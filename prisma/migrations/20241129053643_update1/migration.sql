/*
  Warnings:

  - You are about to drop the column `createdTime` on the `notice` table. All the data in the column will be lost.
  - You are about to drop the column `updatedTime` on the `notice` table. All the data in the column will be lost.
  - You are about to drop the column `assigned_at` on the `user_notice` table. All the data in the column will be lost.
  - Added the required column `updated_time` to the `notice` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `notice` DROP COLUMN `createdTime`,
    DROP COLUMN `updatedTime`,
    ADD COLUMN `created_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updated_time` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `user_notice` DROP COLUMN `assigned_at`,
    ADD COLUMN `assigned_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
