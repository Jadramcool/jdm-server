/*
  Warnings:

  - You are about to drop the `menus` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE `menus`;

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
