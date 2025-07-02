/*
 * @Author: jdm
 * @Date: 2025-06-06 16:01:30
 * @LastEditors: jdm
 * @LastEditTime: 2025-06-06 16:01:30
 * @FilePath: \jdm-server\src\modules\external\index.ts
 * @Description: 外部数据库模块配置
 */
import { ContainerModule } from "inversify";
import { ExternalController } from "./controller";
import { ExternalService } from "./service";
import { ExternalDB } from "../../db/external";

export const externalContainer = new ContainerModule((bind) => {
  // 绑定控制器
  bind(ExternalController).to(ExternalController);

  // 绑定服务
  bind(ExternalService).to(ExternalService);

  // 绑定数据库连接
  bind(ExternalDB).to(ExternalDB);

  // 绑定外部数据库配置
  bind("ExternalDBConfig").toConstantValue({
    host: "117.72.60.94",
    port: 3306,
    user: "root",
    password: "JIADAOMING0119",
    database: "crawler",
    charset: "utf8mb4",
    timezone: "+08:00",
  });
});

