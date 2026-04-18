import {
  compareHash,
  ConflictException,
  emailEmitter,
  EmailEnum,
  emailTemplate,
  encrypt,
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

class AuthenticationService {
  private readonly userRepository: UserRepository;
  private readonly redis: RedisService;
  constructor() {
    this.userRepository = new UserRepository(UserModel);
    this.redis = redisService;
  }

  login = (data: LoginDto): LoginDto => {
    return data;
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
        password: await generateHash({ plaintext: password }),
        gender,
        phone: phone ? await encrypt(phone) : undefined,
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
}

export default new AuthenticationService();
