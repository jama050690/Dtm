import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../lib/prisma.js";

interface CreateRequestBody {
  tripId: string;
  itemDescription: string;
  weightKg: number;
  message?: string;
}

export async function requestRoutes(app: FastifyInstance) {
  // POST /api/requests — Ariza yuborish
  app.post(
    "/",
    { preHandler: [app.authenticate as any] },
    async (
      request: FastifyRequest<{ Body: CreateRequestBody }>,
      reply: FastifyReply
    ) => {
      const senderId = (request.user as { id: string }).id;
      const { tripId, itemDescription, weightKg, message } = request.body;

      if (!tripId || !itemDescription || !weightKg) {
        return reply.code(400).send({
          error: "Trip ID, mahsulot tavsifi va og'irlik majburiy",
        });
      }

      // Trip tekshirish
      const trip = await prisma.trip.findUnique({
        where: { id: tripId },
        include: { user: { select: { id: true } } },
      });

      if (!trip) {
        return reply.code(404).send({ error: "E'lon topilmadi" });
      }

      if (trip.status !== "ACTIVE") {
        return reply.code(400).send({ error: "Bu e'lon faol emas" });
      }

      if (trip.userId === senderId) {
        return reply.code(400).send({
          error: "O'z e'loningizga ariza yubora olmaysiz",
        });
      }

      if (weightKg > trip.availableWeightKg) {
        return reply.code(400).send({
          error: `Faqat ${trip.availableWeightKg} kg bo'sh joy mavjud`,
        });
      }

      // Takroriy ariza tekshirish
      const existingRequest = await prisma.request.findFirst({
        where: {
          tripId,
          senderId,
          status: "PENDING",
        },
      });

      if (existingRequest) {
        return reply.code(409).send({
          error: "Siz allaqachon bu e'longa ariza yuborgansiz",
        });
      }

      const newRequest = await prisma.request.create({
        data: {
          tripId,
          senderId,
          itemDescription,
          weightKg,
          message,
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
          trip: {
            select: {
              id: true,
              fromCity: true,
              toCity: true,
              departureDate: true,
            },
          },
        },
      });

      // Trip egasiga notification yuborish
      try {
        await prisma.notification.create({
          data: {
            userId: trip.userId,
            type: "NEW_REQUEST",
            title: "Yangi ariza",
            message: `${newRequest.sender.firstName} ${newRequest.sender.lastName} sizning ${newRequest.trip.fromCity} → ${newRequest.trip.toCity} e'loningizga ariza yubordi`,
            requestId: newRequest.id,
          },
        });
      } catch (err) {
        console.error("Notification yaratishda xatolik:", err);
      }

      return reply.code(201).send(newRequest);
    }
  );

  // GET /api/requests/sent — Yuborilgan arizalar
  app.get(
    "/sent",
    { preHandler: [app.authenticate as any] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const senderId = (request.user as { id: string }).id;

      const requests = await prisma.request.findMany({
        where: { senderId },
        orderBy: { createdAt: "desc" },
        include: {
          trip: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      });

      return reply.send(requests);
    }
  );

  // GET /api/requests/received — Qabul qilingan arizalar (yo'lovchi uchun)
  app.get(
    "/received",
    { preHandler: [app.authenticate as any] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = (request.user as { id: string }).id;

      const requests = await prisma.request.findMany({
        where: {
          trip: { userId },
        },
        orderBy: { createdAt: "desc" },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
              rating: true,
            },
          },
          trip: {
            select: {
              id: true,
              fromCity: true,
              toCity: true,
              departureDate: true,
            },
          },
        },
      });

      return reply.send(requests);
    }
  );

  // PUT /api/requests/:id/accept — Arizani qabul qilish
  app.put(
    "/:id/accept",
    { preHandler: [app.authenticate as any] },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      const userId = (request.user as { id: string }).id;
      const { id } = request.params;

      const req = await prisma.request.findUnique({
        where: { id },
        include: { trip: true },
      });

      if (!req) {
        return reply.code(404).send({ error: "Ariza topilmadi" });
      }

      if (req.trip.userId !== userId) {
        return reply.code(403).send({
          error: "Faqat o'z e'loningizdagi arizalarni boshqarishingiz mumkin",
        });
      }

      if (req.status !== "PENDING") {
        return reply.code(400).send({
          error: "Bu ariza allaqachon ko'rib chiqilgan",
        });
      }

      // Arizani qabul qilish va mavjud og'irlikni kamaytirish
      const [updatedRequest] = await prisma.$transaction([
        prisma.request.update({
          where: { id },
          data: { status: "ACCEPTED" },
        }),
        prisma.trip.update({
          where: { id: req.tripId },
          data: {
            availableWeightKg: {
              decrement: req.weightKg,
            },
          },
        }),
      ]);

      // Ariza yuboruvchiga notification
      try {
        await prisma.notification.create({
          data: {
            userId: req.senderId,
            type: "REQUEST_ACCEPTED",
            title: "Ariza qabul qilindi",
            message: `Sizning ${req.trip.fromCity} → ${req.trip.toCity} e'loniga yuborgan arizangiz qabul qilindi!`,
            requestId: req.id,
          },
        });
      } catch (err) {
        console.error("Notification yaratishda xatolik:", err);
      }

      return reply.send(updatedRequest);
    }
  );

  // PUT /api/requests/:id/reject — Arizani rad etish
  app.put(
    "/:id/reject",
    { preHandler: [app.authenticate as any] },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      const userId = (request.user as { id: string }).id;
      const { id } = request.params;

      const req = await prisma.request.findUnique({
        where: { id },
        include: { trip: true },
      });

      if (!req) {
        return reply.code(404).send({ error: "Ariza topilmadi" });
      }

      if (req.trip.userId !== userId) {
        return reply.code(403).send({
          error: "Faqat o'z e'loningizdagi arizalarni boshqarishingiz mumkin",
        });
      }

      if (req.status !== "PENDING") {
        return reply.code(400).send({
          error: "Bu ariza allaqachon ko'rib chiqilgan",
        });
      }

      const updatedRequest = await prisma.request.update({
        where: { id },
        data: { status: "REJECTED" },
      });

      // Ariza yuboruvchiga notification
      try {
        await prisma.notification.create({
          data: {
            userId: req.senderId,
            type: "REQUEST_REJECTED",
            title: "Ariza rad etildi",
            message: `Sizning ${req.trip.fromCity} → ${req.trip.toCity} e'loniga yuborgan arizangiz rad etildi`,
            requestId: req.id,
          },
        });
      } catch (err) {
        console.error("Notification yaratishda xatolik:", err);
      }

      return reply.send(updatedRequest);
    }
  );
}
