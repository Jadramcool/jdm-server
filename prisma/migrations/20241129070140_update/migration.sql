-- AlterTable
ALTER TABLE `notice` ADD COLUMN `deleted_time` DATETIME(3) NULL,
    ADD COLUMN `is_deleted` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `user_notice` ADD COLUMN `is_deleted` BOOLEAN NOT NULL DEFAULT false;
