# 博客系统前端 - React + Vite

## 项目说明

本项目整合了博客前台和管理后台，采用单页应用架构：
- **前台展示**：`/` 路径下的博客前台页面
- **后台管理**：`/admin/*` 路径下的管理系统

## 技术栈

- React 18.2.0
- Vite 5.0.8
- React Router 6.20.0
- Redux Toolkit 2.0.1
- Ant Design 5.12.0
- Axios 1.6.2
- Day.js 1.11.10

## 项目结构

```
front/
├── src/
│   ├── api/                    # API接口
│   │   ├── article.js          # 文章接口
│   │   ├── auth.js             # 认证接口
│   │   ├── category.js         # 分类接口
│   │   ├── tag.js              # 标签接口
│   │   ├── comment.js          # 评论接口
│   │   └── user.js             # 用户接口
│   ├── layouts/                # 布局组件
│   │   ├── WebLayout/          # 前台布局
│   │   └── AdminLayout/        # 后台布局
│   ├── pages/                  # 页面组件
│   │   ├── web/                # 前台页面
│   │   │   ├── Home/           # 首页
│   │   │   ├── Article/        # 文章详情
│   │   │   ├── Category/       # 分类页
│   │   │   ├── Tag/            # 标签页
│   │   │   └── Archive/        # 归档页
│   │   └── admin/              # 后台页面
│   │       ├── Login/          # 登录页
│   │       ├── Dashboard/      # 仪表盘
│   │       ├── article/        # 文章管理
│   │       ├── Category/       # 分类管理
│   │       ├── Tag/            # 标签管理
│   │       ├── Comment/        # 评论管理
│   │       └── User/           # 用户管理
│   ├── store/                  # Redux状态管理
│   │   ├── index.js
│   │   └── modules/
│   │       └── auth.js         # 认证状态
│   ├── utils/                  # 工具函数
│   │   └── request.js          # Axios封装
│   ├── App.jsx                 # 根组件
│   ├── main.jsx                # 入口文件
│   └── index.css               # 全局样式
├── index.html
├── package.json
└── vite.config.js
```

## 路由配置

### 前台路由
- `/` - 首页
- `/article/:id` - 文章详情
- `/category/:id` - 分类文章列表
- `/tag/:id` - 标签文章列表
- `/archive` - 文章归档

### 后台路由
- `/admin/login` - 登录页
- `/admin/dashboard` - 仪表盘
- `/admin/article/list` - 文章列表
- `/admin/article/add` - 新增文章
- `/admin/article/edit/:id` - 编辑文章
- `/admin/category` - 分类管理
- `/admin/tag` - 标签管理
- `/admin/comment` - 评论管理
- `/admin/user` - 用户管理

## 快速开始

### 安装依赖
```bash
pnpm install
```

### 开发环境运行
```bash
pnpm run dev
```
访问 http://localhost:3000

### 生产构建
```bash
pnpm run build
```

## 功能特性

### 前台功能
- ✅ 文章列表展示（卡片式布局）
- ✅ 文章详情（Markdown渲染）
- ✅ 分类筛选
- ✅ 标签筛选
- ✅ 文章归档（按年月分组）
- ✅ 文章浏览量统计
- ✅ 上下篇导航
- ✅ 响应式设计

### 后台功能
- ✅ 用户登录/退出
- ✅ 仪表盘数据统计
- ✅ 文章管理（增删改查、发布/草稿）
- ✅ 分类管理
- ✅ 标签管理
- ✅ 评论审核管理
- ✅ 用户状态管理、密码重置
- ✅ 权限路由守卫

## 默认账号

- 管理员：admin / admin123
- 普通用户：rawchen / admin123

## API代理配置

开发环境下，API请求会自动代理到 `http://localhost:9999`

```javascript
// vite.config.js
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://localhost:9999',
      changeOrigin: true
    }
  }
}
```
