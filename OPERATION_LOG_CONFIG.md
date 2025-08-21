# 操作日志配置说明

## 概述

操作日志中间件支持灵活的HTTP方法筛选配置，可以通过 `includeMethods` 和 `excludeMethods` 来控制哪些HTTP方法需要记录操作日志。

## 配置选项

### IOperationLogMiddlewareConfig 接口

```typescript
export interface IOperationLogMiddlewareConfig {
  // 是否启用操作日志记录
  enabled?: boolean;
  // 排除的路径（不记录日志）
  excludePaths?: string[];
  // 排除的方法（不记录日志）
  excludeMethods?: string[];
  // 包含的方法（只记录这些方法的日志，优先级高于excludeMethods）
  includeMethods?: string[];
  // 是否记录请求参数
  logParams?: boolean;
  // 是否记录响应结果
  logResult?: boolean;
  // 参数最大长度（超过则截断）
  maxParamsLength?: number;
  // 结果最大长度（超过则截断）
  maxResultLength?: number;
  // 是否异步记录日志
  async?: boolean;
}
```

## 使用示例

### 1. 只记录特定HTTP方法（推荐）

```typescript
// 只记录 GET、POST、PUT、DELETE 方法的操作日志
app.use(
  createOperationLogMiddleware(container, {
    enabled: true,
    includeMethods: ["GET", "POST", "PUT", "DELETE"],
    excludePaths: ["/health", "/api-docs", "/uploads"],
    async: true,
  })
);
```

### 2. 排除特定HTTP方法

```typescript
// 记录所有方法，但排除 OPTIONS 和 HEAD
app.use(
  createOperationLogMiddleware(container, {
    enabled: true,
    excludeMethods: ["OPTIONS", "HEAD"],
    excludePaths: ["/health", "/api-docs", "/uploads"],
    async: true,
  })
);
```

### 3. 只记录写操作

```typescript
// 只记录数据修改操作（POST、PUT、PATCH、DELETE）
app.use(
  createOperationLogMiddleware(container, {
    enabled: true,
    includeMethods: ["POST", "PUT", "PATCH", "DELETE"],
    excludePaths: ["/health", "/api-docs", "/uploads"],
    async: true,
  })
);
```

### 4. 只记录读操作

```typescript
// 只记录查询操作（GET）
app.use(
  createOperationLogMiddleware(container, {
    enabled: true,
    includeMethods: ["GET"],
    excludePaths: ["/health", "/api-docs", "/uploads"],
    async: true,
  })
);
```

### 5. 完整配置示例

```typescript
app.use(
  createOperationLogMiddleware(container, {
    enabled: true,
    includeMethods: ["GET", "POST", "PUT", "DELETE"], // 只记录这些方法
    excludePaths: [
      "/health",
      "/api-docs",
      "/uploads",
      "/favicon.ico"
    ],
    logParams: true,        // 记录请求参数
    logResult: true,        // 记录响应结果
    maxParamsLength: 1000,  // 参数最大长度
    maxResultLength: 2000,  // 结果最大长度
    async: true,            // 异步记录日志
  })
);
```

## 配置优先级

1. **includeMethods** 优先级最高：如果配置了 `includeMethods`，则只记录指定方法的日志，忽略 `excludeMethods`
2. **excludeMethods** 次优先级：如果没有配置 `includeMethods`，则记录所有方法的日志，但排除 `excludeMethods` 中指定的方法
3. **默认行为**：如果既没有配置 `includeMethods` 也没有配置 `excludeMethods`，则记录所有HTTP方法的日志

## 常用HTTP方法说明

- **GET**: 查询操作，对应 `OperationType.VIEW`
- **POST**: 创建操作，对应 `OperationType.CREATE`
- **PUT**: 更新操作，对应 `OperationType.UPDATE`
- **PATCH**: 部分更新操作，对应 `OperationType.UPDATE`
- **DELETE**: 删除操作，对应 `OperationType.DELETE`
- **OPTIONS**: 预检请求，通常用于CORS
- **HEAD**: 获取资源头信息

## 注意事项

1. HTTP方法名称不区分大小写，内部会自动转换为大写进行匹配
2. 建议根据业务需求合理配置，避免记录过多无用的日志
3. 对于高频访问的接口，建议使用 `excludePaths` 排除，以提高性能
4. 异步记录日志（`async: true`）可以提高接口响应速度，推荐开启