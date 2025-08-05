import { PrismaClient } from "@prisma/client"; // 数据库orm框架
import { Container } from "inversify";
import "reflect-metadata"; // 反射元数据功能
import { PrismaDB } from "../src/db";
import { JWT } from "../src/jwt";
import { createOptimizedPrismaClient, type OptimizedPrismaClient } from "../src/config/database";
import { noticeContainer } from "../src/modules/notice/index";
import { systemContainer } from "../src/modules/sys/index";
import { externalContainer } from "../src/modules/external/index";
import { Upload } from "../src/modules/upload/controller";
import { UploadService } from "../src/modules/upload/services";
import { User } from "../src/modules/user/controller";
import { UserService } from "../src/modules/user/services";
import { UtilService } from "../src/utils/utils";

const createContainer = () => {
  // 创建了一个InversifyExpressServer实例
  const container = new Container();
  /**
   * 加载system模块
   */
  container.load(systemContainer);
  /**
   * 公告模块
   */
  container.load(noticeContainer);
  /**
   * 外部数据库模块
   */
  container.load(externalContainer);

  /**
   * user模块
   */
  container.bind(User).to(User);
  container.bind(UserService).to(UserService);
  /**
   * upload模块
   */
  container.bind(Upload).to(Upload);
  container.bind(UploadService).to(UploadService);

  container.bind(UtilService).to(UtilService);

  /**
   * 封装PrismaClient，使用单例模式避免连接池耗尽
   * 优化配置：
   * 1. 使用单例模式，避免多个实例导致连接池耗尽
   * 2. 配置合适的日志级别和连接参数
   * 3. 优化omit配置，提高安全性
   * 4. 支持环境变量配置
   */
  container.bind<OptimizedPrismaClient>("PrismaClient").toConstantValue(
    createOptimizedPrismaClient({
      enableQueryLog: process.env.NODE_ENV === 'development',
      connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10'),
      connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '20000'),
      queryTimeout: parseInt(process.env.DB_QUERY_TIMEOUT || '60000'),
    })
  );

  container.bind(PrismaDB).to(PrismaDB).inSingletonScope();

  /**
   * JWT
   */
  container.bind(JWT).to(JWT);
  return container;
};

export default createContainer;
