import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import cookie from "@fastify/cookie";
import rateLimit from "@fastify/rate-limit";
import websocket from "@fastify/websocket";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import path from "path";
import { authRoutes } from "./routes/auth.js";
import { userRoutes } from "./routes/users.js";
import { tripRoutes } from "./routes/trips.js";
import { requestRoutes } from "./routes/requests.js";
import { chatRoutes } from "./routes/chat.js";
import { reviewRoutes } from "./routes/reviews.js";
import { adminRoutes } from "./routes/admin.js";
import { otpRoutes } from "./routes/otp.js";
import { notificationRoutes } from "./routes/notifications.js";
import { kycRoutes } from "./routes/kyc.js";
import { dtmRoutes } from "./routes/dtm.js";

const app = Fastify({
  logger: {
    transport: {
      target: "pino-pretty",
      options: { colorize: true },
    },
  },
});

// Plugins
await app.register(cors, {
  origin: [
    process.env.CLIENT_URL || "http://localhost:5173",
    "http://localhost:3001",
    "http://localhost:3000",
    "https://flypost.uz",
  ],
  credentials: true,
});

await app.register(jwt, {
  secret: process.env.JWT_SECRET || "default-secret",
  sign: { expiresIn: process.env.JWT_ACCESS_EXPIRY || "15m" },
});

await app.register(cookie);

await app.register(rateLimit, {
  max: 100,
  timeWindow: "1 minute",
});

await app.register(websocket);

await app.register(multipart, {
  limits: { fileSize: 5 * 1024 * 1024 },
});

await app.register(fastifyStatic, {
  root: path.join(process.cwd(), "uploads"),
  prefix: "/api/uploads/",
});

// Auth decorator — header yoki cookie'dan token o'qish
app.addHook("onRequest", async (request) => {
  // Agar Authorization header allaqachon bor bo'lsa, cookie kerak emas
  if (request.headers.authorization) return;
  const token = request.cookies.accessToken;
  if (token) {
    request.headers.authorization = `Bearer ${token}`;
  }
});

app.decorate("authenticate", async function (request: any, reply: any) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.code(401).send({ error: "Avtorizatsiyadan o'tilmagan" });
  }
});

// Routes
await app.register(authRoutes, { prefix: "/api/auth" });
await app.register(userRoutes, { prefix: "/api/users" });
await app.register(tripRoutes, { prefix: "/api/trips" });
await app.register(requestRoutes, { prefix: "/api/requests" });
await app.register(chatRoutes, { prefix: "/api/chat" });
await app.register(reviewRoutes, { prefix: "/api/reviews" });
await app.register(adminRoutes, { prefix: "/api/admin" });
await app.register(otpRoutes, { prefix: "/api/otp" });
await app.register(notificationRoutes, { prefix: "/api/notifications" });
await app.register(kycRoutes, { prefix: "/api/kyc" });
await app.register(dtmRoutes, { prefix: "/api" });

// Health check
app.get("/api/health", async () => {
  return { status: "ok", timestamp: new Date().toISOString() };
});

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || "3000");
    const host = process.env.HOST || "0.0.0.0";
    await app.listen({ port, host });
    console.log(`Server ishga tushdi: http://localhost:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();

export default app;
