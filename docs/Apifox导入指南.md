# 📋 Apifox 导入指南

## 🚀 快速开始

### 1. 生成 API 文档

```bash
# 生成 OpenAPI 文档
npm run docs:generate

# 或使用 Apifox 专用命令
npm run apifox:generate
```

### 2. 导入到 Apifox

1. **打开 Apifox 应用**
2. **创建新项目**
   - 项目名称: `JDM Server API`
   - 项目描述: `基于Express + TypeScript + Prisma的后端API项目`
3. **导入文档**
   - 点击 **"导入"** → **"OpenAPI (Swagger)"**
   - 选择 **"从文件导入"**
   - 选择生成的 `docs/openapi.json` 文件
4. **配置 JWT 认证**
   - 进入项目设置 → **"认证"**
   - 认证类型: `Bearer Token`
   - Token: `{{token}}`
   - Header名称: `Authorization`
   - Token前缀: `Bearer`
5. **设置环境变量**
   - 环境名称: `开发环境`
   - 前置URL: `http://localhost:3000/api`
   - 变量:
     - `baseUrl`: `http://localhost:3000/api`
     - `token`: (留空，登录后设置)

## 🧪 测试接口

### 登录获取 Token

1. 找到 `认证相关接口` → `用户登录`
2. 设置请求参数:
   ```json
   {
     "username": "admin",
     "password": "123456"
   }
   ```
3. 发送请求，复制响应中的 `token`
4. 在环境变量中设置 `token` 值

### 测试其他接口

选择任意需要认证的接口，确认请求头包含 `Authorization: Bearer {{token}}`，即可正常调用。

## 🔄 更新文档

当 API 接口发生变化时：

```bash
npm run apifox:generate
```

然后在 Apifox 中重新导入 `docs/openapi.json` 文件。

---

🎉 **完成！** 现在可以在 Apifox 中测试所有 API 接口了。