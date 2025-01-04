/*
  Warnings:

  - A unique constraint covering the columns `[medical_record_id]` on the table `appointment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[appointment_id]` on the table `medical_record` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `appointment` ADD COLUMN `medical_record_id` INTEGER NULL;

-- CreateIndex
CREATE UNIQUE INDEX `appointment_medical_record_id_key` ON `appointment`(`medical_record_id`);

-- CreateIndex
CREATE UNIQUE INDEX `medical_record_appointment_id_key` ON `medical_record`(`appointment_id`);
