import { JWT } from "@/jwt";
import type { Request, Response } from "express";
import { inject } from "inversify"; // 装饰器 用于依赖注入
import {
  controller,
  httpDelete as Delete,
  httpGet as Get,
  interfaces,
  httpPost as Post,
  httpPut as Put,
} from "inversify-express-utils";
import { UtilService } from "../../../utils/utils";
import { MenuService } from "./services";

@controller("/system/menu")
export class Menu implements interfaces.Controller {
  // @param userService @inject(UserService): 这是一个装饰器，用于依赖注入。
  constructor(
    @inject(MenuService)
    private readonly MenuService: MenuService,
    @inject(UtilService)
    private readonly UtilService: UtilService
  ) {}

  @Get("/list", JWT.authenticateJwt())
  public async getMenu(req: Request, res: Response) {
    const config = this.UtilService.parseQueryParams(req);
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.MenuService.getMenuList(config);
    res.sendResult(data, code, message, errMsg);
  }

  @Post("/create", JWT.authenticateJwt())
  public async createMenu(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.MenuService.createMenu(req.body);
    res.sendResult(data, code, message, errMsg);
  }

  // 更新菜单
  @Put("/update", JWT.authenticateJwt())
  public async updateMenu(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.MenuService.updateMenu(req.body);
    res.sendResult(data, code, message, errMsg);
  }

  // 删除菜单-单个
  @Delete("/delete/:id", JWT.authenticateJwt())
  public async deleteMenu(req: Request, res: Response) {
    const menuId = Number(req.params.id);
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.MenuService.deleteMenu(menuId);
    res.sendResult(data, code, message, errMsg);
  }

  // 删除菜单 - 批量
  @Put("/batchDelete", JWT.authenticateJwt())
  public async batchDeleteMenu(req: Request, res: Response) {
    const ids = req.body?.ids ? req.body.ids : [];

    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.MenuService.deleteMenu(ids);
    res.sendResult(data, code, message, errMsg);
  }
}
