-- CreateEnum
CREATE TYPE "IncomeExpenseKind" AS ENUM ('INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "VoucherType" AS ENUM ('JOURNAL', 'PAYMENT', 'RECEIPT', 'CONTRA');

-- AlterTable
ALTER TABLE "JournalEntry" ADD COLUMN     "voucherNumber" TEXT,
ADD COLUMN     "voucherType" "VoucherType" NOT NULL DEFAULT 'JOURNAL';

-- CreateTable
CREATE TABLE "IncomeExpenseType" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "IncomeExpenseKind" NOT NULL,
    "accountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IncomeExpenseType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IncomeExpenseType_schoolId_name_key" ON "IncomeExpenseType"("schoolId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "JournalEntry_voucherNumber_key" ON "JournalEntry"("voucherNumber");

-- AddForeignKey
ALTER TABLE "IncomeExpenseType" ADD CONSTRAINT "IncomeExpenseType_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncomeExpenseType" ADD CONSTRAINT "IncomeExpenseType_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

