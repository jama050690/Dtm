import dotenv from "dotenv";
dotenv.config();

import argon2 from "argon2";

const { prisma } = await import("./lib/prisma.js");

async function main() {
  console.log("Seeding boshlanmoqda...");

  // Admin yaratish
  const adminPassword = await argon2.hash("admin123");
  const admin = await prisma.user.upsert({
    where: { email: "admin@sending.uz" },
    update: {},
    create: {
      email: "admin@sending.uz",
      passwordHash: adminPassword,
      firstName: "Admin",
      lastName: "Sending",
      phone: "+998901234567",
      city: "Toshkent",
      role: "BOTH",
      isVerified: true,
      isAdmin: true,
    },
  });
  console.log("Admin yaratildi:", admin.email);

  // Test foydalanuvchilar
  const userPassword = await argon2.hash("test1234");

  const aziz = await prisma.user.upsert({
    where: { email: "aziz@test.com" },
    update: {},
    create: {
      email: "aziz@test.com",
      passwordHash: userPassword,
      firstName: "Aziz",
      lastName: "Karimov",
      phone: "+998901111111",
      city: "Toshkent",
      role: "TRAVELER",
      isVerified: true,
      rating: 4.8,
      ratingCount: 12,
    },
  });

  const nilufar = await prisma.user.upsert({
    where: { email: "nilufar@test.com" },
    update: {},
    create: {
      email: "nilufar@test.com",
      passwordHash: userPassword,
      firstName: "Nilufar",
      lastName: "Rahimova",
      phone: "+998902222222",
      city: "Toshkent",
      role: "TRAVELER",
      isVerified: true,
      rating: 4.5,
      ratingCount: 8,
    },
  });

  const sardor = await prisma.user.upsert({
    where: { email: "sardor@test.com" },
    update: {},
    create: {
      email: "sardor@test.com",
      passwordHash: userPassword,
      firstName: "Sardor",
      lastName: "Aliyev",
      phone: "+998903333333",
      city: "Samarqand",
      role: "SENDER",
      isVerified: true,
      rating: 4.2,
      ratingCount: 5,
    },
  });

  console.log("Foydalanuvchilar yaratildi");

  // Test e'lonlar (trips)
  const trip1 = await prisma.trip.create({
    data: {
      userId: aziz.id,
      fromCity: "Toshkent",
      fromCountry: "O'zbekiston",
      toCity: "Istanbul",
      toCountry: "Turkiya",
      departureDate: new Date("2026-03-15"),
      maxWeightKg: 10,
      availableWeightKg: 7,
      acceptedItems: ["Kiyim", "Hujjat", "Boshqa"],
      pricePerKg: 5,
      currency: "USD",
      description:
        "Faqat qonuniy mahsulotlar qabul qilaman. Hujjat va kiyimlar afzal.",
      contactType: "TELEGRAM",
      contactValue: "@aziz_k",
    },
  });

  const trip2 = await prisma.trip.create({
    data: {
      userId: nilufar.id,
      fromCity: "Toshkent",
      fromCountry: "O'zbekiston",
      toCity: "Moskva",
      toCountry: "Rossiya",
      departureDate: new Date("2026-03-20"),
      maxWeightKg: 5,
      availableWeightKg: 5,
      acceptedItems: ["Kiyim", "Hujjat", "Oziq-ovqat"],
      pricePerKg: 3,
      currency: "USD",
      description: "Kichik hajmdagi narsalar qabul qilinadi.",
      contactType: "PHONE",
      contactValue: "+998902222222",
    },
  });

  await prisma.trip.create({
    data: {
      userId: aziz.id,
      fromCity: "Toshkent",
      fromCountry: "O'zbekiston",
      toCity: "Dubay",
      toCountry: "BAA",
      departureDate: new Date("2026-04-01"),
      maxWeightKg: 15,
      availableWeightKg: 15,
      acceptedItems: ["Kiyim", "Elektronika", "Boshqa"],
      pricePerKg: 4,
      currency: "USD",
      description: "Dubayga uchaman. 15 kg gacha qabul qilaman.",
      contactType: "WHATSAPP",
      contactValue: "+998901111111",
    },
  });

  console.log("E'lonlar yaratildi");

  // Test ariza
  await prisma.request.create({
    data: {
      tripId: trip1.id,
      senderId: sardor.id,
      itemDescription: "2ta ko'ylak, 1ta kitob",
      weightKg: 3,
      message: "Salom, Istanbulga 3 kg kiyim yubormoqchi edim.",
    },
  });

  console.log("Test ariza yaratildi");

  // Test chat va xabarlar
  const chat = await prisma.chat.create({
    data: {
      user1Id: aziz.id < sardor.id ? aziz.id : sardor.id,
      user2Id: aziz.id < sardor.id ? sardor.id : aziz.id,
      tripId: trip1.id,
      lastMessageAt: new Date(),
    },
  });

  await prisma.message.createMany({
    data: [
      {
        chatId: chat.id,
        senderId: sardor.id,
        text: "Salom! Sizning e'loningizni ko'rdim. 3 kg kiyim bor edi.",
        createdAt: new Date("2026-02-24T14:20:00"),
      },
      {
        chatId: chat.id,
        senderId: aziz.id,
        text: "Salom! Ha, qabul qilaman. Qachon topshirasiz?",
        createdAt: new Date("2026-02-24T14:25:00"),
      },
      {
        chatId: chat.id,
        senderId: sardor.id,
        text: "Ertaga kechqurun bo'ladimi?",
        createdAt: new Date("2026-02-24T14:28:00"),
      },
      {
        chatId: chat.id,
        senderId: aziz.id,
        text: "Ha, bo'ladi! Soat 7 da uchrashamiz.",
        createdAt: new Date("2026-02-24T14:30:00"),
      },
    ],
  });

  console.log("Chat va xabarlar yaratildi");

  // Test sharh
  await prisma.review.create({
    data: {
      reviewerId: sardor.id,
      reviewedId: aziz.id,
      tripId: trip1.id,
      rating: 5,
      comment: "Juda ishonchli odam, vaqtida yetkazdi",
    },
  });

  console.log("Sharh yaratildi");
  console.log("Seeding tugadi!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
