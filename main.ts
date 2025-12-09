/*
 * @Author: jdm
 * @Date: 2024-04-23 15:44:47
 * @LastEditors: jdm
 * @LastEditTime: 2024-10-26 16:19:01
 * @FilePath: \APP\main.ts
 * @Description:
 *
 */
import "dotenv/config";
import "reflect-metadata";

// 引入模块别名
import cors from "cors";
import express from "express";
import { getRouteInfo, InversifyExpressServer } from "inversify-express-utils";
import "module-alias/register";
import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import createContainer from "./config/container";
import { checkDatabaseHealth } from "./src/config/database";
import { PrismaDB } from "./src/db";
import { JWT } from "./src/jwt";
import { createOperationLogMiddleware } from "./src/middleware/operationLog";
import { responseHandler } from "./src/middleware/sendResult";
import { RouteInfoManager } from "./src/utils/routeInfoManager";

const container = createContainer();

// 将它与一个依赖注入容器（Container）关联起来
const server = new InversifyExpressServer(container, null, {
  rootPath: "/api",
});

// Swagger 配置
const swaggerOptions: any = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "JDM Server API",
      version: "1.0.0",
      description: `这是一个企业级管理系统的API文档。您可以在这里找到所有可用的API接口，包括用户管理、部门管理、通知系统、AI聊天等功能。

  更多信息请访问：
  - [项目文档](https://github.com/Jadramcool)
  - [API JSON文档](http://localhost:3000/api-docs.json)

  如有问题请联系开发者。`,
      // termsOfService: "https://your-domain.com/terms",
      // contact: {
      //   name: "API Support",
      //   url: "https://your-domain.com/support",
      //   email: "support@your-domain.com",
      // },
      // license: {
      //   name: "MIT",
      //   url: "https://opensource.org/licenses/MIT",
      // },
    },
    servers: [
      {
        url: "http://localhost:3000/api",
        description: "开发环境服务器",
      },
      {
        url: "http://117.72.60.94:3000/api",
        description: "生产环境服务器",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "请在此处输入JWT token，格式：Bearer <token>",
        },
      },
      schemas: {
        ApiResponse: {
          type: "object",
          properties: {
            code: {
              type: "integer",
              description: "响应状态码",
              example: 200,
            },
            message: {
              type: "string",
              description: "响应消息",
              example: "操作成功",
            },
            data: {
              type: "object",
              description: "响应数据",
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/modules/**/controller.ts"], // 指定控制器文件路径
};

const swaggerSpec = swaggerJsDoc(swaggerOptions);

// 配置中间件
server.setConfig((app) => {
  // CORS 配置 - 允许所有来源和方法
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded());
  app.use(container.get(JWT).init());

  // 操作日志中间件 - 直接使用JWT服务解析token
  app.use(
    createOperationLogMiddleware(container, {
      enabled: true,
      excludePaths: ["/health", "/api-docs", "/uploads"],
      excludeMethods: ["OPTIONS"], // 排除的HTTP方法
      // includeMethods: ["GET", "POST", "PUT", "DELETE"], // 只记录指定的HTTP方法（优先级高于excludeMethods）
      logParams: true, // 记录请求参数
      logResult: true, // 记录响应结果
      maxParamsLength: 2000, // 参数最大长度
      maxResultLength: 2000, // 结果最大长度
      async: true,
    })
  );

  app.use(responseHandler);
  app.use("/uploads", express.static("uploads")); // 静态文件

  // Swagger UI 路由
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // 提供动态生成的OpenAPI JSON文档接口
  app.get("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });
});

// 构建一个Express应用程序
const app = server.build();

// 添加健康检查端点
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    version: "1.0.0",
    pid: process.pid,
  });
});

// 全局错误处理
process.on("uncaughtException", (error) => {
  console.error("\n❌ 未捕获的异常:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("\n❌ 未处理的Promise拒绝:", reason);
  process.exit(1);
});

// 优雅关闭
process.on("SIGTERM", async () => {
  console.log("\n🛑 收到SIGTERM信号，正在优雅关闭服务器...");
  await gracefulShutdown();
});

process.on("SIGINT", async () => {
  console.log("\n\n🛑 收到中断信号，正在关闭服务器...");
  await gracefulShutdown();
});

// 优雅关闭函数
async function gracefulShutdown() {
  try {
    console.log("🔌 正在关闭数据库连接...");
    const prismaDB = container.get(PrismaDB);
    await prismaDB.disconnect();
    console.log("✅ 数据库连接已关闭");
  } catch (error) {
    console.error("❌ 关闭数据库连接时出错:", error);
  } finally {
    console.log("👋 服务器已关闭");
    process.exit(0);
  }
}

// 数据库健康检查
async function performDatabaseHealthCheck() {
  try {
    const prismaDB = container.get(PrismaDB);
    const health = await checkDatabaseHealth(prismaDB.prisma);

    if (health.isConnected) {
      console.log(`✅ 数据库连接正常 (延迟: ${health.latency}ms)`);
    } else {
      console.error(`❌ 数据库连接失败: ${health.error}`);
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ 数据库健康检查失败:", error);
    process.exit(1);
  }
}

const routeInfo = getRouteInfo(container);

// 初始化路由信息管理器
const routeInfoManager = container.get(RouteInfoManager);
routeInfoManager.initialize(routeInfo);
// routeInfoManager.printRouteMappings();

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "localhost";
const NODE_ENV = process.env.NODE_ENV || "development";

// 启动服务器
async function startServer() {
  try {
    // 执行数据库健康检查
    await performDatabaseHealthCheck();

    // 启动HTTP服务器
    app.listen(PORT, () => {
      console.log("\n" + "=".repeat(60));
      console.log("🚀 JDM Server 启动成功!");
      console.log("=".repeat(60));
      console.log(`📍 服务地址: http://${HOST}:${PORT}`);
      console.log(`📚 API文档: http://${HOST}:${PORT}/api-docs`);
      console.log(`🏥 健康检查: http://${HOST}:${PORT}/health`);
      console.log(`🌍 运行环境: ${NODE_ENV}`);
      console.log(`⏰ 启动时间: ${new Date().toLocaleString("zh-CN")}`);
      console.log(`💾 进程ID: ${process.pid}`);
      console.log(`📦 Node版本: ${process.version}`);
      console.log("=".repeat(60));
      console.log("✨ 服务器已就绪，等待请求处理...");
      console.log("=".repeat(60) + "\n");
    });
  } catch (error) {
    console.error("❌ 服务器启动失败:", error);
    process.exit(1);
  }
}

// 启动应用
startServer();
