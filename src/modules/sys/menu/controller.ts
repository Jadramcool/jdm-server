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

/**
 * @swagger
 * tags:
 *   name: 系统管理
 *   description: 系统菜单管理
 */

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
   * @swagger
   * /system/menu/list:
   *   get:
   *     summary: 获取菜单列表
   *     tags: [系统管理 - 菜单管理]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: 页码
   *       - in: query
   *         name: pageSize
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 10
   *         description: 每页数量
   *       - in: query
   *         name: keyword
   *         schema:
   *           type: string
   *         description: 搜索关键词
   *     responses:
   *       200:
   *         description: 获取菜单列表成功
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 code:
   *                   type: number
   *                   example: 200
   *                 message:
   *                   type: string
   *                 data:
   *                   type: object
   *                   properties:
   *                     list:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/Menu'
   *                     total:
   *                       type: number
   *       401:
   *         description: 未授权
   */
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

  /**
   * @swagger
   * /system/menu/create:
   *   post:
   *     summary: 创建菜单
   *     tags: [系统管理 - 菜单管理]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - path
   *             properties:
   *               name:
   *                 type: string
   *                 description: 菜单名称
   *               path:
   *                 type: string
   *                 description: 菜单路径
   *               icon:
   *                 type: string
   *                 description: 菜单图标
   *               parentId:
   *                 type: number
   *                 description: 父菜单ID
   *               sortOrder:
   *                 type: number
   *                 description: 排序
   *               isVisible:
   *                 type: boolean
   *                 description: 是否可见
   *     responses:
   *       200:
   *         description: 创建菜单成功
   *       400:
   *         description: 参数错误
   *       401:
   *         description: 未授权
   */
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

  /**
   * @swagger
   * /system/menu/update:
   *   put:
   *     summary: 更新菜单
   *     tags: [系统管理 - 菜单管理]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - id
   *             properties:
   *               id:
   *                 type: number
   *                 description: 菜单ID
   *               name:
   *                 type: string
   *                 description: 菜单名称
   *               path:
   *                 type: string
   *                 description: 菜单路径
   *               component:
   *                 type: string
   *                 description: 组件路径
   *               icon:
   *                 type: string
   *                 description: 菜单图标
   *               parentId:
   *                 type: number
   *                 description: 父级菜单ID
   *               sort:
   *                 type: number
   *                 description: 排序
   *               type:
   *                 type: string
   *                 enum: [menu, button]
   *                 description: 菜单类型
   *               permission:
   *                 type: string
   *                 description: 权限标识
   *               status:
   *                 type: boolean
   *                 description: 状态
   *     responses:
   *       200:
   *         description: 更新菜单成功
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 code:
   *                   type: number
   *                   example: 200
   *                 message:
   *                   type: string
   *                   example: "更新成功"
   *                 data:
   *                   type: object
   *       400:
   *         description: 请求参数错误
   *       401:
   *         description: 未授权
   *       404:
   *         description: 菜单不存在
   */
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

  /**
   * @swagger
   * /system/menu/delete/{id}:
   *   delete:
   *     summary: 删除菜单
   *     tags: [系统管理 - 菜单管理]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: 菜单ID
   *     responses:
   *       200:
   *         description: 删除菜单成功
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 code:
   *                   type: number
   *                   example: 200
   *                 message:
   *                   type: string
   *                   example: "删除成功"
   *                 data:
   *                   type: object
   *       401:
   *         description: 未授权
   *       404:
   *         description: 菜单不存在
   *       403:
   *         description: 菜单下有子菜单，无法删除
   */
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

  /**
   * @swagger
   * /system/menu/batchDelete:
   *   put:
   *     summary: 批量删除菜单
   *     tags: [系统管理 - 菜单管理]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - ids
   *             properties:
   *               ids:
   *                 type: array
   *                 items:
   *                   type: number
   *                 description: 菜单ID数组
   *     responses:
   *       200:
   *         description: 批量删除菜单成功
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 code:
   *                   type: number
   *                   example: 200
   *                 message:
   *                   type: string
   *                   example: "删除成功"
   *                 data:
   *                   type: object
   *       400:
   *         description: 请求参数错误
   *       401:
   *         description: 未授权
   *       403:
   *         description: 部分菜单下有子菜单，无法删除
   */
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

  /**
   * @swagger
   * /system/menu/onlineMenus:
   *   get:
   *     summary: 获取在线菜单列表
   *     tags: [系统管理 - 菜单管理]
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: 页码
   *       - in: query
   *         name: pageSize
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 10
   *         description: 每页数量
   *       - in: query
   *         name: keyword
   *         schema:
   *           type: string
   *         description: 搜索关键词
   *     responses:
   *       200:
   *         description: 获取在线菜单列表成功
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 code:
   *                   type: number
   *                   example: 200
   *                 message:
   *                   type: string
   *                 data:
   *                   type: object
   *                   properties:
   *                     list:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/Menu'
   *                     total:
   *                       type: number
   */
  @Get("/onlineMenus")
  public async getOnlineMenus(req: Request, res: Response) {
    const config = this.UtilService.parseQueryParams(req);
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.MenuService.getOnlineMenuList(config);
    res.sendResult(data, code, message, errMsg);
  }
}
