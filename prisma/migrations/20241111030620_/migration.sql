-- AlterTable
ALTER TABLE `role` ADD COLUMN `deleted_time` DATETIME(3) NULL,
    ADD COLUMN `is_deleted` BOOLEAN NOT NULL DEFAULT false;
