import { ContainerModule, interfaces } from "inversify";
import { XiaoCheng } from "./controller";
import { XiaoChengService } from "./services";

const xiaoChengContainer = new ContainerModule((bind: interfaces.Bind) => {
  /*
   * ai问答
   */
  bind<XiaoCheng>(XiaoCheng).toSelf();
  bind<XiaoChengService>(XiaoChengService).toSelf();
});

export { xiaoChengContainer };
