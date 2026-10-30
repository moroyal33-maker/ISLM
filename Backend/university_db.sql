-- ========================================================
-- قاعدة بيانات النظام الأكاديمي وجدولة المحاضرات (university_db)
-- ========================================================

CREATE DATABASE IF NOT EXISTS `university_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `university_db`;

-- --------------------------------------------------------
-- 1. جدول المشرف (admin)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `admin` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `security_question` varchar(255) DEFAULT NULL,
  `security_answer` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- بيانات المشرف الافتراضية
INSERT INTO `admin` (`id`, `name`, `email`, `password`, `security_question`, `security_answer`)
VALUES (1, 'المشرف', 'admin@test.com', '0000', 'ما هو اسم أول مدرسة درست بها؟', 'الخرطوم')
ON DUPLICATE KEY UPDATE `email`=VALUES(`email`);

-- --------------------------------------------------------
-- 2. جدول الأساتذة (teachers)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `teachers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `specialization` varchar(255) DEFAULT NULL,
  `teaching_subjects` varchar(255) DEFAULT NULL,
  `availability` varchar(255) DEFAULT NULL,
  `degree` varchar(50) DEFAULT NULL,
  `security_question` varchar(255) DEFAULT NULL,
  `security_answer` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- 3. جدول الطلاب (students)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `students` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `acadmic_id` int(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `department` varchar(255) NOT NULL,
  `batch` varchar(50) DEFAULT NULL,
  `academic_year` varchar(50) DEFAULT 'غير محدد',
  `security_question` varchar(255) DEFAULT NULL,
  `security_answer` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `acadmic_id` (`acadmic_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- 4. جدول المحاضرات (lectures)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `lectures` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `teacher_id` int(11) NOT NULL,
  `subject_name` varchar(255) NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `hall_name` varchar(255) NOT NULL,
  `department` varchar(255) DEFAULT NULL,
  `batch` varchar(255) DEFAULT NULL,
  `lecture_day` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `teacher_id` (`teacher_id`),
  CONSTRAINT `lectures_ibfk_1` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
