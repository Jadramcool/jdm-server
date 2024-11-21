/*
  Warnings:

  - You are about to drop the column `keepAlive` on the `menu` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `menu` DROP COLUMN `keepAlive`,
    ADD COLUMN `keep_alive` BOOLEAN NULL DEFAULT false;
