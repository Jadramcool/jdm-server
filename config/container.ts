import "reflect-metadata"; // 反射元数据功能
import { Container } from "inversify";
import { User } from "../src/modules/user/controller";
import { UserService } from "../src/modules/user/services";
import { System } from "../src/modules/sys/controller";
import { SystemService } from "../src/modules/sys/services";
import { PrismaClient } from "@prisma/client"; // 数据库orm框架
import { PrismaDB } from "../src/db";
import { JWT } from "../src/jwt";

const createContainer = () => {
  // 创建了一个InversifyExpressServer实例
  const container = new Container();

  /**
   * user模块
   */
  container.bind(User).to(User);
  container.bind(UserService).to(UserService);
  container.bind(System).to(System);
  container.bind(SystemService).to(SystemService);

  /**
   * 封装PrismaClient，方便注入
   */
  container.bind<PrismaClient>("PrismaClient").toFactory(() => {
    return () => new PrismaClient();
  });

  container.bind(PrismaDB).to(PrismaDB);

  /**
   * JWT
   */
  container.bind(JWT).to(JWT);

  return container;
};

export default createContainer;
