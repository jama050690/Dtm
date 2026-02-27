import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../lib/prisma.js";

export async function notificationRoutes(app: FastifyInstance) {
  // GET /api/notifications — Barcha bildirishnomalar
  app.get(
    "/",
    { preHandler: [app.authenticate as any] },
    async (
      request: FastifyRequest<{
        Querystring: { page?: string; limit?: string };
      }>,
      reply: FastifyReply
    ) => {
      const userId = (request.user as { id: string }).id;
      const page = parseInt(request.query.page || "1");
      const limit = parseInt(request.query.limit || "20");
      const skip = (page - 1) * limit;

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.notification.count({ where: { userId } }),
      ]);

      return reply.send({ notifications, total, page, limit });
    }
  );

  // GET /api/notifications/unread-count — O'qilmaganlar soni
  app.get(
    "/unread-count",
    { preHandler: [app.authenticate as any] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = (request.user as { id: string }).id;

      const count = await prisma.notification.count({
        where: { userId, isRead: false },
      });

      return reply.send({ count });
    }
  );

  // PUT /api/notifications/read-all — Hammasini o'qilgan deb belgilash
  app.put(
    "/read-all",
    { preHandler: [app.authenticate as any] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = (request.user as { id: string }).id;

      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });

      return reply.send({ success: true });
    }
  );

  // PUT /api/notifications/:id/read — Bittasini o'qilgan deb belgilash
  app.put(
    "/:id/read",
    { preHandler: [app.authenticate as any] },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      const userId = (request.user as { id: string }).id;
      const { id } = request.params;

      const notification = await prisma.notification.findUnique({
        where: { id },
      });

      if (!notification || notification.userId !== userId) {
        return reply.code(404).send({ error: "Bildirishnoma topilmadi" });
      }

      const updated = await prisma.notification.update({
        where: { id },
        data: { isRead: true },
      });

      return reply.send(updated);
    }
  );
}
