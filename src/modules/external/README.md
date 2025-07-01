# External 模块 CRUD 功能文档

## 概述

本模块为 `external` 模块提供了完整的 CRUD 功能，包括：

1. **通用数据库操作方法** - 支持传入表名进行操作的通用方法
2. **u3c3 专用方法** - 针对 `u3c3` 表的兼容性方法
3. **完善的数据验证** - 输入验证、数据清理和安全检查
4. **性能优化** - 缓存管理、查询优化和连接池
5. **软删除支持** - 逻辑删除和自动过滤已删除数据

## API 接口

### 通用方法说明

本模块提供了通用的数据库操作方法，支持传入表名进行操作：

- `createData(tableName, data)` - 通用新增方法
- `updateData(tableName, id, data, enableSoftDelete)` - 通用更新方法
- `deleteData(tableName, id, hardDelete)` - 通用删除方法
- `getDataById(tableName, id, enableSoftDelete, selectFields, cacheTTL)` - 通用查询方法

### 1. 查询数据列表

**GET** `/external/u3c3/list`

支持分页、搜索、过滤和排序功能。

**查询参数：**
```typescript
{
  page?: number;          // 页码，默认 1
  pageSize?: number;      // 每页大小，默认 10
  title?: string;         // 标题搜索
  type?: string;          // 类型过滤
  date?: string;          // 日期过滤
  startTime?: string;     // 开始时间
  endTime?: string;       // 结束时间
  sortBy?: string;        // 排序字段，默认 'date'
  sortOrder?: 'ASC' | 'DESC'; // 排序方向，默认 'DESC'
}
```

**响应示例：**
```json
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "data": [
      {
        "id": 1,
        "title": "示例标题",
        "type": "示例类型",
        "content": "示例内容",
        "date": "2025-01-27T10:00:00.000Z",
        "created_at": "2025-01-27T10:00:00.000Z",
        "updated_at": "2025-01-27T10:00:00.000Z"
      }
    ],
    "pagination": {
      "totalRecords": 100,
      "page": 1,
      "pageSize": 10,
      "totalPages": 10
    }
  }
}
```

### 2. 根据 ID 查询单条数据

**GET** `/external/u3c3/:id`

**路径参数：**
- `id`: 数据 ID（正整数）

**响应示例：**
```json
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "id": 1,
    "title": "示例标题",
    "type": "示例类型",
    "content": "示例内容",
    "url": "https://example.com",
    "size": 1024,
    "date": "2025-01-27T10:00:00.000Z",
    "description": "示例描述",
    "tags": "标签1,标签2",
    "status": 1,
    "priority": 1,
    "category": "示例分类",
    "author": "作者",
    "source": "来源",
    "metadata": "{}",
    "is_deleted": false,
    "created_at": "2025-01-27T10:00:00.000Z",
    "updated_at": "2025-01-27T10:00:00.000Z"
  }
}
```

### 3. 新增数据

**POST** `/external/u3c3`

**请求体：**
```json
{
  "title": "新数据标题",        // 必填，字符串，最大500字符
  "type": "数据类型",          // 可选，字符串，最大255字符
  "content": "数据内容",       // 可选，字符串
  "url": "https://example.com", // 可选，有效URL
  "size": 1024,               // 可选，非负数
  "date": "2025-01-27",       // 可选，有效日期
  "description": "描述",      // 可选，字符串，最大255字符
  "tags": "标签1,标签2",      // 可选，字符串，最大255字符
  "status": 1,                // 可选，整数
  "priority": 1,              // 可选，整数
  "category": "分类",         // 可选，字符串，最大255字符
  "author": "作者",           // 可选，字符串，最大255字符
  "source": "来源",           // 可选，字符串，最大255字符
  "metadata": "{}"            // 可选，字符串
}
```

**响应示例：**
```json
{
  "code": 200,
  "message": "新增成功",
  "data": {
    "success": true,
    "id": 123,
    "affectedRows": 1,
    "message": "数据新增成功"
  }
}
```

### 4. 更新数据

**PUT** `/external/u3c3/:id`

**路径参数：**
- `id`: 数据 ID（正整数）

**请求体：**
```json
{
  "title": "更新后的标题",     // 可选，至少提供一个字段
  "type": "更新后的类型",     // 可选
  "content": "更新后的内容"   // 可选
  // ... 其他字段同新增接口
}
```

**响应示例：**
```json
{
  "code": 200,
  "message": "更新成功",
  "data": {
    "success": true,
    "id": 123,
    "affectedRows": 1,
    "message": "数据更新成功"
  }
}
```

### 5. 软删除数据

**DELETE** `/external/u3c3/:id`

**路径参数：**
- `id`: 数据 ID（正整数）

**响应示例：**
```json
{
  "code": 200,
  "message": "删除成功",
  "data": {
    "success": true,
    "id": 123,
    "affectedRows": 1,
    "message": "数据删除成功"
  }
}
```

## 错误响应

### 数据验证失败

**状态码：** 400

```json
{
  "code": 400,
  "message": "数据验证失败",
  "errors": [
    {
      "field": "title",
      "message": "标题不能为空",
      "value": ""
    }
  ]
}
```

