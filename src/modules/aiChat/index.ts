import { ContainerModule, interfaces } from "inversify";
import { AiChat } from "./controller";
import { AiChatService } from "./services";

const aiChatContainer = new ContainerModule((bind: interfaces.Bind) => {
  /*
   * ai问答
   */
  bind<AiChat>(AiChat).toSelf();
  bind<AiChatService>(AiChatService).toSelf();
});

export { aiChatContainer };
