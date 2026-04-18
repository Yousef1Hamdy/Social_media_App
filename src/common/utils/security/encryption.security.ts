import crypto from "crypto";
import { ENCRYPTION_SECRET_KEY as SECRET_KEY } from "../../../config/config";

const IV_LENGTH = 16;
const KEY = Buffer.from(SECRET_KEY as string, "hex");

if (KEY.length !== 32) {
  throw new Error("Encryption key must be 32 bytes (AES-256)");
}
export const encrypt = (text: string): string => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    KEY,
    iv,
  );
  let encryptionData = cipher.update(text, "utf-8", "hex");
  encryptionData += cipher.final("hex");

  return `${iv.toString("hex")}:${encryptionData}`;
};

export const decrypt = (encryptionData: string):string => {
  const parts = encryptionData.split(":");
  if (parts.length !== 2) {
    throw new Error("Invalid encrypted payload format");
  }
  const [ivHex, encryptedText] = parts;

  const iv = Buffer.from(ivHex as string, "hex");

  if (iv.length !== IV_LENGTH) {
    throw new Error("Invalid IV length");
  }

  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    KEY,
    iv,
  );

  let decryptData = decipher.update(encryptedText as string, "hex", "utf8");
  decryptData += decipher.final("utf-8");
  return decryptData;
};
