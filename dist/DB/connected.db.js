"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = require("mongoose");
const config_1 = require("../config/config");
const connectDB = async () => {
    try {
        (0, mongoose_1.connect)(config_1.DB_URL, {
            serverSelectionTimeoutMS: 30000,
        });
        console.log("DB Connected successfully 👌");
    }
    catch (error) {
        console.log(`Fail to connect to database ${error} ❌`);
    }
};
exports.connectDB = connectDB;