### 数据不存在

**状态码：** 500

```json
{
  "code": 500,
  "message": "查询失败",
  "error": "数据不存在或已被删除"
}
```

## 功能特性

### 1. 通用性设计
- **表名参数化**: 支持传入任意表名进行操作
- **灵活配置**: 可选的软删除检查、字段选择、缓存时间等
- **兼容性保持**: 保留原有的 u3c3 专用方法
- **扩展性强**: 易于扩展到其他数据表

### 2. 数据验证

- ✅ 必填字段验证
- ✅ 数据类型验证
- ✅ 字符串长度限制
- ✅ URL 格式验证
- ✅ 日期格式验证
- ✅ 数值范围验证

### 3. 软删除

- ✅ 删除操作不会物理删除数据
- ✅ 硬删除选项: 支持真实删除数据
- ✅ 通过 `is_deleted` 字段标记删除状态
- ✅ 查询时自动过滤已删除数据
- ✅ 灵活控制: 可选择是否启用软删除检查

### 4. 缓存管理

- ✅ 查询结果自动缓存
- ✅ 数据变更时自动清除缓存
- ✅ 可配置TTL: 支持自定义缓存时间
- ✅ 单条记录缓存 10 分钟
- ✅ 列表查询缓存 5 分钟

### 5. 性能优化

- ✅ 智能索引使用
- ✅ 分页查询优化
- ✅ 全文搜索优化
- ✅ COUNT 查询优化
- ✅ 连接池管理
- ✅ 字段选择: 支持指定查询字段

### 6. 安全特性

- ✅ SQL 注入防护
- ✅ 参数验证和清理
- ✅ 错误信息脱敏
- ✅ 输入数据标准化
- ✅ 表名验证: 防止恶意表名注入

## 使用示例

### 通用方法使用

```typescript
// 在服务层使用通用方法
const externalService = new ExternalService();

// 新增任意表数据
const createResult = await externalService.createData('user_table', {
  name: '张三',
  email: 'zhangsan@example.com'
});

// 更新任意表数据
const updateResult = await externalService.updateData(
  'user_table', 
  1, 
  { name: '李四' },
  true // 启用软删除检查
);

// 删除任意表数据
const deleteResult = await externalService.deleteData(
  'user_table', 
  1, 
  false // 软删除
);

// 查询任意表数据
const userData = await externalService.getDataById(
  'user_table',
  1,
  true, // 启用软删除检查
  'id, name, email', // 指定字段
  300000 // 5分钟缓存
);
```

### JavaScript/TypeScript 客户端

```typescript
// 查询列表
const response = await fetch('/external/u3c3/list?page=1&pageSize=10&title=搜索关键词');
const result = await response.json();

// 新增数据
const createResponse = await fetch('/external/u3c3', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: '新数据标题',
    type: '数据类型',
    content: '数据内容'
  })
});

// 更新数据
const updateResponse = await fetch('/external/u3c3/123', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: '更新后的标题'
  })
});

// 删除数据
const deleteResponse = await fetch('/external/u3c3/123', {
  method: 'DELETE'
});

// 查询单条数据
const getResponse = await fetch('/external/u3c3/123');
const data = await getResponse.json();
```

### cURL 示例

```bash
# 查询列表
curl "http://localhost:3000/external/u3c3/list?page=1&pageSize=10"

# 新增数据
curl -X POST "http://localhost:3000/external/u3c3" \
  -H "Content-Type: application/json" \
  -d '{"title":"新数据标题","type":"数据类型"}'

# 更新数据
curl -X PUT "http://localhost:3000/external/u3c3/123" \
  -H "Content-Type: application/json" \
  -d '{"title":"更新后的标题"}'

# 删除数据
curl -X DELETE "http://localhost:3000/external/u3c3/123"

# 查询单条数据
curl "http://localhost:3000/external/u3c3/123"
```

## 注意事项

1. **表名安全**: 使用通用方法时，请确保表名来源可信，避免SQL注入风险
2. **数据验证**：所有输入数据都会经过严格验证，请确保数据格式正确
3. **软删除**：删除操作默认为逻辑删除，数据仍保留在数据库中
4. **缓存机制**: 数据变更后缓存会自动清除，但可能存在短暂的缓存延迟
5. **性能考虑**: 大量数据查询时建议使用分页和筛选条件
6. **兼容性**: 原有的 u3c3 专用方法仍然可用，保持向后兼容
7. **错误处理**: 请根据返回的错误信息进行相应的错误处理

## 扩展功能

未来可考虑添加的功能：

1. **表结构验证**: 自动验证目标表是否存在必要字段
2. **批量操作**: 支持批量新增、更新、删除
3. **事务支持**: 多表操作的事务一致性
4. **数据导入导出**: Excel/CSV 格式支持
5. **审计日志**: 记录数据变更历史
6. **权限控制**: 基于角色的数据访问控制
7. **数据备份**: 自动备份重要数据变更
8. **全文搜索**: 更强大的搜索功能
9. **数据统计**: 提供数据分析和统计功能
10. **动态验证器**: 根据表结构自动生成验证规则