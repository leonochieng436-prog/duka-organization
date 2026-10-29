CREATE TABLE "contact_enquiries" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "businessType" TEXT,
    "numberOfLocations" TEXT,
    "currentSystem" TEXT,
    "interest" TEXT,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_enquiries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "contact_enquiries_createdAt_idx" ON "contact_enquiries"("createdAt");
