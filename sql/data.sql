/*
 Navicat Premium Data Transfer

 Source Server Type    : MySQL
 Source Server Version : 50734
 File Encoding         : 65001

 Date: 2026-04-05
*/

SET NAMES utf8mb4;

-- ----------------------------
-- 初始化角色数据
-- ----------------------------
INSERT INTO `sys_role` (`role_name`, `role_code`, `description`, `status`) VALUES
('超级管理员', 'ROLE_ADMIN', '系统超级管理员，拥有所有权限', 1),
('普通用户', 'ROLE_USER', '普通用户，拥有基本权限', 1),
('访客', 'ROLE_GUEST', '访客用户，只能浏览', 1);

-- ----------------------------
-- 初始化权限数据
-- ----------------------------
INSERT INTO `sys_permission` (`permission_name`, `permission_code`, `permission_type`, `parent_id`, `menu_path`, `menu_icon`, `sort_order`, `description`, `status`) VALUES
-- 系统管理
('系统管理', 'system', 1, 0, '/system', 'SettingOutlined', 1, '系统管理目录', 1),
('用户管理', 'system:user', 1, 1, '/system/user', 'UserOutlined', 1, '用户管理菜单', 1),
('用户查询', 'system:user:query', 2, 2, NULL, NULL, 1, '用户查询按钮', 1),
('用户新增', 'system:user:add', 2, 2, NULL, NULL, 2, '用户新增按钮', 1),
('用户修改', 'system:user:edit', 2, 2, NULL, NULL, 3, '用户修改按钮', 1),
('用户删除', 'system:user:delete', 2, 2, NULL, NULL, 4, '用户删除按钮', 1),
('角色管理', 'system:role', 1, 1, '/system/role', 'TeamOutlined', 2, '角色管理菜单', 1),
('权限管理', 'system:permission', 1, 1, '/system/permission', 'LockOutlined', 3, '权限管理菜单', 1),

-- 文章管理
('内容管理', 'content', 1, 0, '/content', 'FileTextOutlined', 2, '内容管理目录', 1),
('文章管理', 'content:article', 1, 9, '/content/article', 'FileTextOutlined', 1, '文章管理菜单', 1),
('文章查询', 'content:article:query', 2, 10, NULL, NULL, 1, '文章查询按钮', 1),
('文章新增', 'content:article:add', 2, 10, NULL, NULL, 2, '文章新增按钮', 1),
('文章修改', 'content:article:edit', 2, 10, NULL, NULL, 3, '文章修改按钮', 1),
('文章删除', 'content:article:delete', 2, 10, NULL, NULL, 4, '文章删除按钮', 1),
('分类管理', 'content:category', 1, 9, '/content/category', 'FolderOutlined', 2, '分类管理菜单', 1),
('标签管理', 'content:tag', 1, 9, '/content/tag', 'TagsOutlined', 3, '标签管理菜单', 1),

-- 评论管理
('评论管理', 'content:comment', 1, 9, '/content/comment', 'CommentOutlined', 4, '评论管理菜单', 1),
('评论审核', 'content:comment:audit', 2, 18, NULL, NULL, 1, '评论审核按钮', 1),

-- 其他
('友链管理', 'content:friendLink', 1, 9, '/content/friendLink', 'LinkOutlined', 5, '友链管理菜单', 1),
('系统配置', 'system:config', 1, 1, '/system/config', 'ToolOutlined', 4, '系统配置菜单', 1);

-- ----------------------------
-- 初始化角色权限关联
-- ----------------------------
-- 超级管理员拥有所有权限
INSERT INTO `sys_role_permission` (`role_id`, `permission_id`)
SELECT 1, id FROM `sys_permission`;

-- 普通用户权限
INSERT INTO `sys_role_permission` (`role_id`, `permission_id`) VALUES
(2, 10), (2, 11), (2, 12), (2, 13), (2, 14), (2, 15), (2, 16), (2, 17), (2, 18);

