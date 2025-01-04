/*
  Warnings:

  - You are about to alter the column `status` on the `appointment` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Enum(EnumId(3))`.

*/
-- AlterTable
ALTER TABLE `appointment` MODIFY `status` ENUM('UNFINISHED', 'FINISHED', 'CANCELED', 'CALLED') NOT NULL DEFAULT 'UNFINISHED';
