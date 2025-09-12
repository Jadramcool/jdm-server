import { UtilService } from "@/utils/utils";
import { JWT } from "@jwt/index";
import { Request, Response } from "express";
import { inject } from "inversify";
import {
  controller,
  httpDelete,
  httpGet,
  httpPost,
  httpPut,
} from "inversify-express-utils";
import { NavigationGroupService } from "./services";

/**
 * @swagger
 * tags:
 *   name: NavigationGroup
 *   description: 导航组管理
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     NavigationGroupCreateDto:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           description: 导航组名称
 *           example: "系统管理"
 *         icon:
 *           type: string
 *           description: 图标
 *           example: "setting"
 *         description:
 *           type: string
 *           description: 描述
 *           example: "系统管理相关功能"
 *         status:
 *           type: number
 *           description: 状态（1-启用，0-禁用）
 *           example: 1
 *     NavigationGroupUpdateDto:
 *       type: object
 *       required:
 *         - id
 *       properties:
 *         id:
 *           type: number
 *           description: 导航组ID
 *           example: 1
 *         name:
 *           type: string
 *           description: 导航组名称
 *           example: "系统管理"
 *         icon:
 *           type: string
 *           description: 图标
 *           example: "setting"
 *         description:
 *           type: string
 *           description: 描述
 *           example: "系统管理相关功能"
 *         status:
 *           type: number
 *           description: 状态（1-启用，0-禁用）
 *           example: 1
 *     NavigationGroupResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: number
 *           description: 导航组ID
 *         name:
 *           type: string
 *           description: 导航组名称
 *         icon:
 *           type: string
 *           description: 图标
 *         description:
 *           type: string
 *           description: 描述
 *         status:
 *           type: number
 *           description: 状态
 *         isDeleted:
 *           type: boolean
 *           description: 是否删除
 *         createdTime:
 *           type: string
 *           format: date-time
 *           description: 创建时间
 *         updatedTime:
 *           type: string
 *           format: date-time
 *           description: 更新时间
 */

@controller("/navigation-group")
export class NavigationGroup {
  constructor(
    @inject(NavigationGroupService)
    private navigationGroupService: NavigationGroupService,
    @inject(UtilService) private UtilService: UtilService
  ) {}

