-- CreateTable
CREATE TABLE `sys_config` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `value` BOOLEAN NOT NULL,
    `description` VARCHAR(191) NULL,
    `created_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_time` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `sex` ENUM('MALE', 'FEMALE', 'OTHER') NULL DEFAULT 'OTHER',
    `birthday` DATETIME(3) NULL,
    `created_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_time` DATETIME(3) NULL,
    `deleted_time` DATETIME(3) NULL,
    `password` VARCHAR(191) NOT NULL,
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `status` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `user_username_key`(`username`),
    UNIQUE INDEX `user_phone_key`(`phone`),
    UNIQUE INDEX `user_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `navigation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `content` VARCHAR(191) NULL,
    `url` VARCHAR(191) NOT NULL,
    `order` INTEGER NULL,
    `author_id` INTEGER NOT NULL,
    `created_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_time` DATETIME(3) NOT NULL,

    INDEX `navigation_authorId_fkey`(`author_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permission` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `pid` INTEGER NULL,
    `path` VARCHAR(191) NOT NULL,
    `redirect` VARCHAR(191) NULL,
    `icon` VARCHAR(191) NOT NULL,
    `component` VARCHAR(191) NULL,
    `layout` VARCHAR(191) NOT NULL,
    `keepAlive` BOOLEAN NULL DEFAULT false,
    `method` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `show` BOOLEAN NOT NULL DEFAULT true,
    `enable` BOOLEAN NOT NULL DEFAULT true,
    `order` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `created_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_time` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_roleToPermission` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_roleToPermission_AB_unique`(`A`, `B`),
    INDEX `_roleToPermission_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_userToRole` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_userToRole_AB_unique`(`A`, `B`),
    INDEX `_userToRole_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_roleToPermission` ADD CONSTRAINT `_roleToPermission_A_fkey` FOREIGN KEY (`A`) REFERENCES `permission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_roleToPermission` ADD CONSTRAINT `_roleToPermission_B_fkey` FOREIGN KEY (`B`) REFERENCES `role`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_userToRole` ADD CONSTRAINT `_userToRole_A_fkey` FOREIGN KEY (`A`) REFERENCES `role`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_userToRole` ADD CONSTRAINT `_userToRole_B_fkey` FOREIGN KEY (`B`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
