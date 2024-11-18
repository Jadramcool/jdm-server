-- DropForeignKey
ALTER TABLE `role_menu` DROP FOREIGN KEY `role_menu_menu_id_fkey`;

-- DropForeignKey
ALTER TABLE `role_menu` DROP FOREIGN KEY `role_menu_role_id_fkey`;

-- AddForeignKey
ALTER TABLE `role_menu` ADD CONSTRAINT `role_menu_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `role`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_menu` ADD CONSTRAINT `role_menu_menu_id_fkey` FOREIGN KEY (`menu_id`) REFERENCES `menu`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
