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
  controller,
  httpDelete as Delete,
  httpGet as Get,
  httpPost as Post,
  httpPut as Put,
} from "inversify-express-utils";
import { RoleService } from "./services";

/**
 * @swagger
 * tags:
 *   name: System Role
 *   description: 系统角色管理
 */

@controller("/system/role")
export class Role {
  constructor(
    @inject(RoleService)
    private readonly RoleService: RoleService,
    @inject(UtilService)
    private readonly UtilService: UtilService
  ) {}

  /**
   * @swagger
   * /system/role/list:
   *   get:
   *     summary: 获取角色列表
   *     tags: [System Role]
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
   *         description: 获取角色列表成功
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
   *                         $ref: '#/components/schemas/Role'
   *                     total:
   *                       type: number
   *       401:
   *         description: 未授权
   */
  @Get("/list", JWT.authenticateJwt())
  public async getRoleList(req: Request, res: Response) {
    // 将query的key-value value的json参数转换为对象
    const query: any = req.query;
    const config = this.UtilService.parseQueryParams(req);
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.RoleService.getRoleList(config);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /system/role/create:
   *   post:
   *     summary: 创建角色
   *     tags: [System Role]
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
   *             properties:
   *               name:
   *                 type: string
   *                 description: 角色名称
   *               description:
   *                 type: string
   *                 description: 角色描述
   *               permissions:
   *                 type: array
   *                 items:
   *                   type: string
   *                 description: 权限列表
   *     responses:
   *       200:
   *         description: 创建角色成功
   *       400:
   *         description: 参数错误
   *       401:
   *         description: 未授权
   *       409:
   *         description: 角色名称已存在
   */
  @Post("/create", JWT.authenticateJwt())
  public async createRole(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.RoleService.createRole(req.body);
    res.sendResult(data, code, message, errMsg);
  }

  @Put("/update", JWT.authenticateJwt())
  public async updateRole(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.RoleService.updateRole(req.body);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /system/role/delete/{id}:
   *   delete:
   *     summary: 删除角色
   *     tags: [System Role]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: 角色ID
   *     responses:
   *       200:
   *         description: 删除角色成功
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
   *         description: 角色不存在
   *       403:
   *         description: 角色已被使用，无法删除
   */
  @Delete("/delete/:id", JWT.authenticateJwt())
  public async deleteRole(req: Request, res: Response) {
    const roleId = Number(req.params.id);
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.RoleService.deleteRole(roleId);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /system/role/detail/{id}:
   *   get:
   *     summary: 获取角色详情
   *     tags: [System Role]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: 角色ID
   *     responses:
   *       200:
   *         description: 获取角色详情成功
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
   *                   example: "获取成功"
   *                 data:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: number
   *                       description: 角色ID
   *                     name:
   *                       type: string
   *                       description: 角色名称
   *                     code:
   *                       type: string
   *                       description: 角色编码
   *                     description:
   *                       type: string
   *                       description: 角色描述
   *                     status:
   *                       type: boolean
   *                       description: 角色状态
   *                     sort:
   *                       type: number
   *                       description: 排序
   *                     createTime:
   *                       type: string
   *                       format: date-time
   *                       description: 创建时间
   *                     updateTime:
   *                       type: string
   *                       format: date-time
   *                       description: 更新时间
   *       401:
   *         description: 未授权
   *       404:
   *         description: 角色不存在
   */
  @Get("/detail/:id", JWT.authenticateJwt())
  public async getRole(req: Request, res: Response) {
    const roleId = Number(req.params.id);
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.RoleService.getRole(roleId);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /system/role/update/menu:
   *   post:
   *     summary: 更新角色菜单权限
   *     description: 为指定角色分配菜单权限
   *     tags: [System Role]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - roleId
   *               - menuIds
   *             properties:
   *               roleId:
   *                 type: number
   *                 description: 角色ID
   *               menuIds:
   *                 type: array
   *                 items:
   *                   type: number
   *                 description: 菜单ID数组
   *                 example: [1, 2, 3, 4]
   *     responses:
   *       200:
   *         description: 更新角色菜单权限成功
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
   *                   example: "权限分配成功"
   *                 data:
   *                   type: object
   *       400:
   *         description: 请求参数错误
   *       401:
   *         description: 未授权
   *       404:
   *         description: 角色不存在
   */
  @Post("/update/menu", JWT.authenticateJwt())
  public async updateRoleMenu(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.RoleService.updateRoleMenu(req.body);
    res.sendResult(data, code, message, errMsg);
  }
}
