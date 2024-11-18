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
import {
  controller,
  httpDelete as Delete,
  httpGet as Get,
  httpPost as Post,
  httpPut as Put,
} from "inversify-express-utils";
import { RoleService } from "./services";

@controller("/system/role")
export class Role {
  constructor(
    @inject(RoleService)
    private readonly RoleService: RoleService,
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
    }: Jres = await this.RoleService.getRoleList(config);
    res.sendResult(data, code, message, errMsg);
  }

  @Post("/create", JWT.authenticateJwt())
  public async createRole(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.RoleService.createRole(req.body);
    res.sendResult(data, code, message, errMsg);
  }

  @Put("/update", JWT.authenticateJwt())
  public async updateRole(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.RoleService.updateRole(req.body);
    res.sendResult(data, code, message, errMsg);
  }

  @Delete("/delete/:id", JWT.authenticateJwt())
  public async deleteRole(req: Request, res: Response) {
    const roleId = Number(req.params.id);
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.RoleService.deleteRole(roleId);
    res.sendResult(data, code, message, errMsg);
  }

  @Get("/detail/:id", JWT.authenticateJwt())
  public async getRole(req: Request, res: Response) {
    const roleId = Number(req.params.id);
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.RoleService.getRole(roleId);
    res.sendResult(data, code, message, errMsg);
  }

  @Post("/update/menu", JWT.authenticateJwt())
  public async updateRoleMenu(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.RoleService.updateRoleMenu(req.body);
    res.sendResult(data, code, message, errMsg);
  }
}
