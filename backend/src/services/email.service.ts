import nodemailer from 'nodemailer';

// SWAP TO PRODUCTION: replace stub with real SMTP or Resend/SendGrid
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendOTP = async (email: string, otp: string) => {
  void email;
  void otp;
  // Uncomment when SMTP is ready:
  /*
  await transporter.sendMail({
    from: '"CuziCam" <noreply@cuzicam.com>',
    to: email,
    subject: "Your CuziCam Verification Code",
    text: `Your OTP is ${otp}. It expires in 10 minutes.`,
  });
  */
};

export const sendPasswordReset = async (email: string, token: string) => {
  void email;
  void token;
};

export const sendWeeklyPulse = async (email: string, stats: any) => {
  void email;
  void stats;
};

export default {
  sendOTP,
  sendPasswordReset,
  sendWeeklyPulse,
};
