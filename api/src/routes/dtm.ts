import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "../lib/prisma.js";

type Subject = {
  id: number;
  directionId: number;
  name: string;
  description: string;
};

type TestQuestion = {
  id: number;
  question: string;
  A: string;
  B: string;
  C: string;
  D: string;
  correct: "A" | "B" | "C" | "D";
};

type Direction = {
  id: number;
  name: string;
  description: string;
};

const defaultDirections: Direction[] = [
  { id: 1, name: "Aniq fanlar", description: "Matematika va fizika yo'nalishi" },
  { id: 2, name: "Tabiiy fanlar", description: "Kimyo va biologiya yo'nalishi" },
  { id: 3, name: "Ijtimoiy fanlar", description: "Tarix, huquq va geografiya yo'nalishi" },
  { id: 4, name: "Til va adabiyot fanlari", description: "Ona tili, adabiyot va xorijiy tillar yo'nalishi" },
  { id: 5, name: "Kasbiy ijodiy imtihon", description: "Kasbiy va ijodiy yo'nalishlar bo'yicha imtihonlar" },
];

const defaultSubjects: Subject[] = [
  {
    id: 1,
    directionId: 1,
    name: "Matematika",
    description: "Algebra va geometriya",
  },
  {
    id: 2,
    directionId: 1,
    name: "Fizika",
    description: "Mexanika va elektr",
  },
  {
    id: 3,
    directionId: 2,
    name: "Kimyo",
    description: "Organik va noorganik kimyo",
  },
  {
    id: 4,
    directionId: 2,
    name: "Biologiya",
    description: "Tirik organizmlar dunyosi",
  },
];

const defaultTestsBySubject: Record<string, Omit<TestQuestion, "id">[]> = {
  Matematika: [
    {
      question: "2x + 5 = 13 tenglamada x qiymatini toping",
      A: "2",
      B: "3",
      C: "4",
      D: "5",
      correct: "C",
    },
    {
      question: "9 ning kvadrat ildizi nechiga teng?",
      A: "2",
      B: "3",
      C: "4",
      D: "5",
      correct: "B",
    },
  ],
  Fizika: [
    {
      question: "SI tizimida kuch birligi qaysi?",
      A: "Joul",
      B: "Nyuton",
      C: "Vatt",
      D: "Paskal",
      correct: "B",
    },
    {
      question: "Tok kuchi qanday belgilanadi?",
      A: "I",
      B: "U",
      C: "R",
      D: "P",
      correct: "A",
    },
  ],
  Kimyo: [
    {
      question: "Suvning kimyoviy formulasi qaysi?",
      A: "CO2",
      B: "O2",
      C: "H2O",
      D: "NaCl",
      correct: "C",
    },
    {
      question: "Periodik jadvalni kim yaratgan?",
      A: "Mendeleev",
      B: "Faradey",
      C: "Nyuton",
      D: "Eynshteyn",
      correct: "A",
    },
  ],
  Biologiya: [
    {
      question: "Fotosintez asosan qaysi organellada sodir bo'ladi?",
      A: "Yadro",
      B: "Mitoxondriya",
      C: "Xloroplast",
      D: "Ribosoma",
      correct: "C",
    },
    {
      question: "Inson organizmida kislorod tashuvchi oqsil qaysi?",
      A: "Insulin",
      B: "Gemoglobin",
      C: "Kollagen",
      D: "Keratin",
      correct: "B",
    },
  ],
};

let isSeeded = false;

async function ensureDtmSeedData() {
  if (isSeeded) return;
  const activeDirectionIds = defaultDirections.map((direction) => direction.id);

  await prisma.direction.updateMany({
    where: { id: { notIn: activeDirectionIds } },
    data: { isActive: false },
  });

  for (const direction of defaultDirections) {
    await prisma.direction.upsert({
      where: { id: direction.id },
      update: {
        name: direction.name,
        description: direction.description,
        isActive: true,
      },
      create: {
        id: direction.id,
        name: direction.name,
        description: direction.description,
        isActive: true,
      },
    });
  }

  for (const subject of defaultSubjects) {
    await prisma.subject.upsert({
      where: { name: subject.name },
      update: {
        description: subject.description,
        directionId: subject.directionId,
      },
      create: {
        id: subject.id,
        name: subject.name,
        description: subject.description,
        directionId: subject.directionId,
      },
    });
  }

  const subjects = await prisma.subject.findMany({
    select: { id: true, name: true },
  });

  for (const subject of subjects) {
    const existingCount = await prisma.testQuestion.count({
      where: { subjectId: subject.id },
    });

    if (existingCount > 0) continue;

    const tests = defaultTestsBySubject[subject.name] ?? [];
    if (tests.length === 0) continue;

    await prisma.testQuestion.createMany({
      data: tests.map((test) => ({
        subjectId: subject.id,
        question: test.question,
        optionA: test.A,
        optionB: test.B,
        optionC: test.C,
        optionD: test.D,
        correct: test.correct,
      })),
    });
  }

  isSeeded = true;
}

