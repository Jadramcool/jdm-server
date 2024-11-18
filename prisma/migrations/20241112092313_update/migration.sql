/*
  Warnings:

  - You are about to alter the column `created_time` on the `user` table. The data in that column could be lost. The data in that column will be cast from `DateTime(3)` to `DateTime`.
  - Made the column `updated_time` on table `user` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `user` MODIFY `created_time` DATETIME NOT NULL DEFAULT NOW(),
    MODIFY `updated_time` TIMESTAMP(0) NOT NULL DEFAULT NOW() ON UPDATE NOW();
