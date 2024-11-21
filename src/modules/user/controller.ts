/*
 * @Author: jdm
 * @Date: 2024-04-23 15:44:52
 * @LastEditors: jdm
 * @LastEditTime: 2024-09-24 14:29:05
 * @FilePath: \APP\src\modules\user\controller.ts
 * @Description:
 *
 */
// <reference path="../../global.d.ts" />
import type { Request, Response } from "express";
import { inject } from "inversify"; // 装饰器 用于依赖注入
import {
  controller,
  httpGet as Get,
  httpPost as Post,
  httpPut as Put,
} from "inversify-express-utils";
import { JWT } from "../../jwt";
import { UserService } from "./services";

@controller("/user")
export class User {
  // @param UserService @inject(UserService): 这是一个装饰器，用于依赖注入。
  constructor(@inject(UserService) private readonly UserService: UserService) {}

  @Post("/register")
  public async registerUser(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.UserService.registerUser(req.body);
    res.sendResult(data, code, message, errMsg);
  }

  @Post("/login")
  public async login(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.UserService.login(req.body);
    res.sendResult(data, code, message, errMsg);
  }

  @Get("/info", JWT.authenticateJwt())
  public async getUserInfo(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.UserService.getUserInfo(req.user?.id);
    res.sendResult(data, code, message, errMsg);
  }
  @Get("/userRole", JWT.authenticateJwt())
  public async getUserRole(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.UserService.getUserRole(req.user?.id);

    res.sendResult(data, code, message, errMsg);
  }

  /**
   *  获取用户菜单
   *  1. 获取用户角色
   *  2. 获取角色菜单
   *  3. 合并菜单
   *  4. 返回菜单列表
   * @param req
   * @param res
   */
  @Get("/menu", JWT.authenticateJwt())
  public async getUserMenu(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.UserService.getUserMenu(req.user?.id);

    res.sendResult(data, code, message, errMsg);
  }

  @Put("/update", JWT.authenticateJwt())
  public async update(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.UserService.update(req.body, req.user?.id);
    res.sendResult(data, code, message, errMsg);
  }

  @Post("/checkPassword", JWT.authenticateJwt())
  public async checkPassword(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.UserService.checkPassword(req.body, req.user?.id);
    res.sendResult(data, code, message, errMsg);
  }

  @Put("/updatePassword", JWT.authenticateJwt())
  public async updatePassword(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.UserService.updatePassword(req.body, req.user?.id);
    res.sendResult(data, code, message, errMsg);
  }
}
