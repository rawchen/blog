-- ============================================
-- 数据库迁移脚本
-- 执行前请备份数据库
-- ============================================

-- 1. 文章表添加slug字段
ALTER TABLE `blog_article` ADD COLUMN `slug` varchar(200) DEFAULT NULL COMMENT '文章别名' AFTER `title`;
ALTER TABLE `blog_article` ADD UNIQUE KEY `uk_slug` (`slug`);

-- 2. 友链表添加缺失字段
ALTER TABLE `blog_friend_link` ADD COLUMN `owner_name` varchar(50) DEFAULT NULL COMMENT '站长名称' AFTER `description`;
ALTER TABLE `blog_friend_link` ADD COLUMN `owner_email` varchar(100) DEFAULT NULL COMMENT '站长邮箱' AFTER `owner_name`;
ALTER TABLE `blog_friend_link` CHANGE COLUMN `site_logo` `logo` varchar(255) DEFAULT NULL COMMENT 'Logo';

-- 3. 创建站点统计表
DROP TABLE IF EXISTS `blog_site_stat`;
CREATE TABLE `blog_site_stat` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `stat_date` date NOT NULL COMMENT '统计日期',
  `pv_count` int(11) DEFAULT 0 COMMENT '页面浏览量',
  `uv_count` int(11) DEFAULT 0 COMMENT '独立访客数',
  `ip_count` int(11) DEFAULT 0 COMMENT '独立IP数',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_stat_date` (`stat_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='站点统计表';

-- 4. 创建朋友圈表
DROP TABLE IF EXISTS `blog_moment`;
CREATE TABLE `blog_moment` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `title` varchar(200) NOT NULL COMMENT '标题',
  `description` varchar(500) DEFAULT NULL COMMENT '描述',
  `link` varchar(500) DEFAULT NULL COMMENT '链接',
  `author` varchar(50) DEFAULT NULL COMMENT '作者',
  `site_name` varchar(100) DEFAULT NULL COMMENT '站点名',
  `icon` varchar(255) DEFAULT NULL COMMENT '图标',
  `img` varchar(255) DEFAULT NULL COMMENT '图片',
  `publish_time` datetime DEFAULT NULL COMMENT '发布时间',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_publish_time` (`publish_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='朋友圈表';

-- 5. 友链表状态字段修改（添加待审核状态）
ALTER TABLE `blog_friend_link` MODIFY COLUMN `status` tinyint(1) DEFAULT 1 COMMENT '状态 0-待审核 1-正常 2-失效';

-- 6. 文章自定义字段表 (对应Typecho fields)
DROP TABLE IF EXISTS `blog_article_field`;
CREATE TABLE `blog_article_field` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `article_id` bigint(20) NOT NULL COMMENT '文章ID',
  `field_name` varchar(50) NOT NULL COMMENT '字段名: thumb, green, red, blue, book, code等',
  `field_value` text COMMENT '字段值',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_article_id` (`article_id`),
  UNIQUE KEY `uk_article_field` (`article_id`, `field_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='文章自定义字段表';

-- 7. 文章版本历史表
DROP TABLE IF EXISTS `blog_article_version`;
CREATE TABLE `blog_article_version` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `article_id` bigint(20) NOT NULL COMMENT '文章ID',
  `version` int(11) NOT NULL DEFAULT 1 COMMENT '版本号',
  `title` varchar(200) NOT NULL COMMENT '标题',
  `content` longtext COMMENT '内容(Markdown)',
  `summary` varchar(500) DEFAULT NULL COMMENT '摘要',
  `author_id` bigint(20) NOT NULL COMMENT '操作者ID',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_article_id` (`article_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='文章版本历史表';

-- 8. 操作日志表
DROP TABLE IF EXISTS `blog_operation_log`;
CREATE TABLE `blog_operation_log` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` bigint(20) DEFAULT NULL COMMENT '用户ID',
  `username` varchar(50) DEFAULT NULL COMMENT '用户名',
  `operation_type` varchar(50) NOT NULL COMMENT '操作类型: CREATE/UPDATE/DELETE等',
  `target_type` varchar(50) NOT NULL COMMENT '目标类型: ARTICLE/CATEGORY/TAG等',
  `target_id` bigint(20) DEFAULT NULL COMMENT '目标ID',
  `detail` text COMMENT '操作详情JSON',
  `ip_address` varchar(50) DEFAULT NULL COMMENT 'IP地址',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='操作日志表';

-- 9. 评论表增加字段
ALTER TABLE `blog_comment` ADD COLUMN `agent` varchar(255) DEFAULT NULL COMMENT '浏览器代理' AFTER `user_agent`;
ALTER TABLE `blog_comment` ADD COLUMN `os` varchar(50) DEFAULT NULL COMMENT '操作系统' AFTER `agent`;
ALTER TABLE `blog_comment` ADD COLUMN `browser` varchar(50) DEFAULT NULL COMMENT '浏览器' AFTER `os`;
