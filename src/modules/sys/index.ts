import { ContainerModule, interfaces } from "inversify";
import { Permission } from "./menu/controller";
import { PermissionService } from "./menu/services";
import { UserManager } from "./user/controller";
import { UserManagerService } from "./user/services";

const systemContainer = new ContainerModule(
  (
    bind: interfaces.Bind,
    unbind: interfaces.Unbind,
    isBound: interfaces.IsBound,
    rebind: interfaces.Rebind
  ) => {
    /*
     * 权限
     */
    bind<Permission>(Permission).toSelf();
    bind<PermissionService>(PermissionService).toSelf();
    /*
     * 用户
     */
    bind<UserManager>(UserManager).toSelf();
    bind<UserManagerService>(UserManagerService).toSelf();
  }
);

export { systemContainer };
