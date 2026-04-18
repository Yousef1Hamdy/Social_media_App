import { compare, genSalt, hash } from "bcrypt";
import { SALT_ROUND } from "../../../config/config";

export const generateHash = async ({
  plaintext,
  salt = SALT_ROUND,
  minor = "b",
}: {
  plaintext: string;
  salt?: number;
  minor?: "a" | "b";
}): Promise<string> => {
  const generateSalt = await genSalt(salt, minor);
  return await hash(plaintext, generateSalt);
};

export const compareHash = async ({
  plaintext,
  cipherText,
}: {
  plaintext: string;
  cipherText: string;
}) => {
  const match = await compare(plaintext, cipherText);
  return match;
};
