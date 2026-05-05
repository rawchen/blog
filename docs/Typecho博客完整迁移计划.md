# Typecho博客完整迁移计划

## 项目概述
将PHP Typecho博客系统完整迁移到React前端 + Spring Boot后端架构，实现数据库兼容、功能对等、UI一致。

---

## 一、数据库增强 (兼容Typecho数据结构)

### 1.1 新增表结构
- [x] `blog_article_field` - 文章自定义字段表 (对应Typecho fields)
- [x] `blog_site_stat` - 站点统计表
- [x] `blog_moment` - 朋友圈订阅表 (freshrss功能)
- [ ] `blog_article_draft` - 草稿自动保存表 (可选)
- [x] `blog_article_version` - 文章版本历史表
- [x] `blog_operation_log` - 操作日志表

详细SQL请查看 `sql/migration.sql`

### 1.2 修改现有表
- [x] `blog_article` 添加 slug 字段 (文章别名)
- [x] `blog_comment` 添加 agent/os/browser 字段

---

## 二、后端API开发任务清单

### 2.1 文章模块 ArticleController
- [x] GET `/api/article/list` - 文章列表(分页、分类、标签筛选)
- [x] GET `/api/article/{id}` - 文章详情(含上一篇下一篇)
- [x] GET `/api/article/slug/{slug}` - 根据别名获取文章
- [x] POST `/api/article` - 创建文章(支持Markdown转HTML)
- [x] PUT `/api/article/{id}` - 更新文章
- [x] DELETE `/api/article/{id}` - 删除文章(软删除)
- [x] POST `/api/article/{id}/view` - 增加浏览量
- [x] POST `/api/article/{id}/like` - 点赞
- [x] GET `/api/article/search` - 搜索文章
- [x] GET `/api/article/timeline` - 时间线归档
- [x] GET `/api/article/random` - 随机文章
- [x] GET `/api/article/recommend` - 推荐文章
- [x] GET `/api/article/{id}/related` - 相关文章(根据标签)
- [x] POST `/api/article/draft` - 保存草稿
- [x] GET `/api/article/{id}/versions` - 文章版本历史

### 2.2 分类模块 CategoryController
- [x] GET `/api/category/list` - 分类列表
- [x] GET `/api/category/tree` - 分类树形结构
- [x] GET `/api/category/{id}` - 分类详情
- [x] GET `/api/category/{id}/articles` - 分类下的文章
- [x] POST `/api/category` - 创建分类
- [x] PUT `/api/category/{id}` - 更新分类
- [x] DELETE `/api/category/{id}` - 删除分类

### 2.3 标签模块 TagController
- [x] GET `/api/tag/list` - 标签列表
- [x] GET `/api/tag/{id}` - 标签详情
- [x] GET `/api/tag/{id}/articles` - 标签下的文章
- [x] GET `/api/tag/cloud` - 标签云
- [x] POST `/api/tag` - 创建标签
- [x] PUT `/api/tag/{id}` - 更新标签
- [x] DELETE `/api/tag/{id}` - 删除标签

### 2.4 评论模块 CommentController
- [x] GET `/api/comment/list` - 评论列表(管理后台)
- [x] GET `/api/comment/article/{articleId}` - 文章评论(树形结构)
- [x] POST `/api/comment` - 发表评论(支持游客)
- [x] POST `/api/comment/{id}/reply` - 回复评论
- [x] PUT `/api/comment/{id}/audit` - 审核评论
- [x] DELETE `/api/comment/{id}` - 删除评论
- [x] POST `/api/comment/{id}/like` - 点赞评论
- [x] GET `/api/comment/recent` - 最近评论

### 2.5 统计模块 StatController
- [x] GET `/api/stat/site` - 站点统计(文章数、评论数、浏览量等)
- [x] GET `/api/stat/trend` - 访问趋势(按天统计)
- [x] POST `/api/stat/pv` - 记录PV
- [x] GET `/api/stat/hot-articles` - 热门文章
- [x] GET `/api/stat/hot-tags` - 热门标签

### 2.6 友链模块 FriendLinkController
- [x] GET `/api/friend-link/list` - 友链列表
- [x] POST `/api/friend-link` - 添加友链
- [x] PUT `/api/friend-link/{id}` - 更新友链
- [x] DELETE `/api/friend-link/{id}` - 删除友链

