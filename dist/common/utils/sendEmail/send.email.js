"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const config_1 = require("../../../config/config");
const transporter = nodemailer_1.default.createTransport({
    service: "gmail",
    auth: {
        user: config_1.SMTP_USER,
        pass: config_1.SMTP_PASS,
    },
});
const sendEmail = async ({ to, subject, html, cc, bcc, attachments = [], }) => {
    const mailOptions = {
        from: `"${config_1.APPLICATION_NAME}" <${config_1.SMTP_USER}>`,
        to,
        subject,
        html,
        cc,
        bcc,
        attachments,
    };
    return transporter.sendMail(mailOptions);
};
exports.sendEmail = sendEmail;
