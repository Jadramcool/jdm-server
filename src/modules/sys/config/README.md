# 系统配置模块 API 文档

## 概述

系统配置模块提供了完整的配置管理功能，支持多种配置类型、分类管理、安全控制和缓存机制。所有接口都遵循统一的 Jres 响应格式。

## 接口列表

### 1. 获取配置列表

**接口路径**: `GET /system/config/list`

**功能描述**: 获取系统配置列表，支持分页、过滤和搜索

**权限要求**: 需要 JWT 认证

**查询参数**:

- `category` (string, 可选): 配置分类 (SYSTEM, EMAIL, UPLOAD, SECURITY, CUSTOM)
- `type` (string, 可选): 配置类型 (STRING, NUMBER, BOOLEAN, JSON, ARRAY, FILE, EMAIL, URL, PASSWORD)
- `keyword` (string, 可选): 搜索关键词
- `isSystem` (boolean, 可选): 是否为系统配置
- `isPublic` (boolean, 可选): 是否为公开配置
- `page` (number, 可选): 页码，默认 1
- `pageSize` (number, 可选): 每页数量，默认 10
- `createdTime` (array, 可选): 创建时间范围
- `updatedTime` (array, 可选): 更新时间范围

**响应格式**:

```json
{
  "code": 200,
  "message": "获取配置列表成功",
  "data": {
    "data": [
      {
        "id": 1,
        "key": "system.siteName",
        "name": "网站名称",
        "value": "我的网站",
        "type": "STRING",
        "category": "SYSTEM",
        "description": "网站的显示名称",
        "isSystem": false,
        "isPublic": true,
        "sortOrder": 0,
        "createdTime": "2024-01-01T00:00:00.000Z",
        "updatedTime": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "totalRecords": 100,
      "totalPages": 10
    }
  },
  "errMsg": ""
}
```

### 2. 获取公开配置

**接口路径**: `GET /system/config/public`

**功能描述**: 获取所有公开的系统配置，无需认证，主要用于前端获取公开设置

**权限要求**: 无需认证

**响应格式**:

```json
{
  "code": 200,
  "message": "获取公开配置成功",
  "data": {
    "system.siteName": "我的网站",
    "system.siteDescription": "网站描述",
    "upload.maxFileSize": 10485760
  },
  "errMsg": ""
}
```

### 3. 根据 ID 获取配置

**接口路径**: `GET /system/config/detail/{id}`

**功能描述**: 根据配置 ID 获取单个配置的详细信息

**权限要求**: 需要 JWT 认证

**路径参数**:

- `id` (number, 必需): 配置 ID

**响应格式**:

```json
{
  "code": 200,
  "message": "获取配置成功",
  "data": {
    "id": 1,
    "key": "system.siteName",
    "name": "网站名称",
    "value": "我的网站",
    "type": "STRING",
    "category": "SYSTEM",
    "description": "网站的显示名称",
    "isSystem": false,
    "isPublic": true,
    "sortOrder": 0,
    "createdTime": "2024-01-01T00:00:00.000Z",
    "updatedTime": "2024-01-01T00:00:00.000Z"
  },
  "errMsg": ""
}
```

### 4. 根据键名获取配置值

**接口路径**: `GET /system/config/key/{key}`

**功能描述**: 根据配置键名获取配置值，返回解析后的实际值

**权限要求**: 需要 JWT 认证

**路径参数**:

- `key` (string, 必需): 配置键名，如 "system.siteName"

**响应格式**:

```json
{
  "code": 200,
  "message": "获取配置值成功",
  "data": "我的网站",
  "errMsg": ""
}
```

### 5. 创建新配置

**接口路径**: `POST /system/config/create`

**功能描述**: 创建新的系统配置项

**权限要求**: 需要 JWT 认证

**请求体**:

```json
{
  "key": "custom.newConfig",
  "name": "新配置",
  "value": "配置值",
  "type": "STRING",
  "category": "CUSTOM",
  "description": "配置描述",
  "isSystem": false,
  "isPublic": false,
  "sortOrder": 0
}
```

**字段说明**:

- `key` (string, 必需): 配置键名，必须唯一
- `name` (string, 可选): 配置显示名称
- `value` (any, 可选): 配置值
- `type` (string, 必需): 配置类型
- `category` (string, 可选): 配置分类，默认 SYSTEM
- `description` (string, 可选): 配置描述
- `isSystem` (boolean, 可选): 是否为系统配置，默认 false
- `isPublic` (boolean, 可选): 是否为公开配置，默认 false
- `sortOrder` (number, 可选): 排序顺序，默认 0

**响应格式**:

```json
{
  "code": 200,
  "message": "创建配置成功",
  "data": {
    "id": 10,
    "key": "custom.newConfig",
    "name": "新配置",
    "value": "配置值",
    "type": "STRING",
    "category": "CUSTOM",
    "description": "配置描述",
    "isSystem": false,
    "isPublic": false,
    "sortOrder": 0,
    "createdTime": "2024-01-01T00:00:00.000Z",
    "updatedTime": "2024-01-01T00:00:00.000Z"
  },
  "errMsg": ""
}
```

### 6. 更新配置

**接口路径**: `PUT /system/config/update`

**功能描述**: 更新现有的配置项

**权限要求**: 需要 JWT 认证

**请求体**:

