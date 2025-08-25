/*
 * @Author: Assistant
 * @Date: 2024-12-19
 * @Description: 部门管理控制器
 */

import { JWT } from "@/jwt";
import type { Request, Response } from "express";
import { inject } from "inversify";
import {
  controller,
  httpDelete as Delete,
  httpGet as Get,
  interfaces,
  httpPost as Post,
  httpPut as Put,
} from "inversify-express-utils";
import { UtilService } from "../../../utils/utils";
import { DepartmentService } from "./services";

/**
 * @swagger
 * tags:
 *   name: System Department
 *   description: 系统部门管理
 */

@controller("/system/department")
export class DepartmentController implements interfaces.Controller {
  constructor(
    @inject(DepartmentService)
    private readonly departmentService: DepartmentService,
    @inject(UtilService)
    private readonly utilService: UtilService
  ) {}

  /**
   * @swagger
   * /system/department/create:
   *   post:
   *     summary: 创建部门
   *     tags: [System Department]
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
   *               - code
   *             properties:
   *               name:
   *                 type: string
   *                 description: 部门名称
   *                 example: "技术部"
   *               code:
   *                 type: string
   *                 description: 部门编码
   *                 example: "TECH001"
   *               description:
   *                 type: string
   *                 description: 部门描述
   *                 example: "负责技术研发工作"
   *               parentId:
   *                 type: integer
   *                 description: 父部门ID
   *                 example: 1
   *               managerId:
   *                 type: integer
   *                 description: 部门负责人ID
   *                 example: 1
   *               sortOrder:
   *                 type: integer
   *                 description: 排序
   *                 minimum: 0
   *                 example: 1
   *               status:
   *                 type: string
   *                 enum: [ACTIVE, INACTIVE, ARCHIVED]
   *                 description: 部门状态
   *                 example: "ACTIVE"
   *     responses:
   *       201:
   *         description: 部门创建成功
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "部门创建成功"
   *                 data:
   *                   type: object
   *                   description: 创建的部门信息
   *       400:
   *         description: 请求参数错误
   *       409:
   *         description: 部门编码已存在
   *       500:
   *         description: 服务器内部错误
   */
  @Post("/create", JWT.authenticateJwt())
  public async createDepartment(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.departmentService.createDepartment(req.body);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /system/department/update:
   *   put:
   *     summary: 更新部门信息
   *     tags: [System Department]
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
   *                 type: integer
   *                 description: 部门ID
   *                 example: 1
   *               name:
   *                 type: string
   *                 description: 部门名称
   *                 example: "技术部"
   *               code:
   *                 type: string
   *                 description: 部门编码
   *                 example: "TECH001"
   *               description:
   *                 type: string
   *                 description: 部门描述
   *                 example: "负责技术研发工作"
   *               parentId:
   *                 type: integer
   *                 description: 父部门ID
   *                 example: 1
   *               managerId:
   *                 type: integer
   *                 description: 部门负责人ID
   *                 example: 1
   *               sortOrder:
   *                 type: integer
   *                 description: 排序
   *                 minimum: 0
   *                 example: 1
   *               status:
   *                 type: string
   *                 enum: [ACTIVE, INACTIVE, ARCHIVED]
   *                 description: 部门状态
   *                 example: "ACTIVE"
   *     responses:
   *       200:
   *         description: 部门更新成功
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "部门更新成功"
   *                 data:
   *                   type: object
   *                   description: 更新后的部门信息
   *       400:
   *         description: 请求参数错误
   *       404:
   *         description: 部门不存在
   *       409:
   *         description: 部门编码已存在
   *       500:
   *         description: 服务器内部错误
   */
  @Put("/update", JWT.authenticateJwt())
  public async updateDepartment(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.departmentService.updateDepartment(req.body);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /system/department/list:
   *   get:
   *     summary: 获取部门列表（分页）
   *     tags: [System Department]
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
   *         name: name
   *         schema:
   *           type: string
   *         description: 部门名称关键字
   *       - in: query
   *         name: code
   *         schema:
   *           type: string
   *         description: 部门编码关键字
   *       - in: query
   *         name: parentId
   *         schema:
   *           type: integer
   *         description: 父部门ID
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [ACTIVE, INACTIVE, ARCHIVED]
   *         description: 部门状态
   *       - in: query
   *         name: includeChildren
   *         schema:
   *           type: boolean
   *         description: 是否包含子部门
   *     responses:
   *       200:
   *         description: 获取部门列表成功
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "获取部门列表成功"
   *                 data:
   *                   type: object
   *                   properties:
   *                     list:
   *                       type: array
   *                       items:
   *                         type: object
   *                     total:
   *                       type: integer
   *                     page:
   *                       type: integer
   *                     pageSize:
   *                       type: integer
   *       500:
   *         description: 服务器内部错误
   */
  @Get("/list", JWT.authenticateJwt())
  public async getDepartmentList(req: Request, res: Response) {
    const config = this.utilService.parseQueryParams(req);
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.departmentService.getDepartmentList(config);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /system/department/tree:
   *   get:
   *     summary: 获取部门树形结构
   *     tags: [System Department]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: parentId
   *         schema:
   *           type: integer
   *         description: 父部门ID，不传则获取所有根部门
   *     responses:
   *       200:
   *         description: 获取部门树形结构成功
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "获取部门树形结构成功"
   *                 data:
   *                   type: array
   *                   description: 部门树形结构
   *       500:
   *         description: 服务器内部错误
   */
  @Get("/tree", JWT.authenticateJwt())
  public async getDepartmentTree(req: Request, res: Response) {
    const { parentId } = req.query;
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.departmentService.getDepartmentTree(
      parentId ? parseInt(parentId as string) : undefined
    );
    res.sendResult(data, code, message, errMsg);
  }

  // 启用部门
  @Put("/enable/:id", JWT.authenticateJwt())
  public async enableDepartment(req: Request, res: Response) {
    const { id } = req.params;
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.departmentService.enableDepartment(parseInt(id));
    res.sendResult(data, code, message, errMsg);
  }

  // 禁用部门
  @Put("/disable/:id", JWT.authenticateJwt())
  public async disableDepartment(req: Request, res: Response) {
    const { id } = req.params;
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.departmentService.disableDepartment(parseInt(id));
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /system/department/detail/{id}:
   *   get:
   *     summary: 获取部门详情
   *     tags: [System Department]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: 部门ID
   *     responses:
   *       200:
   *         description: 获取成功
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 code:
   *                   type: integer
   *                   example: 200
   *                 message:
   *                   type: string
   *                   example: 获取成功
   *                 data:
   *                   type: object
   *                   description: 部门详情
   *       400:
   *         description: 部门不存在
   *       401:
   *         description: 未授权
   */
  @Get("/detail/:id", JWT.authenticateJwt())
  public async getDepartmentDetail(req: Request, res: Response) {
    const { id } = req.params;
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.departmentService.getDepartmentDetail(parseInt(id));
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /system/department/delete/{id}:
   *   delete:
   *     summary: 删除部门
   *     tags: [System Department]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: 部门ID
   *     responses:
   *       200:
   *         description: 删除成功
   *       400:
   *         description: 删除失败
   *       401:
   *         description: 未授权
   */
  @Delete("/delete/:id", JWT.authenticateJwt())
  public async deleteDepartment(req: Request, res: Response) {
    const { id } = req.params;
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.departmentService.deleteDepartment(parseInt(id));
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /system/department/members/{id}:
   *   get:
   *     summary: 获取部门成员列表
   *     tags: [System Department]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: 部门ID
   *       - in: query
   *         name: includeInactive
   *         schema:
   *           type: boolean
   *           default: false
   *         description: 是否包含非激活用户
   *     responses:
   *       200:
   *         description: 获取成功
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 code:
   *                   type: integer
   *                   example: 200
   *                 message:
   *                   type: string
   *                   example: 获取成功
   *                 data:
   *                   type: array
   *                   description: 部门成员列表
   *       401:
   *         description: 未授权
   */
  @Get("/members/:id", JWT.authenticateJwt())
  public async getDepartmentMembers(req: Request, res: Response) {
    const { id } = req.params;
    const { includeInactive } = req.query;
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.departmentService.getDepartmentMembers(
      parseInt(id),
      includeInactive === "true"
    );
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /system/department/assign-user:
   *   post:
   *     summary: 分配用户到部门
   *     tags: [System Department]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - userId
   *               - departmentId
   *             properties:
   *               userId:
   *                 type: integer
   *                 description: 用户ID
   *                 example: 1
   *               departmentId:
   *                 type: integer
   *                 description: 部门ID
   *                 example: 1
   *               isMain:
   *                 type: boolean
   *                 description: 是否为主部门
   *                 example: true
   *               position:
   *                 type: string
   *                 description: 职位
   *                 example: 高级工程师
   *     responses:
   *       200:
   *         description: 分配成功
   *       400:
   *         description: 分配失败
   *       401:
   *         description: 未授权
   */
  @Post("/assign-user", JWT.authenticateJwt())
  public async assignUserToDepartment(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.departmentService.assignUserToDepartment(req.body);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /system/department/batch-assign-users:
   *   post:
   *     summary: 批量分配用户到部门
   *     tags: [System Department]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - userIds
   *               - departmentId
   *             properties:
   *               userIds:
   *                 type: array
   *                 items:
   *                   type: integer
   *                 description: 用户ID数组
   *                 example: [1, 2, 3]
   *               departmentId:
   *                 type: integer
   *                 description: 部门ID
   *                 example: 1
   *               defaultPosition:
   *                 type: string
   *                 description: 默认职位
   *                 example: 普通员工
   *     responses:
   *       200:
   *         description: 批量分配完成
   *       400:
   *         description: 分配失败
   *       401:
   *         description: 未授权
   */
  @Post("/batch-assign-users", JWT.authenticateJwt())
  public async batchAssignUsersToDepartment(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.departmentService.batchAssignUsersToDepartment(
      req.body
    );
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /system/department/remove-user:
   *   delete:
   *     summary: 从部门移除用户
   *     tags: [System Department]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - userId
   *               - departmentId
   *             properties:
   *               userId:
   *                 type: integer
   *                 description: 用户ID
   *                 example: 1
   *               departmentId:
   *                 type: integer
   *                 description: 部门ID
   *                 example: 1
   *     responses:
   *       200:
   *         description: 移除成功
   *       400:
   *         description: 移除失败
   *       401:
   *         description: 未授权
   */
  @Delete("/remove-user", JWT.authenticateJwt())
  public async removeUserFromDepartment(req: Request, res: Response) {
    const { userId, departmentId } = req.body;
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.departmentService.removeUserFromDepartment(
      userId,
      departmentId
    );
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /system/department/assign-role:
   *   post:
   *     summary: 分配角色到部门
   *     tags: [System Department]
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
   *               - departmentId
   *             properties:
   *               roleId:
   *                 type: integer
   *                 description: 角色ID
   *                 example: 1
   *               departmentId:
   *                 type: integer
   *                 description: 部门ID
   *                 example: 1
   *               autoAssign:
   *                 type: boolean
   *                 description: 是否自动分配给该部门用户
   *                 example: true
   *               defaultPosition:
   *                 type: string
   *                 description: 默认职位
   *                 example: 普通员工
   *     responses:
   *       200:
   *         description: 分配成功
   *       400:
   *         description: 分配失败
   *       401:
   *         description: 未授权
   */
  @Post("/assign-role", JWT.authenticateJwt())
  public async assignRoleToDepartment(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.departmentService.assignRoleToDepartment(req.body);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /system/department/remove-role:
   *   delete:
   *     summary: 从部门移除角色
   *     tags: [System Department]
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
   *               - departmentId
   *             properties:
   *               roleId:
   *                 type: integer
   *                 description: 角色ID
   *                 example: 1
   *               departmentId:
   *                 type: integer
   *                 description: 部门ID
   *                 example: 1
   *     responses:
   *       200:
   *         description: 移除成功
   *       400:
   *         description: 移除失败
   *       401:
   *         description: 未授权
   */
  @Delete("/remove-role", JWT.authenticateJwt())
  public async removeRoleFromDepartment(req: Request, res: Response) {
    const { roleId, departmentId } = req.body;
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.departmentService.removeRoleFromDepartment(
      roleId,
      departmentId
    );
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /system/department/search:
   *   get:
   *     summary: 搜索部门
   *     tags: [System Department]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: keyword
   *         required: true
   *         schema:
   *           type: string
   *         description: 搜索关键字
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *           maximum: 50
   *         description: 限制数量
   *     responses:
   *       200:
   *         description: 搜索成功
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 code:
   *                   type: integer
   *                   example: 200
   *                 message:
   *                   type: string
   *                   example: 搜索成功
   *                 data:
   *                   type: array
   *                   description: 搜索结果
   *       401:
   *         description: 未授权
   */
  @Get("/search", JWT.authenticateJwt())
  public async searchDepartments(req: Request, res: Response) {
    const { keyword, limit } = req.query;
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.departmentService.searchDepartmentsByName(
      keyword as string,
      limit ? parseInt(limit as string) : 10
    );
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /system/department/stats:
   *   get:
   *     summary: 获取部门统计信息
   *     tags: [System Department]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: departmentId
   *         schema:
   *           type: integer
   *         description: 部门ID，不传则获取全部统计
   *     responses:
   *       200:
   *         description: 获取成功
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 code:
   *                   type: integer
   *                   example: 200
   *                 message:
   *                   type: string
   *                   example: 获取成功
   *                 data:
   *                   type: object
   *                   properties:
   *                     totalDepartments:
   *                       type: integer
   *                       description: 总部门数
   *                     activeDepartments:
   *                       type: integer
   *                       description: 激活部门数
   *                     inactiveDepartments:
   *                       type: integer
   *                       description: 非激活部门数
   *                     totalMembers:
   *                       type: integer
   *                       description: 总成员数
   *       401:
   *         description: 未授权
   */
  @Get("/stats", JWT.authenticateJwt())
  public async getDepartmentStats(req: Request, res: Response) {
    const { departmentId } = req.query;
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.departmentService.getDepartmentStats(
      departmentId ? parseInt(departmentId as string) : undefined
    );
    res.sendResult(data, code, message, errMsg);
  }
}
