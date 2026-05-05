# API接口文档

## 基础信息

- 基础路径: `/api`
- 认证方式: JWT Bearer Token
- 返回格式: JSON

## 统一返回格式

### 成功响应

```json
{
  "code": 200,
  "message": "success",
  "data": {},
  "timestamp": 1712345678901
}
```

### 失败响应

```json
{
  "code": 500,
  "message": "错误信息",
  "data": null,
  "timestamp": 1712345678901
}
```

### 分页响应

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "records": [],
    "total": 100,
    "current": 1,
    "size": 10,
    "pages": 10
  },
  "timestamp": 1712345678901
}
```

## 认证接口

### 1. 用户登录

**接口地址**: `POST /auth/login`

**请求参数**:
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "accessToken": "eyJhbGciOiJIUzUxMiJ9...",
    "refreshToken": "eyJhbGciOiJIUzUxMiJ9...",
    "tokenType": "Bearer",
    "expiresIn": 7200,
    "userInfo": {
      "id": 1,
      "username": "admin",
      "nickname": "管理员",
      "email": "admin@rawchen.com"
    },
    "permissions": ["system:user:query", "content:article:add"],
    "roles": ["ROLE_ADMIN"]
  }
}
```

### 2. 刷新Token

**接口地址**: `POST /auth/refresh`

**请求参数**:
```
refreshToken: string
```

**响应示例**: 同登录接口

### 3. 获取当前用户信息

**接口地址**: `GET /auth/info`

**请求头**:
```
Authorization: Bearer {token}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "username": "admin",
    "nickname": "管理员",
    "email": "admin@rawchen.com",
    "avatar": null,
    "status": 1
  }
}
```

### 4. 退出登录

**接口地址**: `POST /auth/logout`

**请求头**:
```
Authorization: Bearer {token}
```

## 文章接口

### 1. 获取文章列表（前台）

**接口地址**: `GET /article/list`

**请求参数**:
- `current`: 当前页，默认1
- `size`: 每页大小，默认10
- `categoryId`: 分类ID（可选）
- `tagId`: 标签ID（可选）
- `keyword`: 搜索关键词（可选）

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "records": [
      {
        "id": 1,
        "title": "文章标题",
        "summary": "文章摘要",
        "coverImage": "https://example.com/cover.jpg",
        "categoryId": 1,
        "categoryName": "技术笔记",
        "authorId": 1,
        "authorName": "RawChen",
        "viewCount": 100,
        "likeCount": 10,
        "commentCount": 5,
        "isTop": 0,
        "isRecommend": 1,
        "publishTime": "2026-04-05 12:00:00",
        "tags": [
          {
            "id": 1,
            "tagName": "Java",
            "color": "#f89820"
          }
        ]
      }
    ],
    "total": 100,
    "current": 1,
    "size": 10,
    "pages": 10
  }
}
```

### 2. 获取文章详情

**接口地址**: `GET /article/detail/{id}`

**路径参数**:
- `id`: 文章ID

**请求参数**:
- `password`: 访问密码（可选）

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "title": "文章标题",
    "content": "# 文章内容...",
    "contentHtml": "<h1>文章内容...</h1>",
    "summary": "文章摘要",
    "categoryId": 1,
    "categoryName": "技术笔记",
    "authorId": 1,
    "authorName": "RawChen",
    "viewCount": 100,
    "likeCount": 10,
    "commentCount": 5,
    "publishTime": "2026-04-05 12:00:00",
    "prevArticle": {
      "id": 2,
      "title": "上一篇文章"
    },
    "nextArticle": {
      "id": 3,
      "title": "下一篇文章"
    }
  }
}
```

### 3. 创建文章（后台）

**接口地址**: `POST /article/admin`

**权限**: `content:article:add`

**请求头**:
```
Authorization: Bearer {token}
```

**请求参数**:
```json
{
  "title": "文章标题",
  "summary": "文章摘要",
  "content": "# 文章内容",
  "coverImage": "https://example.com/cover.jpg",
  "categoryId": 1,
  "tagIds": [1, 2, 3],
  "isTop": 0,
  "isRecommend": 1,
  "status": 1,
  "password": "",
  "allowComment": 1
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": 1
}
```

### 4. 更新文章（后台）

**接口地址**: `PUT /article/admin`

**权限**: `content:article:edit`

**请求参数**: 同创建文章，需包含id字段

### 5. 删除文章（后台）

**接口地址**: `DELETE /article/admin/{id}`

**权限**: `content:article:delete`

### 6. 增加浏览量

**接口地址**: `POST /article/view/{id}`

### 7. 点赞文章

**接口地址**: `POST /article/like/{id}`

## 分类接口

### 1. 获取分类列表

**接口地址**: `GET /category/list`

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "categoryName": "技术笔记",
      "categorySlug": "tech",
      "description": "技术相关文章",
      "articleCount": 50
    }
  ]
}
```

## 标签接口

### 1. 获取标签列表

**接口地址**: `GET /tag/list`

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "tagName": "Java",
      "tagSlug": "java",
      "color": "#f89820",
      "articleCount": 30
    }
  ]
}
```

## 评论接口

### 1. 获取评论列表

**接口地址**: `GET /comment/list/{articleId}`

**请求参数**:
- `current`: 当前页，默认1
- `size`: 每页大小，默认10

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "records": [
      {
        "id": 1,
        "articleId": 1,
        "parentId": 0,
        "nickname": "张三",
        "avatar": "https://example.com/avatar.jpg",
        "content": "评论内容",
        "likeCount": 5,
        "createTime": "2026-04-05 12:00:00",
        "children": []
      }
    ],
    "total": 10
  }
}
```

### 2. 提交评论

**接口地址**: `POST /comment/submit`

**请求参数**:
```json
{
  "articleId": 1,
  "parentId": 0,
  "replyUserId": null,
  "nickname": "张三",
  "email": "zhangsan@example.com",
  "website": "https://example.com",
  "content": "评论内容"
}
```

### 3. 审核评论（后台）

**接口地址**: `PUT /comment/admin/audit/{id}`

**权限**: `content:comment:audit`

**请求参数**:
- `status`: 状态（0-待审核 1-已发布 2-垃圾评论）

## 用户接口

### 1. 获取用户列表（后台）

**接口地址**: `GET /user/admin/list`

**权限**: `system:user:query`

**请求参数**:
- `current`: 当前页
- `size`: 每页大小
- `keyword`: 搜索关键词

### 2. 更新用户状态（后台）

**接口地址**: `PUT /user/admin/status/{id}`

**权限**: `system:user:edit`

**请求参数**:
- `status`: 状态（0-禁用 1-正常）

### 3. 重置用户密码（后台）

**接口地址**: `PUT /user/admin/reset-password/{id}`

**权限**: `system:user:edit`

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| 200 | 操作成功 |
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 403 | 无权限访问 |
| 404 | 资源不存在 |
| 422 | 参数验证失败 |
| 500 | 服务器内部错误 |
| 1001 | 用户不存在 |
| 1002 | 密码错误 |
| 1003 | 用户已被禁用 |
| 1004 | 用户已存在 |
| 1005 | 邮箱已被注册 |
| 1101 | Token无效 |
| 1102 | Token已过期 |
| 1103 | RefreshToken无效 |
| 1201 | 文章不存在 |
| 1202 | 分类不存在 |
| 1203 | 标签不存在 |
| 1204 | 评论不存在 |
| 1301 | 权限不足 |
| 1302 | 角色不存在 |
