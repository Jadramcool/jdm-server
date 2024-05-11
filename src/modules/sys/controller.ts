// <reference path="../../global.d.ts" />
import {
  controller,
  httpGet as Get,
  httpPost as Post,
} from "inversify-express-utils";
import { SystemService } from "./services";
import { inject } from "inversify"; // 装饰器 用于依赖注入
import type { Request, Response } from "express";

@controller("/system")
export class System {
  // @param userService @inject(UserService): 这是一个装饰器，用于依赖注入。
  constructor(
    @inject(SystemService)
    private readonly SystemService: SystemService
  ) {}

  @Get("/premission")
  public async getMenu(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.SystemService.getPremissionList();
    res.sendResult(data, code, message, errMsg);
  }
}
