import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../lib/prisma.js";

interface CreateTripBody {
  fromCity: string;
  fromCountry: string;
  toCity: string;
  toCountry: string;
  departureDate: string;
  departureTime?: string;
  arrivalDate?: string;
  arrivalTime?: string;
  maxWeightKg: number;
  acceptedItems: string[];
  pricePerKg: number;
  currency?: "USD" | "UZS";
  description?: string;
  contactType: "PHONE" | "TELEGRAM" | "WHATSAPP";
  contactValue: string;
  phone?: string;
}

interface TripsQuery {
  toCountry?: string;
  toCity?: string;
  fromDate?: string;
  toDate?: string;
  minWeight?: string;
  maxPrice?: string;
  item?: string;
  page?: string;
  limit?: string;
  sort?: string;
}

export async function tripRoutes(app: FastifyInstance) {
  // GET /api/trips — E'lonlar ro'yxati (filter, search, pagination)
  app.get(
    "/",
    async (
      request: FastifyRequest<{ Querystring: TripsQuery }>,
      reply: FastifyReply
    ) => {
      const {
        toCountry,
        toCity,
        fromDate,
        toDate,
        minWeight,
        maxPrice,
        item,
        page = "1",
        limit = "10",
        sort = "newest",
      } = request.query;

      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
      const skip = (pageNum - 1) * limitNum;

      // Filter
      const where: any = {
        status: "ACTIVE",
        departureDate: { gte: new Date() },
      };

      if (toCountry) where.toCountry = { contains: toCountry, mode: "insensitive" };
      if (toCity) where.toCity = { contains: toCity, mode: "insensitive" };
      if (fromDate) where.departureDate = { ...where.departureDate, gte: new Date(fromDate) };
      if (toDate) where.departureDate = { ...where.departureDate, lte: new Date(toDate) };
      if (minWeight) where.availableWeightKg = { gte: parseFloat(minWeight) };
      if (maxPrice) where.pricePerKg = { lte: parseFloat(maxPrice) };
      if (item) where.acceptedItems = { has: item };

      // Sort
      let orderBy: any = { createdAt: "desc" };
      if (sort === "price_asc") orderBy = { pricePerKg: "asc" };
      if (sort === "price_desc") orderBy = { pricePerKg: "desc" };
      if (sort === "date") orderBy = { departureDate: "asc" };

      const [trips, total] = await Promise.all([
        prisma.trip.findMany({
          where,
          orderBy,
          skip,
          take: limitNum,
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
                rating: true,
                ratingCount: true,
                isVerified: true,
              },
            },
          },
        }),
        prisma.trip.count({ where }),
      ]);

      return reply.send({
        trips,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    }
  );

  // GET /api/trips/my — Mening e'lonlarim
  app.get(
    "/my",
    { preHandler: [app.authenticate as any] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.user as { id: string };

      const trips = await prisma.trip.findMany({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { requests: true } },
        },
      });

      return reply.send(trips);
    }
  );

  // GET /api/trips/:id — E'lon tafsilotlari
  app.get(
    "/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      const { id } = request.params;

      const trip = await prisma.trip.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
              rating: true,
              ratingCount: true,
              createdAt: true,
              isVerified: true,
            },
          },
          reviews: {
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
            orderBy: { createdAt: "desc" },
            take: 10,
          },
          _count: { select: { requests: true } },
        },
      });

      if (!trip) {
        return reply.code(404).send({ error: "E'lon topilmadi" });
      }

      return reply.send(trip);
    }
  );

  // POST /api/trips — E'lon yaratish
  app.post(
    "/",
    { preHandler: [app.authenticate as any] },
    async (
      request: FastifyRequest<{ Body: CreateTripBody }>,
      reply: FastifyReply
    ) => {
      const { id } = request.user as { id: string };
      const body = request.body;

      if (
        !body.fromCity ||
        !body.fromCountry ||
        !body.toCity ||
        !body.toCountry ||
        !body.departureDate ||
        !body.maxWeightKg ||
        !body.pricePerKg ||
        !body.contactType ||
        !body.contactValue
      ) {
        return reply.code(400).send({
          error: "Barcha majburiy maydonlarni to'ldiring",
        });
      }

      if (body.pricePerKg <= 0) {
        return reply.code(400).send({
          error: "Narx 0 dan katta bo'lishi kerak",
        });
      }

      if (body.maxWeightKg <= 0) {
        return reply.code(400).send({
          error: "Vazn 0 dan katta bo'lishi kerak",
        });
      }

      // Telefon raqam tekshiruvi: profilida phone yo'q bo'lsa, body.phone majburiy
      const user = await prisma.user.findUnique({
        where: { id },
        select: { phone: true, isVerified: true },
      });

      if (!user?.isVerified) {
        return reply.code(403).send({
          error: "Akkaunt tasdiqlanmagan. Avval profilingizni tasdiqlang",
        });
      }

      if (!user?.phone && !body.phone) {
        return reply.code(400).send({
          error: "Telefon raqamni kiriting",
        });
      }

      // Agar yangi phone berilgan bo'lsa, user profilini yangilash
      if (body.phone && !user?.phone) {
        await prisma.user.update({
          where: { id },
          data: { phone: body.phone },
        });
      }

      const trip = await prisma.trip.create({
        data: {
          userId: id,
          fromCity: body.fromCity,
          fromCountry: body.fromCountry,
          toCity: body.toCity,
          toCountry: body.toCountry,
          departureDate: new Date(body.departureDate),
          departureTime: body.departureTime || null,
          arrivalDate: body.arrivalDate ? new Date(body.arrivalDate) : null,
          arrivalTime: body.arrivalTime || null,
          maxWeightKg: body.maxWeightKg,
          availableWeightKg: body.maxWeightKg,
          acceptedItems: body.acceptedItems || [],
          pricePerKg: body.pricePerKg,
          currency: body.currency || "USD",
          description: body.description,
          contactType: body.contactType,
          contactValue: body.contactValue,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              isVerified: true,
            },
          },
        },
      });

      return reply.code(201).send(trip);
    }
  );

  // PUT /api/trips/:id — E'lonni yangilash
  app.put(
    "/:id",
    { preHandler: [app.authenticate as any] },
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: Partial<CreateTripBody> & { status?: "ACTIVE" | "INACTIVE" };
      }>,
      reply: FastifyReply
    ) => {
      const userId = (request.user as { id: string }).id;
      const { id } = request.params;
      const body = request.body;

      const trip = await prisma.trip.findUnique({ where: { id } });

      if (!trip) {
        return reply.code(404).send({ error: "E'lon topilmadi" });
      }

      if (trip.userId !== userId) {
        return reply
          .code(403)
          .send({ error: "Faqat o'z e'loningizni tahrirlashingiz mumkin" });
      }

      const updated = await prisma.trip.update({
        where: { id },
        data: {
          ...(body.fromCity && { fromCity: body.fromCity }),
          ...(body.fromCountry && { fromCountry: body.fromCountry }),
          ...(body.toCity && { toCity: body.toCity }),
          ...(body.toCountry && { toCountry: body.toCountry }),
          ...(body.departureDate && {
            departureDate: new Date(body.departureDate),
          }),
          ...(body.departureTime !== undefined && { departureTime: body.departureTime || null }),
          ...(body.arrivalDate !== undefined && {
            arrivalDate: body.arrivalDate ? new Date(body.arrivalDate) : null,
          }),
          ...(body.arrivalTime !== undefined && { arrivalTime: body.arrivalTime || null }),
          ...(body.maxWeightKg && {
            maxWeightKg: body.maxWeightKg,
            availableWeightKg: body.maxWeightKg,
          }),
          ...(body.acceptedItems && { acceptedItems: body.acceptedItems }),
          ...(body.pricePerKg && { pricePerKg: body.pricePerKg }),
          ...(body.currency && { currency: body.currency }),
          ...(body.description !== undefined && {
            description: body.description,
          }),
          ...(body.contactType && { contactType: body.contactType }),
          ...(body.contactValue && { contactValue: body.contactValue }),
          ...(body.status && { status: body.status }),
        },
      });

      return reply.send(updated);
    }
  );

  // DELETE /api/trips/:id — E'lonni o'chirish
  app.delete(
    "/:id",
    { preHandler: [app.authenticate as any] },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      const userId = (request.user as { id: string }).id;
      const { id } = request.params;

      const trip = await prisma.trip.findUnique({ where: { id } });

      if (!trip) {
        return reply.code(404).send({ error: "E'lon topilmadi" });
      }

      if (trip.userId !== userId) {
        return reply
          .code(403)
          .send({ error: "Faqat o'z e'loningizni o'chirishingiz mumkin" });
      }

      await prisma.trip.delete({ where: { id } });

      return reply.send({ message: "E'lon o'chirildi" });
    }
  );
}
