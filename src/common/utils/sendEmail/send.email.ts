import nodemailer, { SendMailOptions } from "nodemailer";

import { APPLICATION_NAME, SMTP_PASS, SMTP_USER } from "../../../config/config";

type SendEmailParams = {
  to: string | string[];
  subject: string;
  html: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: SendMailOptions["attachments"];
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

export const sendEmail = async ({
  to,
  subject,
  html,
  cc,
  bcc,
  attachments = [],
}: SendEmailParams) => {
  const mailOptions: SendMailOptions = {
    from: `"${APPLICATION_NAME}" <${SMTP_USER}>`,
    to,
    subject,
    html,
    cc,
    bcc,
    attachments,
  };

  return transporter.sendMail(mailOptions);
};
