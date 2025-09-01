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
 *   name: 导航管理
 *   description: 导航管理
 * 
 * components:
 *   schemas:
 *     NavigationItem:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 导航ID
 *         title:
 *           type: string
 *           description: 导航标题
 *         content:
 *           type: string
 *           description: 导航内容
 *         type:
 *           type: string
 *           enum: [NOTICE, INFO, ACTIVITY]
 *           description: 导航类型
 *         status:
 *           type: string
 *           description: 导航状态
 *         authorId:
 *           type: integer
 *           description: 作者ID
 *         createdTime:
 *           type: string
 *           format: date-time
 *           description: 创建时间
 *         updatedTime:
 *           type: string
 *           format: date-time
 *           description: 更新时间
 *         author:
 *           type: object
 *           description: 作者信息
 *         receivers:
 *           type: array
 *           description: 接收者列表
 *           items:
 *             type: object
 * 
 *     NavigationCreateDto:
 *       type: object
 *       required:
 *         - title
 *         - type
 *       properties:
 *         title:
 *           type: string
 *           description: 导航标题
 *           example: "系统公告"
 *         content:
 *           type: string
 *           description: 导航内容
 *           example: "这是一条系统公告内容"
 *         type:
 *           type: string
 *           enum: [NOTICE, INFO, ACTIVITY]
 *           description: 导航类型
 *           example: "NOTICE"
 * 
 *     NavigationUpdateDto:
 *       type: object
 *       required:
 *         - id
 *       properties:
 *         id:
 *           type: integer
 *           description: 导航ID
 *           example: 1
 *         title:
 *           type: string
 *           description: 导航标题
 *           example: "更新后的标题"
 *         content:
 *           type: string
 *           description: 导航内容
 *           example: "更新后的内容"
 *         type:
 *           type: string
 *           enum: [NOTICE, INFO, ACTIVITY]
 *           description: 导航类型
 *           example: "INFO"
 * 
 *     NavigationListResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/NavigationItem'
 *         pagination:
 *           type: object
 *           properties:
 *             page:
 *               type: integer
 *               description: 当前页码
 *             pageSize:
 *               type: integer
 *               description: 每页数量
 *             totalRecords:
 *               type: integer
 *               description: 总记录数
 *             totalPages:
 *               type: integer
 *               description: 总页数
 * 
 *     ApiResponse:
 *       type: object
 *       properties:
 *         code:
 *           type: integer
 *           description: 响应状态码
 *         message:
 *           type: string
 *           description: 响应消息
 *         data:
 *           type: object
 *           description: 响应数据
 *         errMsg:
 *           type: string
 *           description: 错误信息
 */

@controller("/navigation")
export class Navigation {
  constructor(
    @inject(NavigationService)
    private readonly NavigationService: NavigationService,
    @inject(UtilService)
    private readonly UtilService: UtilService
  ) {}

  /**
   * @swagger
   * /navigation/list:
   *   get:
   *     tags: [导航管理 - 导航]
   *     summary: 获取导航列表
   *     description: 获取导航列表，支持分页和筛选
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *         description: 页码
   *       - in: query
   *         name: pageSize
   *         schema:
   *           type: integer
   *           default: 10
   *         description: 每页数量
   *       - in: query
   *         name: title
   *         schema:
   *           type: string
   *         description: 标题筛选
   *       - in: query
   *         name: type
   *         schema:
   *           type: string
   *           enum: [NOTICE, INFO, ACTIVITY]
   *         description: 类型筛选
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *         description: 状态筛选
   *       - in: query
   *         name: showPagination
   *         schema:
   *           type: boolean
   *           default: true
   *         description: 是否显示分页
   *     responses:
   *       200:
   *         description: 获取成功
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/NavigationListResponse'
   *       400:
   *         description: 获取失败
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiResponse'
   *       401:
   *         description: 未授权
   */
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

  /**
   * @swagger
   * /navigation/detail/{id}:
   *   get:
   *     tags: [导航管理 - 导航]
   *     summary: 获取导航详情
   *     description: 根据ID获取导航的详细信息
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: 导航ID
   *         example: 1
   *     responses:
   *       200:
   *         description: 获取成功
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/NavigationItem'
   *       400:
   *         description: 导航不存在或获取失败
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiResponse'
   *       401:
   *         description: 未授权
   */
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

  /**
   * @swagger
   * /navigation/create:
   *   post:
   *     tags: [导航管理 - 导航]
   *     summary: 创建导航
   *     description: 创建新的导航项
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/NavigationCreateDto'
   *           examples:
   *             notice:
   *               summary: 创建公告
   *               value:
   *                 title: "系统维护通知"
   *                 content: "系统将于今晚进行维护，请提前保存工作"
   *                 type: "NOTICE"
   *             info:
   *               summary: 创建信息
   *               value:
   *                 title: "新功能上线"
   *                 content: "我们推出了全新的功能模块"
   *                 type: "INFO"
   *     responses:
   *       200:
   *         description: 创建成功
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/NavigationItem'
   *       400:
   *         description: 参数验证失败或创建失败
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           property:
   *                             type: string
   *                             description: 验证失败的字段
   *                           value:
   *                             type: array
   *                             items:
   *                               type: string
   *                             description: 错误信息
   *       401:
   *         description: 未授权
   */
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

  /**
   * @swagger
   * /navigation/update:
   *   put:
   *     tags: [导航管理 - 导航]
   *     summary: 更新导航
   *     description: 更新现有的导航项信息
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/NavigationUpdateDto'
   *           examples:
   *             update:
   *               summary: 更新导航
   *               value:
   *                 id: 1
   *                 title: "更新后的标题"
   *                 content: "更新后的内容描述"
   *                 type: "INFO"
   *     responses:
   *       200:
   *         description: 更新成功
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/NavigationItem'
   *       400:
   *         description: 更新失败
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiResponse'
   *       401:
   *         description: 未授权
   *       404:
   *         description: 导航不存在
   */
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

  /**
   * @swagger
   * /navigation/delete/{id}:
   *   delete:
   *     tags: [导航管理 - 导航]
   *     summary: 删除导航
   *     description: 软删除指定的导航项（标记为已删除，不会物理删除）
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: 要删除的导航ID
   *         example: 1
   *     responses:
   *       200:
   *         description: 删除成功
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       type: "null"
   *                       description: 删除操作无返回数据
   *       400:
   *         description: 删除失败
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiResponse'
   *       401:
   *         description: 未授权
   *       404:
   *         description: 导航不存在
   */
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
