// <reference path="../../global.d.ts" />
import {
  controller,
  httpGet as Get,
  httpPost as Post,
} from "inversify-express-utils";
import { UserService } from "./services";
import { inject } from "inversify"; // 装饰器 用于依赖注入
import { JWT } from "../../jwt";
import type { Request, Response } from "express";

@controller("/user")
export class User {
  // @param userService @inject(UserService): 这是一个装饰器，用于依赖注入。
  constructor(@inject(UserService) private readonly userService: UserService) {}

  @Get("/index", JWT.middleware())
  public async getUser(req: Request, res: Response) {
    let result = await this.userService.getList();
    res.sendResult(result, 200, "获取用户列表成功", "");
  }

  @Post("/register")
  public async registerUser(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.userService.registerUser(req.body);
    res.sendResult(data, code, message, errMsg);
  }

  @Post("/login")
  public async login(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.userService.login(req.body);
    res.sendResult(data, code, message, errMsg);
  }

  @Get("/info", JWT.middleware())
  public async getUserInfo(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.userService.getUserInfo(req.user?.id);
    res.sendResult(data, code, message, errMsg);
  }

  @Get("/premission/menu", JWT.middleware())
  public async getPremissionMenu(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.userService.getPremissionMenu(req.user?.id);
    res.sendResult(data, code, message, errMsg);
  }
}
