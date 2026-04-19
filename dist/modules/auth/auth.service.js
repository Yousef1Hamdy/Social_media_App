"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const token_service_1 = require("./../../common/services/token.service");
const common_1 = require("../../common");
const redis_service_1 = require("../../common/services/redis.service");
const user_model_1 = require("../../DB/models/user.model");
const user_repository_1 = require("../../DB/repository/user.repository");
class AuthenticationService {
    userRepository;
    tokenService;
    redis;
    constructor() {
        this.userRepository = new user_repository_1.UserRepository(user_model_1.UserModel);
        this.tokenService = new token_service_1.TokenService();
        this.redis = redis_service_1.redisService;
    }
    login = async (inputs, issuer) => {
        const { email, password } = inputs;
        const user = await this.userRepository.findOne({
            filter: {
                email,
                confirmEmail: { $exists: true },
                provider: common_1.ProviderEnum.System,
            },
            projection: "+password",
        });
        if (!user) {
            throw new common_1.NotFoundException("invalid email or password");
        }
        const match = await (0, common_1.compareHash)({
            plaintext: password,
            cipherText: user.password,
        });
        if (!match) {
            throw new common_1.NotFoundException("invalid email or password");
        }
        const { access_token, refresh_token } = await this.tokenService.createLoginCredentials(user, issuer);
        return {
            access_token,
            refresh_token,
        };
    };
    verifyEmailOtp = async ({ email, subject = common_1.EmailEnum.ConfirmEmail, title = "Verify Your Account", }) => {
        const blockKey = this.redis.otpBlockKey({ email, type: subject });
        const remainBlockTimeOtp = (await this.redis.ttl(blockKey));
        if (remainBlockTimeOtp > 0) {
            throw new common_1.ConflictException(`You have reached max request trail count please tray again after ${remainBlockTimeOtp} second`);
        }
        const maxTrailCountKey = this.redis.otpMaxRequestKey({
            email,
            type: subject,
        });
        const checkMaxOtpRequest = Number((await this.redis.get(maxTrailCountKey)) || 0);
        if (checkMaxOtpRequest >= 3) {
            await this.redis.set({
                key: this.redis.otpBlockKey({ email, type: subject }),
                value: 0,
                ttl: 300,
            });
            throw new common_1.ConflictException("You have reached max request trail count please tray again after 300 second");
        }
        checkMaxOtpRequest > 0
            ? await this.redis.increment(maxTrailCountKey)
            : await this.redis.set({ key: maxTrailCountKey, value: 1, ttl: 300 });
        const otp = await (0, common_1.generateOTP)();
        const hashedOTP = await (0, common_1.generateHash)({ plaintext: otp });
        await this.redis.set({
            key: this.redis.otpKey({ email, type: subject }),
            value: hashedOTP,
            ttl: 120,
        });
        await (0, common_1.sendEmail)({
            to: email,
            subject,
            html: (0, common_1.emailTemplate)({ otp, ttl: 2 * 60, title }),
        });
    };
    async signup(inputs) {
        const { username, email, password, gender, phone } = inputs;
        const checkUserFound = await this.userRepository.findOne({
            filter: { email },
        });
        if (checkUserFound) {
            throw new common_1.ConflictException("Email exist");
        }
        await this.userRepository.createOne({
            data: {
                ...inputs,
                username,
                email,
                password: await (0, common_1.generateHash)({ plaintext: password }),
                gender,
                phone: phone ? await (0, common_1.encrypt)(phone) : undefined,
            },
        });
        common_1.emailEmitter.emit(common_1.EmailEnum.ConfirmEmail, async () => {
            await this.verifyEmailOtp({ email });
        });
        return "check your email";
    }
    resendConfirmEmail = async (inputs) => {
        const { email } = inputs;
        const account = await this.userRepository.findOne({
            filter: {
                email,
                confirmEmail: { $exists: false },
                provider: common_1.ProviderEnum.System,
            },
        });
        if (!account) {
            throw new common_1.NotFoundException("Fail to find matching account");
        }
        const remainTime = (await this.redis.ttl(this.redis.otpKey({ email })));
        if (remainTime > 0) {
            throw new common_1.ConflictException(`sorry we can't provider a new otp until exists one is expire you can try again later after ${remainTime} second`);
        }
        await this.verifyEmailOtp({ email });
        return;
    };
    confirmEmail = async (inputs) => {
        const { email, otp } = inputs;
        const account = await this.userRepository.findOne({
            filter: {
                email,
                confirmEmail: { $exists: false },
                provider: common_1.ProviderEnum.System,
            },
        });
        if (!account) {
            throw new common_1.NotFoundException("Fail to find matching account");
        }
        const hashOtp = (await this.redis.get(this.redis.otpKey({ email })));
        if (!hashOtp) {
            throw new common_1.NotFoundException("Expired otp");
        }
        const match = await (0, common_1.compareHash)({
            plaintext: otp,
            cipherText: hashOtp,
        });
        if (!match) {
            throw new common_1.NotFoundException("Invalid or expired OTP");
        }
        account.confirmEmail = new Date();
        await account.save();
        await this.redis.deleteKey(await this.redis.keys(this.redis.otpKey({ email })));
        return { message: "Email verified successfully" };
    };
}
exports.default = new AuthenticationService();
