/*
  Warnings:

  - You are about to drop the column `deleted` on the `user` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `user` DROP COLUMN `deleted`,
    ADD COLUMN `is_deleted` BOOLEAN NOT NULL DEFAULT false;
