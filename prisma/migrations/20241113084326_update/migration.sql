/*
  Warnings:

  - You are about to alter the column `type` on the `menu` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - A unique constraint covering the columns `[code]` on the table `menu` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `menu` MODIFY `type` INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `menu_code_key` ON `menu`(`code`);
