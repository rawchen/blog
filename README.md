# 博客系统 - Spring Boot + React 前后端分离项目

一个基于 Spring Boot 和 React 的现代化个人博客系统，采用前后端分离架构，支持类似 Typecho 的独立页面模板化，支持基于角色的权限管理。

## 📋 项目简介

本项目是从原有的 Typecho PHP 博客系统重构而来的完整前后端分离博客系统，保留了原有大部分功能的同时，采用了更现代的技术栈和架构设计，可使用内置Typecho迁移工具一键迁移文章及独立页、评论、标签、分类。

### ✨ 主要特性

- 🎨 **现代化UI**：前台采用简洁优雅的设计，后台使用 Ant Design Pro 风格
- 📝 **Markdown支持**：文章支持 Markdown 格式，代码高亮显示
- 📄 **独立页面模板**：支持类似 Typecho 的独立页面模板化，可自定义页面模板
- 💬 **评论系统**：支持评论回复、审核、点赞等功能
- 🔍 **全文搜索**：支持文章标题、内容、标签搜索
- 📱 **响应式设计**：完美适配PC端和移动端
- 🔐 **权限系统**：基于角色的权限管理，支持 ADMIN、STAFF、VISITOR 三种角色
- 🚀 **JWT认证**：使用 JWT 实现无状态认证
- 📊 **API文档**：使用 Knife4j 自动生成 API 接口文档
- 🤖 **AI摘要**：集成 DeepSeek AI 自动生成文章摘要
- 📡 **RSS订阅**：支持 RSS 订阅和 SiteMap 站点地图
- 🌐 **朋友圈**：支持发布动态，可从 RSS 订阅拉取
- 🎵 **网易云音乐集成**：支持展示网易云音乐歌单和歌曲
- 😀 **B站表情包集成**：支持在评论中使用B站表情包
- ⚙️ **自定义任务系统**：可扩展定制开发的定时任务系统
- 🚀 **轻量部署**：依赖组件少，无需Redis，仅需MySQL，脚本一键部署线上服务器

## 🛠 技术栈

### 后端技术

| 技术 | 版本 | 说明 |
|------|------|------|
| JDK | 1.8+ | Java开发环境 |
| Spring Boot | 2.7.18 | 应用框架 |
| MyBatis-Plus | 3.5.3.1 | ORM框架 |
| MySQL | 5.7+ | 数据库 |
| Spring Security | - | 安全框架 |
| JWT | 0.11.5 | Token认证 |
| Knife4j | 3.0.3 | API文档工具 |
| Lombok | - | 简化代码 |
| Hutool | 5.8.18 | 工具库 |

### 前端技术

| 技术 | 版本 | 说明 |
|------|------|------|
| React | 18.2.0 | 前端框架 |
| Vite | 5.0.8 | 构建工具 |
| React Router | 6.20.0 | 路由管理 |
| Redux Toolkit | 2.0.1 | 状态管理 |
| Ant Design | 5.12.0 | UI组件库(后台) |
| Axios | 1.6.2 | HTTP客户端 |
| Day.js | 1.11.10 | 日期处理 |

## 📁 项目结构

```
blog/
│   # 前端
├── front/          
│   ├── src/
│   │   ├── api/         # API接口
│   │   ├── components/  # 公共组件
│   │   ├── pages/       # 页面组件
│   │   ├── router/      # 路由配置
│   │   ├── store/       # Redux状态管理
│   │   └── utils/       # 工具函数
│   ├── package.json
│   └── vite.config.js
│
│   # 后端
├── src/main/java/com/rawchen/blog/
│   ├── config/      # 配置类
│   ├── controller/  # 控制器层
│   ├── entity/      # 实体类
│   ├── dto/         # 数据传输对象
│   ├── vo/          # 视图对象
│   ├── mapper/      # Mapper接口
│   ├── service/     # 服务层
│   ├── common/      # 公共类
│   ├── exception/   # 异常处理
│   └── security/    # 安全相关
├── pom.xml
│
├── sql/                 # 数据库脚本
│   ├── schema.sql       # 表结构
│   └── data.sql         # 初始数据
│
└── docs/                # 文档
    └── API文档.md
```

## 🚀 快速开始

### 环境要求

- JDK 1.8+
- Node.js 16+
- MySQL 5.7+
- Maven 3.6+

### 安装步骤

#### 1. 克隆项目

```bash
git clone https://github.com/rawchen/blog.git
```

#### 2. 导入数据库

```bash
# 创建数据库
CREATE DATABASE blog DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

# 导入表结构和初始数据
mysql -u root -p blog < sql/schema.sql
mysql -u root -p blog < sql/data.sql
```

#### 3. 配置后端

修改 `blog/src/main/resources/application-dev.yml`:

```yaml
spring:
  datasource:
    url: jdbc:mysql://127.0.0.1:3306/blog?useUnicode=true&characterEncoding=utf8&useSSL=false&serverTimezone=Asia/Shanghai
    username: root
    password: your_password
```

#### 4. 启动后端

```bash
cd blog
mvn clean install
mvn spring-boot:run
```

后端启动成功后，访问：
- API文档: http://localhost:9999/doc.html

#### 5. 启动前端

**前台展示 & 后台管理：**

```bash
cd front
pnpm i
pnpm run dev
```

- 博客: http://localhost:3000
- 管理: http://localhost:3000/admin

## 📝 默认账号

- 管理员账号: `admin`
- 管理员密码: `admin123`

