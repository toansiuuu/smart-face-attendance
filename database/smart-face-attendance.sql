

DROP TABLE IF EXISTS `attendance_events`;

CREATE TABLE `attendance_events` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `employee_id` bigint NOT NULL,
  `shift_id` bigint NOT NULL,
  `work_date` date NOT NULL,
  `event_type` enum('MORNING_IN','LUNCH_OUT','AFTERNOON_IN','WORK_OUT') COLLATE utf8mb4_unicode_ci NOT NULL,
  `occurred_at` datetime(3) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_attendance_employee_date_event` (`employee_id`,`work_date`,`event_type`),
  KEY `ix_events_shift` (`shift_id`),
  CONSTRAINT `fk_events_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_events_shift` FOREIGN KEY (`shift_id`) REFERENCES `shifts` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `correction_requests`;

CREATE TABLE `correction_requests` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `employee_id` bigint NOT NULL,
  `shift_id` bigint NOT NULL,
  `work_date` date NOT NULL,
  `event_type` enum('MORNING_IN','LUNCH_OUT','AFTERNOON_IN','WORK_OUT') COLLATE utf8mb4_unicode_ci NOT NULL,
  `proposed_occurred_at` datetime(3) NOT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('PENDING','APPROVED','REJECTED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `requested_by_account_id` bigint NOT NULL,
  `reviewed_by_account_id` bigint DEFAULT NULL,
  `reviewed_at` datetime(3) DEFAULT NULL,
  `review_note` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `ix_corrections_employee_day_event` (`employee_id`,`work_date`,`event_type`,`status`,`id`),
  KEY `ix_corrections_shift` (`shift_id`),
  KEY `ix_corrections_status_created` (`status`,`created_at`),
  KEY `ix_corrections_requested_by` (`requested_by_account_id`),
  KEY `ix_corrections_reviewed_by` (`reviewed_by_account_id`),
  CONSTRAINT `fk_corrections_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_corrections_requester` FOREIGN KEY (`requested_by_account_id`) REFERENCES `user_accounts` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_corrections_reviewer` FOREIGN KEY (`reviewed_by_account_id`) REFERENCES `user_accounts` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_corrections_shift` FOREIGN KEY (`shift_id`) REFERENCES `shifts` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `employees`;

CREATE TABLE `employees` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `employee_code` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('ACTIVE','INACTIVE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_employees_code` (`employee_code`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `face_enrollments`
--

DROP TABLE IF EXISTS `face_enrollments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `face_enrollments` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `employee_id` bigint NOT NULL,
  `external_ref` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `model_version` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `enrolled_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_enrollment_employee` (`employee_id`),
  UNIQUE KEY `uq_enrollment_external_ref` (`external_ref`),
  CONSTRAINT `fk_enrollments_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `shift_milestones`;

CREATE TABLE `shift_milestones` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `shift_id` bigint NOT NULL,
  `event_type` enum('MORNING_IN','LUNCH_OUT','AFTERNOON_IN','WORK_OUT') COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_time` time NOT NULL,
  `window_start` time NOT NULL,
  `window_end` time NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_shift_milestone` (`shift_id`,`event_type`),
  CONSTRAINT `fk_milestones_shift` FOREIGN KEY (`shift_id`) REFERENCES `shifts` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `ck_milestone_time_order` CHECK (((`window_start` <= `target_time`) and (`target_time` <= `window_end`)))
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `shifts`;

CREATE TABLE `shifts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `shift_code` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `shift_name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `effective_from` date NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_shifts_code` (`shift_code`),
  UNIQUE KEY `uq_shifts_effective_from` (`effective_from`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `user_accounts`;

CREATE TABLE `user_accounts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `employee_id` bigint DEFAULT NULL,
  `username` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('MANAGER','EMPLOYEE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `enabled` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_accounts_username` (`username`),
  UNIQUE KEY `uq_accounts_employee` (`employee_id`),
  CONSTRAINT `fk_accounts_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `ck_employee_account_has_employee` CHECK (((`role` <> _utf8mb4'EMPLOYEE') or (`employee_id` is not null)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
