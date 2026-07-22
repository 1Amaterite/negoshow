-- CreateEnum
CREATE TYPE "Decision" AS ENUM ('APPROVED', 'REJECTED', 'PENDING');

-- CreateEnum
CREATE TYPE "BulletinStatus" AS ENUM ('PENDING', 'PROCESSED', 'REQUIRES_MANUAL_REVIEW');

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Commodity" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'kg',
    "description" TEXT,
    "imageUrl" TEXT,

    CONSTRAINT "Commodity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Market" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Market_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RetailPrice" (
    "id" SERIAL NOT NULL,
    "commodityId" INTEGER NOT NULL,
    "marketId" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "observedDate" TIMESTAMP(3) NOT NULL,
    "sourceBulletinId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RetailPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorCheck" (
    "id" SERIAL NOT NULL,
    "commodityId" INTEGER NOT NULL,
    "marketId" INTEGER,
    "checkedPrice" DOUBLE PRECISION NOT NULL,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isFlagged" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "VendorCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BulletinRecord" (
    "id" SERIAL NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "uploadDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedStatus" "BulletinStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "BulletinRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ValidationDecision" (
    "id" SERIAL NOT NULL,
    "vendorCheckId" INTEGER NOT NULL,
    "adminDecision" "Decision" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ValidationDecision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_username_key" ON "AdminUser"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Commodity_name_key" ON "Commodity"("name");

-- CreateIndex
CREATE INDEX "RetailPrice_commodityId_observedDate_idx" ON "RetailPrice"("commodityId", "observedDate");

-- CreateIndex
CREATE INDEX "VendorCheck_commodityId_checkedAt_idx" ON "VendorCheck"("commodityId", "checkedAt");

-- AddForeignKey
ALTER TABLE "RetailPrice" ADD CONSTRAINT "RetailPrice_commodityId_fkey" FOREIGN KEY ("commodityId") REFERENCES "Commodity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetailPrice" ADD CONSTRAINT "RetailPrice_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetailPrice" ADD CONSTRAINT "RetailPrice_sourceBulletinId_fkey" FOREIGN KEY ("sourceBulletinId") REFERENCES "BulletinRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorCheck" ADD CONSTRAINT "VendorCheck_commodityId_fkey" FOREIGN KEY ("commodityId") REFERENCES "Commodity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorCheck" ADD CONSTRAINT "VendorCheck_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidationDecision" ADD CONSTRAINT "ValidationDecision_vendorCheckId_fkey" FOREIGN KEY ("vendorCheckId") REFERENCES "VendorCheck"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
