/*
 * @Author: Assistant
 * @Date: 2024-12-20
 * @LastEditors: Assistant
 * @LastEditTime: 2024-12-20
 * @FilePath: \jdm-server\src\modules\sys\operation-log\controller.ts
 * @Description: 操作日志控制器
 */
import { JWT } from "@/jwt";
import type { Request, Response } from "express";
import { inject } from "inversify";
import {
  controller,
  httpDelete as Delete,
  httpGet as Get,
  httpPost as Post,
} from "inversify-express-utils";
import { UtilService } from "../../../utils/utils";
import { OperationLogService } from "./services";

/**
 * @swagger
 * tags:
 *   name: 系统管理
 *   description: 操作日志管理相关接口
 */
@controller("/system/operation-log")
export class OperationLogController {
  /**
   * 构造函数，注入依赖服务
   * @param operationLogService 操作日志服务
   * @param utilService 工具服务
   */
  constructor(
    @inject(OperationLogService)
    private readonly operationLogService: OperationLogService,
    @inject(UtilService)
    private readonly utilService: UtilService
  ) {}

  /**
   * @swagger
   * /system/operation-log/list:
   *   get:
   *     summary: 获取操作日志列表
   *     tags: [系统管理 - 操作日志]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *         description: 页码
   *       - in: query
   *         name: pageSize
   *         schema:
   *           type: integer
   *         description: 每页数量
   *       - in: query
   *         name: operationType
   *         schema:
   *           type: string
   *         description: 操作类型
   *       - in: query
   *         name: operationStatus
   *         schema:
   *           type: string
   *         description: 操作状态
   *       - in: query
   *         name: userId
   *         schema:
   *           type: integer
   *         description: 操作用户ID
   *       - in: query
   *         name: module
   *         schema:
   *           type: string
   *         description: 操作模块
   *       - in: query
   *         name: startTime
   *         schema:
   *           type: string
   *           format: date-time
   *         description: 开始时间
   *       - in: query
   *         name: endTime
   *         schema:
   *           type: string
   *           format: date-time
   *         description: 结束时间
   *     responses:
   *       200:
   *         description: 获取操作日志列表成功
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
  public async getOperationLogList(req: Request, res: Response) {
    const config = this.utilService.parseQueryParams(req);
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.operationLogService.getLogList(config);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /system/operation-log/detail/{id}:
   *   get:
   *     summary: 获取操作日志详情
   *     tags: [系统管理 - 操作日志]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: 操作日志ID
   *     responses:
   *       200:
   *         description: 获取操作日志详情成功
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
   *       401:
   *         description: 未授权
   *       404:
   *         description: 操作日志不存在
   */
  @Get("/detail/:id", JWT.authenticateJwt())
  public async getOperationLogDetail(req: Request, res: Response) {
    const logId = Number(req.params.id);
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.operationLogService.getLogById(logId);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /system/operation-log/stats:
   *   get:
   *     summary: 获取操作日志统计信息
   *     tags: [系统管理 - 操作日志]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 获取统计信息成功
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
   *                     total:
   *                       type: number
   *                     todayCount:
   *                       type: number
   *                     successCount:
   *                       type: number
   *                     failureCount:
   *                       type: number
   *                     typeStats:
   *                       type: array
   *                     moduleStats:
   *                       type: array
   *       401:
   *         description: 未授权
   */
  @Get("/stats", JWT.authenticateJwt())
  public async getOperationLogStats(req: Request, res: Response) {
    try {
      const data = await this.operationLogService.getLogStats();
      res.sendResult(data, 200, "获取操作日志统计成功");
    } catch (error) {
      res.sendResult(null, 500, "获取操作日志统计失败", error.message);
    }
  }

  /**
   * @swagger
   * /system/operation-log/delete/{id}:
   *   delete:
   *     summary: 删除操作日志
   *     tags: [系统管理 - 操作日志]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: 操作日志ID
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
   *       401:
   *         description: 未授权
   *       404:
   *         description: 操作日志不存在
   */
  @Delete("/delete/:id", JWT.authenticateJwt())
  public async deleteOperationLog(req: Request, res: Response) {
    const logId = Number(req.params.id);
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.operationLogService.deleteLog(logId);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /system/operation-log/batch-delete:
   *   post:
   *     summary: 批量删除操作日志
   *     tags: [系统管理 - 操作日志]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               ids:
   *                 type: array
   *                 items:
   *                   type: integer
   *                 description: 要删除的日志ID数组
   *             required:
   *               - ids
   *     responses:
   *       200:
   *         description: 批量删除成功
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
   *       401:
   *         description: 未授权
   */
  @Post("/batch-delete", JWT.authenticateJwt())
  public async batchDeleteOperationLog(req: Request, res: Response) {
    const { ids } = req.body;
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.operationLogService.batchDeleteLogs(ids);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /system/operation-log/clear-expired:
   *   post:
   *     summary: 清理过期操作日志
   *     tags: [系统管理 - 操作日志]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: false
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               days:
   *                 type: integer
   *                 description: 保留天数，默认30天
   *     responses:
   *       200:
   *         description: 清理成功
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
   *                     deletedCount:
   *                       type: number
   *       401:
   *         description: 未授权
   */
  @Post("/clear-expired", JWT.authenticateJwt())
  public async clearExpiredOperationLog(req: Request, res: Response) {
    const { days = 30 } = req.body;
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.operationLogService.cleanExpiredLogs(days);
    res.sendResult(data, code, message, errMsg);
  }
}