### 2.7 配置模块 ConfigController
- [x] GET `/api/config/site` - 站点配置(公开)
- [x] GET `/api/config/all` - 所有配置(管理后台)
- [x] PUT `/api/config` - 更新配置
- [x] POST `/api/config/upload-logo` - 上传Logo
- [x] POST `/api/config/upload-favicon` - 上传Favicon

### 2.8 朋友圈模块 MomentController (freshrss)
- [x] GET `/api/moment/list` - 朋友圈列表(分页)
- [x] POST `/api/moment` - 添加动态
- [x] POST `/api/moment/fetch` - 从RSS订阅拉取
- [x] DELETE `/api/moment/{id}` - 删除动态

### 2.9 文件上传模块 UploadController
- [x] POST `/api/upload/image` - 上传图片
- [x] POST `/api/upload/file` - 上传文件
- [x] DELETE `/api/upload/{filename}` - 删除文件

### 2.10 用户认证模块 AuthController
- [x] POST `/api/auth/login` - 登录
- [x] POST `/api/auth/logout` - 登出
- [x] POST `/api/auth/refresh` - 刷新Token
- [x] GET `/api/auth/info` - 当前用户信息
- [x] PUT `/api/auth/profile` - 更新个人信息
- [x] PUT `/api/auth/password` - 修改密码

### 2.11 RSS和SiteMap模块 FeedController
- [x] GET `/feed` - RSS订阅
- [x] GET `/sitemap.xml` - SiteMap

---

## 三、前端组件迁移任务

### 3.1 公共布局组件
- [x] WebLayout - 主布局(header + content + footer)
- [x] Header组件 - 导航栏(支持分类下拉菜单)
- [x] Footer组件 - 页脚(社交链接、最新文章、最近评论)
- [ ] Sidebar组件 - 侧边栏(个人简介、分类、标签云)
- [x] BackTop组件 - 返回顶部按钮
- [x] TableOfContents组件 - 文章目录(右侧固定)

### 3.2 首页模块 (index.php)
- [x] Home页面 - 单栏/三栏文章列表切换
- [x] Hero区域 - 站点标题、描述、社交链接
- [x] ArticleCard组件 - 文章卡片(封面、标题、摘要、分类)
- [x] Pagination组件 - 分页导航

### 3.3 文章详情模块 (post.php)
- [x] ArticleDetail页面
- [x] PostHeader组件 - 文章题图区域
- [x] PostMeta组件 - 文章元信息(时间、分类、标签)
- [x] PostContent组件 - 文章内容(Markdown渲染)
- [x] PostTags组件 - 文章标签(彩色标签)
- [x] PostNav组件 - 上一篇/下一篇导航
- [x] RelatedPosts组件 - 相关文章列表
- [x] PostShare组件 - 底部分享栏

### 3.4 评论模块 (comments.php)
- [x] CommentList组件 - 评论列表(树形结构)
- [x] CommentItem组件 - 单条评论(头像、昵称、内容、时间、UA)
- [x] CommentForm组件 - 评论表单(昵称、邮箱、网址、内容)
- [x] CommentReply组件 - 回复功能

### 3.5 归档模块 (archive.php, page-timeline.php)
- [x] Archive页面 - 文章归档
- [x] Timeline页面 - 时间线归档(按年月分组)
- [x] CategoryPage页面 - 分类归档(page-category.php)
- [ ] StatsCard组件 - 统计卡片

### 3.6 搜索模块 (page-search.php)
- [x] SearchPage页面 - 搜索页
- [ ] SearchBox组件 - 搜索框
- [x] TagCloud组件 - 标签云

### 3.7 友链模块 (friends.php)
- [x] FriendsPage页面 - 友链页面
- [ ] FriendLinkCard组件 - 友链卡片

### 3.8 朋友圈模块 (freshrss.php)
- [x] MomentsPage页面 - 朋友圈页面
- [ ] MomentCard组件 - 动态卡片

### 3.9 404页面 (404.php)
- [x] NotFoundPage页面 - 404页面

---

## 四、Markdown渲染功能

### 4.1 后端渲染 (Java)
```xml
<!-- 依赖 -->
<dependency>
    <groupId>com.vladsch.flexmark</groupId>
    <artifactId>flexmark-all</artifactId>
    <version>0.64.8</version>
</dependency>
```

