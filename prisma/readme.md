# Prisma 数据库管理指南

本项目使用 Prisma 作为 ORM 工具，支持 MySQL 数据库。本文档详细介绍了如何配置和使用 Prisma。

## 📋 目录结构

```
prisma/
├── initData/           # 初始化数据文件
│   ├── department.ts   # 部门数据
│   ├── menu.ts        # 菜单数据
│   ├── operationLog.ts # 操作日志数据
│   ├── role.ts        # 角色数据
│   ├── sysConfig.ts   # 系统配置数据
│   └── user.ts        # 用户数据
├── migrations/         # 数据库迁移文件
├── models/            # 数据模型文件
├── schema.prisma      # Prisma 模式文件
├── seed.ts           # 种子数据脚本
└── readme.md         # 本文档
```

## 🔧 环境配置

### 1. 数据库连接配置

在项目根目录的 `.env` 文件中配置数据库连接字符串：

```env
# MySQL 数据库连接
DATABASE_URL="mysql://用户名:密码@主机:端口/数据库名"

# 示例
DATABASE_URL="mysql://root:123456@localhost:3306/mydatabase"
```

### 2. 安装依赖

确保已安装必要的依赖：

```shell
npm install @prisma/client prisma ts-node
```

## 🚀 快速开始

### 1. 生成 Prisma Client

```shell
npx prisma generate
```

### 2. 数据库初始化

创建并应用初始迁移：

```shell
npx prisma migrate dev --name init
```

### 3. 运行种子文件

填充初始数据：

```shell
npx ts-node prisma/seed.ts
```

或者使用 npm 脚本：

```shell
npx prisma db seed
```

## 📊 数据模型

项目包含以下主要数据模型：

- **User**: 用户信息
- **Department**: 部门信息
- **Role**: 角色权限
- **Menu**: 菜单配置
- **SysConfig**: 系统配置
- **OperationLog**: 操作日志

详细的模型定义请查看 `schema.prisma` 文件。

## 🔄 数据库迁移

### 创建新迁移

当修改了 `schema.prisma` 文件后，创建新的迁移：

```shell
npx prisma migrate dev --name 迁移名称
```

### 应用迁移到生产环境

```shell
npx prisma migrate deploy
```

### 重置数据库

⚠️ **警告：此操作会删除所有数据**

```shell
npx prisma migrate reset
```

## 🌱 种子数据

种子文件 (`seed.ts`) 包含以下初始数据：

- 系统配置数据
- 默认用户账户
- 基础角色权限
- 菜单结构
- 部门组织架构
- 示例操作日志

### 自定义种子数据

修改 `initData/` 目录下的相应文件来自定义初始数据。

## 🛠️ 常用命令

### 数据库管理

```shell
# 查看数据库状态
npx prisma migrate status

# 生成客户端代码
npx prisma generate

# 打开数据库管理界面
npx prisma studio

# 验证模式文件
npx prisma validate

# 格式化模式文件
npx prisma format
```

### 数据操作

```shell
# 推送模式变更（开发环境）
npx prisma db push

# 从数据库拉取模式
npx prisma db pull
```

## 🔍 Prisma Studio

Prisma Studio 是一个可视化数据库管理工具：

```shell
npx prisma studio
```

启动后访问 `http://localhost:5555` 来管理数据库。

## 📝 开发建议

1. **模式变更**：修改 `schema.prisma` 后务必运行迁移
2. **类型安全**：充分利用 Prisma 的类型安全特性
3. **查询优化**：使用 `include` 和 `select` 优化查询性能
4. **事务处理**：对于复杂操作使用 Prisma 事务

## 🐛 常见问题

### 1. 连接数据库失败

- 检查 `.env` 文件中的 `DATABASE_URL` 配置
- 确认数据库服务正在运行
- 验证用户名、密码和数据库名称

### 2. 迁移失败

- 检查数据库权限
- 确认模式文件语法正确
- 查看迁移历史记录

### 3. 种子数据运行失败

- 确保数据库已初始化
- 检查种子数据的格式和约束
- 查看错误日志定位问题

## 📚 相关文档

- [Prisma 官方文档](https://www.prisma.io/docs/)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate)
