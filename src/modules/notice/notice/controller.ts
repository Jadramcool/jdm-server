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
  httpDelete as Delete,
  httpGet as Get,
  httpPost as Post,
  httpPut as Put,
  controller,
} from "inversify-express-utils";
import { NoticeService } from "./services";

/**
 * @swagger
 * tags:
 *   name: Notice
 *   description: 通知管理
 */

@controller("/notice")
export class Notice {
  constructor(
    @inject(NoticeService)
    private readonly NoticeService: NoticeService,
    @inject(UtilService)
    private readonly UtilService: UtilService
  ) {}

  /**
   * @swagger
   * /notice/list:
   *   get:
   *     summary: 获取通知列表
   *     tags: [Notice]
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
   *           maximum: 100
   *           default: 10
   *         description: 每页数量
   *       - in: query
   *         name: title
   *         schema:
   *           type: string
   *         description: 通知标题关键词
   *       - in: query
   *         name: type
   *         schema:
   *           type: string
   *           enum: [system, user, announcement]
   *         description: 通知类型
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [draft, published, archived]
   *         description: 通知状态
   *     responses:
   *       200:
   *         description: 获取通知列表成功
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
   *                         type: object
   *                         properties:
   *                           id:
   *                             type: number
   *                           title:
   *                             type: string
   *                           content:
   *                             type: string
   *                           type:
   *                             type: string
   *                           status:
   *                             type: string
   *                           createdAt:
   *                             type: string
   *                             format: date-time
   *                     total:
   *                       type: number
   *                     page:
   *                       type: number
   *                     pageSize:
   *                       type: number
   *       401:
   *         description: 未授权
   */
  @Get("/list", JWT.authenticateJwt())
  public async getNoticeList(req: Request, res: Response) {
    // 将query的key-value value的json参数转换为对象
    const config = this.UtilService.parseQueryParams(req);
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.NoticeService.getNoticeList(config);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /notice/detail/{id}:
   *   get:
   *     summary: 获取通知详情
   *     tags: [Notice]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: 通知ID
   *     responses:
   *       200:
   *         description: 获取通知详情成功
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
   *                     id:
   *                       type: number
   *                     title:
   *                       type: string
   *                     content:
   *                       type: string
   *                     type:
   *                       type: string
   *                     status:
   *                       type: string
   *                     createdAt:
   *                       type: string
   *                       format: date-time
   *                     updatedAt:
   *                       type: string
   *                       format: date-time
   *       401:
   *         description: 未授权
   *       404:
   *         description: 通知不存在
   */
  @Get("/detail/:id", JWT.authenticateJwt())
  public async getNoticeDetail(req: Request, res: Response) {
    const noticeId = Number(req.params.id);
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.NoticeService.getNoticeDetail(noticeId);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /notice/create:
   *   post:
   *     summary: 创建通知
   *     tags: [Notice]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - title
   *               - content
   *               - type
   *             properties:
   *               title:
   *                 type: string
   *                 description: 通知标题
   *                 example: "系统维护通知"
   *               content:
   *                 type: string
   *                 description: 通知内容
   *                 example: "系统将于今晚进行维护，预计维护时间2小时"
   *               type:
   *                 type: string
   *                 enum: [system, user, announcement]
   *                 description: 通知类型
   *                 example: "system"
   *               status:
   *                 type: string
   *                 enum: [draft, published, archived]
   *                 description: 通知状态
   *                 default: "draft"
   *               priority:
   *                 type: string
   *                 enum: [low, normal, high, urgent]
   *                 description: 优先级
   *                 default: "normal"
   *               targetUsers:
   *                 type: array
   *                 items:
   *                   type: integer
   *                 description: 目标用户ID列表
   *     responses:
   *       200:
   *         description: 创建通知成功
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
   *                   example: "创建成功"
   *                 data:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: number
   *                       description: 新创建的通知ID
   *       400:
   *         description: 请求参数错误
   *       401:
   *         description: 未授权
   */
  @Post("/create", JWT.authenticateJwt())
  public async createNotice(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.NoticeService.createNotice(req.body, req.user);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /notice/update:
   *   put:
   *     summary: 更新通知
   *     tags: [Notice]
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
   *                 description: 通知ID
   *               title:
   *                 type: string
   *                 description: 通知标题
   *               content:
   *                 type: string
   *                 description: 通知内容
   *               type:
   *                 type: string
   *                 enum: [system, user, announcement]
   *                 description: 通知类型
   *               status:
   *                 type: string
   *                 enum: [draft, published, archived]
   *                 description: 通知状态
   *               priority:
   *                 type: string
   *                 enum: [low, normal, high, urgent]
   *                 description: 优先级
   *               targetUsers:
   *                 type: array
   *                 items:
   *                   type: integer
   *                 description: 目标用户ID列表
   *     responses:
   *       200:
   *         description: 更新通知成功
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
   *         description: 通知不存在
   */
  @Put("/update", JWT.authenticateJwt())
  public async updateNotice(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.NoticeService.updateNotice(req.body, req.user);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /notice/delete/{id}:
   *   delete:
   *     summary: 删除通知
   *     tags: [Notice]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: 通知ID
   *     responses:
   *       200:
   *         description: 删除通知成功
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
   *         description: 通知不存在
   */
  @Delete("/delete/:id", JWT.authenticateJwt())
  public async deleteNotice(req: Request, res: Response) {
    const roleId = Number(req.params.id);
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.NoticeService.deleteNotice(roleId);
    res.sendResult(data, code, message, errMsg);
  }
  /**
   * @swagger
   * /notice/send:
   *   post:
   *     summary: 发送通知
   *     description: 将通知发送给指定用户或所有用户
   *     tags: [Notice]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - noticeId
   *             properties:
   *               noticeId:
   *                 type: number
   *                 description: 通知ID
   *               userIds:
   *                 type: array
   *                 items:
   *                   type: integer
   *                 description: 目标用户ID列表，为空则发送给所有用户
   *               sendAll:
   *                 type: boolean
   *                 description: 是否发送给所有用户
   *                 default: false
   *     responses:
   *       200:
   *         description: 发送通知成功
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
   *                   example: "发送成功"
   *                 data:
   *                   type: object
   *                   properties:
   *                     sentCount:
   *                       type: number
   *                       description: 发送成功的用户数量
   *       400:
   *         description: 请求参数错误
   *       401:
   *         description: 未授权
   *       404:
   *         description: 通知不存在
   */
  @Post("/send", JWT.authenticateJwt())
  public async sendNotice(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.NoticeService.sendNotice(req.body);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /notice/userNotice:
   *   get:
   *     summary: 获取用户通知列表
   *     description: 获取当前用户的通知列表
   *     tags: [Notice]
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
   *           maximum: 100
   *           default: 10
   *         description: 每页数量
   *       - in: query
   *         name: isRead
   *         schema:
   *           type: boolean
   *         description: 是否已读（true=已读，false=未读）
   *       - in: query
   *         name: type
   *         schema:
   *           type: string
   *           enum: [system, user, announcement]
   *         description: 通知类型
   *     responses:
   *       200:
   *         description: 获取用户通知列表成功
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
   *                         type: object
   *                         properties:
   *                           id:
   *                             type: number
   *                           title:
   *                             type: string
   *                           content:
   *                             type: string
   *                           type:
   *                             type: string
   *                           isRead:
   *                             type: boolean
   *                           readAt:
   *                             type: string
   *                             format: date-time
   *                           createdAt:
   *                             type: string
   *                             format: date-time
   *                     total:
   *                       type: number
   *                     unreadCount:
   *                       type: number
   *                       description: 未读通知数量
   *       401:
   *         description: 未授权
   */
  @Get("/userNotice", JWT.authenticateJwt())
  public async getUserNoticeList(req: Request, res: Response) {
    // 将query的key-value value的json参数转换为对象
    const config = this.UtilService.parseQueryParams(req);
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.NoticeService.getUserNoticeList(config);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /notice/read:
   *   put:
   *     summary: 标记通知为已读
   *     description: 将指定通知标记为已读状态
   *     tags: [Notice]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               noticeId:
   *                 type: number
   *                 description: 通知ID
   *               noticeIds:
   *                 type: array
   *                 items:
   *                   type: integer
   *                 description: 批量标记的通知ID列表
   *               markAllRead:
   *                 type: boolean
   *                 description: 是否标记所有通知为已读
   *                 default: false
   *     responses:
   *       200:
   *         description: 标记已读成功
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
   *                   example: "标记成功"
   *                 data:
   *                   type: object
   *                   properties:
   *                     readCount:
   *                       type: number
   *                       description: 标记为已读的通知数量
   *       400:
   *         description: 请求参数错误
   *       401:
   *         description: 未授权
   *       404:
   *         description: 通知不存在
   */
  @Put("/read", JWT.authenticateJwt())
  public async userReadNotice(req: Request, res: Response) {
    console.log(req.body);
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.NoticeService.userReadNotice(req.body, req.user);
    res.sendResult(data, code, message, errMsg);
  }
}
