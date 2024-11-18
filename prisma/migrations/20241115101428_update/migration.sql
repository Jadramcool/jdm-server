/*
  Warnings:

  - A unique constraint covering the columns `[role_id,menu_id]` on the table `role_menu` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `role_menu_role_id_menu_id_key` ON `role_menu`(`role_id`, `menu_id`);
