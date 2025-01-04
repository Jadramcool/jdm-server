/*
  Warnings:

  - You are about to drop the column `diagnosis` on the `medical_record` table. All the data in the column will be lost.
  - Added the required column `diagnostic` to the `medical_record` table without a default value. This is not possible if the table is not empty.
  - Added the required column `main_complaint` to the `medical_record` table without a default value. This is not possible if the table is not empty.
  - Added the required column `now_sickness` to the `medical_record` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `medical_record` DROP COLUMN `diagnosis`,
    ADD COLUMN `diagnostic` VARCHAR(191) NOT NULL,
    ADD COLUMN `main_complaint` VARCHAR(191) NOT NULL,
    ADD COLUMN `now_sickness` VARCHAR(191) NOT NULL;
