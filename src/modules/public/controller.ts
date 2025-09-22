import { JWT } from "@/jwt";
import type { Request, Response } from "express";
import { inject } from "inversify"; // 装饰器 用于依赖注入
import { controller, httpPost as Post } from "inversify-express-utils";
import { PublicService } from "./services";

/**
 * @swagger
 * components:
 *   schemas:
 *     SortRequest:
 *       type: object
 *       required:
 *         - tableName
 *         - sourceId
 *         - position
 *       properties:
 *         tableName:
 *           type: string
 *           description: 表名
 *           example: "navigation"
 *         sourceId:
 *           type: integer
 *           description: 要移动的项目ID
 *           example: 5
 *         targetId:
 *           type: integer
 *           description: 目标项目ID（position为before/after时必需）
 *           example: 3
 *         position:
 *           type: string
 *           enum: ["before", "after", "first", "last"]
 *           description: 相对位置
 *           example: "after"
 *         sortField:
 *           type: string
 *           description: 排序字段名，默认为 'sortOrder'
 *           example: "sortOrder"
 *           default: "sortOrder"
 *         parentId:
 *           type: integer
 *           description: 父级ID（用于层级结构）
 *           example: 1
 *         parentField:
 *           type: string
 *           description: 父级字段名（用于层级结构）
 *           example: "parentId"
 *
 *     ResetSortRequest:
 *       type: object
 *       required:
 *         - tableName
 *       properties:
 *         tableName:
 *           type: string
 *           description: 表名
 *           example: "navigation"
 *         sortField:
 *           type: string
 *           description: 排序字段名，默认为 'sortOrder'
 *           example: "sortOrder"
 *           default: "sortOrder"
 *         orderBy:
 *           type: string
 *           description: 排序依据字段，默认为 'id'
 *           example: "createdTime"
 *           default: "id"
 *         orderDirection:
 *           type: string
 *           enum: ["asc", "desc"]
 *           description: 排序方向
 *           example: "asc"
 *         filters:
 *           type: object
 *           description: 筛选条件
 *           example: { "isDeleted": false }
 *
 *     ApiResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: object
 *           description: 响应数据
 *         code:
 *           type: integer
 *           description: 状态码
 *           example: 200
 *         message:
 *           type: string
 *           description: 响应消息
 *           example: "操作成功"
 *         errMsg:
 *           type: string
 *           description: 错误信息
 *           example: ""
 *
 *     SortResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/ApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 updatedCount:
 *                   type: integer
 *                   description: 更新的记录数量
 *                   example: 1
 *
 *     ResetSortResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/ApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 updatedCount:
 *                   type: integer
 *                   description: 更新的记录数量
 *                   example: 10
 *                 tableName:
 *                   type: string
 *                   description: 表名
 *                   example: "navigation"
 *                 sortField:
 *                   type: string
 *                   description: 排序字段名
 *                   example: "sortOrder"
 *                 orderBy:
 *                   type: string
 *                   description: 排序依据字段
 *                   example: "createdTime"
 *                 orderDirection:
 *                   type: string
 *                   description: 排序方向
 *                   example: "asc"
 *
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

@controller("/public")
export class Public {
  constructor(
    @inject(PublicService) private readonly PublicService: PublicService
  ) {}

  /**
   * @swagger
   * /public/sort:
   *   post:
   *     tags:
   *       - Public
   *     summary: 通用排序接口
   *     description: |
   *       通用的拖拽排序接口，支持多种排序场景：
   *       - 将项目移动到指定项目的前面或后面
   *       - 将项目移动到列表的最前面或最后面
   *       - 支持层级结构的排序
   *
   *       **算法特点：**
   *       - 高效：只更新被移动的项目，不重新分配所有项目的排序值
   *       - 智能：通过计算合适的排序值插入到目标位置
   *       - 稳定：使用中间值算法确保排序稳定性
   *       - 安全：确保排序值不会小于0，避免负数排序值
   *     security:
   *       - BearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/SortRequest'
   *           examples:
   *             moveAfter:
   *               summary: 移动到指定项目后面
   *               description: 将导航项5移动到导航项3的后面
   *               value:
   *                 tableName: "navigation"
   *                 sourceId: 5
   *                 targetId: 3
   *                 position: "after"
   *             moveBefore:
   *               summary: 移动到指定项目前面
   *               description: 将导航项5移动到导航项3的前面
   *               value:
   *                 tableName: "navigation"
   *                 sourceId: 5
   *                 targetId: 3
   *                 position: "before"
   *             moveFirst:
   *               summary: 移动到最前面
   *               description: 将导航项5移动到列表最前面
   *               value:
   *                 tableName: "navigation"
   *                 sourceId: 5
   *                 position: "first"
   *             moveLast:
   *               summary: 移动到最后面
   *               description: 将导航项5移动到列表最后面
   *               value:
   *                 tableName: "navigation"
   *                 sourceId: 5
   *                 position: "last"
   *             hierarchical:
   *               summary: 层级结构排序
   *               description: 在同一父级下移动部门
   *               value:
   *                 tableName: "department"
   *                 sourceId: 10
   *                 targetId: 8
   *                 position: "before"
   *                 parentId: 3
   *                 parentField: "parentId"
   *     responses:
   *       200:
   *         description: 排序成功
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SortResponse'
   *             examples:
   *               success:
   *                 summary: 排序成功
   *                 value:
   *                   data:
   *                     updatedCount: 1
   *                   code: 200
   *                   message: "排序成功，更新了 1 条记录"
   *                   errMsg: ""
   *       400:
   *         description: 参数错误
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiResponse'
   *             examples:
   *               invalidParams:
   *                 summary: 参数错误
   *                 value:
   *                   data: null
   *                   code: 400
   *                   message: "参数错误"
   *                   errMsg: "tableName 参数是必填的"
   *               tableNotFound:
   *                 summary: 表不存在
   *                 value:
   *                   data: null
   *                   code: 400
   *                   message: "不支持的表名"
   *                   errMsg: "表名 'invalid_table' 不存在或不支持排序操作"
   *       401:
   *         description: 未授权访问
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiResponse'
   *             example:
   *               data: null
   *               code: 401
   *               message: "未授权访问"
   *               errMsg: "请提供有效的JWT令牌"
   *       500:
   *         description: 服务器错误
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiResponse'
   *             example:
   *               data: null
   *               code: 500
   *               message: "服务器错误"
   *               errMsg: "数据库连接失败"
   */
  @Post("/sort", JWT.authenticateJwt())
  public async sort(req: Request, res: Response) {
    try {
      let {
        data = null,
        code = 200,
        message = "",
        errMsg = "",
      }: Jres = await this.PublicService.sort(req.body);
      res.sendResult(data, code, message, errMsg);
    } catch (err) {
      res.sendResult(null, 500, "服务器错误", err.message);
    }
  }

  /**
   * @swagger
   * /public/resetSort:
   *   post:
   *     tags:
   *       - Public
   *     summary: 批量重置排序接口
   *     description: |
   *       批量重置指定表的所有记录排序，将所有记录按照指定规则重新排序。
   *
   *       **功能特点：**
   *       - 支持自定义排序字段和排序依据
   *       - 支持筛选条件，只重置符合条件的记录
   *       - 使用10的倍数作为排序值，便于后续插入操作
   *       - 支持正序和倒序排列
   *       - 事务操作，确保数据一致性
   *
   *       **适用场景：**
   *       - 数据导入后需要重新排序
   *       - 排序值混乱需要重新整理
   *       - 批量调整排序规则
   *     security:
   *       - BearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/ResetSortRequest'
   *           examples:
   *             basicReset:
   *               summary: 基础重置排序
   *               description: 重置导航表的排序，按创建时间正序排列
   *               value:
   *                 tableName: "navigation"
   *                 sortField: "sortOrder"
   *                 orderBy: "createdTime"
   *                 orderDirection: "asc"
   *                 filters: {}
   *             filteredReset:
   *               summary: 条件筛选重置
   *               description: 只重置未删除的导航项排序
   *               value:
   *                 tableName: "navigation"
   *                 sortField: "sortOrder"
   *                 orderBy: "createdTime"
   *                 orderDirection: "asc"
   *                 filters:
   *                   isDeleted: false
   *             departmentReset:
   *               summary: 部门排序重置
   *               description: 重置部门表排序，按名称正序排列
   *               value:
   *                 tableName: "department"
   *                 sortField: "sortOrder"
   *                 orderBy: "name"
   *                 orderDirection: "asc"
   *                 filters:
   *                   status: "active"
   *             reverseOrder:
   *               summary: 倒序重置
   *               description: 按ID倒序重置排序
   *               value:
   *                 tableName: "navigation"
   *                 sortField: "sortOrder"
   *                 orderBy: "id"
   *                 orderDirection: "desc"
   *                 filters: {}
   *     responses:
   *       200:
   *         description: 重置排序成功
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ResetSortResponse'
   *             examples:
   *               success:
   *                 summary: 重置成功
   *                 value:
   *                   data:
   *                     updatedCount: 10
   *                     tableName: "navigation"
   *                     sortField: "sortOrder"
   *                     orderBy: "createdTime"
   *                     orderDirection: "asc"
   *                   code: 200
   *                   message: "重置排序成功"
   *                   errMsg: ""
   *               noRecords:
   *                 summary: 无记录需要重置
   *                 value:
   *                   data:
   *                     updatedCount: 0
   *                     tableName: "navigation"
   *                     sortField: "sortOrder"
   *                   code: 200
   *                   message: "没有需要重置排序的记录"
   *                   errMsg: ""
   *       400:
   *         description: 参数错误
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiResponse'
   *             examples:
   *               missingTableName:
   *                 summary: 缺少表名
   *                 value:
   *                   data: null
   *                   code: 400
   *                   message: "表名不能为空"
   *                   errMsg: "tableName 参数是必填的字符串类型"
   *               invalidTable:
   *                 summary: 无效表名
   *                 value:
   *                   data: null
   *                   code: 400
   *                   message: "不支持的表名"
   *                   errMsg: "表名 'invalid_table' 不存在或不支持排序操作"
   *       401:
   *         description: 未授权访问
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiResponse'
   *             example:
   *               data: null
   *               code: 401
   *               message: "未授权访问"
   *               errMsg: "请提供有效的JWT令牌"
   *       500:
   *         description: 服务器错误
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiResponse'
   *             example:
   *               data: null
   *               code: 500
   *               message: "重置排序失败"
   *               errMsg: "数据库事务执行失败"
   */
  @Post("/resetSort", JWT.authenticateJwt())
  public async resetSort(req: Request, res: Response) {
    try {
      let {
        data = null,
        code = 200,
        message = "",
        errMsg = "",
      }: Jres = await this.PublicService.resetSort(req.body);
      res.sendResult(data, code, message, errMsg);
    } catch (err) {
      res.sendResult(null, 500, "服务器错误", err.message);
    }
  }
}
