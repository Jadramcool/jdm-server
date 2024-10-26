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
import "module-alias/register";
import cors from "cors";
import express from "express";
import { InversifyExpressServer, getRouteInfo } from "inversify-express-utils";
import * as prettyjson from "prettyjson";
import createContainer from "./config/container";
import { JWT } from "./src/jwt";
import { logger } from "./src/middleware/logger";
import { responseHandler } from "./src/middleware/sendResult";

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
  app.use(logger);
});

// 构建一个Express应用程序
const app = server.build();

const routeInfo = getRouteInfo(container);
console.log(prettyjson.render({ routes: routeInfo }));

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
