import { connect } from "mongoose";
import { DB_URL } from "../config/config";

export const connectDB = async () => {
  try {
    connect(DB_URL as string, {
      serverSelectionTimeoutMS: 30000,
    });
    console.log("DB Connected successfully 👌");
  } catch (error) {
    console.log(`Fail to connect to database ${error} ❌`);
  }
};
