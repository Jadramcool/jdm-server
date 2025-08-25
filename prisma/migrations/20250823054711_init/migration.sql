-- CreateTable
CREATE TABLE `sys_config` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `description` VARCHAR(191) NULL,
    `created_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_time` DATETIME(3) NOT NULL,
    `category` VARCHAR(191) NULL DEFAULT 'SYSTEM',
    `key` VARCHAR(191) NOT NULL,
    `value` VARCHAR(191) NULL,
    `is_public` BOOLEAN NOT NULL DEFAULT false,
    `is_system` BOOLEAN NOT NULL DEFAULT false,
    `sort_order` INTEGER NULL DEFAULT 0,
    `type` ENUM('STRING', 'NUMBER', 'BOOLEAN', 'JSON', 'ARRAY', 'FILE', 'EMAIL', 'URL', 'PASSWORD') NOT NULL DEFAULT 'STRING',
    `name` VARCHAR(191) NULL,

    UNIQUE INDEX `sys_config_config_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `sex` ENUM('MALE', 'FEMALE', 'OTHER') NULL DEFAULT 'OTHER',
    `avatar` VARCHAR(191) NULL,
    `birthday` DATETIME(3) NULL,
    `created_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_time` DATETIME(3) NULL,
    `deleted_time` DATETIME(3) NULL,
    `password` VARCHAR(191) NOT NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `status` INTEGER NOT NULL DEFAULT 0,
    `role_type` VARCHAR(191) NULL DEFAULT 'user',
    `city` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `address_detail` VARCHAR(191) NULL,
    `department_id` INTEGER NULL,
    `joined_at` DATETIME(3) NULL,
    `position` VARCHAR(191) NULL,
    `is_blog_user` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `user_username_key`(`username`),
    UNIQUE INDEX `user_phone_key`(`phone`),
    UNIQUE INDEX `user_email_key`(`email`),
    INDEX `user_department_id_fkey`(`department_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `menu` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `pid` INTEGER NULL,
    `path` VARCHAR(191) NULL,
    `redirect` VARCHAR(191) NULL,
    `icon` VARCHAR(191) NULL,
    `component` VARCHAR(191) NULL,
    `layout` VARCHAR(191) NOT NULL,
    `keep_alive` BOOLEAN NULL DEFAULT false,
    `method` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `show` BOOLEAN NOT NULL DEFAULT true,
    `enable` BOOLEAN NOT NULL DEFAULT true,
    `order` INTEGER NOT NULL,
    `created_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_time` DATETIME(3) NULL,
    `need_login` BOOLEAN NULL DEFAULT true,
    `extra_data` VARCHAR(191) NULL,

    UNIQUE INDEX `menu_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `created_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_time` DATETIME(3) NOT NULL,
    `deleted_time` DATETIME(3) NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `role_code_key`(`code`),
    UNIQUE INDEX `role_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role_menu` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `role_id` INTEGER NOT NULL,
    `menu_id` INTEGER NOT NULL,
    `assigned_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `role_menu_menu_id_fkey`(`menu_id`),
    UNIQUE INDEX `role_menu_role_id_menu_id_key`(`role_id`, `menu_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_role` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `role_id` INTEGER NOT NULL,
    `assigned_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `user_role_roleId_fkey`(`role_id`),
    INDEX `user_role_user_id_fkey`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notice` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `content` VARCHAR(191) NULL,
    `type` ENUM('NOTICE', 'INFO', 'ACTIVITY') NOT NULL,
    `authorId` INTEGER NOT NULL,
    `status` INTEGER NOT NULL DEFAULT 0,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_time` DATETIME(3) NOT NULL,
    `deleted_time` DATETIME(3) NULL,

    INDEX `notice_authorId_fkey`(`authorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_notice` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `notice_id` INTEGER NOT NULL,
    `assigned_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `readTime` DATETIME(3) NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,

    INDEX `user_notice_notice_id_fkey`(`notice_id`),
    UNIQUE INDEX `user_notice_user_id_notice_id_key`(`user_id`, `notice_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `todo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pid` INTEGER NULL,
    `title` VARCHAR(191) NOT NULL,
    `content` VARCHAR(191) NULL,
    `sort_order` INTEGER NULL DEFAULT 0,
    `isDone` BOOLEAN NOT NULL DEFAULT false,
    `created_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_time` DATETIME(3) NULL,
    `done_time` DATETIME(3) NULL,
    `userId` INTEGER NOT NULL,

    INDEX `todo_pid_fkey`(`pid`),
    INDEX `todo_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `department` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `level` INTEGER NOT NULL DEFAULT 1,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `status` INTEGER NOT NULL DEFAULT 0,
    `manager_id` INTEGER NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_time` DATETIME(3) NOT NULL,
    `deleted_time` DATETIME(3) NULL,
    `parent_id` INTEGER NULL,

    UNIQUE INDEX `department_code_key`(`code`),
    INDEX `department_parent_id_fkey`(`parent_id`),
    INDEX `department_manager_id_fkey`(`manager_id`),
    INDEX `department_code_idx`(`code`),
    INDEX `department_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role_department` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `role_id` INTEGER NOT NULL,
    `department_id` INTEGER NOT NULL,
    `auto_assign` BOOLEAN NOT NULL DEFAULT false,
    `default_position` VARCHAR(191) NULL,
    `assigned_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `role_department_role_id_fkey`(`role_id`),
    INDEX `role_department_department_id_fkey`(`department_id`),
    INDEX `role_department_auto_assign_idx`(`auto_assign`),
    UNIQUE INDEX `role_department_role_id_department_id_key`(`role_id`, `department_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `operation_log` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NULL,
    `username` VARCHAR(191) NULL,
    `operation_type` ENUM('CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN', 'LOGOUT', 'EXPORT', 'IMPORT', 'OTHER') NOT NULL,
    `module` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `method` VARCHAR(191) NULL,
    `url` VARCHAR(191) NULL,
    `params` TEXT NULL,
    `result` TEXT NULL,
    `status` ENUM('SUCCESS', 'FAILED', 'PENDING') NOT NULL DEFAULT 'SUCCESS',
    `error_message` TEXT NULL,
    `ip_address` VARCHAR(191) NULL,
    `user_agent` TEXT NULL,
    `duration` INTEGER NULL,
    `created_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `operation_log_user_id_fkey`(`user_id`),
    INDEX `operation_log_operation_type_idx`(`operation_type`),
    INDEX `operation_log_created_time_idx`(`created_time`),
    INDEX `operation_log_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `blog_category` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `icon` VARCHAR(191) NULL,
    `color` VARCHAR(191) NULL,
    `parent_id` INTEGER NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `post_count` INTEGER NOT NULL DEFAULT 0,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_time` DATETIME(3) NOT NULL,
    `deleted_time` DATETIME(3) NULL,

    UNIQUE INDEX `blog_category_name_key`(`name`),
    UNIQUE INDEX `blog_category_slug_key`(`slug`),
    INDEX `blog_category_parent_id_idx`(`parent_id`),
    INDEX `blog_category_sort_order_idx`(`sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `blog_tag` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `color` VARCHAR(191) NULL,
    `icon` VARCHAR(191) NULL,
    `use_count` INTEGER NOT NULL DEFAULT 0,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_time` DATETIME(3) NOT NULL,
    `deleted_time` DATETIME(3) NULL,

    UNIQUE INDEX `blog_tag_name_key`(`name`),
    UNIQUE INDEX `blog_tag_slug_key`(`slug`),
    INDEX `blog_tag_use_count_idx`(`use_count`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `blog_post` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `summary` TEXT NULL,
    `content` LONGTEXT NOT NULL,
    `cover_image` VARCHAR(191) NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `is_top` BOOLEAN NOT NULL DEFAULT false,
    `allow_comment` BOOLEAN NOT NULL DEFAULT true,
    `view_count` INTEGER NOT NULL DEFAULT 0,
    `like_count` INTEGER NOT NULL DEFAULT 0,
    `comment_count` INTEGER NOT NULL DEFAULT 0,
    `author_id` INTEGER NOT NULL,
    `category_id` INTEGER NULL,
    `published_at` DATETIME(3) NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_time` DATETIME(3) NOT NULL,
    `deleted_time` DATETIME(3) NULL,

    UNIQUE INDEX `blog_post_slug_key`(`slug`),
    INDEX `blog_post_author_id_idx`(`author_id`),
    INDEX `blog_post_category_id_idx`(`category_id`),
    INDEX `blog_post_status_published_at_idx`(`status`, `published_at`),
    INDEX `blog_post_is_top_published_at_idx`(`is_top`, `published_at`),
    INDEX `blog_post_slug_idx`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `blog_post_tag` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `post_id` INTEGER NOT NULL,
    `tag_id` INTEGER NOT NULL,

    UNIQUE INDEX `blog_post_tag_post_id_tag_id_key`(`post_id`, `tag_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `blog_comment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `content` TEXT NOT NULL,
    `author_name` VARCHAR(191) NULL,
    `author_email` VARCHAR(191) NULL,
    `author_url` VARCHAR(191) NULL,
    `author_ip` VARCHAR(191) NULL,
    `user_agent` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `like_count` INTEGER NOT NULL DEFAULT 0,
    `post_id` INTEGER NOT NULL,
    `user_id` INTEGER NULL,
    `parent_id` INTEGER NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_time` DATETIME(3) NOT NULL,
    `deleted_time` DATETIME(3) NULL,

    INDEX `blog_comment_post_id_status_idx`(`post_id`, `status`),
    INDEX `blog_comment_user_id_idx`(`user_id`),
    INDEX `blog_comment_parent_id_idx`(`parent_id`),
    INDEX `blog_comment_created_time_idx`(`created_time`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `blog_post_like` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `post_id` INTEGER NOT NULL,
    `user_id` INTEGER NULL,
    `guest_id` VARCHAR(191) NULL,
    `ip_address` VARCHAR(191) NULL,
    `created_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `blog_post_like_post_id_idx`(`post_id`),
    UNIQUE INDEX `blog_post_like_post_id_user_id_key`(`post_id`, `user_id`),
    UNIQUE INDEX `blog_post_like_post_id_guest_id_key`(`post_id`, `guest_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `blog_comment_like` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `comment_id` INTEGER NOT NULL,
    `user_id` INTEGER NULL,
    `guest_id` VARCHAR(191) NULL,
    `ip_address` VARCHAR(191) NULL,
    `created_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `blog_comment_like_comment_id_idx`(`comment_id`),
    UNIQUE INDEX `blog_comment_like_comment_id_user_id_key`(`comment_id`, `user_id`),
    UNIQUE INDEX `blog_comment_like_comment_id_guest_id_key`(`comment_id`, `guest_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `blog_config` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(191) NOT NULL,
    `value` TEXT NULL,
    `description` VARCHAR(191) NULL,
    `category` VARCHAR(191) NULL,
    `created_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_time` DATETIME(3) NOT NULL,

    UNIQUE INDEX `blog_config_key_key`(`key`),
    INDEX `blog_config_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `blog_friend_link` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `avatar` VARCHAR(191) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_visible` BOOLEAN NOT NULL DEFAULT true,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_time` DATETIME(3) NOT NULL,
    `deleted_time` DATETIME(3) NULL,

    INDEX `blog_friend_link_sort_order_idx`(`sort_order`),
    INDEX `blog_friend_link_is_visible_idx`(`is_visible`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user` ADD CONSTRAINT `user_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `department`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_menu` ADD CONSTRAINT `role_menu_menu_id_fkey` FOREIGN KEY (`menu_id`) REFERENCES `menu`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_menu` ADD CONSTRAINT `role_menu_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `role`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_role` ADD CONSTRAINT `user_role_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `role`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_role` ADD CONSTRAINT `user_role_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notice` ADD CONSTRAINT `notice_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_notice` ADD CONSTRAINT `user_notice_notice_id_fkey` FOREIGN KEY (`notice_id`) REFERENCES `notice`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_notice` ADD CONSTRAINT `user_notice_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `todo` ADD CONSTRAINT `todo_pid_fkey` FOREIGN KEY (`pid`) REFERENCES `todo`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `todo` ADD CONSTRAINT `todo_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `department` ADD CONSTRAINT `department_manager_id_fkey` FOREIGN KEY (`manager_id`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `department` ADD CONSTRAINT `department_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `department`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_department` ADD CONSTRAINT `role_department_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `department`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_department` ADD CONSTRAINT `role_department_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `role`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `operation_log` ADD CONSTRAINT `operation_log_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `blog_category` ADD CONSTRAINT `blog_category_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `blog_category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `blog_post` ADD CONSTRAINT `blog_post_author_id_fkey` FOREIGN KEY (`author_id`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `blog_post` ADD CONSTRAINT `blog_post_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `blog_category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `blog_post_tag` ADD CONSTRAINT `blog_post_tag_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `blog_post`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `blog_post_tag` ADD CONSTRAINT `blog_post_tag_tag_id_fkey` FOREIGN KEY (`tag_id`) REFERENCES `blog_tag`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `blog_comment` ADD CONSTRAINT `blog_comment_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `blog_post`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `blog_comment` ADD CONSTRAINT `blog_comment_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `blog_comment` ADD CONSTRAINT `blog_comment_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `blog_comment`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `blog_post_like` ADD CONSTRAINT `blog_post_like_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `blog_post`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `blog_post_like` ADD CONSTRAINT `blog_post_like_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `blog_comment_like` ADD CONSTRAINT `blog_comment_like_comment_id_fkey` FOREIGN KEY (`comment_id`) REFERENCES `blog_comment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `blog_comment_like` ADD CONSTRAINT `blog_comment_like_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
