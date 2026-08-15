-- AlterTable
ALTER TABLE "School" ADD COLUMN     "idCardPrimaryColor" TEXT,
ADD COLUMN     "idCardQrVerificationEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "idCardSecondaryColor" TEXT;

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "idCardIssuedAt" TIMESTAMP(3),
ADD COLUMN     "idCardQrCode" TEXT,
ADD COLUMN     "idCardVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "rollNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Student_idCardQrCode_key" ON "Student"("idCardQrCode");
