-- Guests unlock by phone number
ALTER TABLE "Person" ADD COLUMN "phone" TEXT;
CREATE INDEX "Person_phone_idx" ON "Person"("phone");

-- Per-event invitations (RSVP moves here from Person)
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "attending" BOOLEAN,
    "dietaryRestrictions" TEXT,
    "respondedAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Invitation_personId_event_key" ON "Invitation"("personId", "event");
CREATE INDEX "Invitation_event_idx" ON "Invitation"("event");

ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Everyone already in the database was a wedding guest; keep their RSVPs.
INSERT INTO "Invitation" ("id", "personId", "event", "attending", "dietaryRestrictions", "respondedAt", "updatedAt")
SELECT 'inv_' || "id", "id", 'wedding', "attending", "dietaryRestrictions", "respondedAt", CURRENT_TIMESTAMP
FROM "Person";

ALTER TABLE "Person" DROP COLUMN "attending",
DROP COLUMN "dietaryRestrictions",
DROP COLUMN "respondedAt";

-- Shared rate limit counters
CREATE TABLE "RateLimit" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "resetAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("key")
);
