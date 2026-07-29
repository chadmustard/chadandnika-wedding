-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "profileImageUrl" TEXT NOT NULL,
    "inviteToken" TEXT NOT NULL,
    "isCouple" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "attending" BOOLEAN,
    "dietaryRestrictions" TEXT,
    "respondedAt" TIMESTAMP(3),
    "firstVisitAt" TIMESTAMP(3),
    "lastVisitAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocationStay" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "placeLabel" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "fromYear" INTEGER NOT NULL,
    "toYear" INTEGER,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "LocationStay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocationPhoto" (
    "id" TEXT NOT NULL,
    "locationStayId" TEXT NOT NULL,
    "uploadedByPersonId" TEXT,
    "imageUrl" TEXT NOT NULL,
    "caption" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LocationPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Person_inviteToken_key" ON "Person"("inviteToken");

-- CreateIndex
CREATE INDEX "LocationStay_personId_idx" ON "LocationStay"("personId");

-- AddForeignKey
ALTER TABLE "LocationStay" ADD CONSTRAINT "LocationStay_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationPhoto" ADD CONSTRAINT "LocationPhoto_locationStayId_fkey" FOREIGN KEY ("locationStayId") REFERENCES "LocationStay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationPhoto" ADD CONSTRAINT "LocationPhoto_uploadedByPersonId_fkey" FOREIGN KEY ("uploadedByPersonId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;
