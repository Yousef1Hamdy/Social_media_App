"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailTemplate = void 0;
const emailTemplate = ({ otp, ttl = 120, title = "Verify Your Account", }) => {
    const expiryMinutes = ttl / 60;
    return `
   <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">
  <title>Verification Code Email</title>
  <style>
    /* Global resets for email clients */
    .ExternalClass, .ReadMsgBody {
      width: 100%;
      background-color: #f4f6fc;
    }
    body, table, td, p, a {
      margin: 0;
      padding: 0;
      border: 0;
      font-size: 100%;
      font-family: 'Arial', 'Helvetica Neue', Helvetica, sans-serif;
      line-height: 1.5;
    }
    img {
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
    }
    @media only screen and (max-width: 600px) {
      table[class="container"] {
        width: 100% !important;
      }
      td[class="inner-padding"] {
        padding: 30px 20px !important;
      }
      div[class="otp-box"] {
        font-size: 28px !important;
        letter-spacing: 4px !important;
        padding: 12px 16px !important;
      }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#f4f6fc; font-family:'Arial','Helvetica Neue',Helvetica,sans-serif;">
  <!-- MAIN EMAIL CONTAINER (centered, max-width 600px) -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" align="center" bgcolor="#f4f6fc" style="background-color:#f4f6fc;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <!-- CARD CONTAINER -->
        <table width="100%" max-width="600" cellpadding="0" cellspacing="0" border="0" align="center" style="max-width:600px; width:100%; background:#ffffff; border-radius:24px; box-shadow:0 12px 30px rgba(0,0,0,0.05); border-collapse:separate; overflow:hidden;">
          
          <!-- HEADER SECTION with brand / logo placeholder -->
          <tr>
            <td style="background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); padding: 28px 32px; text-align:center;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <!-- optional logo placeholder (replace with your brand logo) -->
                    <div style="font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.3px; margin-bottom: 6px;">
                      🔐 SecureAuth
                    </div>
                    <div style="font-size: 14px; color: rgba(255,255,255,0.85); font-weight: 400;">
                      trusted identity verification
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- MAIN CONTENT AREA -->
          <tr>
            <td style="padding: 40px 32px 32px 32px;" class="inner-padding">
              <!-- Dynamic Title -->
              <h2 style="font-size: 26px; font-weight: 700; color: #1e293b; margin: 0 0 12px 0; line-height: 1.2;">${title}</h2>
              <p style="font-size: 16px; color: #475569; margin: 0 0 24px 0; font-weight: 400;">
                Use the secure verification code below to complete your action. This code is time‑sensitive and should not be shared with anyone.
              </p>
              
              <!-- OTP CODE BOX (highlighted) -->
              <div style="background-color: #f8fafc; border-radius: 20px; padding: 8px; border: 1px solid #e2e8f0; margin-bottom: 28px;">
                <div style="background-color: #ffffff; border-radius: 16px; padding: 20px 12px; text-align: center; border: 1px solid #eef2ff;">
                  <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #4f46e5; font-family: 'Courier New', 'SF Mono', monospace; background: #ffffff; display: inline-block; word-break: break-all;">
                    ${otp}
                  </div>
                </div>
              </div>
              
              <!-- EXPIRY INFO & RESEND NOTE -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background: #fef9e3; border-left: 4px solid #eab308; padding: 14px 18px; border-radius: 12px; margin-bottom: 24px;">
                    <p style="margin: 0; font-size: 14px; color: #854d0e; font-weight: 500;">
                      ⏱️ This verification code will expire in <strong>${expiryMinutes} minutes</strong>.
                    </p>
                    <p style="margin: 6px 0 0 0; font-size: 13px; color: #a16207;">
                      For security reasons, never share this code via email or phone.
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- ADDITIONAL SUPPORT NOTE -->
              <p style="font-size: 14px; color: #64748b; margin: 28px 0 0 0; border-top: 1px solid #e9edf2; padding-top: 24px; text-align: center;">
                Didn't request this code? You can safely ignore this email.<br>
                Need help? Contact our <a href="#" style="color:#4f46e5; text-decoration:underline;">support team</a>.
              </p>
            </td>
          </tr>
          
          <!-- FOOTER SECTION with subtle branding & legal -->
          <tr>
            <td style="background-color: #fafcff; padding: 20px 32px 28px 32px; border-top: 1px solid #eef2ff; text-align: center;">
              <p style="font-size: 12px; color: #94a3b8; margin: 0 0 12px 0;">
                &copy; 2025 SecureAuth Platform. All rights reserved.
              </p>
              <p style="font-size: 12px; color: #94a3b8; margin: 0;">
                123 Trust Street, Security District, 10101<br>
                <a href="#" style="color:#4f46e5; text-decoration:none;">Privacy Policy</a> &nbsp;|&nbsp; 
                <a href="#" style="color:#4f46e5; text-decoration:none;">Terms of Service</a>
              </p>
            </td>
          </tr>
        </table>
        <!-- END CARD -->
        
        <!-- tiny spacer for better readability on mobile -->
        <div style="height: 20px; font-size:0;">&nbsp;</div>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};
exports.emailTemplate = emailTemplate;
