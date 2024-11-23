import { JWT } from "@/jwt";
import type { Request, Response } from "express";
import { inject } from "inversify"; // 装饰器 用于依赖注入
import { controller, httpPost as Post } from "inversify-express-utils";
import { UploadService } from "./services";

@controller("/upload")
export class Upload {
  constructor(
    @inject(UploadService) private readonly UploadService: UploadService
  ) {}

  @Post("/avatar", JWT.authenticateJwt())
  public async uploadAvatar(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.UploadService.uploadAvatar(req);
    res.sendResult(data, code, message, errMsg);
  }
}
