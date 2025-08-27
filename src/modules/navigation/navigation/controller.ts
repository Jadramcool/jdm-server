import { JWT } from "@/jwt";
import { UtilService } from "@/utils/utils";
import type { Request, Response } from "express";
import { inject } from "inversify"; // 装饰器 用于依赖注入
import {
  httpDelete as Delete,
  httpGet as Get,
  httpPost as Post,
  httpPut as Put,
  controller,
} from "inversify-express-utils";
import { NavigationService } from "./services";

/**
 * @swagger
 * tags:
 *   name: Navigation
 *   description: 导航管理
 */

@controller("/navigation")
export class Navigation {
  constructor(
    @inject(NavigationService)
    private readonly NavigationService: NavigationService,
    @inject(UtilService)
    private readonly UtilService: UtilService
  ) {}

  @Get("/list", JWT.authenticateJwt())
  public async getNavigationList(req: Request, res: Response) {
    const config = this.UtilService.parseQueryParams(req);
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.NavigationService.getNavigationList(config);
    res.sendResult(data, code, message, errMsg);
  }

  @Get("/detail/:id", JWT.authenticateJwt())
  public async getNavigationDetail(req: Request, res: Response) {
    const noticeId = Number(req.params.id);
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.NavigationService.getNavigationDetail(noticeId);
    res.sendResult(data, code, message, errMsg);
  }
  @Post("/create", JWT.authenticateJwt())
  public async createNavigation(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.NavigationService.createNavigation(req.body, req.user);
    res.sendResult(data, code, message, errMsg);
  }

  @Put("/update", JWT.authenticateJwt())
  public async updateNavigation(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.NavigationService.updateNavigation(req.body, req.user);
    res.sendResult(data, code, message, errMsg);
  }

  @Delete("/delete/:id", JWT.authenticateJwt())
  public async deleteNavigation(req: Request, res: Response) {
    const roleId = Number(req.params.id);
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.NavigationService.deleteNavigation(roleId);
    res.sendResult(data, code, message, errMsg);
  }
}
