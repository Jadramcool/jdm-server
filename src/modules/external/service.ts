/*
 * @Author: jdm
 * @Date: 2025-06-06 16:01:30
 * @LastEditors: jdm 1051780106@qq.com
 * @LastEditTime: 2025-06-26 15:14:04
 * @FilePath: \jdm-server\src\modules\external\service.ts
 * @Description: 外部数据库查询服务
 */
import { inject, injectable } from "inversify";
import { ExternalDB, QueryParams, PaginatedResult } from "../../db/external";

@injectable()
export class ExternalService {
  constructor(@inject(ExternalDB) private externalDB: ExternalDB) {}

  /**
   * 获取爬虫数据
   * @param params 查询参数
   * @returns 分页结果
   */
  async getScrapedData(params: ReqListConfig): Promise<PaginatedResult<any>> {
    try {
      const { page, pageSize } = params.pagination;
      const filters = params.filters;
      console.log("🚀 ~ ExternalService ~ getScrapedData ~ filters:", filters);
      const queryParams: QueryParams = {
        page: page as number,
        pageSize: pageSize as number,
        title: filters.title as string,
        type: filters.type as string,
        date: filters.date as string,
        startTime: filters.startTime as string,
        endTime: filters.endTime as string,
      };
      const resp = await this.externalDB.getScrapedData("u3c3", queryParams);
      return resp;
    } catch (error) {
      console.error("ExternalService.getScrapedData error:", error);
      throw new Error("获取爬虫数据失败");
    }
  }

  /**
   * 获取视频库数据
   * @param params 查询参数
   * @returns 分页结果
   */
  async getSykbData(params: QueryParams): Promise<PaginatedResult<any>> {
    try {
      return await this.externalDB.getSykbData(params);
    } catch (error) {
      console.error("ExternalService.getSykbData error:", error);
      throw new Error("获取视频库数据失败");
    }
  }

  /**
   * 获取知识库数据
   * @param params 查询参数
   * @returns 分页结果
   */
  async getKbData(params: QueryParams): Promise<PaginatedResult<any>> {
    try {
      return await this.externalDB.getKbData(params);
    } catch (error) {
      console.error("ExternalService.getKbData error:", error);
      throw new Error("获取知识库数据失败");
    }
  }

  /**
   * 获取执行日志
   * @param params 查询参数
   * @returns 分页结果
   */
  async getExecutionLogs(params: QueryParams): Promise<PaginatedResult<any>> {
    try {
      return await this.externalDB.getExecutionLogs(params);
    } catch (error) {
      console.error("ExternalService.getExecutionLogs error:", error);
      throw new Error("获取执行日志失败");
    }
  }
}

