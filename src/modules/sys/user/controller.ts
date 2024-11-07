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
import { controller, httpGet as Get } from "inversify-express-utils";
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
    console.log("🚀 ~ UserManager ~ getUser ~ config:", config);
    // 打印时间
    console.log("-------", new Date().toLocaleString());
    console.log("🚀 query:", query);
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
}
