import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(`./.env.${process.env.NODE_ENV || "development"}`) });

export const PORT = process.env.PORT;
export const APPLICATION_NAME = process.env.APPLICATION_NAME;
// DB
export const DB_URL = process.env.DB_URL ;
export const DB_URI :string  = process.env.DB_URI as string;
// hash
export const SALT_ROUND: number = Number(process.env.SALT_ROUND ?? 10);
export const ENCRYPTION_SECRET_KEY = process.env.ENCRYPTION_SECRET_KEY;
// # SMTP
export const SMTP_USER = process.env.SMTP_USER;
export const SMTP_PASS = process.env.SMTP_PASS;
export const SMTP_HOST = process.env.SMTP_HOST;
export const SMTP_PORT = process.env.SMTP_PORT;
export const SMTP_SECURE = process.env.SMTP_SECURE;
