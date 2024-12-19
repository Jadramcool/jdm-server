/*
  Warnings:

  - A unique constraint covering the columns `[user_id]` on the table `doctor` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `doctor_user_id_key` ON `doctor`(`user_id`);
