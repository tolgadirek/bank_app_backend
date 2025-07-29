/*
  Warnings:

  - A unique constraint covering the columns `[accountNumber]` on the table `BankAccount` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[iban]` on the table `BankAccount` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `accountNumber` to the `BankAccount` table without a default value. This is not possible if the table is not empty.
  - Added the required column `iban` to the `BankAccount` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `BankAccount` table without a default value. This is not possible if the table is not empty.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[BankAccount] ADD [accountNumber] NVARCHAR(1000) NOT NULL,
[balance] FLOAT(53) NOT NULL CONSTRAINT [BankAccount_balance_df] DEFAULT 0.0,
[createdAt] DATETIME2 NOT NULL CONSTRAINT [BankAccount_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
[iban] NVARCHAR(1000) NOT NULL,
[updatedAt] DATETIME2 NOT NULL;

-- CreateIndex
ALTER TABLE [dbo].[BankAccount] ADD CONSTRAINT [BankAccount_accountNumber_key] UNIQUE NONCLUSTERED ([accountNumber]);

-- CreateIndex
ALTER TABLE [dbo].[BankAccount] ADD CONSTRAINT [BankAccount_iban_key] UNIQUE NONCLUSTERED ([iban]);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
