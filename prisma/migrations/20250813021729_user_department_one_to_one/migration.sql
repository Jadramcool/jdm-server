-- AlterTable
ALTER TABLE `user` ALTER COLUMN `joined_at` DROP DEFAULT;

-- RenameIndex
ALTER TABLE `user` RENAME INDEX `user_department_id_idx` TO `user_department_id_fkey`;
