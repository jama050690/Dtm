import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../lib/prisma.js";

interface CreateMessageBody {
  text: string;
  imageUrl?: string;
}

interface StartChatBody {
  userId: string;
  tripId: string;
}

export async function chatRoutes(app: FastifyInstance) {
  // GET /api/chat — Suhbatlar ro'yxati
  app.get(
    "/",
    { preHandler: [app.authenticate as any] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = (request.user as { id: string }).id;

      const chats = await prisma.chat.findMany({
        where: {
          OR: [{ user1Id: userId }, { user2Id: userId }],
        },
        orderBy: { lastMessageAt: "desc" },
        include: {
          user1: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
          user2: {
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
            },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              text: true,
              createdAt: true,
              isRead: true,
              senderId: true,
            },
          },
        },
      });

      // Format: har bir chatda "otherUser" va "lastMessage" qo'shamiz
      const formattedChats = chats.map((chat) => {
        const otherUser =
          chat.user1Id === userId ? chat.user2 : chat.user1;
        const lastMessage = chat.messages[0] || null;

        return {
          id: chat.id,
          otherUser,
          trip: chat.trip,
          lastMessage,
          lastMessageAt: chat.lastMessageAt,
        };
      });

      return reply.send(formattedChats);
    }
  );

  // POST /api/chat — Yangi chat boshlash
  app.post(
    "/",
    { preHandler: [app.authenticate as any] },
    async (
      request: FastifyRequest<{ Body: StartChatBody }>,
      reply: FastifyReply
    ) => {
      const currentUserId = (request.user as { id: string }).id;
      const { userId, tripId } = request.body;

      if (!userId || !tripId) {
        return reply
          .code(400)
          .send({ error: "userId va tripId majburiy" });
      }

      if (currentUserId === userId) {
        return reply
          .code(400)
          .send({ error: "O'zingiz bilan chat boshlay olmaysiz" });
      }

      // Mavjud chatni tekshirish
      const [id1, id2] =
        currentUserId < userId
          ? [currentUserId, userId]
          : [userId, currentUserId];

      let chat = await prisma.chat.findUnique({
        where: {
          user1Id_user2Id_tripId: {
            user1Id: id1,
            user2Id: id2,
            tripId,
          },
        },
      });

      if (!chat) {
        chat = await prisma.chat.create({
          data: {
            user1Id: id1,
            user2Id: id2,
            tripId,
          },
        });
      }

      return reply.send(chat);
    }
  );

  // GET /api/chat/:id/messages — Xabarlar
  app.get(
    "/:id/messages",
    { preHandler: [app.authenticate as any] },
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Querystring: { page?: string; limit?: string };
      }>,
      reply: FastifyReply
    ) => {
      const userId = (request.user as { id: string }).id;
      const { id } = request.params;
      const page = parseInt(request.query.page || "1");
      const limit = parseInt(request.query.limit || "50");

      // Chat ga kirishni tekshirish
      const chat = await prisma.chat.findUnique({ where: { id } });

      if (!chat) {
        return reply.code(404).send({ error: "Chat topilmadi" });
      }

      if (chat.user1Id !== userId && chat.user2Id !== userId) {
        return reply.code(403).send({ error: "Bu chatga kirishingiz mumkin emas" });
      }

      // O'qilmagan xabarlarni o'qildi deb belgilash
      await prisma.message.updateMany({
        where: {
          chatId: id,
          senderId: { not: userId },
          isRead: false,
        },
        data: { isRead: true },
      });

      const messages = await prisma.message.findMany({
        where: { chatId: id },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
        },
      });

      return reply.send(messages.reverse());
    }
  );

  // POST /api/chat/:id/messages — Xabar yuborish
  app.post(
    "/:id/messages",
    { preHandler: [app.authenticate as any] },
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: CreateMessageBody;
      }>,
      reply: FastifyReply
    ) => {
      const userId = (request.user as { id: string }).id;
      const { id } = request.params;
      const { text, imageUrl } = request.body;

      if (!text && !imageUrl) {
        return reply.code(400).send({ error: "Xabar matni yoki rasm majburiy" });
      }

      // Chat ga kirishni tekshirish
      const chat = await prisma.chat.findUnique({ where: { id } });

      if (!chat) {
        return reply.code(404).send({ error: "Chat topilmadi" });
      }

      if (chat.user1Id !== userId && chat.user2Id !== userId) {
        return reply.code(403).send({ error: "Bu chatga kirishingiz mumkin emas" });
      }

      const [message] = await prisma.$transaction([
        prisma.message.create({
          data: {
            chatId: id,
            senderId: userId,
            text: text || "",
            imageUrl,
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
          },
        }),
        prisma.chat.update({
          where: { id },
          data: { lastMessageAt: new Date() },
        }),
      ]);

      return reply.code(201).send(message);
    }
  );

  // WebSocket — Real-time chat
  app.get(
    "/ws",
    { websocket: true, preHandler: [app.authenticate as any] },
    (socket: any, request: FastifyRequest) => {
      const userId = (request.user as { id: string }).id;

      socket.on("message", async (rawMessage: any) => {
        try {
          const data = JSON.parse(rawMessage.toString());

          if (data.type === "message") {
            const { chatId, text, imageUrl } = data;

            const chat = await prisma.chat.findUnique({
              where: { id: chatId },
            });

            if (
              !chat ||
              (chat.user1Id !== userId && chat.user2Id !== userId)
            ) {
              socket.send(JSON.stringify({ error: "Ruxsat yo'q" }));
              return;
            }

            const message = await prisma.message.create({
              data: {
                chatId,
                senderId: userId,
                text: text || "",
                imageUrl,
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
              },
            });

            await prisma.chat.update({
              where: { id: chatId },
              data: { lastMessageAt: new Date() },
            });

            socket.send(
              JSON.stringify({ type: "new_message", message })
            );
          }
        } catch (err) {
          socket.send(JSON.stringify({ error: "Xatolik yuz berdi" }));
        }
      });

      socket.on("close", () => {
        // Client disconnected
      });
    }
  );
}
