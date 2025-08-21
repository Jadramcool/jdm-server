import { ContainerModule, interfaces } from "inversify";
import { Menu } from "./menu/controller";
import { MenuService } from "./menu/services";
import { Role } from "./role/controller";
import { RoleService } from "./role/services";
import { UserManager } from "./user/controller";
import { UserManagerService } from "./user/services";
import { ConfigController } from "./config/controller";
import { ConfigService } from "./config/services";
import { ConfigUtil } from "./config/config.util";
import { DepartmentController } from "./department/controller";
import { DepartmentService } from "./department/services";
import { OperationLogController } from "./operation-log/controller";
import { OperationLogService } from "./operation-log/services";

const systemContainer = new ContainerModule(
  (
    bind: interfaces.Bind,
    unbind: interfaces.Unbind,
    isBound: interfaces.IsBound,
    rebind: interfaces.Rebind
  ) => {
    /*
     * 菜单
     */
    bind<Menu>(Menu).toSelf();
    bind<MenuService>(MenuService).toSelf();
    /*
     * 用户
     */
    bind<UserManager>(UserManager).toSelf();
    bind<UserManagerService>(UserManagerService).toSelf();
    /*
     * 角色
     */
    bind<Role>(Role).toSelf();
    bind<RoleService>(RoleService).toSelf();
    /*
     * 系统配置
     */
    bind<ConfigController>(ConfigController).toSelf();
    bind<ConfigService>(ConfigService).toSelf();
    bind<ConfigUtil>(ConfigUtil).toSelf().inSingletonScope();
    /*
     * 部门管理
     */
    bind<DepartmentController>(DepartmentController).toSelf();
    bind<DepartmentService>(DepartmentService).toSelf();
    /*
     * 操作日志
     */
    bind<OperationLogController>(OperationLogController).toSelf();
    bind<OperationLogService>(OperationLogService).toSelf();
  }
);

export { systemContainer };
