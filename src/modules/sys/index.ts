import { ContainerModule, interfaces } from "inversify";
import { Menu } from "./menu/controller";
import { MenuService } from "./menu/services";
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
     * 菜单
     */
    bind<Menu>(Menu).toSelf();
    bind<MenuService>(MenuService).toSelf();
    /*
     * 用户
     */
    bind<UserManager>(UserManager).toSelf();
    bind<UserManagerService>(UserManagerService).toSelf();
  }
);

export { systemContainer };
