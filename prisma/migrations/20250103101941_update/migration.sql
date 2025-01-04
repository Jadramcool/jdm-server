/*
  Warnings:

  - You are about to drop the column `medical_record_id` on the `appointment` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `appointment_medical_record_id_key` ON `appointment`;

-- AlterTable
ALTER TABLE `appointment` DROP COLUMN `medical_record_id`;
