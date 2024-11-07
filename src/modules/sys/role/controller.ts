/*
 * @Author: Jay
 * @Date: 2024-05-11 17:56:25
 * @LastEditors: jdm
 * @LastEditTime: 2024-08-21 15:42:05
 * @FilePath: \APP\src\modules\sys\user\controller.ts
 * @Description:
 *
 */
import { JWT } from "@/jwt";
import { UtilService } from "@/utils/utils";
import type { Request, Response } from "express";
import { inject } from "inversify"; // 装饰器 用于依赖注入
import { controller, httpGet as Get } from "inversify-express-utils";
import { RoleManageService } from "./services";

@controller("/system/role")
export class RoleManager {
  constructor(
    @inject(RoleManageService)
    private readonly RoleManageService: RoleManageService,
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
    }: Jres = await this.RoleManageService.getRoleList(config);
    res.sendResult(data, code, message, errMsg);
  }

  // @Get("/detail/:id", JWT.authenticateJwt())
  // public async getUserInfo(req: Request, res: Response) {
  //   const userId = Number(req.params.id);
  //   let {
  //     data = null,
  //     code = 200,
  //     message = "",
  //     errMsg = "",
  //   }: Jres = await this.RoleManageService.getUserInfo(userId);
  //   res.sendResult(data, code, message, errMsg);
  // }
}
