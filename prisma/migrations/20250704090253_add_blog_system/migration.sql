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
