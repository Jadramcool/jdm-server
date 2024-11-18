/*
  Warnings:

  - You are about to drop the column `deleted_time` on the `menu` table. All the data in the column will be lost.
  - You are about to drop the column `is_deleted` on the `menu` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `menu` DROP COLUMN `deleted_time`,
    DROP COLUMN `is_deleted`;
