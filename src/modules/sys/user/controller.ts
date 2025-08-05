/*
 * @Author: Jay
 * @Date: 2024-05-11 17:56:25
 * @LastEditors: jdm
 * @LastEditTime: 2024-09-24 11:47:56
 * @FilePath: \APP\src\modules\sys\user\controller.ts
 * @Description:
 *
 */
import { JWT } from "@/jwt";
import type { Request, Response } from "express";
import { inject } from "inversify"; // 装饰器 用于依赖注入
import {
  controller,
  httpGet as Get,
  httpPost as Post,
  httpPut as Put,
} from "inversify-express-utils";
import { UtilService } from "../../../utils/utils";
import { UserManagerService } from "./services";

/**
 * @swagger
 * tags:
 *   name: System User
 *   description: 系统用户管理相关接口
 */
@controller("/system/user")
export class UserManager {
  // @param userService @inject(UserService): 这是一个装饰器，用于依赖注入。
  constructor(
    @inject(UserManagerService)
    private readonly UserManagerService: UserManagerService,
    @inject(UtilService)
    private readonly UtilService: UtilService
  ) {}

  /**
   * @swagger
   * /system/user/list:
   *   get:
   *     summary: 获取用户列表
   *     tags: [System User]
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
   *         name: username
   *         schema:
   *           type: string
   *         description: 用户名搜索
   *       - in: query
   *         name: email
   *         schema:
   *           type: string
   *         description: 邮箱搜索
   *       - in: query
   *         name: status
   *         schema:
   *           type: integer
   *           enum: [0, 1]
   *         description: 用户状态（0-禁用，1-启用）
   *     responses:
   *       200:
   *         description: 获取用户列表成功
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
   *                           username:
   *                             type: string
   *                           email:
   *                             type: string
   *                           status:
   *                             type: number
   *                           createTime:
   *                             type: string
   *                             format: date-time
   *                     total:
   *                       type: number
   *       401:
   *         description: 未授权
   */
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
    }: Jres = await this.UserManagerService.getUserList(config);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /system/user/detail/{id}:
   *   get:
   *     summary: 获取用户详情
   *     tags: [System User]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: 用户ID
   *     responses:
   *       200:
   *         description: 获取用户详情成功
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
   *                     username:
   *                       type: string
   *                     email:
   *                       type: string
   *                     avatar:
   *                       type: string
   *                     status:
   *                       type: number
   *                     roles:
   *                       type: array
   *                       items:
   *                         type: object
   *                     createTime:
   *                       type: string
   *                       format: date-time
   *                     updateTime:
   *                       type: string
   *                       format: date-time
   *       401:
   *         description: 未授权
   *       404:
   *         description: 用户不存在
   */
  @Get("/detail/:id", JWT.authenticateJwt())
  public async getUserInfo(req: Request, res: Response) {
    const userId = Number(req.params.id);
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.UserManagerService.getUserInfo(userId);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /system/user/create:
   *   post:
   *     summary: 创建用户
   *     tags: [System User]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - username
   *               - email
   *               - password
   *             properties:
   *               username:
   *                 type: string
   *                 description: 用户名
   *               email:
   *                 type: string
   *                 format: email
   *                 description: 邮箱
   *               password:
   *                 type: string
   *                 description: 密码
   *               avatar:
   *                 type: string
   *                 description: 头像URL
   *               status:
   *                 type: number
   *                 enum: [0, 1]
   *                 default: 1
   *                 description: 用户状态（0-禁用，1-启用）
   *               roleIds:
   *                 type: array
   *                 items:
   *                   type: number
   *                 description: 角色ID数组
   *     responses:
   *       200:
   *         description: 创建用户成功
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
   *       400:
   *         description: 请求参数错误
   *       401:
   *         description: 未授权
   *       409:
   *         description: 用户名或邮箱已存在
   */
  @Post("/create", JWT.authenticateJwt())
  public async createUser(req: Request, res: Response) {
    console.log(req.body);
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.UserManagerService.createUser(req.body);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /system/user/update:
   *   put:
   *     summary: 更新用户
   *     tags: [System User]
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
   *                 description: 用户ID
   *               username:
   *                 type: string
   *                 description: 用户名
   *               email:
   *                 type: string
   *                 format: email
   *                 description: 邮箱
   *               avatar:
   *                 type: string
   *                 description: 头像URL
   *               status:
   *                 type: number
   *                 enum: [0, 1]
   *                 description: 用户状态（0-禁用，1-启用）
   *               roleIds:
   *                 type: array
   *                 items:
   *                   type: number
   *                 description: 角色ID数组
   *     responses:
   *       200:
   *         description: 更新用户成功
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
   *         description: 用户不存在
   *       409:
   *         description: 用户名或邮箱已存在
   */
  @Put("/update", JWT.authenticateJwt())
  public async updateUser(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.UserManagerService.updateUser(req.body);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /system/user/delete/{id}:
   *   put:
   *     summary: 删除用户
   *     tags: [System User]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: 用户ID
   *     responses:
   *       200:
   *         description: 删除用户成功
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
   *         description: 用户不存在
   *       403:
   *         description: 无法删除当前用户或超级管理员
   */
  @Put("/delete/:id", JWT.authenticateJwt())
  public async deleteUser(req: Request, res: Response) {
    const userId = Number(req.params.id);
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.UserManagerService.deleteUser(userId);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /system/user/batchDelete:
   *   put:
   *     summary: 批量删除用户
   *     tags: [System User]
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
   *                 description: 用户ID数组
   *                 example: [1, 2, 3]
   *     responses:
   *       200:
   *         description: 批量删除用户成功
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
   *                   properties:
   *                     deletedCount:
   *                       type: number
   *                       description: 删除成功的用户数量
   *       400:
   *         description: 请求参数错误
   *       401:
   *         description: 未授权
   *       403:
   *         description: 部分用户无法删除
   */
  @Put("/batchDelete", JWT.authenticateJwt())
  public async batchDeleteUser(req: Request, res: Response) {
    const ids = req.body?.ids ? req.body.ids : [];

    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.UserManagerService.deleteUser(ids);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /system/user/status/{id}:
   *   put:
   *     summary: 启用/禁用用户
   *     description: 更新用户的启用状态
   *     tags: [System User]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: 用户ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - status
   *             properties:
   *               status:
   *                 type: number
   *                 enum: [0, 1]
   *                 description: 用户状态（0-禁用，1-启用）
   *     responses:
   *       200:
   *         description: 更新用户状态成功
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
   *       400:
   *         description: 请求参数错误
   *       401:
   *         description: 未授权
   *       404:
   *         description: 用户不存在
   *       403:
   *         description: 无法禁用当前用户或超级管理员
   */
  @Put("/status/:id", JWT.authenticateJwt())
  public async updateUserStatus(req: Request, res: Response) {
    const userId = Number(req.params.id);
    const status = Number(req.body.status);
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.UserManagerService.updateUserStatus(userId, status);
    res.sendResult(data, code, message, errMsg);
  }
}
