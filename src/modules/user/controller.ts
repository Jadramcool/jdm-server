/*
 * @Author: jdm
 * @Date: 2024-04-23 15:44:52
 * @LastEditors: jdm
 * @LastEditTime: 2024-09-24 14:29:05
 * @FilePath: \APP\src\modules\user\controller.ts
 * @Description:
 *
 */
// <reference path="../../global.d.ts" />
import type { Request, Response } from "express";
import { inject } from "inversify"; // 装饰器 用于依赖注入
import {
  controller,
  httpGet as Get,
  httpPost as Post,
  httpPut as Put,
} from "inversify-express-utils";
import { JWT } from "../../jwt";
import { UserService } from "./services";

/**
 * @swagger
 * tags:
 *   name: 用户管理
 *   description: 用户管理
 */

@controller("/user")
export class User {
  // @param UserService @inject(UserService): 这是一个装饰器，用于依赖注入。
  constructor(@inject(UserService) private readonly UserService: UserService) {}

  /**
   * @swagger
   * /user/register:
   *   post:
   *     summary: 注册
   *     tags: [用户管理]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               username:
   *                 type: string
   *               password:
   *                 type: string
   *     responses:
   *       200:
   *         description: User registered successfully
   *       400:
   *         description: Invalid input
   */
  @Post("/register")
  public async registerUser(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.UserService.registerUser(req.body);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /user/login:
   *   post:
   *     summary: 登录
   *     tags: [用户管理]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               username:
   *                 type: string
   *                 default: admin
   *               password:
   *                 type: string
   *                 default: 123456..
   *     responses:
   *       200:
   *         description: User logged in successfully
   *       401:
   *         description: Unauthorized
   */
  @Post("/login")
  public async login(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.UserService.login(req.body);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /user/info:
   *   get:
   *     summary: 获取用户信息
   *     tags: [用户管理]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 获取用户信息成功
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
   *                   example: "获取用户信息成功"
   *                 data:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: number
   *                     username:
   *                       type: string
   *                     email:
   *                       type: string
   *       401:
   *         description: 未授权
   */
  @Get("/info", JWT.authenticateJwt())
  public async getUserInfo(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.UserService.getUserInfo(req.user?.id);
    res.sendResult(data, code, message, errMsg);
  }
  /**
   * @swagger
   * /user/userRole:
   *   get:
   *     summary: 获取用户角色
   *     tags: [用户管理]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 获取用户角色成功
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
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: number
   *                       name:
   *                         type: string
   *                       description:
   *                         type: string
   *       401:
   *         description: 未授权
   */
  @Get("/userRole", JWT.authenticateJwt())
  public async getUserRole(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.UserService.getUserRole(req.user?.id);

    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /user/menu:
   *   get:
   *     summary: 获取用户菜单
   *     description: 获取用户菜单列表，包括用户角色对应的菜单权限
   *     tags: [用户管理]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 获取用户菜单成功
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
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: number
   *                       name:
   *                         type: string
   *                       path:
   *                         type: string
   *                       icon:
   *                         type: string
   *                       children:
   *                         type: array
   *       401:
   *         description: 未授权
   */
  @Get("/menu", JWT.authenticateJwt())
  public async getUserMenu(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.UserService.getUserMenu(req.user?.id);

    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /user/update:
   *   put:
   *     summary: 更新用户信息
   *     tags: [用户管理]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               username:
   *                 type: string
   *                 description: 用户名
   *               email:
   *                 type: string
   *                 description: 邮箱
   *               phone:
   *                 type: string
   *                 description: 手机号
   *               avatar:
   *                 type: string
   *                 description: 头像URL
   *     responses:
   *       200:
   *         description: 更新用户信息成功
   *       401:
   *         description: 未授权
   *       400:
   *         description: 参数错误
   */
  @Put("/update", JWT.authenticateJwt())
  public async update(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.UserService.update(req.body, req.user?.id);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /user/checkPassword:
   *   post:
   *     summary: 验证用户密码
   *     tags: [用户管理]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - password
   *             properties:
   *               password:
   *                 type: string
   *                 description: 当前密码
   *     responses:
   *       200:
   *         description: 密码验证成功
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
   *                   type: boolean
   *       401:
   *         description: 未授权
   *       400:
   *         description: 密码错误
   */
  @Post("/checkPassword", JWT.authenticateJwt())
  public async checkPassword(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.UserService.checkPassword(req.body, req.user?.id);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /user/updatePassword:
   *   put:
   *     summary: 修改用户密码
   *     tags: [用户管理]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - oldPassword
   *               - newPassword
   *             properties:
   *               oldPassword:
   *                 type: string
   *                 description: 旧密码
   *               newPassword:
   *                 type: string
   *                 description: 新密码
   *                 minLength: 6
   *     responses:
   *       200:
   *         description: 密码修改成功
   *       401:
   *         description: 未授权
   *       400:
   *         description: 旧密码错误或新密码格式不正确
   */
  @Put("/updatePassword", JWT.authenticateJwt())
  public async updatePassword(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.UserService.updatePassword(req.body, req.user?.id);
    res.sendResult(data, code, message, errMsg);
  }
}
