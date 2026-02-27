import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendVerificationEmail(
  email: string,
  token: string
): Promise<void> {
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;

  await transporter.sendMail({
    from: `"Sending" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: email,
    subject: "Email manzilingizni tasdiqlang - Sending",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px">
        <h2 style="color:#2563EB">Sending</h2>
        <p>Salom! Ro'yxatdan o'tganingiz uchun rahmat.</p>
        <p>Email manzilingizni tasdiqlash uchun quyidagi tugmani bosing:</p>
        <a href="${verifyUrl}"
           style="display:inline-block;background:#2563EB;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;margin:16px 0">
          Emailni tasdiqlash
        </a>
        <p style="color:#6B7280;font-size:14px">Agar siz ro'yxatdan o'tmagan bo'lsangiz, bu xabarni e'tiborsiz qoldiring.</p>
      </div>
    `,
  });
}

export async function sendResetPasswordEmail(
  email: string,
  token: string
): Promise<void> {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

  await transporter.sendMail({
    from: `"Sending" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: email,
    subject: "Parolni tiklash - Sending",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px">
        <h2 style="color:#2563EB">Sending</h2>
        <p>Parolni tiklash so'rovi qabul qilindi.</p>
        <p>Yangi parol o'rnatish uchun quyidagi tugmani bosing:</p>
        <a href="${resetUrl}"
           style="display:inline-block;background:#2563EB;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;margin:16px 0">
          Parolni tiklash
        </a>
        <p style="color:#6B7280;font-size:14px">Havola 1 soat ichida amal qiladi.</p>
        <p style="color:#6B7280;font-size:14px">Agar siz bu so'rovni yubormagan bo'lsangiz, xabarni e'tiborsiz qoldiring.</p>
      </div>
    `,
  });
}

export async function sendOtpEmail(
  email: string,
  code: string,
  name: string
): Promise<{ sent: boolean; reason?: string }> {
  const hasConfig = Boolean(
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
  );
  if (!hasConfig) {
    console.error("SMTP sozlamalari to'liq emas, OTP email yuborilmadi");
    return { sent: false, reason: "missing_email_config" };
  }

  try {
    await transporter.sendMail({
      from: `"Sending" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: "Tasdiqlash kodi - Sending",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:420px;margin:0 auto;padding:24px;text-align:center">
          <h2 style="color:#2563EB">Sending</h2>
          <p style="color:#666">Salom, <strong>${name}</strong>!</p>
          <p style="color:#666">Sizning tasdiqlash kodingiz:</p>
          <div style="background:linear-gradient(135deg,#2563EB,#7C3AED);color:white;font-size:32px;font-weight:bold;letter-spacing:8px;padding:20px;border-radius:12px;margin:20px 0">
            ${code}
          </div>
          <p style="color:#999;font-size:13px">Kod 5 daqiqa ichida amal qiladi.</p>
        </div>
      `,
    });
    return { sent: true };
  } catch (err: any) {
    console.error(`OTP email yuborilmadi: ${email} | ${err?.message}`);
    return { sent: false, reason: err?.message || "send_failed" };
  }
}
