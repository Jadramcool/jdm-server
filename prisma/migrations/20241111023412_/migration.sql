/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `role` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `role` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `role` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `role` ADD COLUMN `code` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `role_code_key` ON `role`(`code`);

-- CreateIndex
CREATE UNIQUE INDEX `role_name_key` ON `role`(`name`);
