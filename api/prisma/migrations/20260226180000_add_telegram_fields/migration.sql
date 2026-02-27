-- AlterTable
ALTER TABLE "users" ADD COLUMN "telegram_id" BIGINT,
ADD COLUMN "telegram_username" TEXT,
ADD COLUMN "telegram_photo_url" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_telegram_id_key" ON "users"("telegram_id");
