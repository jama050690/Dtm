import { pipeline } from "stream/promises";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { MultipartFile } from "@fastify/multipart";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// uploads papkasi mavjudligini ta'minlash
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export async function saveUploadedFile(
  data: MultipartFile | undefined
): Promise<{ filePath: string; fileName: string }> {

  if (!data) {
    throw new Error("Fayl topilmadi");
  }

  if (!ALLOWED_TYPES.includes(data.mimetype)) {
    throw new Error("Faqat rasm fayllari (JPEG, PNG, WebP, GIF) qabul qilinadi");
  }

  const ext = path.extname(data.filename) || ".jpg";
  const fileName = `${randomUUID()}${ext}`;
  const filePath = path.join(UPLOAD_DIR, fileName);

  await pipeline(data.file, fs.createWriteStream(filePath));

  // Fayl hajmini tekshirish
  const stats = fs.statSync(filePath);
  if (stats.size > MAX_FILE_SIZE) {
    fs.unlinkSync(filePath);
    throw new Error("Fayl hajmi 5 MB dan oshmasligi kerak");
  }

  return { filePath: `/uploads/${fileName}`, fileName };
}

export function deleteUploadedFile(fileUrl: string): void {
  if (!fileUrl || !fileUrl.startsWith("/uploads/")) return;
  const fileName = path.basename(fileUrl);
  const fullPath = path.join(UPLOAD_DIR, fileName);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
}
