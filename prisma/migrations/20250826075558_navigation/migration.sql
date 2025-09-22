-- CreateTable
CREATE TABLE `Navigation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `path` VARCHAR(191) NOT NULL,
    `icon` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `group_id` INTEGER NULL,
    `sort_order` INTEGER NULL DEFAULT 0,
    `status` INTEGER NULL DEFAULT 0,
    `is_deleted` BOOLEAN NULL DEFAULT false,
    `created_time` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_time` DATETIME(3) NULL,
    `deleted_time` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NavigationGroup` (
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