function getCorrectIndex(correct: string): number {
  const normalized = correct.toUpperCase();
  if (normalized === "A") return 0;
  if (normalized === "B") return 1;
  if (normalized === "C") return 2;
  return 3;
}

export async function dtmRoutes(app: FastifyInstance) {
  // 1) Home page data
  // GET /api/dashboard
  app.get(
    "/dashboard",
    { preHandler: [app.authenticate as any] },
    async (request: FastifyRequest) => {
      const userId = request.user.id;

      const stats = await prisma.testResult.aggregate({
        where: { userId },
        _count: { id: true },
        _sum: { score: true, totalQuestions: true, coinsEarned: true },
      });

      const recentResults = await prisma.testResult.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { subject: { select: { id: true, name: true } } },
      });

      return {
        stats: {
          totalTests: stats._count.id ?? 0,
          correctAnswers: stats._sum.score ?? 0,
          totalQuestions: stats._sum.totalQuestions ?? 0,
          coins: stats._sum.coinsEarned ?? 0,
        },
        recentResults: recentResults.map((result) => ({
          id: result.id,
          subjectId: result.subject.id,
          subjectName: result.subject.name,
          score: result.score,
          totalQuestions: result.totalQuestions,
          createdAt: result.createdAt.toISOString(),
          coinsEarned: result.coinsEarned,
        })),
      };
    }
  );

  // 2) Directions page
  // GET /api/directions
  app.get("/directions", async () => {
    await ensureDtmSeedData();
    return prisma.direction.findMany({
      where: { isActive: true },
      orderBy: { id: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
      },
    });
  });

  // 3) Subjects page
  // GET /api/directions/:directionId/subjects
  app.get(
    "/directions/:directionId/subjects",
    async (
      request: FastifyRequest<{ Params: { directionId: string } }>,
      reply: FastifyReply
    ) => {
      await ensureDtmSeedData();

      const directionId = Number.parseInt(request.params.directionId, 10);
      if (Number.isNaN(directionId)) {
        return reply.code(400).send({ error: "directionId noto'g'ri" });
      }

      const subjects = await prisma.subject.findMany({
        where: { directionId },
        orderBy: { id: "asc" },
        select: {
          id: true,
          directionId: true,
          name: true,
          description: true,
          _count: { select: { testQuestions: true } },
        },
      });

      return subjects.map((subject) => ({
        id: subject.id,
        directionId: subject.directionId,
        name: subject.name,
        description: subject.description,
        questionCount: subject._count.testQuestions,
      }));
    }
  );

  // Legacy support: GET /api/subjects?directionId=...
  app.get(
    "/subjects",
    async (request: FastifyRequest<{ Querystring: { directionId?: string } }>) => {
    await ensureDtmSeedData();
    const directionId = request.query.directionId
      ? Number.parseInt(request.query.directionId, 10)
      : undefined;

    if (request.query.directionId && Number.isNaN(directionId)) {
      return [];
    }

    const subjects = await prisma.subject.findMany({
      where: directionId ? { directionId } : undefined,
      orderBy: { id: "asc" },
      select: {
        id: true,
        directionId: true,
        name: true,
        description: true,
      },
    });

    return subjects;
    }
  );

  // 4) Test list/start page
  // GET /api/subjects/:subjectId/tests
  app.get(
    "/subjects/:subjectId/tests",
    { preHandler: [app.authenticate as any] },
    async (
      request: FastifyRequest<{ Params: { subjectId: string } }>,
      reply: FastifyReply
    ) => {
      await ensureDtmSeedData();

      const subjectId = Number.parseInt(request.params.subjectId, 10);
      if (Number.isNaN(subjectId)) {
        return reply.code(400).send({ error: "subjectId noto'g'ri" });
      }

      const subject = await prisma.subject.findUnique({
        where: { id: subjectId },
        include: { _count: { select: { testQuestions: true } } },
      });

      if (!subject) {
        return reply.code(404).send({ error: "Fan topilmadi" });
      }

      return [
        {
          id: subject.id,
          subjectId: subject.id,
          title: `${subject.name} testi`,
          description: subject.description,
          questionCount: subject._count.testQuestions,
          durationSec: Math.max(subject._count.testQuestions * 60, 300),
        },
      ];
    }
  );

  // GET /api/tests/:subjectId (legacy)
  app.get(
    "/tests/:subjectId",
    { preHandler: [app.authenticate as any] },
    async (
      request: FastifyRequest<{ Params: { subjectId: string } }>,
      reply: FastifyReply
    ) => {
      await ensureDtmSeedData();

      const subjectId = Number.parseInt(request.params.subjectId, 10);
      if (Number.isNaN(subjectId)) {
        return reply.code(400).send({ error: "subjectId noto'g'ri" });
      }

      const tests = await prisma.testQuestion.findMany({
        where: { subjectId },
        orderBy: { id: "asc" },
      });

      return tests.map((test) => ({
        id: test.id,
        question: test.question,
        A: test.optionA,
        B: test.optionB,
        C: test.optionC,
        D: test.optionD,
        correct: test.correct as "A" | "B" | "C" | "D",
      }));
    }
  );

  // 5) Test page
  // GET /api/tests/:subjectId/start
  app.get(
    "/tests/:subjectId/start",
    { preHandler: [app.authenticate as any] },
    async (
      request: FastifyRequest<{ Params: { subjectId: string } }>,
      reply: FastifyReply
    ) => {
      await ensureDtmSeedData();

      const subjectId = Number.parseInt(request.params.subjectId, 10);
      if (Number.isNaN(subjectId)) {
        return reply.code(400).send({ error: "subjectId noto'g'ri" });
      }

      const subject = await prisma.subject.findUnique({
        where: { id: subjectId },
        select: { id: true, name: true, description: true },
      });

      if (!subject) {
        return reply.code(404).send({ error: "Fan topilmadi" });
      }

      const questions = await prisma.testQuestion.findMany({
        where: { subjectId },
        orderBy: { id: "asc" },
      });

      return {
        test: {
          id: subject.id,
          subjectId: subject.id,
          title: `${subject.name} testi`,
          description: subject.description,
          durationSec: Math.max(questions.length * 60, 300),
          questionCount: questions.length,
        },
        questions: questions.map((q) => ({
          id: q.id,
          question: q.question,
          options: [
            { key: "A", text: q.optionA },
            { key: "B", text: q.optionB },
            { key: "C", text: q.optionC },
            { key: "D", text: q.optionD },
          ],
        })),
      };
    }
  );

  // POST /api/tests/:subjectId/submit
  app.post(
    "/tests/:subjectId/submit",
    { preHandler: [app.authenticate as any] },
    async (
      request: FastifyRequest<{
        Params: { subjectId: string };
        Body: { answers: number[] };
      }>,
      reply: FastifyReply
    ) => {
      const userId = request.user.id;
      const subjectId = Number.parseInt(request.params.subjectId, 10);
      const answers = Array.isArray(request.body?.answers) ? request.body.answers : [];

      if (Number.isNaN(subjectId)) {
        return reply.code(400).send({ error: "subjectId noto'g'ri" });
      }

      const subject = await prisma.subject.findUnique({
        where: { id: subjectId },
        select: { id: true, name: true },
      });

      if (!subject) {
        return reply.code(404).send({ error: "Fan topilmadi" });
      }

      const questions = await prisma.testQuestion.findMany({
        where: { subjectId },
        orderBy: { id: "asc" },
        select: { id: true, correct: true },
      });

      const total = questions.length;
      let correctCount = 0;

      questions.forEach((q, idx) => {
        if (answers[idx] === getCorrectIndex(q.correct)) {
          correctCount += 1;
        }
      });

      const coinsEarned = Math.max(0, Math.round((correctCount / Math.max(total, 1)) * 10));

      const result = await prisma.testResult.create({
        data: {
          userId,
          subjectId,
          score: correctCount,
          totalQuestions: total,
          answers,
          coinsEarned,
        },
      });

      const totals = await prisma.testResult.aggregate({
        where: { userId },
        _sum: { coinsEarned: true },
      });

      return {
        resultId: result.id,
        subjectId,
        subjectName: subject.name,
        score: correctCount,
        totalQuestions: total,
        percentage: total > 0 ? Math.round((correctCount / total) * 100) : 0,
        coinsEarned,
        totalCoins: totals._sum.coinsEarned ?? 0,
      };
    }
  );

  // Legacy: POST /api/results
  app.post(
    "/results",
    { preHandler: [app.authenticate as any] },
    async (
      request: FastifyRequest<{
        Body: { subjectId: number; score: number; total: number; answers?: number[] };
      }>,
      reply: FastifyReply
    ) => {
      const userId = request.user.id;
      const { subjectId, score, total, answers = [] } = request.body;

      if (!subjectId || score === undefined || !total) {
        return reply.code(400).send({ error: "subjectId, score va total majburiy" });
      }

      const safeScore = Math.max(0, score);
      const safeTotal = Math.max(1, total);
      const coinsEarned = Math.max(0, Math.round((safeScore / safeTotal) * 10));
      const subject = await prisma.subject.findUnique({
        where: { id: subjectId },
        select: { id: true },
      });

      if (!subject) {
        return reply.code(404).send({ error: "Fan topilmadi" });
      }

      await prisma.testResult.create({
        data: {
          userId,
          subjectId,
          score: safeScore,
          totalQuestions: safeTotal,
          answers,
          coinsEarned,
        },
      });

      const totals = await prisma.testResult.aggregate({
        where: { userId },
        _sum: { coinsEarned: true },
      });

      return reply.send({
        message: "Natija saqlandi",
        coinsEarned,
        totalCoins: totals._sum.coinsEarned ?? 0,
      });
    }
  );

  // GET /api/results
  app.get(
    "/results",
    { preHandler: [app.authenticate as any] },
    async (request: FastifyRequest) => {
      const results = await prisma.testResult.findMany({
        where: { userId: request.user.id },
        orderBy: { createdAt: "desc" },
        include: {
          subject: {
            select: { name: true },
          },
        },
      });

      return results.map((result) => ({
        subjectId: result.subjectId,
        subjectName: result.subject.name,
        score: result.score,
        totalQuestions: result.totalQuestions,
        answers: result.answers ?? [],
        date: result.createdAt.toISOString(),
        coinsEarned: result.coinsEarned,
      }));
    }
  );

  // GET /api/results/:resultId
  app.get(
    "/results/:resultId",
    { preHandler: [app.authenticate as any] },
    async (
      request: FastifyRequest<{ Params: { resultId: string } }>,
      reply: FastifyReply
    ) => {
      const result = await prisma.testResult.findFirst({
        where: {
          id: request.params.resultId,
          userId: request.user.id,
        },
        include: {
          subject: {
            select: { id: true, name: true },
          },
        },
      });

      if (!result) {
        return reply.code(404).send({ error: "Natija topilmadi" });
      }

      return {
        id: result.id,
        subjectId: result.subject.id,
        subjectName: result.subject.name,
        score: result.score,
        totalQuestions: result.totalQuestions,
        percentage:
          result.totalQuestions > 0
            ? Math.round((result.score / result.totalQuestions) * 100)
            : 0,
        coinsEarned: result.coinsEarned,
        answers: result.answers ?? [],
        createdAt: result.createdAt.toISOString(),
      };
    }
  );

  // GET /api/stats
  app.get(
    "/stats",
    { preHandler: [app.authenticate as any] },
    async (request: FastifyRequest) => {
      const stats = await prisma.testResult.aggregate({
        where: { userId: request.user.id },
        _count: { id: true },
        _sum: {
          score: true,
          totalQuestions: true,
          coinsEarned: true,
        },
      });

      return {
        totalTests: stats._count.id ?? 0,
        correctAnswers: stats._sum.score ?? 0,
        totalQuestions: stats._sum.totalQuestions ?? 0,
        totalScore: stats._sum.score ?? 0,
        coins: stats._sum.coinsEarned ?? 0,
      };
    }
  );
}
