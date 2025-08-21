/*
  Warnings:

  - You are about to drop the `user_department` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `user_department` DROP FOREIGN KEY `user_department_department_id_fkey`;

-- DropForeignKey
ALTER TABLE `user_department` DROP FOREIGN KEY `user_department_user_id_fkey`;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `department_id` INTEGER NULL,
    ADD COLUMN `joined_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `position` VARCHAR(191) NULL;

-- DropTable
DROP TABLE `user_department`;

-- CreateIndex
CREATE INDEX `user_department_id_idx` ON `user`(`department_id`);

-- AddForeignKey
ALTER TABLE `user` ADD CONSTRAINT `user_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `department`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
