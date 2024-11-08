import { JWT } from "@/jwt";
import type { Request, Response } from "express";
import { inject } from "inversify"; // 装饰器 用于依赖注入
import {
  controller,
  httpGet as Get,
  interfaces,
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

  /**
   * @api {GET} /system/menu/list 获取菜单列表
   * @apiName GetMenu
   * @apiGroup 菜单模块
   * @apiDescription 获取菜单列表
   * @apiSuccess {Object} data 返回数据
   * @apiSuccess {Number} code 状态码
   * @apiSuccess {String} message 提示信息
   * @apiSuccess {String} errMsg 错误信息
   * @apiSuccessExample {json} Success-Response:
   * {
   *   "data": [
   *    {
   *         "id": 1,
   *         "name": "默认",
   *         "code": "Default",
   *         "type": "MENU",
   *         "pid": null,
   *         "path": "/default",
   *         "redirect": "/default/home",
   *         "icon": "fe:layout",
   *         "component": null,
   *         "layout": "normal",
   *         "keepAlive": null,
   *         "method": null,
   *         "description": null,
   *         "show": true,
   *         "enable": true,
   *         "order": 0
   *     }
   *   ],
   *   "code": 200,
   *   "message": "成功",
   *   "errMsg": ""
   * }
   */

  @Get("/list", JWT.authenticateJwt())
  public async getMenu(req: Request, res: Response) {
    const query: Recordable = req.query;
    console.log(req.user);
    const config = this.UtilService.parseQueryParams(req);
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.MenuService.getMenuList(config);
    res.sendResult(data, code, message, errMsg);
  }
}
