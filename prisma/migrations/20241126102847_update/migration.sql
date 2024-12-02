/*
  Warnings:

  - You are about to drop the `_noticereceiver` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `_noticereceiver` DROP FOREIGN KEY `_NoticeReceiver_A_fkey`;

-- DropForeignKey
ALTER TABLE `_noticereceiver` DROP FOREIGN KEY `_NoticeReceiver_B_fkey`;

-- DropForeignKey
ALTER TABLE `notice` DROP FOREIGN KEY `Notice_authorId_fkey`;

-- DropTable
DROP TABLE `_noticereceiver`;

-- CreateTable
CREATE TABLE `user_notice` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `notice_id` INTEGER NOT NULL,
    `assigned_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `user_notice_user_id_notice_id_key`(`user_id`, `notice_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `notice` ADD CONSTRAINT `notice_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_notice` ADD CONSTRAINT `user_notice_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_notice` ADD CONSTRAINT `user_notice_notice_id_fkey` FOREIGN KEY (`notice_id`) REFERENCES `notice`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
