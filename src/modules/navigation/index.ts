import { ContainerModule, interfaces } from "inversify";
import { NavigationGroup } from "./navigation-group/controller";
import { NavigationGroupService } from "./navigation-group/services";
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
    /*
     * 导航组
     */
    bind<NavigationGroup>(NavigationGroup).toSelf();
    bind<NavigationGroupService>(NavigationGroupService).toSelf();
  }
);

export { navigationContainer };