  /**
   * @swagger
   * /navigation-group/create:
   *   post:
   *     summary: 创建导航组
   *     tags: [导航管理 - 导航组]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/NavigationGroupCreateDto'
   *           examples:
   *             系统管理:
   *               summary: 创建系统管理导航组
   *               value:
   *                 name: "系统管理"
   *                 icon: "setting"
   *                 description: "系统管理相关功能"
   *                 status: 1
   *             用户中心:
   *               summary: 创建用户中心导航组
   *               value:
   *                 name: "用户中心"
   *                 icon: "user"
   *                 description: "用户相关功能"
   *                 status: 1
   *     responses:
   *       200:
   *         description: 创建成功
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
   *                   example: "导航组创建成功"
   *                 data:
   *                   $ref: '#/components/schemas/NavigationGroupResponse'
   *       400:
   *         description: 参数错误
   *       401:
   *         description: 未授权
   *       500:
   *         description: 服务器错误
   */
  @httpPost("/create", JWT.authenticateJwt())
  public async createNavigationGroup(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.navigationGroupService.createNavigationGroup(
      req.body,
      req.user
    );
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /navigation-group/update:
   *   put:
   *     summary: 更新导航组
   *     tags: [导航管理 - 导航组]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/NavigationGroupUpdateDto'
   *           examples:
   *             更新导航组:
   *               summary: 更新导航组信息
   *               value:
   *                 id: 1
   *                 name: "系统管理"
   *                 icon: "setting-new"
   *                 description: "系统管理相关功能（已更新）"
   *                 status: 1
   *     responses:
   *       200:
   *         description: 更新成功
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
   *                   example: "导航组更新成功"
   *                 data:
   *                   $ref: '#/components/schemas/NavigationGroupResponse'
   *       400:
   *         description: 参数错误
   *       401:
   *         description: 未授权
   *       404:
   *         description: 导航组不存在
   *       500:
   *         description: 服务器错误
   */
  @httpPut("/update", JWT.authenticateJwt())
  public async updateNavigationGroup(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.navigationGroupService.updateNavigationGroup(
      req.body,
      req.user
    );
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /navigation-group/delete:
   *   delete:
   *     summary: 删除导航组
   *     tags: [导航管理 - 导航组]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               id:
   *                 type: number
   *                 description: 导航组ID
   *                 example: 1
   *             required:
   *               - id
   *           examples:
   *             删除导航组:
   *               summary: 删除指定导航组
   *               value:
   *                 id: 1
   *     responses:
   *       200:
   *         description: 删除成功
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
   *                   example: "导航组删除成功"
   *                 data:
   *                   type: null
   *       400:
   *         description: 参数错误或导航组下存在导航项
   *       401:
   *         description: 未授权
   *       404:
   *         description: 导航组不存在
   *       500:
   *         description: 服务器错误
   */
  @httpDelete("/delete", JWT.authenticateJwt())
  public async deleteNavigationGroup(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.navigationGroupService.deleteNavigationGroup(
      req.body.id,
      req.user
    );
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /navigation-group/detail/{id}:
   *   get:
   *     summary: 获取导航组详情
   *     tags: [导航管理 - 导航组]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: number
   *         description: 导航组ID
   *         example: 1
   *     responses:
   *       200:
   *         description: 获取成功
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
   *                   example: "获取导航组详情成功"
   *                 data:
   *                   allOf:
   *                     - $ref: '#/components/schemas/NavigationGroupResponse'
   *                     - type: object
   *                       properties:
   *                         navigations:
   *                           type: array
   *                           description: 关联的导航项
   *                           items:
   *                             type: object
   *                             properties:
   *                               id:
   *                                 type: number
   *                               name:
   *                                 type: string
   *                               path:
   *                                 type: string
   *                               icon:
   *                                 type: string
   *                               sortOrder:
   *                                 type: number
   *       401:
   *         description: 未授权
   *       404:
   *         description: 导航组不存在
   *       500:
   *         description: 服务器错误
   */
  @httpGet("/detail/:id", JWT.authenticateJwt())
  public async getNavigationGroupDetail(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.navigationGroupService.getNavigationGroupDetail(
      parseInt(req.params.id),
      req.user
    );
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /navigation-group/list:
   *   get:
   *     summary: 获取导航组列表
   *     tags: [导航管理 - 导航组]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: pagination
   *         schema:
   *           type: string
   *         description: 分页信息（JSON字符串）
   *         example: '{"page":1,"pageSize":10}'
   *       - in: query
   *         name: filters
   *         schema:
   *           type: string
   *         description: 过滤条件（JSON字符串）
   *         example: '{}'
   *       - in: query
   *         name: options
   *         schema:
   *           type: string
   *         description: 其他选项（JSON字符串）
   *         example: '{"showPagination":true,"with_navigation":true}'
   *     responses:
   *       200:
   *         description: 获取成功
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
   *                   example: "获取导航组列表成功"
   *                 data:
   *                   type: object
   *                   properties:
   *                     list:
   *                       type: array
   *                       items:
   *                         allOf:
   *                           - $ref: '#/components/schemas/NavigationGroupResponse'
   *                           - type: object
   *                             properties:
   *                               _count:
   *                                 type: object
   *                                 properties:
   *                                   navigations:
   *                                     type: number
   *                                     description: 关联的导航项数量
   *                     total:
   *                       type: number
   *                       description: 总数量
   *                       example: 50
   *                     page:
   *                       type: number
   *                       description: 当前页码
   *                       example: 1
   *                     pageSize:
   *                       type: number
   *                       description: 每页数量
   *                       example: 10
   *                     totalPages:
   *                       type: number
   *                       description: 总页数
   *                       example: 5
   *       401:
   *         description: 未授权
   *       500:
   *         description: 服务器错误
   */
  @httpGet("/list", JWT.authenticateJwt())
  public async getNavigationGroupList(req: Request, res: Response) {
    const config = this.UtilService.parseQueryParams(req);
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.navigationGroupService.getNavigationGroupList(config);
    res.sendResult(data, code, message, errMsg);
  }
}

