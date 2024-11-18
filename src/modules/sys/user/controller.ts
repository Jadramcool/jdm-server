/*
 * @Author: Jay
 * @Date: 2024-05-11 17:56:25
 * @LastEditors: jdm
 * @LastEditTime: 2024-09-24 11:47:56
 * @FilePath: \APP\src\modules\sys\user\controller.ts
 * @Description:
 *
 */
import { JWT } from "@/jwt";
import type { Request, Response } from "express";
import { inject } from "inversify"; // 装饰器 用于依赖注入
import {
  controller,
  httpGet as Get,
  httpPost as Post,
  httpPut as Put,
} from "inversify-express-utils";
import { UtilService } from "../../../utils/utils";
import { UserManagerService } from "./services";

@controller("/system/user")
export class UserManager {
  // @param userService @inject(UserService): 这是一个装饰器，用于依赖注入。
  constructor(
    @inject(UserManagerService)
    private readonly UserManagerService: UserManagerService,
    @inject(UtilService)
    private readonly UtilService: UtilService
  ) {}

  @Get("/list", JWT.authenticateJwt())
  public async getUser(req: Request, res: Response) {
    // 将query的key-value value的json参数转换为对象
    const query: any = req.query;

    const config = this.UtilService.parseQueryParams(req);
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.UserManagerService.getUserList(config);
    res.sendResult(data, code, message, errMsg);
  }

  @Get("/detail/:id", JWT.authenticateJwt())
  public async getUserInfo(req: Request, res: Response) {
    const userId = Number(req.params.id);
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.UserManagerService.getUserInfo(userId);
    res.sendResult(data, code, message, errMsg);
  }

  // 创建用户
  @Post("/create", JWT.authenticateJwt())
  public async createUser(req: Request, res: Response) {
    console.log(req.body);
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.UserManagerService.createUser(req.body);
    res.sendResult(data, code, message, errMsg);
  }

  // 更新用户
  @Put("/update", JWT.authenticateJwt())
  public async updateUser(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.UserManagerService.updateUser(req.body);
    res.sendResult(data, code, message, errMsg);
  }

  // 删除用户
  @Put("/delete/:id", JWT.authenticateJwt())
  public async deleteUser(req: Request, res: Response) {
    const userId = Number(req.params.id);
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.UserManagerService.deleteUser(userId);
    res.sendResult(data, code, message, errMsg);
  }

  // 批量删除用户
  @Put("/batchDelete", JWT.authenticateJwt())
  public async batchDeleteUser(req: Request, res: Response) {
    const ids = req.body?.ids ? req.body.ids : [];

    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.UserManagerService.deleteUser(ids);
    res.sendResult(data, code, message, errMsg);
  }

  // 启用/禁用用户
  @Put("/status/:id", JWT.authenticateJwt())
  public async updateUserStatus(req: Request, res: Response) {
    const userId = Number(req.params.id);
    const status = Number(req.body.status);
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.UserManagerService.updateUserStatus(userId, status);
    res.sendResult(data, code, message, errMsg);
  }
}
