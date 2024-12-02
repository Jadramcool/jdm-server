/*
  Warnings:

  - You are about to alter the column `type` on the `notice` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(1))`.

*/
-- AlterTable
ALTER TABLE `notice` MODIFY `content` VARCHAR(191) NULL,
    MODIFY `type` ENUM('NOTICE', 'INFO', 'ACTIVE') NOT NULL;
