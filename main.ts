import "reflect-metadata"; // 反射元数据功能
import { InversifyExpressServer } from "inversify-express-utils";
import { JWT } from "./src/jwt";
import express from "express";
import createContainer from "./config/container";
import { responseHandler } from "./src/middleware/sendResult";
import cors from "cors";

const container = createContainer();

// 将它与一个依赖注入容器（Container）关联起来
const server = new InversifyExpressServer(container, null, {
  rootPath: "/api",
});

// 配置中间件
server.setConfig((app) => {
  app.use(express.json());
  app.use(container.get(JWT).init());
  app.use(responseHandler);
  app.use(cors());
});

// 构建一个Express应用程序
const app = server.build();

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
