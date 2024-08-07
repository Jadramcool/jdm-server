import {
  controller,
  interfaces,
  httpGet as Get,
  httpPost as Post,
} from "inversify-express-utils";
import { PermissionService } from "./services";
import { inject } from "inversify"; // 装饰器 用于依赖注入
import type { Request, Response } from "express";

@controller("/system/permission")
export class Permission implements interfaces.Controller {
  // @param userService @inject(UserService): 这是一个装饰器，用于依赖注入。
  constructor(
    @inject(PermissionService)
    private readonly PermissionService: PermissionService
  ) {}

  @Get("/list")
  public async getPermissionMenu(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.PermissionService.getPermissionList(req.user?.id);
    res.sendResult(data, code, message, errMsg);
  }
}
