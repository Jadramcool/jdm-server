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
import { TodoService } from "./services";

/**
 * @swagger
 * tags:
 *   name: 通知管理
 *   description: 待办事项管理
 */

@controller("/todo")
export class Todo {
  constructor(
    @inject(TodoService)
    private readonly TodoService: TodoService,
    @inject(UtilService)
    private readonly UtilService: UtilService
  ) {}

  /**
   * @swagger
   * /todo/list:
   *   get:
   *     summary: 获取待办事项列表
   *     tags: [通知管理 - 待办事项]
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
   *         description: 待办事项标题关键词
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [pending, in_progress, completed, cancelled]
   *         description: 待办事项状态
   *       - in: query
   *         name: priority
   *         schema:
   *           type: string
   *           enum: [low, normal, high, urgent]
   *         description: 优先级
   *       - in: query
   *         name: dueDate
   *         schema:
   *           type: string
   *           format: date
   *         description: 截止日期
   *     responses:
   *       200:
   *         description: 获取待办事项列表成功
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
   *                           description:
   *                             type: string
   *                           status:
   *                             type: string
   *                           priority:
   *                             type: string
   *                           dueDate:
   *                             type: string
   *                             format: date-time
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
  public async getTodoList(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.TodoService.getTodoList();
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /todo/detail/{id}:
   *   get:
   *     summary: 获取待办事项详情
   *     tags: [通知管理 - 待办事项]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: 待办事项ID
   *     responses:
   *       200:
   *         description: 获取待办事项详情成功
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
   *                     description:
   *                       type: string
   *                     status:
   *                       type: string
   *                     priority:
   *                       type: string
   *                     dueDate:
   *                       type: string
   *                       format: date-time
   *                     completedAt:
   *                       type: string
   *                       format: date-time
   *                     createdAt:
   *                       type: string
   *                       format: date-time
   *                     updatedAt:
   *                       type: string
   *                       format: date-time
   *       401:
   *         description: 未授权
   *       404:
   *         description: 待办事项不存在
   */
  @Get("/detail/:id", JWT.authenticateJwt())
  public async getTodoDetail(req: Request, res: Response) {
    const todoId = Number(req.params.id);
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.TodoService.getTodoDetail(todoId);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /todo/create:
   *   post:
   *     summary: 创建待办事项
   *     tags: [通知管理 - 待办事项]
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
   *             properties:
   *               title:
   *                 type: string
   *                 description: 待办事项标题
   *                 example: "完成项目文档"
   *               description:
   *                 type: string
   *                 description: 待办事项描述
   *                 example: "编写项目的技术文档和用户手册"
   *               priority:
   *                 type: string
   *                 enum: [low, normal, high, urgent]
   *                 description: 优先级
   *                 default: "normal"
   *               dueDate:
   *                 type: string
   *                 format: date-time
   *                 description: 截止日期
   *               tags:
   *                 type: array
   *                 items:
   *                   type: string
   *                 description: 标签列表
   *               assigneeId:
   *                 type: number
   *                 description: 指派给的用户ID
   *     responses:
   *       200:
   *         description: 创建待办事项成功
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
   *                       description: 新创建的待办事项ID
   *       400:
   *         description: 请求参数错误
   *       401:
   *         description: 未授权
   */
  @Post("/create", JWT.authenticateJwt())
  public async createTodo(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.TodoService.createTodo(req.body, req.user);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /todo/update:
   *   put:
   *     summary: 更新待办事项
   *     tags: [通知管理 - 待办事项]
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
   *                 description: 待办事项ID
   *               title:
   *                 type: string
   *                 description: 待办事项标题
   *               description:
   *                 type: string
   *                 description: 待办事项描述
   *               status:
   *                 type: string
   *                 enum: [pending, in_progress, completed, cancelled]
   *                 description: 待办事项状态
   *               priority:
   *                 type: string
   *                 enum: [low, normal, high, urgent]
   *                 description: 优先级
   *               dueDate:
   *                 type: string
   *                 format: date-time
   *                 description: 截止日期
   *               tags:
   *                 type: array
   *                 items:
   *                   type: string
   *                 description: 标签列表
   *               assigneeId:
   *                 type: number
   *                 description: 指派给的用户ID
   *     responses:
   *       200:
   *         description: 更新待办事项成功
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
   *         description: 待办事项不存在
   */
  @Put("/update", JWT.authenticateJwt())
  public async updateTodo(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.TodoService.updateTodo(req.body, req.user);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /todo/updateOrder:
   *   put:
   *     summary: 更新待办事项排序
   *     description: 批量更新待办事项的排序顺序
   *     tags: [通知管理 - 待办事项]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - todoOrders
   *             properties:
   *               todoOrders:
   *                 type: array
   *                 items:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: number
   *                       description: 待办事项ID
   *                     order:
   *                       type: number
   *                       description: 排序值
   *                 description: 待办事项排序列表
   *                 example:
   *                   - id: 1
   *                     order: 1
   *                   - id: 2
   *                     order: 2
   *     responses:
   *       200:
   *         description: 更新排序成功
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
   *                   example: "排序更新成功"
   *                 data:
   *                   type: object
   *       400:
   *         description: 请求参数错误
   *       401:
   *         description: 未授权
   */
  @Put("/updateOrder", JWT.authenticateJwt())
  public async updateTodoOrder(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.TodoService.updateTodoOrder(req.body);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /todo/delete/{id}:
   *   delete:
   *     summary: 删除待办事项
   *     tags: [通知管理 - 待办事项]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: 待办事项ID
   *     responses:
   *       200:
   *         description: 删除待办事项成功
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
   *         description: 待办事项不存在
   */
  @Delete("/delete/:id", JWT.authenticateJwt())
  public async deleteTodo(req: Request, res: Response) {
    const todoId = Number(req.params.id);
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.TodoService.deleteTodo(todoId);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /todo/done/{id}/{status}:
   *   put:
   *     summary: 标记待办事项完成状态
   *     description: 将待办事项标记为完成或未完成，status可传可不传，不传默认为已完成，0：未完成，1：已完成
   *     tags: [通知管理 - 待办事项]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: 待办事项ID
   *       - in: path
   *         name: status
   *         required: false
   *         schema:
   *           type: integer
   *           enum: [0, 1]
   *           default: 1
   *         description: 完成状态（0=未完成，1=已完成）
   *     responses:
   *       200:
   *         description: 状态更新成功
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
   *                   example: "状态更新成功"
   *                 data:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: number
   *                     status:
   *                       type: integer
   *                     completedAt:
   *                       type: string
   *                       format: date-time
   *       401:
   *         description: 未授权
   *       404:
   *         description: 待办事项不存在
   */
  @Put("/done/:id/:status?", JWT.authenticateJwt())
  public async doneTodo(req: Request, res: Response) {
    const todoId = Number(req.params.id);
    const status = Number(req.params.status ? req.params.status : 1);
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.TodoService.doneTodo(todoId, status);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /todo/timeline:
   *   get:
   *     summary: 获取待办事项时间线
   *     description: 获取待办事项的时间线视图，按日期分组显示
   *     tags: [通知管理 - 待办事项]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date
   *         description: 开始日期
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date
   *         description: 结束日期
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [pending, in_progress, completed, cancelled]
   *         description: 待办事项状态
   *       - in: query
   *         name: priority
   *         schema:
   *           type: string
   *           enum: [low, normal, high, urgent]
   *         description: 优先级
   *     responses:
   *       200:
   *         description: 获取时间线成功
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
   *                     timeline:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           date:
   *                             type: string
   *                             format: date
   *                             description: 日期
   *                           todos:
   *                             type: array
   *                             items:
   *                               type: object
   *                               properties:
   *                                 id:
   *                                   type: number
   *                                 title:
   *                                   type: string
   *                                 status:
   *                                   type: string
   *                                 priority:
   *                                   type: string
   *                                 dueDate:
   *                                   type: string
   *                                   format: date-time
   *                     summary:
   *                       type: object
   *                       properties:
   *                         total:
   *                           type: number
   *                         completed:
   *                           type: number
   *                         pending:
   *                           type: number
   *                         overdue:
   *                           type: number
   *       401:
   *         description: 未授权
   */
  @Get("/timeline", JWT.authenticateJwt())
  public async getTodoTimeLine(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.TodoService.getTodoTimeLine();
    res.sendResult(data, code, message, errMsg);
  }
}
