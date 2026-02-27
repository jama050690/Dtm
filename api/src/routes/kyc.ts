import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "../lib/prisma.js";
import { saveUploadedFile } from "../utils/uploads.js";

export async function kycRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate as any);

  // GET /api/kyc/me - Mening KYC holatim
  app.get(
    "/me",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.user as { id: string };

      const verification = await prisma.kycVerification.findUnique({
        where: { userId: id },
        select: {
          id: true,
          status: true,
          passportImageUrl: true,
          selfieImageUrl: true,
          rejectionReason: true,
          submittedAt: true,
          reviewedAt: true,
        },
      });

      return reply.send(verification);
    }
  );

  // POST /api/kyc/submit - KYC yuborish
  app.post(
    "/submit",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.user as { id: string };

      let passportImageUrl = "";
      let selfieImageUrl = "";

      const parts = request.parts();
      for await (const part of parts as any) {
        if (part.type === "file") {
          if (part.fieldname === "passportImage") {
            const saved = await saveUploadedFile(part);
            passportImageUrl = saved.filePath;
          } else if (part.fieldname === "selfieImage") {
            const saved = await saveUploadedFile(part);
            selfieImageUrl = saved.filePath;
          } else {
            await part.toBuffer();
          }
        }
      }

      if (!passportImageUrl || !selfieImageUrl) {
        return reply.code(400).send({
          error: "passportImage va selfieImage majburiy",
        });
      }

      const verification = await prisma.kycVerification.upsert({
        where: { userId: id },
        create: {
          userId: id,
          passportImageUrl,
          selfieImageUrl,
          status: "PENDING",
          rejectionReason: null,
          submittedAt: new Date(),
          reviewedAt: null,
          reviewedBy: null,
        },
        update: {
          passportImageUrl,
          selfieImageUrl,
          status: "PENDING",
          rejectionReason: null,
          submittedAt: new Date(),
          reviewedAt: null,
          reviewedBy: null,
        },
        select: {
          id: true,
          status: true,
          submittedAt: true,
        },
      });

      await prisma.user.update({
        where: { id },
        data: { isVerified: false },
      });

      return reply.send({
        message: "KYC so'rovi yuborildi",
        verification,
      });
    }
  );
}
