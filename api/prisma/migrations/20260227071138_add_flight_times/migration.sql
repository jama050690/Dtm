-- AlterTable
ALTER TABLE "trips" ADD COLUMN     "arrival_date" TIMESTAMP(3),
ADD COLUMN     "arrival_time" TEXT,
ADD COLUMN     "departure_time" TEXT;
