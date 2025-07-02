# JDM Server 项目

一个基于 Node.js + TypeScript + Prisma 的后端服务项目，支持文件上传、用户管理、AI聊天等功能。

## 快速开始

### 环境要求

- Node.js >= 16.0.0
- MySQL 数据库
- pnpm（推荐）或 npm

### 安装依赖

```bash
pnpm install
```

### 环境配置

#### 1. 基础配置

复制并配置主环境变量文件：

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置数据库连接等基础信息：

```env
# 数据库连接
DATABASE_URL="mysql://username:password@localhost:3306/database_name"

# 服务器配置
BASE_URL="http://localhost:3000"

# 默认密码（已加密）
DEFAULT_PASSWORD="$2a$10$XhLYUx71gN8lnXBpD33k6Og15FE5ojbzTiK9KnqPupmRhfuAXCJMW"

# AI API 密钥
ARK_API_KEY="your-ark-api-key"
ZHIPUAI_API_KEY="your-zhipuai-api-key"
```

#### 2. OSS配置（可选）

如果需要使用阿里云OSS文件上传功能，请配置OSS环境变量：

```bash
cp .env.oss.example .env.oss
```

编辑 `.env.oss` 文件，填入真实的OSS配置：

```env
# OSS区域
OSS_REGION="oss-cn-hangzhou"

# OSS访问密钥
OSS_ACCESS_KEY_ID="your-access-key-id"
OSS_ACCESS_KEY_SECRET="your-access-key-secret"

# OSS存储桶名称
OSS_BUCKET_NAME="your-bucket-name"
```

**⚠️ 安全提醒：**
- `.env.oss` 文件包含敏感信息，已添加到 `.gitignore`
- 请勿将真实的AccessKey提交到代码仓库
- 建议定期轮换AccessKey

### 数据库初始化

```bash
# 生成Prisma客户端
pnpm prisma generate

# 运行数据库迁移
pnpm prisma migrate dev

# 初始化数据
pnpm prisma db seed
```

### 启动项目

```bash
# 开发模式
pnpm dev

# 生产模式
pnpm build
pnpm start
```

## 主要功能

### 文件上传

- **本地上传**：支持文件上传到本地服务器
- **OSS上传**：支持文件上传到阿里云OSS（需配置）
- **头像上传**：专门的头像上传接口
- **自动清理**：OSS上传成功后自动删除本地临时文件

详细使用说明请参考：[OSS上传功能指南](./OSS_UPLOAD_GUIDE.md)

### 用户管理

- 用户注册/登录
- JWT身份验证
- 用户信息管理
- 头像上传

### AI聊天

- 支持多种AI模型
- 聊天记录管理
- 流式响应

### 系统管理

- 系统配置管理
- 通知管理
- 日志记录

## API文档

项目启动后，可以通过以下方式查看API文档：

- 查看 `request.http` 文件中的示例请求
- 使用Postman等工具导入API集合

## 项目结构

```
jdm-server/
├── src/
│   ├── modules/          # 功能模块
│   │   ├── upload/       # 文件上传模块
│   │   ├── user/         # 用户管理模块
│   │   ├── aiChat/       # AI聊天模块
│   │   ├── sys/          # 系统管理模块
│   │   └── notice/       # 通知模块
│   ├── utils/            # 工具函数
│   ├── middleware/       # 中间件
│   ├── db/              # 数据库配置
│   └── jwt/             # JWT配置
├── prisma/              # 数据库相关
│   ├── schema.prisma    # 数据库模式
│   ├── migrations/      # 数据库迁移
│   └── initData/        # 初始化数据
├── config/              # 配置文件
├── uploads/             # 本地上传文件目录
├── .env                 # 主环境变量
├── .env.oss             # OSS配置（不提交到Git）
└── .env.oss.example     # OSS配置模板
```

## 开发指南

### 添加新模块

1. 在 `src/modules/` 下创建新的模块目录
2. 创建 `controller.ts`、`services.ts` 等文件
3. 在 `config/container.ts` 中注册依赖
4. 在 `main.ts` 中注册路由

### 数据库操作

```bash
# 创建新的迁移
pnpm prisma migrate dev --name migration_name

# 重置数据库
pnpm prisma migrate reset

# 查看数据库
pnpm prisma studio
```

### 代码规范

- 使用TypeScript进行类型检查
- 遵循ESLint规则
- 使用Prettier格式化代码
- 编写单元测试

## 部署

### Docker部署（推荐）

```bash
# 构建镜像
docker build -t jdm-server .

# 运行容器
docker run -p 3000:3000 jdm-server
```

### 传统部署

```bash
# 构建项目
pnpm build

# 使用PM2管理进程
pm2 start dist/main.js --name jdm-server
```

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查 `DATABASE_URL` 配置
   - 确认数据库服务是否启动
   - 验证用户名密码是否正确

2. **OSS上传失败**
   - 检查 `.env.oss` 文件是否存在
   - 验证AccessKey是否有效
   - 确认Bucket权限配置

3. **端口占用**
   - 修改 `BASE_URL` 中的端口号
   - 或者停止占用端口的进程

### 日志查看

```bash
# 查看应用日志
tail -f logs/app.log

# 查看错误日志
tail -f logs/error.log
```

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 联系方式

如有问题或建议，请通过以下方式联系：

- 创建 Issue
- 发送邮件到：your-email@example.com

---

**注意：** 在生产环境中使用前，请确保：
- 更改默认密码
- 配置HTTPS
- 设置防火墙规则
- 定期备份数据库
- 监控系统性能