"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisService = exports.RedisService = void 0;
const email_enum_1 = require("./../enums/email.enum");
const redis_1 = require("redis");
const config_1 = require("../../config/config");
class RedisService {
    client;
    constructor() {
        this.client = (0, redis_1.createClient)({ url: config_1.DB_URI });
        this.handelEvents();
    }
    handelEvents() {
        this.client.on("error", (error) => {
            console.log(`REDIS ERROR ,,,, ${error}`);
        });
        this.client.on("ready", () => {
            console.log(`REDIS READY`);
        });
    }
    async connect() {
        await this.client.connect();
        console.log("REDIS IS CONNECTED 🌸");
    }
    otpKey = ({ email, type = email_enum_1.EmailEnum.ConfirmEmail }) => {
        return `Otp::user::${email}::${type}`;
    };
    otpMaxRequestKey = ({ email, type = email_enum_1.EmailEnum.ConfirmEmail, }) => {
        return `${this.otpKey({ email, type })}::Request`;
    };
    otpBlockKey = ({ email, type = email_enum_1.EmailEnum.ConfirmEmail, }) => {
        return `${this.otpKey({ email, type })}::Block::Request`;
    };
    baseRevokeTokenKey = (userId) => {
        return `RevokeToken::${userId.toString()}`;
    };
    revokeTokenKey = ({ userId, jti, }) => {
        return `RevokeToken::${userId}::${jti}`;
    };
    set = async ({ key, value, ttl, }) => {
        try {
            const data = typeof value == "string" ? value : JSON.stringify(value);
            return ttl
                ? await this.client.set(key, data, { EX: ttl })
                : await this.client.set(key, data);
        }
        catch (error) {
            console.log(`Fail in redis set operation ${error}`);
            return null;
        }
    };
    update = async ({ key, value, ttl, }) => {
        try {
            if (!(await this.client.exists(key)))
                return 0;
            return await this.set({ key, value, ttl });
        }
        catch (error) {
            console.log(`Fail in redis update operation ${error}`);
            return null;
        }
    };
    increment = async (key) => {
        try {
            if (!(await this.client.exists(key)))
                return 0;
            return await this.client.incr(key);
        }
        catch (error) {
            console.log(`Fail in redis increment operation ${error}`);
            return null;
        }
    };
    get = async (key) => {
        try {
            try {
                return JSON.parse((await this.client.get(key)));
            }
            catch (error) {
                return await this.client.get(key);
            }
        }
        catch (error) {
            console.log(`Fail in redis get operation ${error}`);
            return null;
        }
    };
    ttl = async (key) => {
        try {
            return await this.client.ttl(key);
        }
        catch (error) {
            console.log(`Fail in redis ttl operation ${error}`);
            return null;
        }
    };
    exists = async (key) => {
        try {
            return await this.client.exists(key);
        }
        catch (error) {
            console.log(`Fail in redis exists operation ${error}`);
            return null;
        }
    };
    expire = async ({ key, ttl, }) => {
        try {
            return await this.client.expire(key, ttl);
        }
        catch (error) {
            console.log(`Fail in redis add-expire operation ${error}`);
            return 0;
        }
    };
    mGet = async (keys) => {
        try {
            if (!keys.length)
                return 0;
            return await this.client.mGet(keys);
        }
        catch (error) {
            console.log(`Fail in redis mGet operation ${error}`);
            return [];
        }
    };
    keys = async (prefix) => {
        try {
            return await this.client.keys(`${prefix}*`);
        }
        catch (error) {
            console.log(`Fail in redis keys operation ${error}`);
            return [];
        }
    };
    deleteKey = async (key) => {
        try {
            if (!key || (Array.isArray(key) && !key.length))
                return 0;
            return Array.isArray(key)
                ? await this.client.del(key)
                : await this.client.del(key);
        }
        catch (error) {
            console.log(`Fail in redis delete operation ${error}`);
            return 0;
        }
    };
    FCM_key(userId) {
        return `user:FCM:${userId.toString()}`;
    }
    async addFCM(userId, FCMToken) {
        return await this.client.sAdd(this.FCM_key(userId), FCMToken);
    }
    async removeFCM(userId, FCMToken) {
        return await this.client.sRem(this.FCM_key(userId), FCMToken);
    }
    async getFCMs(userId) {
        return await this.client.sMembers(this.FCM_key(userId));
    }
    async hasFCMs(userId) {
        return await this.client.sCard(this.FCM_key(userId));
    }
    async removeFCMUser(userId) {
        return await this.client.del(this.FCM_key(userId));
    }
}
exports.RedisService = RedisService;
exports.redisService = new RedisService();
