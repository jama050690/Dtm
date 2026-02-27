import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../lib/prisma.js";
import { hashPassword } from "../utils/password.js";
import { sendOtpEmail } from "../utils/email.js";

interface SendOtpBody {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  city?: string;
  role?: "TRAVELER" | "SENDER" | "BOTH";
}

interface VerifyOtpBody {
  email: string;
  code: string;
}

interface ResendOtpBody {
  email: string;
}

interface ForgotPasswordOtpBody {
  email: string;
}

interface ResetPasswordOtpBody {
  email: string;
  code: string;
  newPassword: string;
}

// In-memory OTP storage
const otpStore = new Map<
  string,
  { code: string; expiresAt: number; userData: SendOtpBody }
>();
const resetOtpStore = new Map<
  string,
  { code: string; expiresAt: number; userId: string }
>();

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function otpRoutes(app: FastifyInstance) {
  // POST /api/otp/send-otp
  app.post(
    "/send-otp",
    async (
      request: FastifyRequest<{ Body: SendOtpBody }>,
      reply: FastifyReply
    ) => {
      const { email, password, firstName, lastName, phone, city, role } =
        request.body;

      if (!email || !password || !firstName || !lastName) {
        return reply
          .code(400)
          .send({ error: "Email, parol, ism va familiya majburiy" });
      }

      if (password.length < 8) {
        return reply
          .code(400)
          .send({ error: "Parol kamida 8 belgidan iborat bo'lishi kerak" });
      }

      try {
        const existing = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });
        if (existing) {
          return reply
            .code(409)
            .send({ error: "Bu email allaqachon ro'yxatdan o'tgan" });
        }

        const code = generateOTP();
        const expiresAt = Date.now() + 5 * 60 * 1000;

        otpStore.set(email.toLowerCase(), {
          code,
          expiresAt,
          userData: { email, password, firstName, lastName, phone, city, role },
        });

        const mailResult = await sendOtpEmail(email, code, firstName);

        return reply.send({
          message: mailResult.sent
            ? "Tasdiqlash kodi yuborildi"
            : "Email sozlanmagan (dev rejim)",
          email,
          ...(mailResult.sent ? {} : { devOtp: code }),
        });
      } catch (err: any) {
        console.error("OTP yuborishda xato:", err?.message);
        return reply.code(500).send({ error: "Server xatolik berdi" });
      }
    }
  );

  // POST /api/otp/verify-otp
  app.post(
    "/verify-otp",
    async (
      request: FastifyRequest<{ Body: VerifyOtpBody }>,
      reply: FastifyReply
    ) => {
      const email = (request.body.email || "").trim().toLowerCase();
      const code = (request.body.code || "").trim();

      if (!email || !code) {
        return reply
          .code(400)
          .send({ error: "Email va kodni kiriting" });
      }

      const otpData = otpStore.get(email);
      if (!otpData) {
        return reply
          .code(400)
          .send({ error: "OTP topilmadi. Qaytadan so'rang" });
      }

      if (Date.now() > otpData.expiresAt) {
        otpStore.delete(email);
        return reply
          .code(400)
          .send({ error: "Kod muddati tugagan. Qaytadan so'rang" });
      }

      if (otpData.code !== code) {
        return reply.code(400).send({ error: "Noto'g'ri kod" });
      }

      try {
        const { firstName, lastName, phone, city, role, password } =
          otpData.userData;

        // Yana bir bor tekshirish
        const existing = await prisma.user.findUnique({
          where: { email },
        });
        if (existing) {
          otpStore.delete(email);
          return reply
            .code(409)
            .send({ error: "Bu email allaqachon ro'yxatdan o'tgan" });
        }

        const passwordHash = await hashPassword(password);

        const user = await prisma.user.create({
          data: {
            email,
            passwordHash,
            firstName,
            lastName,
            phone: phone || null,
            city: city || null,
            role: role || "SENDER",
            isVerified: true,
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        });

        otpStore.delete(email);

        return reply.send({
          message: "Ro'yxatdan o'tish muvaffaqiyatli yakunlandi",
          verified: true,
          user,
        });
      } catch (err: any) {
        console.error("OTP verify xato:", err?.message);
        return reply
          .code(500)
          .send({ error: "Ro'yxatdan o'tishda xatolik yuz berdi" });
      }
    }
  );

  // POST /api/otp/resend-otp
  app.post(
    "/resend-otp",
    async (
      request: FastifyRequest<{ Body: ResendOtpBody }>,
      reply: FastifyReply
    ) => {
      const email = (request.body.email || "").trim().toLowerCase();
      if (!email) {
        return reply.code(400).send({ error: "Email kiriting" });
      }

      const otpData = otpStore.get(email);
      if (!otpData) {
        return reply
          .code(400)
          .send({ error: "Avval ro'yxatdan o'tishni boshlang" });
      }

      const code = generateOTP();
      otpData.code = code;
      otpData.expiresAt = Date.now() + 5 * 60 * 1000;

      try {
        const mailResult = await sendOtpEmail(
          otpData.userData.email,
          code,
          otpData.userData.firstName
        );

        return reply.send({
          message: mailResult.sent
            ? "Yangi kod yuborildi"
            : "Email sozlanmagan (dev rejim)",
          ...(mailResult.sent ? {} : { devOtp: code }),
        });
      } catch (err: any) {
        console.error("OTP qayta yuborishda xato:", err?.message);
        return reply.code(500).send({ error: "Server xatolik berdi" });
      }
    }
  );

  // POST /api/otp/forgot-password
  app.post(
    "/forgot-password",
    async (
      request: FastifyRequest<{ Body: ForgotPasswordOtpBody }>,
      reply: FastifyReply
    ) => {
      const email = (request.body.email || "").trim().toLowerCase();

      if (!email) {
        return reply.code(400).send({ error: "Email kiriting" });
      }

      try {
        const user = await prisma.user.findUnique({
          where: { email },
          select: { id: true, firstName: true },
        });

        if (!user) {
          return reply
            .code(400)
            .send({ error: "Bu email bilan hisob topilmadi" });
        }

        const code = generateOTP();
        const expiresAt = Date.now() + 5 * 60 * 1000;

        resetOtpStore.set(email, {
          code,
          expiresAt,
          userId: user.id,
        });

        const mailResult = await sendOtpEmail(email, code, user.firstName);

        return reply.send({
          message: mailResult.sent
            ? "Parolni tiklash kodi yuborildi"
            : "Email sozlanmagan (dev rejim)",
          email,
          ...(mailResult.sent ? {} : { devOtp: code }),
        });
      } catch (err: any) {
        console.error("Forgot password xato:", err?.message);
        return reply.code(500).send({ error: "Server xatolik berdi" });
      }
    }
  );

  // POST /api/otp/reset-password
  app.post(
    "/reset-password",
    async (
      request: FastifyRequest<{ Body: ResetPasswordOtpBody }>,
      reply: FastifyReply
    ) => {
      const email = (request.body.email || "").trim().toLowerCase();
      const code = (request.body.code || "").trim();
      const newPassword = request.body.newPassword;

      if (!email || !code || !newPassword) {
        return reply
          .code(400)
          .send({ error: "Email, kod va yangi parolni kiriting" });
      }

      if (newPassword.length < 8) {
        return reply
          .code(400)
          .send({ error: "Parol kamida 8 belgidan iborat bo'lishi kerak" });
      }

      const otpData = resetOtpStore.get(email);
      if (!otpData) {
        return reply
          .code(400)
          .send({ error: "OTP topilmadi. Qaytadan so'rang" });
      }

      if (Date.now() > otpData.expiresAt) {
        resetOtpStore.delete(email);
        return reply
          .code(400)
          .send({ error: "Kod muddati tugagan. Qaytadan so'rang" });
      }

      if (otpData.code !== code) {
        return reply.code(400).send({ error: "Noto'g'ri kod" });
      }

      try {
        const passwordHash = await hashPassword(newPassword);
        await prisma.user.update({
          where: { id: otpData.userId },
          data: { passwordHash },
        });

        resetOtpStore.delete(email);
        return reply.send({ message: "Parol muvaffaqiyatli yangilandi" });
      } catch (err: any) {
        console.error("Reset password xato:", err?.message);
        return reply
          .code(500)
          .send({ error: "Parolni yangilashda xatolik" });
      }
    }
  );
}
