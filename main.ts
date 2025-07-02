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
import createContainer from "./config/container";
import { JWT } from "./src/jwt";
// import { logger } from "./src/middleware/logger";
import * as prettyjson from "prettyjson";
import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { responseHandler } from "./src/middleware/sendResult";

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
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded());
  app.use(container.get(JWT).init());
  app.use(responseHandler);
  // app.use(logger);
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
process.on("SIGTERM", () => {
  console.log("\n🛑 收到SIGTERM信号，正在优雅关闭服务器...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("\n\n🛑 收到中断信号，正在关闭服务器...");
  process.exit(0);
});

const routeInfo = getRouteInfo(container);

// 优化的路由信息打印函数
function printOptimizedRouteInfo(routes: any[]) {
  const totalEndpoints = routes.reduce(
    (total, module) => total + (module.endpoints?.length || 0),
    0
  );

  console.log("\n" + "=".repeat(60));
  console.log("📋 API 接口统计报告");
  console.log("=".repeat(60));
  console.log(`📊 模块总数: ${routes.length} 个`);
  console.log(`🔗 接口总数: ${totalEndpoints} 个`);
  console.log("=".repeat(60));

  routes.forEach((module, index) => {
    const controllerName = module.controller;
    const endpoints = module.endpoints || [];
    const endpointCount = endpoints.length;

    console.log(`\n📁 ${index + 1}. ${controllerName} 模块`);
    console.log(`   └─ 接口数量: ${endpointCount} 个`);

    if (endpointCount > 0) {
      console.log("   └─ 接口列表:");
      endpoints.forEach((endpoint: any, endpointIndex: number) => {
        const route = endpoint.route;
        const method = route.split(" ")[0];
        const path = route.split(" ")[1] || route;
        const methodEmoji = getMethodEmoji(method);
        console.log(`      ${methodEmoji} ${endpointIndex + 1}. ${route}`);
      });
    }
  });

  console.log("\n" + "=".repeat(60));
  console.log("✅ 路由信息加载完成");
  console.log("=".repeat(60));
}

// 根据HTTP方法返回对应的emoji
function getMethodEmoji(method: string): string {
  const methodMap: { [key: string]: string } = {
    GET: "📖",
    POST: "📝",
    PUT: "✏️",
    DELETE: "🗑️",
    PATCH: "🔧",
  };
  return methodMap[method] || "🔗";
}

printOptimizedRouteInfo(routeInfo);

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "localhost";
const NODE_ENV = process.env.NODE_ENV || "development";

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