## 💽 一键部署（服务器）
```bash
./remote_deploy.sh
```

## 📚 核心功能

### 后台管理

- ✅ 仪表盘数据统计
- ✅ 文章管理（增删改查、发布、草稿、版本历史）
- ✅ 独立页面管理
- ✅ 分类管理
- ✅ 标签管理
- ✅ 评论管理（审核、删除）
- ✅ 朋友圈管理（发布、RSS拉取）
- ✅ 友链管理
- ✅ 站点配置管理

### 前台展示

- ✅ 文章列表（分页、分类筛选）
- ✅ 文章详情（Markdown渲染、代码高亮）
- ✅ 文章搜索
- ✅ 分类/标签归档
- ✅ 评论功能
- ✅ 文章点赞、浏览量统计

## 🔒 权限说明

系统采用基于角色的访问控制：

### 角色说明

1. **ADMIN**：超级管理员，拥有所有权限，可进行文章、配置等管理操作
2. **STAFF**：工作人员，可访问后台管理界面，拥有部分管理权限
3. **VISITOR**：访客角色，可访问后台但权限有限

## 状态规则
| 状态 | 列表可见 | Feed可见 | 直接访问URL | 详情内容 |
|-----|---------|---------|------------|---------|
| 0-待审 | ❌ | ❌ | ❌ 404 | - |
| 1-发布 | ✅ | ✅ | ✅ | 完整内容 |
| 2-加密 | ✅ | ✅ 提示 | ✅ | 需密码 |
| 3-隐藏 | ❌ | ❌ | ✅ | 完整内容 |
| 4-私密 | ❌ | ❌ | ❌ 404 | - |

## 📖 API文档

启动后端后，访问 http://localhost:9999/doc.html 查看完整的API文档。

### 主要接口

#### 认证相关

- `POST /api/auth/login` - 用户登录
- `GET /api/auth/info` - 获取当前用户信息
- `POST /api/auth/logout` - 退出登录
- `PUT /api/auth/password` - 修改密码
- `PUT /api/auth/profile` - 更新个人资料

#### 文章相关

- `POST /api/article/article-list` - 获取文章列表（前台）
- `GET /api/article/detail/{id}` - 获取文章详情
- `GET /api/article/slug/{slug}` - 根据别名获取文章
- `GET /api/article/timeline` - 时间线归档
- `GET /api/article/archive` - 归档列表
- `GET /api/article/random` - 随机文章
- `GET /api/article/recommend` - 推荐文章
- `POST /api/article/latest-article` - 最新文章
- `GET /api/article/admin/list` - 获取文章列表（后台）
- `POST /api/article/admin` - 创建文章
- `PUT /api/article/admin` - 更新文章
- `DELETE /api/article/admin/{id}` - 删除文章
- `POST /api/article/admin/ai/summary` - AI生成文章摘要

#### 独立页面

- `GET /api/article/pages` - 获取独立页面列表
- `GET /api/article/page/{slug}` - 获取独立页面详情
- `POST /api/article/admin/pages` - 创建独立页面

#### 分类标签

- `GET /api/category/category-list` - 获取分类列表
- `GET /api/tag/list` - 获取标签列表

#### 评论相关

- `GET /api/comment/list/{articleId}` - 获取评论列表
- `POST /api/comment/submit` - 提交评论
- `POST /api/comment/like/{id}` - 点赞评论
- `PUT /api/comment/admin/audit/{id}` - 审核评论

#### 朋友圈

- `GET /api/moment/list` - 获取朋友圈列表（前台）
- `POST /api/moment/admin` - 添加动态
- `POST /api/moment/admin/fetch` - 从RSS订阅拉取

#### RSS & SiteMap

- `GET /feed` - RSS订阅
- `GET /sitemap.xml` - 站点地图

#### 配置相关

- `GET /api/config/site-config` - 获取站点配置（公开）
- `GET /api/config/all` - 获取所有配置（后台）
- `PUT /api/config/batch` - 批量更新配置

## 🔧 配置说明

### JWT配置

```yaml
jwt:
  secret: rawchen-blog-jwt-secret-key-2026-very-long-secret-key-for-security
  expiration: 2592000000   # Access Token过期时间（毫秒），默认1个月
  token-prefix: Bearer
  header: Authorization
```

### 邮箱配置

```yaml
spring:
  mail:
    host: smtp.qq.com
    port: 587
    username: your_email@qq.com
    password: your_auth_code
    from: your_email@qq.com
```

### IP数据库配置

```yaml
ip2region:
  xdb: file:./data/ip2region_v4.xdb
```

### OSS配置

```yaml
aliyun:
  oss:
    access-key-id: xxx
    access-key-secret: xxx
    role-arn: acs:ram::xxx:role/xxx
    endpoint: oss-cn-xxx.aliyuncs.com
    bucket-name: xxx
    custom-domain: 
    sts-expiration: 3600
    upload-folder: blog
```

### DeepSeek AI配置

```yaml
deepseek:
  api-key: sk-xxx
  base-url: https://api.deepseek.com
  chat-model: deepseek-chat
```

### 跨域配置

系统已配置允许所有域名跨域访问，生产环境请根据实际情况修改 `CorsConfig.java`。

## 📄 License

MIT License

## 🙏 致谢

感谢以下开源项目：

- [Spring Boot](https://spring.io/projects/spring-boot)
- [React](https://react.dev/)
- [Ant Design](https://ant.design/)
- [MyBatis-Plus](https://baomidou.com/)
