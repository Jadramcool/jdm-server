import { PrismaClient } from "@prisma/client"; // 数据库orm框架
import { Container } from "inversify";
import "reflect-metadata"; // 反射元数据功能
import { PrismaDB } from "../src/db";
import { JWT } from "../src/jwt";
import { appointmentContainer } from "../src/modules/appointment/index";
import { hospitalContainer } from "../src/modules/hospital/index";
import { medicalRecordContainer } from "../src/modules/medicalRecord/index";
import { noticeContainer } from "../src/modules/notice/index";
import { scheduleContainer } from "../src/modules/schedule/index";
import { systemContainer } from "../src/modules/sys/index";
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
   * 医院模块
   */
  container.load(hospitalContainer);
  /**
   * 预约排班模块
   */
  container.load(scheduleContainer);
  /**
   * 患者挂号模块
   */
  container.load(appointmentContainer);
  /**
   * 病例模块
   */
  container.load(medicalRecordContainer);

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
   * 封装PrismaClient，方便注入
   */
  container.bind<PrismaClient>("PrismaClient").toFactory(() => {
    return () =>
      new PrismaClient({
        omit: {
          user: {
            password: true,
          },
        },
      });
  });

  container.bind(PrismaDB).to(PrismaDB);

  /**
   * JWT
   */
  container.bind(JWT).to(JWT);
  return container;
};

export default createContainer;