```json
{
  "id": 1,
  "key": "system.siteName",
  "name": "网站名称",
  "value": "新的网站名称",
  "type": "STRING",
  "category": "SYSTEM",
  "description": "更新后的描述",
  "isSystem": false,
  "isPublic": true,
  "sortOrder": 0
}
```

**字段说明**:

- `id` (number, 必需): 配置 ID
- 其他字段与创建接口相同，均为可选

**响应格式**:

```json
{
  "code": 200,
  "message": "配置更新成功",
  "data": {
    "id": 1,
    "key": "system.siteName",
    "name": "网站名称",
    "value": "新的网站名称",
    "type": "STRING",
    "category": "SYSTEM",
    "description": "更新后的描述",
    "isSystem": false,
    "isPublic": true,
    "sortOrder": 0,
    "createdTime": "2024-01-01T00:00:00.000Z",
    "updatedTime": "2024-01-01T12:00:00.000Z"
  },
  "errMsg": ""
}
```

### 7. 批量更新配置

**接口路径**: `PUT /system/config/batch-update`

**功能描述**: 批量更新多个配置项，支持部分成功的情况

**权限要求**: 需要 JWT 认证

**请求体**:

```json
{
  "configs": [
    {
      "id": 1,
      "value": "新值1"
    },
    {
      "id": 2,
      "value": "新值2"
    }
  ]
}
```

**响应格式**:

```json
{
  "code": 200,
  "message": "批量更新配置成功",
  "data": {
    "results": [
      {
        "id": 1,
        "key": "config1",
        "value": "新值1"
      },
      {
        "id": 2,
        "key": "config2",
        "value": "新值2"
      }
    ],
    "successCount": 2,
    "skipCount": 0
  },
  "errMsg": ""
}
```

**部分失败响应** (code: 207):

```json
{
  "code": 207,
  "message": "批量更新部分失败: 1/2 个配置更新失败",
  "data": {
    "results": [
      {
        "id": 1,
        "key": "config1",
        "value": "新值1"
      }
    ],
    "successCount": 1,
    "skipCount": 0,
    "errors": [
      {
        "index": 2,
        "configId": 2,
        "error": "配置不存在 (ID: 2)"
      }
    ]
  },
  "errMsg": "批量更新部分失败: 1/2 个配置更新失败"
}
```

### 8. 删除配置

**接口路径**: `DELETE /system/config/delete/{id}`

**功能描述**: 删除指定的配置项，系统配置不能删除

**权限要求**: 需要 JWT 认证

**路径参数**:

- `id` (number, 必需): 配置 ID

**响应格式**:

```json
{
  "code": 200,
  "message": "配置删除成功",
  "data": {
    "id": 10,
    "key": "custom.deletedConfig",
    "name": "已删除的配置"
  },
  "errMsg": ""
}
```

**系统配置删除失败响应** (code: 403):

```json
{
  "code": 403,
  "message": "系统配置 'system.isInit' 不能删除",
  "data": null,
  "errMsg": "系统配置 'system.isInit' 不能删除"
}
```

### 9. 验证密码配置

**接口路径**: `POST /system/config/validate-password`

**功能描述**: 验证密码类型配置的值是否正确

**权限要求**: 需要 JWT 认证

**请求体**:

```json
{
  "key": "admin.password",
  "password": "输入的密码"
}
```

**字段说明**:

- `key` (string, 必需): 密码配置的键名
- `password` (string, 必需): 要验证的密码

**响应格式**:

```json
{
  "code": 200,
  "message": "验证完成",
  "data": {
    "isValid": true
  },
  "errMsg": ""
}
```

## 配置类型说明

### 支持的配置类型

- **STRING**: 字符串类型
- **NUMBER**: 数字类型
- **BOOLEAN**: 布尔类型
- **JSON**: JSON 对象类型
- **ARRAY**: 数组类型
- **FILE**: 文件路径类型
- **EMAIL**: 邮箱地址类型
- **URL**: URL 地址类型
- **PASSWORD**: 密码类型（自动加密存储）

### 配置分类

- **SYSTEM**: 系统配置
- **EMAIL**: 邮件配置
- **UPLOAD**: 上传配置
- **SECURITY**: 安全配置
- **CUSTOM**: 自定义配置

## 错误码说明

- **200**: 操作成功
- **207**: 批量操作部分成功
- **400**: 请求参数错误
- **401**: 未授权访问
- **403**: 禁止操作（如删除系统配置）
- **404**: 资源不存在
- **409**: 资源冲突（如键名重复）
- **500**: 服务器内部错误
- **501**: 功能未实现

## 特殊说明

### 系统配置保护

系统配置（`isSystem: true`）具有以下特点：

- 不能被删除
- 通常包含系统核心配置，如 `system.isInit`、`system.version`
- 修改时需要特别谨慎

### 密码配置处理

- 密码类型配置在存储时会自动使用 bcrypt 加密
- 获取密码配置时返回 "**\*\***" 而不是实际值
- 提供专门的验证接口来检查密码是否正确

### 公开配置

- 标记为 `isPublic: true` 的配置可以通过 `/public` 接口无需认证获取
- 主要用于前端需要的公开设置，如网站名称、描述等

### 值类型转换

- 系统会根据配置类型自动转换和解析配置值
- JSON 和 ARRAY 类型会自动进行 JSON 解析
- BOOLEAN 类型支持多种格式输入（true/false、1/0、"true"/"false"）

