/*
 * @Author: jdm
 * @Date: 2024-04-23 15:44:47
 * @LastEditors: jdm
 * @LastEditTime: 2024-10-26 16:19:01
 * @FilePath: \APP\main.ts
 * @Description:
 *
 */
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
      title: "API Documentation",
      version: "1.0.0",
      description: "API documentation for the Express application",
    },
    servers: [
      {
        url: "http://localhost:3000/api", // API 根路径
        description: "Local server",
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
