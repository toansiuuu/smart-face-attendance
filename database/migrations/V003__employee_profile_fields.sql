ALTER TABLE `employees` ADD COLUMN `phone` varchar(20) DEFAULT NULL AFTER `department_id`;
ALTER TABLE `employees` ADD COLUMN `email` varchar(255) DEFAULT NULL AFTER `phone`;
ALTER TABLE `employees` ADD COLUMN `position` varchar(100) DEFAULT NULL AFTER `email`;
ALTER TABLE `employees` ADD COLUMN `date_of_birth` date DEFAULT NULL AFTER `position`;
ALTER TABLE `employees` ADD COLUMN `gender` enum('MALE','FEMALE','OTHER') DEFAULT NULL AFTER `date_of_birth`;
ALTER TABLE `employees` ADD COLUMN `avatar_url` varchar(500) DEFAULT NULL AFTER `gender`;
