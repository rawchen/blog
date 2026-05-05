/*
 Navicat Premium Data Transfer

 Source Server         : rawchen
 Source Server Type    : MySQL
 Source Server Version : 50734
 Source Host           : 1.12.63.32:3306
 Source Schema         : rawchen

 Target Server Type    : MySQL
 Target Server Version : 50734
 File Encoding         : 65001

 Date: 05/04/2026 23:27:04
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for typecho_access_log
-- ----------------------------
DROP TABLE IF EXISTS `typecho_access_log`;
CREATE TABLE `typecho_access_log`  (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `ua` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT '',
  `browser_id` varchar(32) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT '',
  `browser_version` varchar(32) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT '',
  `os_id` varchar(32) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT '',
  `os_version` varchar(32) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT '',
  `url` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT '',
  `path` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT '',
  `query_string` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT '',
  `ip` int(32) UNSIGNED NULL DEFAULT 0,
  `entrypoint` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT '',
  `entrypoint_domain` varchar(100) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT '',
  `referer` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT '',
  `referer_domain` varchar(100) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT '',
  `time` int(32) UNSIGNED NULL DEFAULT 0,
  `content_id` int(10) UNSIGNED NULL DEFAULT NULL,
  `meta_id` int(10) UNSIGNED NULL DEFAULT NULL,
  `robot` tinyint(1) NULL DEFAULT 0,
  `robot_id` varchar(32) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT '',
  `robot_version` varchar(32) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT '',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_time`(`time`) USING BTREE,
  INDEX `idx_path`(`path`) USING BTREE,
  INDEX `idx_ip_ua`(`ip`, `ua`) USING BTREE,
  INDEX `idx_robot`(`robot`, `time`) USING BTREE,
  INDEX `idx_os_id`(`os_id`) USING BTREE,
  INDEX `idx_robot_id`(`robot_id`) USING BTREE,
  INDEX `idx_browser_id`(`browser_id`) USING BTREE,
  INDEX `idx_content_id`(`content_id`) USING BTREE,
  INDEX `idx_meta_id`(`meta_id`) USING BTREE,
  INDEX `idx_entrypoint`(`entrypoint`) USING BTREE,
  INDEX `idx_entrypoint_domain`(`entrypoint_domain`) USING BTREE,
  INDEX `idx_referer`(`referer`) USING BTREE,
  INDEX `idx_referer_domain`(`referer_domain`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1095356 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for typecho_comments
-- ----------------------------
DROP TABLE IF EXISTS `typecho_comments`;
CREATE TABLE `typecho_comments`  (
  `coid` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `cid` int(10) UNSIGNED NULL DEFAULT 0,
  `created` int(10) UNSIGNED NULL DEFAULT 0,
  `author` varchar(200) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `authorId` int(10) UNSIGNED NULL DEFAULT 0,
  `ownerId` int(10) UNSIGNED NULL DEFAULT 0,
  `mail` varchar(200) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `url` varchar(200) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `ip` varchar(64) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `agent` varchar(200) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `text` text CHARACTER SET utf8 COLLATE utf8_general_ci NULL,
  `type` varchar(16) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT 'comment',
  `status` varchar(16) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT 'approved',
  `parent` int(10) UNSIGNED NULL DEFAULT 0,
  `authorImg` varchar(500) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`coid`) USING BTREE,
  INDEX `cid`(`cid`) USING BTREE,
  INDEX `created`(`created`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1326 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for typecho_contents
-- ----------------------------
DROP TABLE IF EXISTS `typecho_contents`;
CREATE TABLE `typecho_contents`  (
  `cid` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` varchar(200) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `slug` varchar(200) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `created` int(10) UNSIGNED NULL DEFAULT 0,
  `modified` int(10) UNSIGNED NULL DEFAULT 0,
  `text` longtext CHARACTER SET utf8 COLLATE utf8_general_ci NULL,
  `order` int(10) UNSIGNED NULL DEFAULT 0,
  `authorId` int(10) UNSIGNED NULL DEFAULT 0,
  `template` varchar(32) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `type` varchar(16) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT 'post',
  `status` varchar(16) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT 'publish',
  `password` varchar(32) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `commentsNum` int(10) UNSIGNED NULL DEFAULT 0,
  `allowComment` char(1) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT '0',
  `allowPing` char(1) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT '0',
  `allowFeed` char(1) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT '0',
  `parent` int(10) UNSIGNED NULL DEFAULT 0,
  `views` int(11) NULL DEFAULT NULL,
  `likes` int(11) NULL DEFAULT 0,
  PRIMARY KEY (`cid`) USING BTREE,
  UNIQUE INDEX `slug`(`slug`) USING BTREE,
  INDEX `created`(`created`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1750 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for typecho_fields
-- ----------------------------
DROP TABLE IF EXISTS `typecho_fields`;
CREATE TABLE `typecho_fields`  (
  `cid` int(10) UNSIGNED NOT NULL,
  `name` varchar(200) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `type` varchar(8) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT 'str',
  `str_value` text CHARACTER SET utf8 COLLATE utf8_general_ci NULL,
  `int_value` int(10) NULL DEFAULT 0,
  `float_value` float NULL DEFAULT 0,
  PRIMARY KEY (`cid`, `name`) USING BTREE,
  INDEX `int_value`(`int_value`) USING BTREE,
  INDEX `float_value`(`float_value`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for typecho_metas
-- ----------------------------
DROP TABLE IF EXISTS `typecho_metas`;
CREATE TABLE `typecho_metas`  (
  `mid` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` varchar(200) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `slug` varchar(200) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `type` varchar(32) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `description` varchar(200) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `count` int(10) UNSIGNED NULL DEFAULT 0,
  `order` int(10) UNSIGNED NULL DEFAULT 0,
  `parent` int(10) UNSIGNED NULL DEFAULT 0,
  PRIMARY KEY (`mid`) USING BTREE,
  INDEX `slug`(`slug`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 273 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for typecho_options
-- ----------------------------
DROP TABLE IF EXISTS `typecho_options`;
CREATE TABLE `typecho_options`  (
  `name` varchar(32) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `user` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `value` text CHARACTER SET utf8 COLLATE utf8_general_ci NULL,
  PRIMARY KEY (`name`, `user`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for typecho_relationships
-- ----------------------------
DROP TABLE IF EXISTS `typecho_relationships`;
CREATE TABLE `typecho_relationships`  (
  `cid` int(10) UNSIGNED NOT NULL,
  `mid` int(10) UNSIGNED NOT NULL,
  PRIMARY KEY (`cid`, `mid`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for typecho_users
-- ----------------------------
DROP TABLE IF EXISTS `typecho_users`;
CREATE TABLE `typecho_users`  (
  `uid` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` varchar(32) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `password` varchar(64) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `mail` varchar(200) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `url` varchar(200) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `screenName` varchar(32) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `created` int(10) UNSIGNED NULL DEFAULT 0,
  `activated` int(10) UNSIGNED NULL DEFAULT 0,
  `logged` int(10) UNSIGNED NULL DEFAULT 0,
  `group` varchar(16) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT 'visitor',
  `authCode` varchar(64) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`uid`) USING BTREE,
  UNIQUE INDEX `name`(`name`) USING BTREE,
  UNIQUE INDEX `mail`(`mail`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

SET FOREIGN_KEY_CHECKS = 1;
