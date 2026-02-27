import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../lib/prisma.js";
import { saveUploadedFile, deleteUploadedFile } from "../utils/uploads.js";

interface UpdateProfileBody {
  firstName?: string;
  lastName?: string;
  phone?: string;
  city?: string;
  role?: "TRAVELER" | "SENDER" | "BOTH";
}

export async function userRoutes(app: FastifyInstance) {
  // GET /api/users/me — Mening profilim
  app.get(
    "/me",
    { preHandler: [app.authenticate as any] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.user as { id: string };

      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          city: true,
          avatarUrl: true,
          role: true,
          rating: true,
          ratingCount: true,
          isVerified: true,
          isAdmin: true,
          createdAt: true,
          _count: {
            select: {
              trips: true,
              sentRequests: true,
              reviewsReceived: true,
            },
          },
        },
      });

      if (!user) {
        return reply.code(404).send({ error: "Foydalanuvchi topilmadi" });
      }

      return reply.send(user);
    }
  );

  // PUT /api/users/me — Profilni yangilash
  app.put(
    "/me",
    { preHandler: [app.authenticate as any] },
    async (
      request: FastifyRequest<{ Body: UpdateProfileBody }>,
      reply: FastifyReply
    ) => {
      const { id } = request.user as { id: string };
      const { firstName, lastName, phone, city, role } = request.body;

      const user = await prisma.user.update({
        where: { id },
        data: {
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...(phone !== undefined && { phone }),
          ...(city !== undefined && { city }),
          ...(role && { role }),
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          city: true,
          avatarUrl: true,
          role: true,
          rating: true,
          isVerified: true,
        },
      });

      return reply.send(user);
    }
  );

  // POST /api/users/me/avatar — Avatar yuklash
  app.post(
    "/me/avatar",
    { preHandler: [app.authenticate as any] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.user as { id: string };

      try {
        const file = await request.file();
        const { filePath } = await saveUploadedFile(file);

        // Eski avatarni o'chirish
        const currentUser = await prisma.user.findUnique({
          where: { id },
          select: { avatarUrl: true },
        });
        if (currentUser?.avatarUrl) {
          deleteUploadedFile(currentUser.avatarUrl);
        }

        const user = await prisma.user.update({
          where: { id },
          data: { avatarUrl: filePath },
          select: {
            id: true,
            avatarUrl: true,
          },
        });

        return reply.send(user);
      } catch (err: any) {
        return reply.code(400).send({ error: err.message });
      }
    }
  );

  // GET /api/users/:id — Foydalanuvchi profili (ommaviy)
  app.get(
    "/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      const { id } = request.params;

      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          city: true,
          avatarUrl: true,
          role: true,
          rating: true,
          ratingCount: true,
          isVerified: true,
          createdAt: true,
          _count: {
            select: {
              trips: true,
              reviewsReceived: true,
            },
          },
        },
      });

      if (!user) {
        return reply.code(404).send({ error: "Foydalanuvchi topilmadi" });
      }

      return reply.send(user);
    }
  );
}
