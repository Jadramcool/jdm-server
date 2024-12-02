/*
  Warnings:

  - The values [ACTIVE] on the enum `notice_type` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `notice` MODIFY `type` ENUM('NOTICE', 'INFO', 'ACTIVITY') NOT NULL;
