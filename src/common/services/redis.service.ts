import { EmailEnum } from "./../enums/email.enum";
import { createClient, RedisClientType } from "redis";
import { DB_URI } from "../../config/config";
import { Types } from "mongoose";
type RedisKeyType = {
  email: string;
  type?: EmailEnum;
};
export class RedisService {
  private readonly client: RedisClientType;
  constructor() {
    this.client = createClient({ url: DB_URI });
    this.handelEvents();
  }
  private handelEvents() {
    this.client.on("error", (error) => {
      console.log(`REDIS ERROR ,,,, ${error}`);
    });
    this.client.on("ready", () => {
      console.log(`REDIS READY`);
    });
  }
  public async connect() {
    await this.client.connect();
    console.log("REDIS IS CONNECTED 🌸");
  }

  otpKey = ({ email, type = EmailEnum.ConfirmEmail }: RedisKeyType): string => {
    return `Otp::user::${email}::${type}`;
  };

  otpMaxRequestKey = ({
    email,
    type = EmailEnum.ConfirmEmail,
  }: RedisKeyType): string => {
    return `${this.otpKey({ email, type })}::Request`;
  };

  otpBlockKey = ({
    email,
    type = EmailEnum.ConfirmEmail,
  }: RedisKeyType): string => {
    return `${this.otpKey({ email, type })}::Block::Request`;
  };

  baseRevokeTokenKey = (userId: Types.ObjectId | string): string => {
    return `RevokeToken::${userId.toString()}`;
  };

  revokeTokenKey = ({
    userId,
    jti,
  }: {
    userId: Types.ObjectId | string;
    jti: string;
  }): string => {
    return `RevokeToken::${userId}::${jti}`;
  };

  set = async ({
    key,
    value,
    ttl,
  }: {
    key: string;
    value: string|number | object;
    ttl?: number | undefined;
  }): Promise<string | null> => {
    try {
      const data = typeof value == "string" ? value : JSON.stringify(value);
      return ttl
        ? await this.client.set(key, data, { EX: ttl })
        : await this.client.set(key, data);
    } catch (error) {
      console.log(`Fail in redis set operation ${error}`);
      return null;
    }
  };

  update = async ({
    key,
    value,
    ttl,
  }: {
    key: string;
    value: string |number| object;
    ttl?: number | undefined;
  }): Promise<string | number | null> => {
    try {
      if (!(await this.client.exists(key))) return 0;
      return await this.set({ key, value, ttl });
    } catch (error) {
      console.log(`Fail in redis update operation ${error}`);
      return null;
    }
  };

  increment = async (key: string): Promise<string | number | null> => {
    try {
      if (!(await this.client.exists(key))) return 0;
      return await this.client.incr(key);
    } catch (error) {
      console.log(`Fail in redis increment operation ${error}`);
      return null;
    }
  };

  get = async (key: string): Promise<string | number | null> => {
    try {
      try {
        return JSON.parse((await this.client.get(key)) as string);
      } catch (error) {
        return await this.client.get(key);
      }
    } catch (error) {
      console.log(`Fail in redis get operation ${error}`);
      return null;
    }
  };

  ttl = async (key: string): Promise<number | null> => {
    try {
      return await this.client.ttl(key);
    } catch (error) {
      console.log(`Fail in redis ttl operation ${error}`);
      return null;
    }
  };

  exists = async (key: string): Promise<string | number | null> => {
    try {
      return await this.client.exists(key);
    } catch (error) {
      console.log(`Fail in redis exists operation ${error}`);
      return null;
    }
  };

  expire = async ({
    key,
    ttl,
  }: {
    key: string;
    ttl: number;
  }): Promise<number> => {
    try {
      return await this.client.expire(key, ttl);
    } catch (error) {
      console.log(`Fail in redis add-expire operation ${error}`);
      return 0;
    }
  };

  mGet = async (keys: string[]): Promise<(string | null)[] | number> => {
    try {
      if (!keys.length) return 0;
      return await this.client.mGet(keys);
    } catch (error) {
      console.log(`Fail in redis mGet operation ${error}`);
      return [];
    }
  };

  keys = async (prefix: string) => {
    try {
      return await this.client.keys(`${prefix}*`);
    } catch (error) {
      console.log(`Fail in redis keys operation ${error}`);
      return [];
    }
  };

deleteKey = async (
  key: string | string[]
): Promise<number> => {
  try {
    if (!key || (Array.isArray(key) && !key.length)) return 0;

    return Array.isArray(key)
      ? await this.client.del(key)
      : await this.client.del(key);
  } catch (error) {
    console.log(`Fail in redis delete operation ${error}`);
    return 0;
  }
};
}

export const redisService = new RedisService();
