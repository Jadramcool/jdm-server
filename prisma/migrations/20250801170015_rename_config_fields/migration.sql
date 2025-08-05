-- AlterTable
ALTER TABLE `sys_config` RENAME COLUMN `config_key` TO `key`;
ALTER TABLE `sys_config` RENAME COLUMN `config_name` TO `name`;
ALTER TABLE `sys_config` RENAME COLUMN `config_value` TO `value`;