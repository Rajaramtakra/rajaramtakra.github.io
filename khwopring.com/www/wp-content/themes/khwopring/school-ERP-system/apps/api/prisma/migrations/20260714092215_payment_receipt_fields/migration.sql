-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "filePath" TEXT,
ADD COLUMN     "receiptNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Payment_receiptNumber_key" ON "Payment"("receiptNumber");