功能要求:
- [x] Markdown转HTML
- [x] 代码高亮(支持22种语言)
- [ ] 数学公式(MathJax)
- [x] 表格支持
- [x] 任务列表
- [ ] 图片懒加载
- [x] 外链自动添加target="_blank"

### 4.2 前端渲染 (React)
```bash
npm install react-markdown remark-gfm rehype-highlight rehype-katex
```

功能要求:
- [ ] 实时预览编辑器
- [x] 代码高亮(highlight.js)
- [ ] 数学公式(KaTeX)
- [ ] 图片点击放大
- [x] 目录自动生成

---

## 五、后台管理模块增强

### 5.1 仪表盘 Dashboard
- [ ] 站点概览(文章数、评论数、访问量)
- [ ] 访问趋势图表
- [ ] 最新评论
- [ ] 系统信息

### 5.2 文章管理
- [ ] 文章列表(搜索、筛选、批量操作)
- [ ] 文章编辑器(Markdown实时预览)
- [ ] 文章设置(分类、标签、封面、摘要)
- [ ] 文章字段管理(thumb, color, icon等)
- [ ] 草稿自动保存
- [ ] 版本历史回滚

### 5.3 分类管理
- [ ] 分类树形列表
- [ ] 拖拽排序
- [ ] 分类图标设置

### 5.4 标签管理
- [ ] 标签列表
- [ ] 标签颜色设置
- [ ] 合并标签

### 5.5 评论管理
- [ ] 评论列表
- [ ] 评论审核
- [ ] 垃圾评论过滤
- [ ] 批量删除

### 5.6 友链管理
- [ ] 友链列表
- [ ] 友链检测(自动检测网站是否可访问)

### 5.7 系统设置
- [ ] 基本设置(站点名称、描述、关键词)
- [ ] 显示设置(文章列表模式、侧边栏设置)
- [ ] 评论设置(是否需要审核、是否需要登录)
- [ ] 社交链接设置
- [ ] 图片CDN设置
- [ ] 代码高亮设置
- [ ] MathJax设置

### 5.8 用户管理
- [ ] 用户列表
- [ ] 角色权限管理

---

## 六、Typecho兼容性处理

### 6.1 数据迁移工具
- [ ] Typecho数据库导入脚本
- [ ] 文章内容转换(Markdown格式)
- [ ] 评论数据迁移
- [ ] 分类标签迁移

### 6.2 URL兼容
- [x] `/archives/{cid}` -> `/article/{id}`
- [x] `/category/{slug}` -> `/category/{id}`
- [x] `/tag/{slug}` -> `/tag/{id}`

### 6.3 API兼容
- [x] RSS订阅接口 `/feed`
- [x] SiteMap生成

---

## 七、执行优先级

### P0 - 核心功能 (第一周)
1. 完善数据库结构
2. 文章CRUD完整API
3. Markdown渲染(后端+前端)
4. 评论功能
5. 分类标签管理

### P1 - 重要功能 (第二周)
1. 搜索功能
2. 归档功能
3. 后台文章编辑器增强
4. 系统配置管理
5. 统计功能

### P2 - 增强功能 (第三周)
1. 朋友圈模块
2. 友链模块
3. 文章目录
4. 相关文章推荐
5. 版本历史

### P3 - 优化完善 (第四周)
1. 性能优化
2. SEO优化
3. 移动端适配优化
4. 缓存策略
5. 部署文档

---

## 八、技术栈确认

### 后端
- Java 8
- Spring Boot 2.x
- MyBatis-Plus
- MySQL 5.7+
- Redis (缓存)
- JWT认证

### 前端
- React 18
- React Router 6
- Axios
- highlight.js (代码高亮)
- KaTeX (数学公式)
- react-markdown (Markdown渲染)

### 管理后台
- Ant Design Pro
- Monaco Editor / CodeMirror (代码编辑器)
- ECharts (图表)

---

## 九、文件资源迁移

### 需要复制的资源
- [ ] `/php/font/` -> `/front/public/font/`
- [ ] `/php/images/` -> `/front/public/images/`
- [ ] `/php/css/top-style.css` -> 整合到组件CSS
- [ ] Font Awesome 4.7.0 -> `/front/public/fontawesome/`
