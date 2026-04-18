"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decrypt = exports.encrypt = void 0;
const crypto_1 = __importDefault(require("crypto"));
const config_1 = require("../../../config/config");
const IV_LENGTH = 16;
const KEY = Buffer.from(config_1.ENCRYPTION_SECRET_KEY, "hex");
if (KEY.length !== 32) {
    throw new Error("Encryption key must be 32 bytes (AES-256)");
}
const encrypt = (text) => {
    const iv = crypto_1.default.randomBytes(IV_LENGTH);
    const cipher = crypto_1.default.createCipheriv("aes-256-cbc", KEY, iv);
    let encryptionData = cipher.update(text, "utf-8", "hex");
    encryptionData += cipher.final("hex");
    return `${iv.toString("hex")}:${encryptionData}`;
};
exports.encrypt = encrypt;
const decrypt = (encryptionData) => {
    const parts = encryptionData.split(":");
    if (parts.length !== 2) {
        throw new Error("Invalid encrypted payload format");
    }
    const [ivHex, encryptedText] = parts;
    const iv = Buffer.from(ivHex, "hex");
    if (iv.length !== IV_LENGTH) {
        throw new Error("Invalid IV length");
    }
    const decipher = crypto_1.default.createDecipheriv("aes-256-cbc", KEY, iv);
    let decryptData = decipher.update(encryptedText, "hex", "utf8");
    decryptData += decipher.final("utf-8");
    return decryptData;
};
exports.decrypt = decrypt;
