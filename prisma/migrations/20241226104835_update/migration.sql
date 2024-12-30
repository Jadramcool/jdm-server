/*
  Warnings:

  - You are about to drop the column `weekday` on the `doctor_schedule` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `doctor_schedule` DROP COLUMN `weekday`,
    ADD COLUMN `appoint_count` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `max_count` INTEGER NOT NULL DEFAULT 100;
