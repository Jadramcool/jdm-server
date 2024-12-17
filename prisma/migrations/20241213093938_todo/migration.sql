/*
  Warnings:

  - You are about to drop the column `deleted_time` on the `todo` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `todo` DROP COLUMN `deleted_time`,
    ADD COLUMN `done_time` DATETIME(3) NULL;
