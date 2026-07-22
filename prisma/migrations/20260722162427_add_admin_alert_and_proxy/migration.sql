-- AlterTable
ALTER TABLE "RetailPrice" ADD COLUMN     "isProxy" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "AdminAlert" (
    "id" SERIAL NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAlert_pkey" PRIMARY KEY ("id")
);
