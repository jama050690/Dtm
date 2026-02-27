import "dotenv/config";
import { prisma } from "../src/lib/prisma.js";
import argon2 from "argon2";

async function main() {
  const email = "admin@sending.uz";
  const password = "admin123";

  const hash = await argon2.hash(password);

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      passwordHash: hash,
      firstName: "Admin",
      lastName: "Flypost",
      role: "SENDER",
      isAdmin: true,
      isVerified: true,
    },
    update: {
      passwordHash: hash,
      isAdmin: true,
    },
  });

  console.log("Admin yaratildi:", user.id, user.email, "isAdmin:", user.isAdmin);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
