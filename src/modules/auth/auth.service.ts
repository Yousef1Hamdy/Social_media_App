import { TokenService } from "./../../common/services/token.service";
import {
  BadRequestException,
  compareHash,
  ConflictException,
  emailEmitter,
  EmailEnum,
  emailTemplate,
  generateHash,
  generateOTP,
  NotFoundException,
  ProviderEnum,
  sendEmail,
} from "../../common";
import {
  redisService,
  RedisService,
} from "../../common/services/redis.service";
import { UserModel } from "../../DB/models/user.model";
import { UserRepository } from "../../DB/repository/user.repository";
import {
  ConfirmEmailDto,
  LoginDto,
  ResendConfirmEmailDto,
  SignupDto,
} from "./auth.dto";
import { LoginResponse } from "./auth.entity";
import { OAuth2Client } from "google-auth-library";
import { Clint_audience } from "../../config/config";

class AuthenticationService {
  private readonly userRepository: UserRepository;
  private readonly tokenService: TokenService;
  private readonly redis: RedisService;
  constructor() {
    this.userRepository = new UserRepository(UserModel);
    this.tokenService = new TokenService();
    this.redis = redisService;
  }

  login = async (inputs: LoginDto, issuer: string): Promise<LoginResponse> => {
    const { email, password } = inputs;

    const user = await this.userRepository.findOne({
      filter: {
        email,
        confirmEmail: { $exists: true },
        provider: ProviderEnum.System,
      },
      projection: "+password",
    });
    if (!user) {
      throw new NotFoundException("invalid email or password");
    }
    const match = await compareHash({
      plaintext: password,
      cipherText: user.password,
    });

    if (!match) {
      throw new NotFoundException("invalid email or password");
    }

    const { access_token, refresh_token } =
      await this.tokenService.createLoginCredentials(user, issuer);

    return {
      access_token,
      refresh_token,
    };
  };

  verifyEmailOtp = async ({
    email,
    subject = EmailEnum.ConfirmEmail,
    title = "Verify Your Account",
  }: {
    email: string;
    subject?: EmailEnum;
    title?: string;
  }) => {
    const blockKey = this.redis.otpBlockKey({ email, type: subject });
    const remainBlockTimeOtp = (await this.redis.ttl(blockKey)) as number;
    if (remainBlockTimeOtp > 0) {
      throw new ConflictException(
        `You have reached max request trail count please tray again after ${remainBlockTimeOtp} second`,
      );
    }

    // check max trail count
    const maxTrailCountKey = this.redis.otpMaxRequestKey({
      email,
      type: subject,
    });
    const checkMaxOtpRequest = Number(
      (await this.redis.get(maxTrailCountKey)) || 0,
    );

    if (checkMaxOtpRequest >= 3) {
      await this.redis.set({
        key: this.redis.otpBlockKey({ email, type: subject }),
        value: 0,
        ttl: 300,
      });
      throw new ConflictException(
        "You have reached max request trail count please tray again after 300 second",
      );
    }

    checkMaxOtpRequest > 0
      ? await this.redis.increment(maxTrailCountKey)
      : await this.redis.set({ key: maxTrailCountKey, value: 1, ttl: 300 });

    const otp = await generateOTP();

    const hashedOTP = await generateHash({ plaintext: otp });

    await this.redis.set({
      key: this.redis.otpKey({ email, type: subject }),
      value: hashedOTP,
      ttl: 120,
    });

    await sendEmail({
      to: email,
      subject,
      html: emailTemplate({ otp, ttl: 2 * 60, title }),
    });
  };

  async signup(inputs: SignupDto): Promise<string> {
    const { username, email, password, gender, phone } = inputs;

    const checkUserFound = await this.userRepository.findOne({
      filter: { email },
    });

    if (checkUserFound) {
      throw new ConflictException("Email exist");
    }
    await this.userRepository.createOne({
      data: {
        ...inputs,
        username,
        email,
        password,
        gender,
        phone,
      },
    });

    emailEmitter.emit(EmailEnum.ConfirmEmail, async () => {
      await this.verifyEmailOtp({ email });
    });

    return "check your email";
  }

  resendConfirmEmail = async (inputs: ResendConfirmEmailDto) => {
    const { email } = inputs;

    const account = await this.userRepository.findOne({
      filter: {
        email,
        confirmEmail: { $exists: false },
        provider: ProviderEnum.System,
      },
    });

    if (!account) {
      throw new NotFoundException("Fail to find matching account");
    }

    const remainTime = (await this.redis.ttl(
      this.redis.otpKey({ email }),
    )) as number;
    if (remainTime > 0) {
      throw new ConflictException(
        `sorry we can't provider a new otp until exists one is expire you can try again later after ${remainTime} second`,
      );
    }

    await this.verifyEmailOtp({ email });

    return;
  };

  confirmEmail = async (inputs: ConfirmEmailDto) => {
    const { email, otp } = inputs;

    const account = await this.userRepository.findOne({
      filter: {
        email,
        confirmEmail: { $exists: false },
        provider: ProviderEnum.System,
      },
    });

    if (!account) {
      throw new NotFoundException("Fail to find matching account");
    }

    const hashOtp = (await this.redis.get(
      this.redis.otpKey({ email }),
    )) as string;

    if (!hashOtp) {
      throw new NotFoundException("Expired otp");
    }

    const match = await compareHash({
      plaintext: otp,
      cipherText: hashOtp,
    });

    if (!match) {
      throw new NotFoundException("Invalid or expired OTP");
    }
    account.confirmEmail = new Date();
    await account.save();

    await this.redis.deleteKey(
      await this.redis.keys(this.redis.otpKey({ email })),
    );

    return { message: "Email verified successfully" };
  };

  private async verifyGoogleAccount(idToken: string) {
    const client = new OAuth2Client();

    const ticket = await client.verifyIdToken({
      idToken,
      audience: Clint_audience,
    });
    const payload = ticket.getPayload();
    if (!payload?.email_verified) {
      throw new BadRequestException("Fail to verify this account with google");
    }
    return payload;
  }

  signupWithGmail = async (
    { idToken }: { idToken: string },
    issuer: string,
  ) => {
    const payload = await this.verifyGoogleAccount(idToken);

    const checkUserExist = await this.userRepository.findOne({
      filter: { email: payload.email as string },
    });
    if (checkUserExist) {
      if (checkUserExist.provider == ProviderEnum.System) {
        throw new ConflictException(
          "Account already exist with different provider",
        );
      }

      const account = await this.loginWithGmail(idToken, issuer);
      return { account, status: 200 };
    }

    const user = await this.userRepository.createOne({
      data: {
        firstName: payload?.given_name,
        lastName: payload?.family_name || " ",
        email: payload.email,
        provider: ProviderEnum.Google,
        // profilePicture: payload.picture,
        confirmEmail: new Date(),
      },
    });

    return {
      account: await this.tokenService.createLoginCredentials(user, issuer),
    };
  };

  loginWithGmail = async (idToken: string, issuer: string) => {
    const payload = await this.verifyGoogleAccount(idToken);
    const user = await this.userRepository.findOne({
      filter: { email: payload.email as string, provider: ProviderEnum.Google },
    });
    if (!user) {
      throw new NotFoundException(
        "Invalid login credentials or Invalid login approach",
      );
    }

    return await this.tokenService.createLoginCredentials(user, issuer);
  };
}

export default new AuthenticationService();
