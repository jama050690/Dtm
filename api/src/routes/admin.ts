import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../lib/prisma.js";

// Admin middleware
async function isAdmin(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { id: string; isAdmin: boolean };
  if (!user.isAdmin) {
    return reply.code(403).send({ error: "Admin huquqi talab qilinadi" });
  }
}

export async function adminRoutes(app: FastifyInstance) {
  // Barcha admin routelar uchun auth + admin tekshiruv
  app.addHook("preHandler", app.authenticate as any);
  app.addHook("preHandler", isAdmin);

  // GET /api/admin/stats — Statistika
  app.get(
    "/stats",
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const [
        totalUsers,
        totalTrips,
        activeTrips,
        totalRequests,
        pendingRequests,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.trip.count(),
        prisma.trip.count({ where: { status: "ACTIVE" } }),
        prisma.request.count(),
        prisma.request.count({ where: { status: "PENDING" } }),
      ]);

      // Oxirgi 30 kun ichida ro'yxatdan o'tganlar
      const newUsersLast30Days = await prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      });

      // Eng mashhur yo'nalishlar
      const topRoutes = await prisma.trip.groupBy({
        by: ["fromCountry", "toCountry"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 5,
      });

      return reply.send({
        users: {
          total: totalUsers,
          newLast30Days: newUsersLast30Days,
        },
        trips: {
          total: totalTrips,
          active: activeTrips,
        },
        requests: {
          total: totalRequests,
          pending: pendingRequests,
        },
        topRoutes: topRoutes.map((r) => ({
          from: r.fromCountry,
          to: r.toCountry,
          count: r._count.id,
        })),
      });
    }
  );

  // GET /api/admin/users — Foydalanuvchilar ro'yxati
  app.get(
    "/users",
    async (
      request: FastifyRequest<{
        Querystring: { page?: string; limit?: string; search?: string };
      }>,
      reply: FastifyReply
    ) => {
      const page = parseInt(request.query.page || "1");
      const limit = parseInt(request.query.limit || "20");
      const search = request.query.search;

      const where: any = {};
      if (search) {
        where.OR = [
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ];
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            city: true,
            role: true,
            rating: true,
            isVerified: true,
            isBlocked: true,
            isAdmin: true,
            createdAt: true,
            _count: {
              select: { trips: true, sentRequests: true },
            },
          },
        }),
        prisma.user.count({ where }),
      ]);

      return reply.send({
        users,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    }
  );

  // PUT /api/admin/users/:id/block — Bloklash/Blokdan chiqarish
  app.put(
    "/users/:id/block",
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: { blocked: boolean };
      }>,
      reply: FastifyReply
    ) => {
      const { id } = request.params;
      const { blocked } = request.body;

      const user = await prisma.user.update({
        where: { id },
        data: { isBlocked: blocked },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isBlocked: true,
        },
      });

      return reply.send({
        message: blocked ? "Foydalanuvchi bloklandi" : "Blokdan chiqarildi",
        user,
      });
    }
  );

  // PUT /api/admin/users/:id — Foydalanuvchi ma'lumotlarini tahrirlash
  app.put(
    "/users/:id",
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: {
          firstName?: string;
          lastName?: string;
          phone?: string | null;
          city?: string | null;
          role?: "TRAVELER" | "SENDER" | "BOTH";
          isVerified?: boolean;
        };
      }>,
      reply: FastifyReply
    ) => {
      const { id } = request.params;
      const body = request.body ?? {};
      const allowedRoles = ["TRAVELER", "SENDER", "BOTH"] as const;

      if (body.role && !allowedRoles.includes(body.role)) {
        return reply.code(400).send({ error: "role noto'g'ri" });
      }

      const updateData: {
        firstName?: string;
        lastName?: string;
        phone?: string | null;
        city?: string | null;
        role?: "TRAVELER" | "SENDER" | "BOTH";
        isVerified?: boolean;
      } = {};

      if (body.firstName !== undefined) updateData.firstName = body.firstName;
      if (body.lastName !== undefined) updateData.lastName = body.lastName;
      if (body.phone !== undefined) updateData.phone = body.phone;
      if (body.city !== undefined) updateData.city = body.city;
      if (body.role !== undefined) updateData.role = body.role;
      if (body.isVerified !== undefined) updateData.isVerified = body.isVerified;

      if (Object.keys(updateData).length === 0) {
        return reply
          .code(400)
          .send({ error: "Yangilash uchun maydon yuborilmadi" });
      }

      const user = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          city: true,
          role: true,
          isVerified: true,
          isBlocked: true,
          isAdmin: true,
          createdAt: true,
          _count: {
            select: { trips: true, sentRequests: true },
          },
        },
      });

      return reply.send({ message: "Foydalanuvchi yangilandi", user });
    }
  );

  // DELETE /api/admin/users/:id — Foydalanuvchini o'chirish
  app.delete(
    "/users/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      const { id } = request.params;
      const adminId = (request.user as { id: string }).id;

      if (id === adminId) {
        return reply.code(400).send({ error: "O'zingizni o'chira olmaysiz" });
      }

      const targetUser = await prisma.user.findUnique({
        where: { id },
        select: { id: true, isAdmin: true },
      });

      if (!targetUser) {
        return reply.code(404).send({ error: "Foydalanuvchi topilmadi" });
      }

      if (targetUser.isAdmin) {
        return reply.code(400).send({ error: "Admin foydalanuvchini o'chirib bo'lmaydi" });
      }

      await prisma.user.delete({ where: { id } });

      return reply.send({ message: "Foydalanuvchi o'chirildi" });
    }
  );

  // GET /api/admin/trips — E'lonlar ro'yxati
  app.get(
    "/trips",
    async (
      request: FastifyRequest<{
        Querystring: { page?: string; limit?: string; status?: string };
      }>,
      reply: FastifyReply
    ) => {
      const page = parseInt(request.query.page || "1");
      const limit = parseInt(request.query.limit || "20");
      const status = request.query.status;

      const where: any = {};
      if (status) where.status = status;

      const [trips, total] = await Promise.all([
        prisma.trip.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            _count: { select: { requests: true } },
          },
        }),
        prisma.trip.count({ where }),
      ]);

      return reply.send({
        trips,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    }
  );

  // DELETE /api/admin/trips/:id — E'lonni o'chirish
  app.delete(
    "/trips/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      const { id } = request.params;

      await prisma.trip.delete({ where: { id } });

      return reply.send({ message: "E'lon o'chirildi" });
    }
  );

  // PUT /api/admin/trips/:id — E'lonni tahrirlash
  app.put(
    "/trips/:id",
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: {
          departureDate?: string;
          maxWeightKg?: number;
          availableWeightKg?: number;
          pricePerKg?: number;
          status?: "ACTIVE" | "INACTIVE" | "COMPLETED";
        };
      }>,
      reply: FastifyReply
    ) => {
      const { id } = request.params;
      const body = request.body ?? {};
      const allowedStatuses = ["ACTIVE", "INACTIVE", "COMPLETED"] as const;

      if (body.status && !allowedStatuses.includes(body.status)) {
        return reply.code(400).send({ error: "status noto'g'ri" });
      }

      if (body.pricePerKg !== undefined && body.pricePerKg <= 0) {
        return reply.code(400).send({ error: "Narx 0 dan katta bo'lishi kerak" });
      }

      if (body.maxWeightKg !== undefined && body.maxWeightKg <= 0) {
        return reply.code(400).send({ error: "Vazn 0 dan katta bo'lishi kerak" });
      }

      if (body.availableWeightKg !== undefined && body.availableWeightKg < 0) {
        return reply.code(400).send({ error: "Bo'sh vazn manfiy bo'lishi mumkin emas" });
      }

      const existingTrip = await prisma.trip.findUnique({
        where: { id },
        select: {
          id: true,
          maxWeightKg: true,
          availableWeightKg: true,
        },
      });

      if (!existingTrip) {
        return reply.code(404).send({ error: "E'lon topilmadi" });
      }

      const nextMaxWeight =
        body.maxWeightKg !== undefined ? body.maxWeightKg : existingTrip.maxWeightKg;
      const nextAvailableWeight =
        body.availableWeightKg !== undefined
          ? body.availableWeightKg
          : Math.min(existingTrip.availableWeightKg, nextMaxWeight);

      if (nextAvailableWeight > nextMaxWeight) {
        return reply
          .code(400)
          .send({ error: "Bo'sh vazn maksimal vazndan katta bo'lishi mumkin emas" });
      }

      const updateData: {
        departureDate?: Date;
        maxWeightKg?: number;
        availableWeightKg?: number;
        pricePerKg?: number;
        status?: "ACTIVE" | "INACTIVE" | "COMPLETED";
      } = {};

      if (body.departureDate !== undefined) {
        const parsedDate = new Date(body.departureDate);
        if (Number.isNaN(parsedDate.getTime())) {
          return reply.code(400).send({ error: "departureDate noto'g'ri formatda" });
        }
        updateData.departureDate = parsedDate;
      }

      if (body.maxWeightKg !== undefined) updateData.maxWeightKg = body.maxWeightKg;
      if (body.availableWeightKg !== undefined || body.maxWeightKg !== undefined) {
        updateData.availableWeightKg = nextAvailableWeight;
      }
      if (body.pricePerKg !== undefined) updateData.pricePerKg = body.pricePerKg;
      if (body.status !== undefined) updateData.status = body.status;

      if (Object.keys(updateData).length === 0) {
        return reply
          .code(400)
          .send({ error: "Yangilash uchun maydon yuborilmadi" });
      }

      const trip = await prisma.trip.update({
        where: { id },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          _count: { select: { requests: true } },
        },
      });

      return reply.send({ message: "E'lon yangilandi", trip });
    }
  );

  app.get(
    "/kyc",
    async (
      request: FastifyRequest<{
        Querystring: {
          page?: string;
          limit?: string;
          status?: "PENDING" | "APPROVED" | "REJECTED";
        };
      }>,
      reply: FastifyReply
    ) => {
      const page = parseInt(request.query.page || "1");
      const limit = parseInt(request.query.limit || "20");
      const status = request.query.status;

      const where: { status?: "PENDING" | "APPROVED" | "REJECTED" } = {};
      if (status) where.status = status;

      const [items, total] = await Promise.all([
        prisma.kycVerification.findMany({
          where,
          orderBy: { submittedAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                isVerified: true,
              },
            },
          },
        }),
        prisma.kycVerification.count({ where }),
      ]);

      return reply.send({
        items,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    }
  );

  app.put(
    "/kyc/:id/review",
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: { status: "APPROVED" | "REJECTED"; reason?: string };
      }>,
      reply: FastifyReply
    ) => {
      const { id } = request.params;
      const { status, reason } = request.body;
      const adminId = (request.user as { id: string }).id;

      if (status !== "APPROVED" && status !== "REJECTED") {
        return reply.code(400).send({ error: "status noto'g'ri" });
      }

      const existing = await prisma.kycVerification.findUnique({
        where: { id },
        select: { id: true, userId: true },
      });

      if (!existing) {
        return reply.code(404).send({ error: "KYC so'rovi topilmadi" });
      }

      const verification = await prisma.$transaction(async (tx) => {
        const updated = await tx.kycVerification.update({
          where: { id },
          data: {
            status,
            rejectionReason:
              status === "REJECTED" ? reason || "Sabab ko'rsatilmagan" : null,
            reviewedAt: new Date(),
            reviewedBy: adminId,
          },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        });

        await tx.user.update({
          where: { id: existing.userId },
          data: { isVerified: status === "APPROVED" },
        });

        return updated;
      });

      return reply.send({
        message: status === "APPROVED" ? "KYC tasdiqlandi" : "KYC rad etildi",
        verification,
      });
    }
  );

  // ---------------- DTM Admin Panel ----------------

  // GET /api/admin/dtm/stats
  app.get("/dtm/stats", async (_request: FastifyRequest, reply: FastifyReply) => {
    const [directions, subjects, questions, attempts, users] = await Promise.all([
      prisma.direction.count({ where: { isActive: true } }),
      prisma.subject.count(),
      prisma.testQuestion.count(),
      prisma.testResult.count(),
      prisma.user.count(),
    ]);

    return reply.send({
      directions,
      subjects,
      questions,
      attempts,
      users,
    });
  });

  // GET /api/admin/dtm/directions
  app.get("/dtm/directions", async (_request: FastifyRequest) => {
    const directions = await prisma.direction.findMany({
      orderBy: { id: "asc" },
      include: {
        _count: { select: { subjects: true } },
      },
    });

    return directions;
  });

  // POST /api/admin/dtm/directions
  app.post(
    "/dtm/directions",
    async (
      request: FastifyRequest<{
        Body: { id?: number; name: string; description?: string; isActive?: boolean };
      }>,
      reply: FastifyReply
    ) => {
      const { id, name, description, isActive = true } = request.body;

      if (!name?.trim()) {
        return reply.code(400).send({ error: "name majburiy" });
      }

      const direction = await prisma.direction.create({
        data: {
          ...(id ? { id } : {}),
          name: name.trim(),
          description,
          isActive,
        },
      });

      return reply.code(201).send(direction);
    }
  );

  // PUT /api/admin/dtm/directions/:id
  app.put(
    "/dtm/directions/:id",
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: { name?: string; description?: string; isActive?: boolean };
      }>,
      reply: FastifyReply
    ) => {
      const id = Number.parseInt(request.params.id, 10);
      if (Number.isNaN(id)) {
        return reply.code(400).send({ error: "directionId noto'g'ri" });
      }

      const body = request.body ?? {};
      const data: { name?: string; description?: string; isActive?: boolean } = {};
      if (body.name !== undefined) data.name = body.name.trim();
      if (body.description !== undefined) data.description = body.description;
      if (body.isActive !== undefined) data.isActive = body.isActive;

      if (Object.keys(data).length === 0) {
        return reply.code(400).send({ error: "Yangilash uchun maydon yuborilmadi" });
      }

      const direction = await prisma.direction.update({
        where: { id },
        data,
      });

      return reply.send(direction);
    }
  );

  // GET /api/admin/dtm/subjects
  app.get(
    "/dtm/subjects",
    async (
      request: FastifyRequest<{ Querystring: { directionId?: string } }>,
      reply: FastifyReply
    ) => {
      const directionId = request.query.directionId
        ? Number.parseInt(request.query.directionId, 10)
        : undefined;

      if (request.query.directionId && Number.isNaN(directionId)) {
        return reply.code(400).send({ error: "directionId noto'g'ri" });
      }

      const subjects = await prisma.subject.findMany({
        where: directionId ? { directionId } : undefined,
        orderBy: { id: "asc" },
        include: {
          direction: { select: { id: true, name: true } },
          _count: { select: { testQuestions: true } },
        },
      });

      return reply.send(subjects);
    }
  );

  // POST /api/admin/dtm/subjects
  app.post(
    "/dtm/subjects",
    async (
      request: FastifyRequest<{
        Body: { directionId: number; name: string; description?: string };
      }>,
      reply: FastifyReply
    ) => {
      const { directionId, name, description } = request.body;

      if (!directionId || !name?.trim()) {
        return reply.code(400).send({ error: "directionId va name majburiy" });
      }

      const subject = await prisma.subject.create({
        data: {
          directionId,
          name: name.trim(),
          description,
        },
      });

      return reply.code(201).send(subject);
    }
  );

  // PUT /api/admin/dtm/subjects/:id
  app.put(
    "/dtm/subjects/:id",
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: { directionId?: number; name?: string; description?: string };
      }>,
      reply: FastifyReply
    ) => {
      const id = Number.parseInt(request.params.id, 10);
      if (Number.isNaN(id)) {
        return reply.code(400).send({ error: "subjectId noto'g'ri" });
      }

      const body = request.body ?? {};
      const data: { directionId?: number; name?: string; description?: string } = {};
      if (body.directionId !== undefined) data.directionId = body.directionId;
      if (body.name !== undefined) data.name = body.name.trim();
      if (body.description !== undefined) data.description = body.description;

      if (Object.keys(data).length === 0) {
        return reply.code(400).send({ error: "Yangilash uchun maydon yuborilmadi" });
      }

      const subject = await prisma.subject.update({
        where: { id },
        data,
      });

      return reply.send(subject);
    }
  );

  // DELETE /api/admin/dtm/subjects/:id
  app.delete(
    "/dtm/subjects/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      const id = Number.parseInt(request.params.id, 10);
      if (Number.isNaN(id)) {
        return reply.code(400).send({ error: "subjectId noto'g'ri" });
      }

      await prisma.subject.delete({ where: { id } });
      return reply.send({ message: "Fan o'chirildi" });
    }
  );

  // GET /api/admin/dtm/subjects/:subjectId/questions
  app.get(
    "/dtm/subjects/:subjectId/questions",
    async (
      request: FastifyRequest<{ Params: { subjectId: string } }>,
      reply: FastifyReply
    ) => {
      const subjectId = Number.parseInt(request.params.subjectId, 10);
      if (Number.isNaN(subjectId)) {
        return reply.code(400).send({ error: "subjectId noto'g'ri" });
      }

      const questions = await prisma.testQuestion.findMany({
        where: { subjectId },
        orderBy: { id: "asc" },
      });

      return reply.send(questions);
    }
  );

  // POST /api/admin/dtm/subjects/:subjectId/questions
  app.post(
    "/dtm/subjects/:subjectId/questions",
    async (
      request: FastifyRequest<{
        Params: { subjectId: string };
        Body: {
          question: string;
          optionA: string;
          optionB: string;
          optionC: string;
          optionD: string;
          correct: "A" | "B" | "C" | "D";
        };
      }>,
      reply: FastifyReply
    ) => {
      const subjectId = Number.parseInt(request.params.subjectId, 10);
      if (Number.isNaN(subjectId)) {
        return reply.code(400).send({ error: "subjectId noto'g'ri" });
      }

      const { question, optionA, optionB, optionC, optionD, correct } = request.body;
      if (!question || !optionA || !optionB || !optionC || !optionD || !correct) {
        return reply.code(400).send({ error: "Barcha maydonlar majburiy" });
      }

      const validCorrect = ["A", "B", "C", "D"];
      if (!validCorrect.includes(correct)) {
        return reply.code(400).send({ error: "correct faqat A/B/C/D bo'lishi kerak" });
      }

      const created = await prisma.testQuestion.create({
        data: {
          subjectId,
          question,
          optionA,
          optionB,
          optionC,
          optionD,
          correct,
        },
      });

      return reply.code(201).send(created);
    }
  );

  // PUT /api/admin/dtm/questions/:id
  app.put(
    "/dtm/questions/:id",
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: {
          question?: string;
          optionA?: string;
          optionB?: string;
          optionC?: string;
          optionD?: string;
          correct?: "A" | "B" | "C" | "D";
        };
      }>,
      reply: FastifyReply
    ) => {
      const id = Number.parseInt(request.params.id, 10);
      if (Number.isNaN(id)) {
        return reply.code(400).send({ error: "questionId noto'g'ri" });
      }

      const data = request.body ?? {};
      if (data.correct !== undefined && !["A", "B", "C", "D"].includes(data.correct)) {
        return reply.code(400).send({ error: "correct faqat A/B/C/D bo'lishi kerak" });
      }

      if (Object.keys(data).length === 0) {
        return reply.code(400).send({ error: "Yangilash uchun maydon yuborilmadi" });
      }

      const updated = await prisma.testQuestion.update({
        where: { id },
        data,
      });

      return reply.send(updated);
    }
  );

  // DELETE /api/admin/dtm/questions/:id
  app.delete(
    "/dtm/questions/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      const id = Number.parseInt(request.params.id, 10);
      if (Number.isNaN(id)) {
        return reply.code(400).send({ error: "questionId noto'g'ri" });
      }

      await prisma.testQuestion.delete({ where: { id } });
      return reply.send({ message: "Savol o'chirildi" });
    }
  );
}
