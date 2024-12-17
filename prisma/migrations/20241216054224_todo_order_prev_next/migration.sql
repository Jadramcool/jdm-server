/*
  Warnings:

  - You are about to drop the column `next_id` on the `todo` table. All the data in the column will be lost.
  - You are about to drop the column `order` on the `todo` table. All the data in the column will be lost.
  - You are about to drop the column `prev_id` on the `todo` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `todo` DROP COLUMN `next_id`,
    DROP COLUMN `order`,
    DROP COLUMN `prev_id`,
    ADD COLUMN `sort_order` INTEGER NULL DEFAULT 0;
