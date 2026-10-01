CREATE TABLE `employees` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `employee_code` varchar(32) NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `status` enum('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_employees_code` (`employee_code`)
);

CREATE TABLE `user_accounts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `employee_id` bigint DEFAULT NULL,
  `username` varchar(80) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('MANAGER','EMPLOYEE') NOT NULL,
  `enabled` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_accounts_username` (`username`),
  UNIQUE KEY `uq_accounts_employee` (`employee_id`),
  CONSTRAINT `fk_accounts_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `ck_employee_account_has_employee` CHECK (((`role` <> 'EMPLOYEE') or (`employee_id` is not null)))
);

CREATE TABLE `shifts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `shift_code` varchar(32) NOT NULL,
  `shift_name` varchar(120) NOT NULL,
  `effective_from` date NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_shifts_code` (`shift_code`),
  UNIQUE KEY `uq_shifts_effective_from` (`effective_from`)
);

CREATE TABLE `shift_milestones` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `shift_id` bigint NOT NULL,
  `event_type` enum('MORNING_IN','LUNCH_OUT','AFTERNOON_IN','WORK_OUT') NOT NULL,
  `target_time` time NOT NULL,
  `window_start` time NOT NULL,
  `window_end` time NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_shift_milestone` (`shift_id`,`event_type`),
  CONSTRAINT `fk_milestones_shift` FOREIGN KEY (`shift_id`) REFERENCES `shifts` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `ck_milestone_time_order` CHECK (((`window_start` <= `target_time`) and (`target_time` <= `window_end`)))
);

CREATE TABLE `face_enrollments` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `employee_id` bigint NOT NULL,
  `external_ref` varchar(120) NOT NULL,
  `model_version` varchar(80) DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `enrolled_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_enrollment_employee` (`employee_id`),
  UNIQUE KEY `uq_enrollment_external_ref` (`external_ref`),
  CONSTRAINT `fk_enrollments_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE RESTRICT
);

CREATE TABLE `attendance_events` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `employee_id` bigint NOT NULL,
  `shift_id` bigint NOT NULL,
  `work_date` date NOT NULL,
  `event_type` enum('MORNING_IN','LUNCH_OUT','AFTERNOON_IN','WORK_OUT') NOT NULL,
  `occurred_at` datetime(3) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_attendance_employee_date_event` (`employee_id`,`work_date`,`event_type`),
  CONSTRAINT `fk_events_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_events_shift` FOREIGN KEY (`shift_id`) REFERENCES `shifts` (`id`) ON DELETE RESTRICT
);

CREATE TABLE `correction_requests` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `employee_id` bigint NOT NULL,
  `shift_id` bigint NOT NULL,
  `work_date` date NOT NULL,
  `event_type` enum('MORNING_IN','LUNCH_OUT','AFTERNOON_IN','WORK_OUT') NOT NULL,
  `proposed_occurred_at` datetime(3) NOT NULL,
  `reason` text NOT NULL,
  `status` enum('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  `requested_by_account_id` bigint NOT NULL,
  `reviewed_by_account_id` bigint DEFAULT NULL,
  `reviewed_at` datetime(3) DEFAULT NULL,
  `review_note` varchar(500) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_corrections_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_corrections_requester` FOREIGN KEY (`requested_by_account_id`) REFERENCES `user_accounts` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_corrections_reviewer` FOREIGN KEY (`reviewed_by_account_id`) REFERENCES `user_accounts` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_corrections_shift` FOREIGN KEY (`shift_id`) REFERENCES `shifts` (`id`) ON DELETE RESTRICT
);
