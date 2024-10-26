/*
  Warnings:

  - You are about to alter the column `value` on the `sys_config` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `TinyInt`.

*/
-- AlterTable
ALTER TABLE `sys_config` MODIFY `value` BOOLEAN NOT NULL;
