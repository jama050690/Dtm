import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { randomUUID } from "crypto";
import { prisma } from "../lib/prisma.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { OAuth2Client } from "google-auth-library";
import {
  sendVerificationEmail,
  sendResetPasswordEmail,
} from "../utils/email.js";
import { validateTelegramInitData, validateTelegramWidget, TelegramWidgetData } from "../utils/telegram.js";

interface RegisterBody {
  email: string;
  password: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  city?: string;
  role?: "TRAVELER" | "SENDER" | "BOTH";
}

interface LoginBody {
  email: string;
  password: string;
}

interface ForgotPasswordBody {
  email: string;
}

interface ResetPasswordBody {
  token: string;
  password: string;
}

export async function authRoutes(app: FastifyInstance) {
  const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  // POST /api/auth/register
  app.post(
    "/register",
    async (
      request: FastifyRequest<{ Body: RegisterBody }>,
      reply: FastifyReply
    ) => {
      const { email, password, name, firstName, lastName, phone, city, role } =
        request.body;
      const derivedFirstName = firstName || name?.trim().split(" ")[0] || "";
      const derivedLastName =
        lastName || name?.trim().split(" ").slice(1).join(" ") || "-";

      // Validatsiya
      if (!email || !password || !derivedFirstName || !derivedLastName) {
        return reply.code(400).send({
          error: "Email, parol, ism va familiya majburiy",
        });
      }

      if (password.length < 6) {
        return reply.code(400).send({
          error: "Parol kamida 6 belgidan iborat bo'lishi kerak",
        });
      }

      // Email mavjudligini tekshirish
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });
      if (existingUser) {
        return reply.code(409).send({
          error: "Bu email allaqachon ro'yxatdan o'tgan",
        });
      }

      // Foydalanuvchi yaratish
      const passwordHash = await hashPassword(password);
      const verifyToken = randomUUID();

      const user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash,
          firstName: derivedFirstName,
          lastName: derivedLastName,
          phone,
          city,
          role: role || "SENDER",
          verifyToken,
          verifyTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 soat
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      });

      // Email yuborish
      try {
        await sendVerificationEmail(user.email, verifyToken);
      } catch (err) {
        // Email yuborilmasa ham ro'yxatdan o'tish davom etadi
        console.error("Email yuborishda xatolik:", err);
      }

      const accessToken = app.jwt.sign({
        id: user.id,
        email: user.email,
        role: user.role,
        isAdmin: false,
      });

      return reply.code(201).send({
        message:
          "Ro'yxatdan o'tdingiz! Email manzilingizga tasdiqlash havolasi yuborildi.",
        token: accessToken,
        accessToken,
        user: {
          ...user,
          name: `${user.firstName} ${user.lastName}`.trim(),
        },
      });
    }
  );

  // POST /api/auth/login
  app.post(
    "/login",
    async (
      request: FastifyRequest<{ Body: LoginBody }>,
      reply: FastifyReply
    ) => {
      const { email, password } = request.body;

      if (!email || !password) {
        return reply.code(400).send({
          error: "Email va parol majburiy",
        });
      }

      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (!user) {
        return reply.code(401).send({
          error: "Email yoki parol noto'g'ri",
        });
      }

      if (user.isBlocked) {
        return reply.code(403).send({
          error: "Hisobingiz bloklangan. Admin bilan bog'laning.",
        });
      }

      const isPasswordValid = await verifyPassword(
        password,
        user.passwordHash
      );
      if (!isPasswordValid) {
        return reply.code(401).send({
          error: "Email yoki parol noto'g'ri",
        });
      }

      // Access token
      const accessToken = app.jwt.sign({
        id: user.id,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin,
      });

      // Refresh token
      const refreshToken = app.jwt.sign(
        { id: user.id },
        {
          expiresIn: process.env.JWT_REFRESH_EXPIRY || "7d",
        }
      );

      // Refresh tokenni saqlash
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken },
      });

      reply.setCookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24, // 1 kun
      });

      reply.setCookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 kun
      });

      return reply.send({
        token: accessToken,
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`.trim(),
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          role: user.role,
          avatarUrl: user.avatarUrl,
          isVerified: user.isVerified,
          isAdmin: user.isAdmin,
        },
      });
    }
  );

  // POST /api/auth/refresh
  app.post(
    "/refresh",
    async (
      request: FastifyRequest<{ Body: { refreshToken?: string } }>,
      reply: FastifyReply
    ) => {
      // Cookie yoki body dan refresh token olish
      const refreshToken = request.cookies.refreshToken || request.body?.refreshToken;

      if (!refreshToken) {
        return reply.code(400).send({ error: "Refresh token majburiy" });
      }

      try {
        const decoded = app.jwt.verify(refreshToken) as { id: string };

        const user = await prisma.user.findUnique({
          where: { id: decoded.id },
        });

        if (!user || user.refreshToken !== refreshToken) {
          return reply.code(401).send({ error: "Token yaroqsiz" });
        }

        const newAccessToken = app.jwt.sign({
          id: user.id,
          email: user.email,
          role: user.role,
          isAdmin: user.isAdmin,
        });

        const newRefreshToken = app.jwt.sign(
          { id: user.id },
          { expiresIn: process.env.JWT_REFRESH_EXPIRY || "7d" }
        );

        await prisma.user.update({
          where: { id: user.id },
          data: { refreshToken: newRefreshToken },
        });

        reply.setCookie("accessToken", newAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24,
        });

        reply.setCookie("refreshToken", newRefreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 30,
        });

        return reply.send({ success: true, accessToken: newAccessToken, refreshToken: newRefreshToken });
      } catch {
        return reply.code(401).send({ error: "Token yaroqsiz yoki muddati o'tgan" });
      }
    }
  );

  // POST /api/auth/logout
  app.post(
    "/logout",
    { preHandler: [app.authenticate as any] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user as { id: string };

      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: null },
      });

      reply.clearCookie("accessToken", { path: "/" });
      reply.clearCookie("refreshToken", { path: "/" });

      return reply.send({ message: "Muvaffaqiyatli chiqildi" });
    }
  );

  // GET /api/auth/me
  app.get(
    "/me",
    { preHandler: [app.authenticate as any] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = await prisma.user.findUnique({
        where: { id: request.user.id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      });

      if (!user) {
        return reply.code(404).send({ error: "Foydalanuvchi topilmadi" });
      }

      const stats = await prisma.testResult.aggregate({
        where: { userId: user.id },
        _sum: { coinsEarned: true },
      });

      return reply.send({
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`.trim(),
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        coins: stats._sum.coinsEarned ?? 0,
      });
    }
  );

  // GET /api/auth/verify-email/:token
  app.get(
    "/verify-email/:token",
    async (
      request: FastifyRequest<{ Params: { token: string } }>,
      reply: FastifyReply
    ) => {
      const { token } = request.params;

      const user = await prisma.user.findFirst({
        where: {
          verifyToken: token,
          verifyTokenExpiry: { gt: new Date() },
        },
      });

      if (!user) {
        return reply.code(400).send({
          error: "Token yaroqsiz yoki muddati o'tgan",
        });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          isVerified: true,
          verifyToken: null,
          verifyTokenExpiry: null,
        },
      });

      return reply.send({
        message: "Email muvaffaqiyatli tasdiqlandi!",
      });
    }
  );

  // POST /api/auth/forgot-password
  app.post(
    "/forgot-password",
    async (
      request: FastifyRequest<{ Body: ForgotPasswordBody }>,
      reply: FastifyReply
    ) => {
      const { email } = request.body;

      if (!email) {
        return reply.code(400).send({ error: "Email majburiy" });
      }

      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      // Xavfsizlik uchun user topilmasa ham xuddi shunday javob qaytaramiz
      if (!user) {
        return reply.send({
          message: "Agar email ro'yxatdan o'tgan bo'lsa, tiklash havolasi yuborildi",
        });
      }

      const resetToken = randomUUID();

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken,
          resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000), // 1 soat
        },
      });

      try {
        await sendResetPasswordEmail(user.email, resetToken);
      } catch (err) {
        console.error("Reset email yuborishda xatolik:", err);
      }

      return reply.send({
        message: "Agar email ro'yxatdan o'tgan bo'lsa, tiklash havolasi yuborildi",
      });
    }
  );

  // POST /api/auth/google — Google orqali kirish (accessToken from useGoogleLogin)
  app.post(
    "/google",
    async (
      request: FastifyRequest<{ Body: { accessToken?: string; idToken?: string } }>,
      reply: FastifyReply
    ) => {
      const { accessToken, idToken } = request.body;

      if (!accessToken && !idToken) {
        return reply.code(400).send({ error: "Google token majburiy" });
      }

      try {
        let email = "";
        let given_name = "";
        let family_name = "";
        let picture: string | null = null;
        let email_verified = false;

        if (idToken) {
          const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
          });
          const payload = ticket.getPayload();

          if (!payload?.email) {
            return reply.code(401).send({ error: "Google token yaroqsiz" });
          }

          email = payload.email;
          given_name = payload.given_name || "";
          family_name = payload.family_name || "";
          picture = payload.picture || null;
          email_verified = Boolean(payload.email_verified);
        } else {
          const res = await fetch(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );

          if (!res.ok) {
            return reply.code(401).send({ error: "Google token yaroqsiz" });
          }

          const payload = await res.json();
          if (!payload || !payload.email) {
            return reply.code(401).send({ error: "Google token yaroqsiz" });
          }

          email = payload.email;
          given_name = payload.given_name || "";
          family_name = payload.family_name || "";
          picture = payload.picture || null;
          email_verified = Boolean(payload.email_verified);
        }

        // Foydalanuvchi mavjudmi?
        let user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });

        if (!user) {
          // Yangi foydalanuvchi yaratish (parolsiz)
          const randomPass = await hashPassword(randomUUID());
          user = await prisma.user.create({
            data: {
              email: email.toLowerCase(),
              passwordHash: randomPass,
              firstName: given_name || "User",
              lastName: family_name || "",
              avatarUrl: picture || null,
              role: "SENDER",
              isVerified: email_verified || false,
            },
          });
        } else if (picture && !user.avatarUrl) {
          // Mavjud user — avatar yangilash
          user = await prisma.user.update({
            where: { id: user.id },
            data: { avatarUrl: picture },
          });
        }

        if (user.isBlocked) {
          return reply.code(403).send({
            error: "Hisobingiz bloklangan. Admin bilan bog'laning.",
          });
        }

        // Tokenlar
        const jwtAccessToken = app.jwt.sign({
          id: user.id,
          email: user.email,
          role: user.role,
          isAdmin: user.isAdmin,
        });

        const refreshToken = app.jwt.sign(
          { id: user.id },
          { expiresIn: process.env.JWT_REFRESH_EXPIRY || "7d" }
        );

        await prisma.user.update({
          where: { id: user.id },
          data: { refreshToken },
        });

        reply.setCookie("accessToken", jwtAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24,
        });

        reply.setCookie("refreshToken", refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 30,
        });

        return reply.send({
          accessToken: jwtAccessToken,
          refreshToken,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            role: user.role,
            avatarUrl: user.avatarUrl,
            isVerified: user.isVerified,
            isAdmin: user.isAdmin,
          },
        });
      } catch (err) {
        console.error("Google auth xatolik:", err);
        return reply.code(401).send({ error: "Google autentifikatsiya xatosi" });
      }
    }
  );

  // POST /api/auth/telegram — Telegram Mini App orqali kirish
  app.post(
    "/telegram",
    async (
      request: FastifyRequest<{ Body: { initData: string } }>,
      reply: FastifyReply
    ) => {
      const { initData } = request.body;

      if (!initData) {
        return reply.code(400).send({ error: "Telegram initData majburiy" });
      }

      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (!botToken) {
        return reply.code(500).send({ error: "Telegram bot konfiguratsiyasi topilmadi" });
      }

      try {
        const parsed = validateTelegramInitData(initData, botToken);
        const tgUser = parsed.user;

        // telegramId bo'yicha user qidirish
        let user = await prisma.user.findUnique({
          where: { telegramId: BigInt(tgUser.id) },
        });

        if (!user) {
          // Yangi user yaratish
          const randomPass = await hashPassword(randomUUID());
          user = await prisma.user.create({
            data: {
              email: `tg_${tgUser.id}@telegram.flypost.uz`,
              passwordHash: randomPass,
              firstName: tgUser.first_name || "User",
              lastName: tgUser.last_name || "",
              avatarUrl: tgUser.photo_url || null,
              telegramId: BigInt(tgUser.id),
              telegramUsername: tgUser.username || null,
              telegramPhotoUrl: tgUser.photo_url || null,
              role: "SENDER",
              isVerified: false,
            },
          });
        } else {
          // Telegram ma'lumotlarini yangilash
          await prisma.user.update({
            where: { id: user.id },
            data: {
              telegramUsername: tgUser.username || user.telegramUsername,
              telegramPhotoUrl: tgUser.photo_url || user.telegramPhotoUrl,
            },
          });
        }

        if (user.isBlocked) {
          return reply.code(403).send({
            error: "Hisobingiz bloklangan. Admin bilan bog'laning.",
          });
        }

        // Tokenlar
        const jwtAccessToken = app.jwt.sign({
          id: user.id,
          email: user.email,
          role: user.role,
          isAdmin: user.isAdmin,
        });

        const refreshToken = app.jwt.sign(
          { id: user.id },
          { expiresIn: process.env.JWT_REFRESH_EXPIRY || "7d" }
        );

        await prisma.user.update({
          where: { id: user.id },
          data: { refreshToken },
        });

        return reply.send({
          accessToken: jwtAccessToken,
          refreshToken,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            role: user.role,
            avatarUrl: user.avatarUrl,
            isVerified: user.isVerified,
            isAdmin: user.isAdmin,
          },
        });
      } catch (err: any) {
        console.error("Telegram auth xatolik:", err);
        return reply.code(401).send({
          error: err.message || "Telegram autentifikatsiya xatosi",
        });
      }
    }
  );

  // POST /api/auth/telegram-widget — Telegram Login Widget orqali kirish (web)
  app.post(
    "/telegram-widget",
    async (
      request: FastifyRequest<{ Body: TelegramWidgetData }>,
      reply: FastifyReply
    ) => {
      const data = request.body;

      if (!data || !data.id || !data.hash) {
        return reply.code(400).send({ error: "Telegram ma'lumotlari noto'g'ri" });
      }

      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (!botToken) {
        return reply.code(500).send({ error: "Telegram bot konfiguratsiyasi topilmadi" });
      }

      try {
        validateTelegramWidget(data, botToken);

        // telegramId bo'yicha user qidirish
        let user = await prisma.user.findUnique({
          where: { telegramId: BigInt(data.id) },
        });

        if (!user) {
          // Yangi user yaratish
          const randomPass = await hashPassword(randomUUID());
          user = await prisma.user.create({
            data: {
              email: `tg_${data.id}@telegram.flypost.uz`,
              passwordHash: randomPass,
              firstName: data.first_name || "User",
              lastName: data.last_name || "",
              avatarUrl: data.photo_url || null,
              telegramId: BigInt(data.id),
              telegramUsername: data.username || null,
              telegramPhotoUrl: data.photo_url || null,
              role: "SENDER",
              isVerified: true,
            },
          });
        } else {
          // Telegram ma'lumotlarini yangilash
          await prisma.user.update({
            where: { id: user.id },
            data: {
              telegramUsername: data.username || user.telegramUsername,
              telegramPhotoUrl: data.photo_url || user.telegramPhotoUrl,
            },
          });
        }

        if (user.isBlocked) {
          return reply.code(403).send({
            error: "Hisobingiz bloklangan. Admin bilan bog'laning.",
          });
        }

        // Tokenlar
        const jwtAccessToken = app.jwt.sign({
          id: user.id,
          email: user.email,
          role: user.role,
          isAdmin: user.isAdmin,
        });

        const refreshToken = app.jwt.sign(
          { id: user.id },
          { expiresIn: process.env.JWT_REFRESH_EXPIRY || "7d" }
        );

        await prisma.user.update({
          where: { id: user.id },
          data: { refreshToken },
        });

        reply.setCookie("accessToken", jwtAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24,
        });

        reply.setCookie("refreshToken", refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 30,
        });

        return reply.send({
          accessToken: jwtAccessToken,
          refreshToken,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            role: user.role,
            avatarUrl: user.avatarUrl,
            isVerified: user.isVerified,
            isAdmin: user.isAdmin,
          },
        });
      } catch (err: any) {
        console.error("Telegram widget auth xatolik:", err);
        return reply.code(401).send({
          error: err.message || "Telegram autentifikatsiya xatosi",
        });
      }
    }
  );

  // POST /api/auth/reset-password
  app.post(
    "/reset-password",
    async (
      request: FastifyRequest<{ Body: ResetPasswordBody }>,
      reply: FastifyReply
    ) => {
      const { token, password } = request.body;

      if (!token || !password) {
        return reply.code(400).send({
          error: "Token va yangi parol majburiy",
        });
      }

      if (password.length < 8) {
        return reply.code(400).send({
          error: "Parol kamida 8 belgidan iborat bo'lishi kerak",
        });
      }

      const user = await prisma.user.findFirst({
        where: {
          resetToken: token,
          resetTokenExpiry: { gt: new Date() },
        },
      });

      if (!user) {
        return reply.code(400).send({
          error: "Token yaroqsiz yoki muddati o'tgan",
        });
      }

      const passwordHash = await hashPassword(password);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          resetToken: null,
          resetTokenExpiry: null,
        },
      });

      return reply.send({
        message: "Parol muvaffaqiyatli yangilandi!",
      });
    }
  );
}
