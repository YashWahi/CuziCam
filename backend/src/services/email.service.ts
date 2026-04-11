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
  console.log(`[EMAIL STUB] OTP for ${email}: ${otp}`);
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
  console.log(`[EMAIL STUB] PW Reset for ${email}: ${token}`);
};

export const sendWeeklyPulse = async (email: string, stats: any) => {
  console.log(`[EMAIL STUB] Weekly Pulse for ${email}`);
};

export default {
  sendOTP,
  sendPasswordReset,
  sendWeeklyPulse,
};
