import { ContainerModule, interfaces } from "inversify";
import { Navigation } from "./navigation/controller";
import { NavigationService } from "./navigation/services";

const navigationContainer = new ContainerModule(
  (
    bind: interfaces.Bind,
    unbind: interfaces.Unbind,
    isBound: interfaces.IsBound,
    rebind: interfaces.Rebind
  ) => {
    /*
     * 导航
     */
    bind<Navigation>(Navigation).toSelf();
    bind<NavigationService>(NavigationService).toSelf();
  }
);

export { navigationContainer };
