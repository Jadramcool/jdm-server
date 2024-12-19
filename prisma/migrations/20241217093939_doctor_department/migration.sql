-- DropForeignKey
ALTER TABLE `doctor` DROP FOREIGN KEY `doctor_department_id_fkey`;

-- AlterTable
ALTER TABLE `doctor` MODIFY `department_id` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `doctor` ADD CONSTRAINT `doctor_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `department`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
