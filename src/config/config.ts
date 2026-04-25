import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(`./.env.${process.env.NODE_ENV || "development"}`) });

export const PORT = process.env.PORT;
export const APPLICATION_NAME = process.env.APPLICATION_NAME;
// DB
export const DB_URL = process.env.DB_URL;
export const DB_URI: string = process.env.DB_URI as string;
// hash
export const SALT_ROUND: number = Number(process.env.SALT_ROUND ?? 10);
export const ENCRYPTION_SECRET_KEY = process.env.ENCRYPTION_SECRET_KEY;
// # SMTP
export const SMTP_USER = process.env.SMTP_USER;
export const SMTP_PASS = process.env.SMTP_PASS;
export const SMTP_HOST = process.env.SMTP_HOST;
export const SMTP_PORT = process.env.SMTP_PORT;
export const SMTP_SECURE = process.env.SMTP_SECURE;

// jwt
export const SYSTEM_TOKEN_SECRET_KEY = process.env.SYSTEM_TOKEN_SECRET_KEY;
export const USER_TOKEN_SECRET_KEY = process.env.USER_TOKEN_SECRET_KEY;
export const ACCESS_EXPIRE_IN = parseInt(
  (process.env.ACCESS_EXPIRE_IN as string) ?? 1800,
);

export const SYSTEM_REFRESH_TOKEN_SECRET_KEY =
  process.env.SYSTEM_REFRESH_TOKEN_SECRET_KEY;
export const USER_REFRESH_TOKEN_SECRET_KEY =
  process.env.USER_REFRESH_TOKEN_SECRET_KEY;
export const REFRESH_EXPIRE_IN = parseInt(
  (process.env.REFRESH_EXPIRE_IN as string) ?? 1800,
);

//

export const Clint_audience = (process.env.Clint_audience?.split(",") ||
  []) as string[];

//  aws
export const AWS_REGION = process.env.AWS_REGION as string;
export const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME as string;
export const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID as string;
export const AWS_SECRET_ACCESS_KEY = process.env
  .AWS_SECRET_ACCESS_KEY as string;
export const AWS_EXPIRES_IN = parseInt(
  (process.env.AWS_EXPIRES_IN as string) ?? "120",
) as number;
