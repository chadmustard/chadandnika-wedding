-- CreateEnum
CREATE TYPE "RoomType" AS ENUM ('QUEENS_GARDEN', 'QUEENS_OCEAN', 'KING_GARDEN', 'KING_OCEAN');

-- AlterTable
ALTER TABLE "Household" ADD COLUMN     "checkIn" DATE,
ADD COLUMN     "checkOut" DATE,
ADD COLUMN     "roomNotes" TEXT,
ADD COLUMN     "roomType" "RoomType";

-- AlterTable
ALTER TABLE "Person" ADD COLUMN     "arrivalAt" TIMESTAMP(3),
ADD COLUMN     "arrivalFlight" TEXT,
ADD COLUMN     "departureAt" TIMESTAMP(3),
ADD COLUMN     "departureFlight" TEXT,
ADD COLUMN     "homeAirport" TEXT;

-- CreateTable
CREATE TABLE "Gift" (
    "id" TEXT NOT NULL,
    "householdId" TEXT,
    "fromName" TEXT NOT NULL,
    "event" TEXT,
    "description" TEXT NOT NULL,
    "amountCents" INTEGER,
    "receivedOn" DATE,
    "thankYouSentOn" DATE,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Gift_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Gift_householdId_idx" ON "Gift"("householdId");

-- AddForeignKey
ALTER TABLE "Gift" ADD CONSTRAINT "Gift_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE SET NULL ON UPDATE CASCADE;
