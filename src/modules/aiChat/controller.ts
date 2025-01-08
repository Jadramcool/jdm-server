import { JWT } from "@/jwt";
import { UtilService } from "@/utils/utils";
import type { Request, Response } from "express";
import { inject } from "inversify"; // 装饰器 用于依赖注入
import { controller, httpPost as Post } from "inversify-express-utils";
import { AiChatService } from "./services";

@controller("/aiChat")
export class AiChat {
  constructor(
    @inject(AiChatService)
    private readonly AiChatService: AiChatService,
    @inject(UtilService)
    private readonly UtilService: UtilService
  ) {}

  // 智谱清言api
  @Post("/zhipu-chat", JWT.authenticateJwt())
  public async aiChatZhiPu(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.AiChatService.aiChatZhiPu(req.body);
    res.sendResult(data, code, message, errMsg);
  }

  @Post("/chat", JWT.authenticateJwt())
  public async aiChat(req: Request, res: Response) {
    console.log("[ req.body ] >", req.body);
    // let {
    //   data = null,
    //   code = 200,
    //   message = "",
    //   errMsg = "",
    // }: Jres = await this.AiChatService.aiChat(req.body);

    const aiStream: any = await this.AiChatService.aiChat(req.body);
    console.log("🚀 ~ aiChat ~ aiStream:", aiStream);

    // 设置响应头，以流式传输数据
    res.setHeader("Content-Type", "text/plain"); // 可以根据需要设置其他类型
    res.setHeader("Transfer-Encoding", "chunked"); // 设置分块传输编码（可选）

    aiStream.pipe(res); // 将 OpenAI 流数据直接通过 pipe 传输给前端
    // res.sendResult(data, code, message, errMsg);
  }
}