-- ----------------------------
-- 初始化管理员用户 (密码: admin123，使用BCrypt加密)
-- BCrypt密码格式: $2a$10$[22字符salt][31字符hash] 共60字符
-- ----------------------------
INSERT INTO `sys_user` (`username`, `password`, `email`, `nickname`, `gender`, `status`, `signature`) VALUES
('admin', '$2a$10$mG24UbDw0r5Mqm07TRRv/OGQ1fheETKYOt7IZbbMPy60c1PGLP2ze', 'admin@rawchen.com', '管理员', 1, 1, '我是系统管理员'),
('test', '$2a$10$mG24UbDw0r5Mqm07TRRv/OGQ1fheETKYOt7IZbbMPy60c1PGLP2ze', 'test@rawchen.com', '测试用户', 1, 1, '我是测试用户');

-- ----------------------------
-- 初始化用户角色关联
-- ----------------------------
INSERT INTO `sys_user_role` (`user_id`, `role_id`) VALUES
(1, 1),
(2, 2);

-- ----------------------------
-- 初始化分类数据
-- ----------------------------
INSERT INTO `blog_category` (`category_name`, `category_slug`, `description`, `parent_id`, `sort_order`, `icon`, `status`) VALUES
('技术笔记', 'tech', '技术相关文章', 0, 1, 'code', 1),
('生活随笔', 'life', '生活相关文章', 0, 2, 'heart', 1),
('项目实战', 'project', '项目实战案例', 0, 3, 'rocket', 1),
('学习笔记', 'study', '学习笔记整理', 0, 4, 'book', 1);

-- ----------------------------
-- 初始化标签数据
-- ----------------------------
INSERT INTO `blog_tag` (`tag_name`, `tag_slug`, `description`, `color`, `status`) VALUES
('Java', 'java', 'Java相关技术', '#f89820', 1),
('Spring Boot', 'spring-boot', 'Spring Boot框架', '#6db33f', 1),
('MySQL', 'mysql', 'MySQL数据库', '#4479a1', 1),
('React', 'react', 'React框架', '#61dafb', 1),
('Vue', 'vue', 'Vue框架', '#42b883', 1),
('Linux', 'linux', 'Linux系统', '#fcc624', 1),
('Docker', 'docker', 'Docker容器', '#2496ed', 1),
('Redis', 'redis', 'Redis缓存', '#dc382d', 1);

-- ----------------------------
-- 初始化系统配置
-- ----------------------------
INSERT INTO `sys_config` (`config_key`, `config_value`, `config_type`, `description`) VALUES
('site_name', 'RawChen Blog', 'basic', '网站名称'),
('site_description', '一个简洁优雅的个人博客', 'basic', '网站描述'),
('site_keywords', 'Java,Spring Boot,博客,技术分享', 'basic', '网站关键词'),
('site_url', 'https://rawchen.com', 'basic', '网站地址'),
('site_logo', '/logo.png', 'basic', '网站Logo'),
('site_favicon', '/favicon.ico', 'basic', '网站图标'),
('site_icp', '粤ICP备XXXXXXXX号', 'basic', 'ICP备案号'),
('comment_need_audit', 'true', 'comment', '评论是否需要审核'),
('comment_need_login', 'false', 'comment', '评论是否需要登录'),
('article_page_size', '10', 'display', '文章分页大小'),
('sidebar_show_category', 'true', 'display', '侧边栏是否显示分类'),
('sidebar_show_tag', 'true', 'display', '侧边栏是否显示标签'),
('sidebar_show_latest_article', 'true', 'display', '侧边栏是否显示最新文章');

-- ----------------------------
-- 初始化友链
-- ----------------------------
INSERT INTO `blog_friend_link` (`site_name`, `site_url`, `site_logo`, `description`, `sort_order`, `status`) VALUES
('RawChen', 'https://rawchen.com', 'https://cdn.rawchen.com/logo.png', 'RawChen个人博客', 1, 1),
('GitHub', 'https://github.com', 'https://github.githubassets.com/favicons/favicon.svg', '全球最大同性交友网站', 2, 1);
