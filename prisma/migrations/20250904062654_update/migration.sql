/*
  Warnings:

  - You are about to drop the column `group_id` on the `navigation` table. All the data in the column will be lost.
  - You are about to drop the `navigation_group` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE `navigation` DROP COLUMN `group_id`,
    MODIFY `name` VARCHAR(191) NULL,
    MODIFY `path` VARCHAR(191) NULL;

-- DropTable
DROP TABLE `navigation_group`;

-- CreateTable
CREATE TABLE `navigation-group` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `icon` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `sort_order` INTEGER NULL DEFAULT 0,
    `status` INTEGER NULL DEFAULT 0,
    `is_deleted` BOOLEAN NULL DEFAULT false,
    `created_time` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_time` DATETIME(3) NULL,
    `deleted_time` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `navigation_group_navigation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `navigation_id` INTEGER NOT NULL,
    `group_id` INTEGER NOT NULL,
    `sort_order` INTEGER NULL DEFAULT 0,
    `created_time` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_time` DATETIME(3) NULL,

    UNIQUE INDEX `navigation_group_navigation_navigation_id_group_id_key`(`navigation_id`, `group_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `navigation_group_navigation` ADD CONSTRAINT `navigation_group_navigation_navigation_id_fkey` FOREIGN KEY (`navigation_id`) REFERENCES `navigation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `navigation_group_navigation` ADD CONSTRAINT `navigation_group_navigation_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `navigation-group`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
