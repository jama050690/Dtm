import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../lib/prisma.js";

interface CreateReviewBody {
  reviewedId: string;
  tripId: string;
  rating: number;
  comment?: string;
}

export async function reviewRoutes(app: FastifyInstance) {
  // POST /api/reviews — Sharh yozish
  app.post(
    "/",
    { preHandler: [app.authenticate as any] },
    async (
      request: FastifyRequest<{ Body: CreateReviewBody }>,
      reply: FastifyReply
    ) => {
      const reviewerId = (request.user as { id: string }).id;
      const { reviewedId, tripId, rating, comment } = request.body;

      if (!reviewedId || !tripId || !rating) {
        return reply.code(400).send({
          error: "reviewedId, tripId va rating majburiy",
        });
      }

      if (rating < 1 || rating > 5) {
        return reply.code(400).send({
          error: "Reyting 1 dan 5 gacha bo'lishi kerak",
        });
      }

      if (reviewerId === reviewedId) {
        return reply.code(400).send({
          error: "O'zingizga sharh yoza olmaysiz",
        });
      }

      // Takroriy sharh tekshirish
      const existing = await prisma.review.findUnique({
        where: {
          reviewerId_tripId: {
            reviewerId,
            tripId,
          },
        },
      });

      if (existing) {
        return reply.code(409).send({
          error: "Siz bu safaraga allaqachon sharh yozgansiz",
        });
      }

      // Sharh yaratish va reytingni yangilash
      const review = await prisma.review.create({
        data: {
          reviewerId,
          reviewedId,
          tripId,
          rating,
          comment,
        },
        include: {
          reviewer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
        },
      });

      // O'rtacha reytingni qayta hisoblash
      const reviewedUser = await prisma.user.findUnique({
        where: { id: reviewedId },
      });

      if (reviewedUser) {
        const newCount = reviewedUser.ratingCount + 1;
        const newRating =
          (reviewedUser.rating * reviewedUser.ratingCount + rating) / newCount;

        await prisma.user.update({
          where: { id: reviewedId },
          data: {
            rating: Math.round(newRating * 10) / 10,
            ratingCount: newCount,
          },
        });
      }

      return reply.code(201).send(review);
    }
  );

  // GET /api/reviews/user/:id — Foydalanuvchi sharhlari
  app.get(
    "/user/:id",
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Querystring: { page?: string; limit?: string };
      }>,
      reply: FastifyReply
    ) => {
      const { id } = request.params;
      const page = parseInt(request.query.page || "1");
      const limit = parseInt(request.query.limit || "10");

      const [reviews, total] = await Promise.all([
        prisma.review.findMany({
          where: { reviewedId: id },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
          include: {
            reviewer: {
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
          },
        }),
        prisma.review.count({ where: { reviewedId: id } }),
      ]);

      return reply.send({
        reviews,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    }
  );
}
