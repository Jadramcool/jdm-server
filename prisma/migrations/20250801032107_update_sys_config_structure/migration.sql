/*
  Warnings:

  - You are about to drop the column `name` on the `sys_config` table. All the data in the column will be lost.
  - You are about to drop the column `value` on the `sys_config` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[config_key]` on the table `sys_config` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `config_key` to the `sys_config` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `sys_config` DROP COLUMN `name`,
    DROP COLUMN `value`,
    ADD COLUMN `category` VARCHAR(191) NULL DEFAULT 'SYSTEM',
    ADD COLUMN `config_key` VARCHAR(191) NOT NULL,
    ADD COLUMN `config_value` VARCHAR(191) NULL,
    ADD COLUMN `is_public` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `is_system` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `sort_order` INTEGER NULL DEFAULT 0,
    ADD COLUMN `type` ENUM('STRING', 'NUMBER', 'BOOLEAN', 'JSON', 'ARRAY', 'FILE', 'EMAIL', 'URL', 'PASSWORD') NOT NULL DEFAULT 'STRING';

-- CreateIndex
CREATE UNIQUE INDEX `sys_config_config_key_key` ON `sys_config`(`config_key`);
