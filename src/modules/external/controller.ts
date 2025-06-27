/*
 * @Author: jdm
 * @Date: 2025-06-06 16:01:30
 * @LastEditors: jdm 1051780106@qq.com
 * @LastEditTime: 2025-06-27 10:21:07
 * @FilePath: \jdm-server\src\modules\external\controller.ts
 * @Description: 外部数据库查询控制器
 */
import { Request, Response } from "express";
import { inject, injectable } from "inversify";
import { controller, httpGet } from "inversify-express-utils";
import { ExternalService } from "./service";
import { QueryParams } from "../../db/external";
import { UtilService } from "@/utils/utils";

@controller("/external")
export class ExternalController {
  constructor(
    @inject(ExternalService)
    private externalService: ExternalService,
    @inject(UtilService)
    private readonly UtilService: UtilService
  ) {}

  /**
   * 获取爬虫数据
   * @param req
   * @param res
   */
  @httpGet("/u3c3/list")
  async getScrapedData(req: Request, res: Response) {
    try {
      const config = this.UtilService.parseQueryParams(req);
      const result = await this.externalService.getScrapedData(config);
      res.json({
        code: 200,
        message: "查询成功",
        data: result,
      });
    } catch (error) {
      console.error("获取爬虫数据失败:", error);
      res.status(500).json({
        code: 500,
        message: "查询失败",
        error: error instanceof Error ? error.message : "未知错误",
      });
    }
  }

  /**
   * 获取视频库数据
   * @param req
   * @param res
   */
  @httpGet("/sykb-data")
  async getSykbData(req: Request, res: Response) {
    try {
      const params: QueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        pageSize: req.query.pageSize
          ? parseInt(req.query.pageSize as string)
          : 10,
        title: req.query.title as string,
        startTime: req.query.startTime as string,
        endTime: req.query.endTime as string,
      };

      const result = await this.externalService.getSykbData(params);
      res.json({
        code: 200,
        message: "查询成功",
        data: result,
      });
    } catch (error) {
      console.error("获取视频库数据失败:", error);
      res.status(500).json({
        code: 500,
        message: "查询失败",
        error: error instanceof Error ? error.message : "未知错误",
      });
    }
  }

  /**
   * 获取知识库数据
   * @param req
   * @param res
   */
  @httpGet("/kb-data")
  async getKbData(req: Request, res: Response) {
    try {
      const params: QueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        pageSize: req.query.pageSize
          ? parseInt(req.query.pageSize as string)
          : 10,
        title: req.query.title as string,
        startTime: req.query.startTime as string,
        endTime: req.query.endTime as string,
      };

      const result = await this.externalService.getKbData(params);
      res.json({
        code: 200,
        message: "查询成功",
        data: result,
      });
    } catch (error) {
      console.error("获取知识库数据失败:", error);
      res.status(500).json({
        code: 500,
        message: "查询失败",
        error: error instanceof Error ? error.message : "未知错误",
      });
    }
  }

  /**
   * 获取执行日志
   * @param req
   * @param res
   */
  @httpGet("/execution-logs")
  async getExecutionLogs(req: Request, res: Response) {
    try {
      const params: QueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        pageSize: req.query.pageSize
          ? parseInt(req.query.pageSize as string)
          : 10,
        title: req.query.title as string,
        startTime: req.query.startTime as string,
        endTime: req.query.endTime as string,
      };

      const result = await this.externalService.getExecutionLogs(params);
      res.json({
        code: 200,
        message: "查询成功",
        data: result,
      });
    } catch (error) {
      console.error("获取执行日志失败:", error);
      res.status(500).json({
        code: 500,
        message: "查询失败",
        error: error instanceof Error ? error.message : "未知错误",
      });
    }
  }
}

