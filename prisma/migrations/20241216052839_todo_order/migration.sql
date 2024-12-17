/*
  Warnings:

  - You are about to drop the column `sort` on the `todo` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `todo` DROP COLUMN `sort`,
    ADD COLUMN `order` INTEGER NULL DEFAULT 0;
