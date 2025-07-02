/*
 * @Author: jdm
 * @Date: 2025-06-06 16:01:30
 * @LastEditors: jdm 1051780106@qq.com
 * @LastEditTime: 2025-06-30 00:21:47
 * @FilePath: \jdm-server\src\modules\external\service.ts
 * @Description: 外部数据库查询服务
 */
import { inject, injectable } from "inversify";
import { ExternalDB, QueryParams, PaginatedResult } from "../../db/external";
import {
  CreateU3C3DataDto,
  UpdateU3C3DataDto,
  U3C3DataResponseDto,
  OperationResult,
} from "./dto";

@injectable()
export class ExternalService {
  constructor(@inject(ExternalDB) private externalDB: ExternalDB) {}

  /**
   * 获取爬虫数据
   * @param params 查询参数
   * @returns 分页结果
   */
  async getU3C3Data(params: ReqListConfig): Promise<PaginatedResult<any>> {
    try {
      const { page, pageSize } = params.pagination;
      const filters = params.filters;
      const queryParams: QueryParams = {
        page: page as number,
        pageSize: pageSize as number,
        sortBy: filters.sortBy as string, // 排序字段
        sortOrder: filters.sortOrder as "ASC" | "DESC", // 排序顺序
        title: filters.title as string,
        type: filters.type as string,
        date: filters.date as string,
        startTime: filters.startTime as string,
        endTime: filters.endTime as string,
      };
      const resp = await this.externalDB.getU3C3Data("u3c3", queryParams);
      return resp;
    } catch (error) {
      console.error("ExternalService.getU3C3Data error:", error);
      throw new Error("获取爬虫数据失败");
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

  /**
   * 通用新增数据方法
   * @param tableName 表名
   * @param data 要新增的数据
   * @returns 新增结果
   */
  async createData(tableName: string, data: any): Promise<OperationResult> {
    try {
      const result = await this.externalDB.createData(tableName, data);

      // 清除缓存
      this.externalDB.clearCache();

      return {
        success: true,
        data: result,
        message: "数据新增成功",
      };
    } catch (error) {
      console.error(`[服务] 新增${tableName}数据失败:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "新增失败",
        message: "数据新增失败",
      };
    }
  }

  /**
   * 新增u3c3数据（兼容性方法）
   * @param data 要新增的数据
   * @returns 新增结果
   */
  async createU3C3Data(data: CreateU3C3DataDto): Promise<OperationResult> {
    return this.createData("u3c3", data);
  }

  /**
   * 通用更新数据方法
   * @param tableName 表名
   * @param id 数据ID
   * @param data 要更新的数据
   * @param enableSoftDelete 是否启用软删除检查
   * @returns 更新结果
   */
  async updateData(
    tableName: string,
    id: number,
    data: any,
    enableSoftDelete: boolean = true
  ): Promise<OperationResult> {
    try {
      const result = await this.externalDB.updateData(
        tableName,
        id,
        data,
        enableSoftDelete
      );

      // 清除缓存
      this.externalDB.clearCache();

      return {
        success: true,
        data: result,
        message: "数据更新成功",
      };
    } catch (error) {
      console.error(`[服务] 更新${tableName}数据失败:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "更新失败",
        message: "数据更新失败",
      };
    }
  }

  /**
   * 更新u3c3数据（兼容性方法）
   * @param id 数据ID
   * @param data 要更新的数据
   * @returns 更新结果
   */
  async updateU3C3Data(
    id: number,
    data: UpdateU3C3DataDto
  ): Promise<OperationResult> {
    return this.updateData("u3c3", id, data);
  }

  /**
   * 通用删除数据方法
   * @param tableName 表名
   * @param id 数据ID
   * @param hardDelete 是否硬删除
   * @returns 删除结果
   */
  async deleteData(
    tableName: string,
    id: number,
    hardDelete: boolean = false
  ): Promise<OperationResult> {
    try {
      const result = await this.externalDB.deleteData(
        tableName,
        id,
        hardDelete
      );

      // 清除缓存
      this.externalDB.clearCache();

      return {
        success: true,
        data: result,
        message: "数据删除成功",
      };
    } catch (error) {
      console.error(`[服务] 删除${tableName}数据失败:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "删除失败",
        message: "数据删除失败",
      };
    }
  }

  /**
   * 软删除u3c3数据（兼容性方法）
   * @param id 数据ID
   * @returns 删除结果
   */
  async deleteU3C3Data(id: number): Promise<OperationResult> {
    return this.deleteData("u3c3", id);
  }

  /**
   * 通用根据ID获取数据方法
   * @param tableName 表名
   * @param id 数据ID
   * @param enableSoftDelete 是否启用软删除检查
   * @param selectFields 要查询的字段
   * @param cacheTTL 缓存时间
   * @returns 查询结果
   */
  async getDataById(
    tableName: string,
    id: number,
    enableSoftDelete: boolean = true,
    selectFields: string = "*",
    cacheTTL: number = 600000
  ): Promise<any | null> {
    try {
      const result = await this.externalDB.getDataById(
        tableName,
        id,
        enableSoftDelete,
        selectFields,
        cacheTTL
      );
      return result;
    } catch (error) {
      console.error(`[服务] 根据ID获取${tableName}数据失败:`, error);
      return null;
    }
  }

  /**
   * 根据ID获取u3c3数据（兼容性方法）
   * @param id 数据ID
   * @returns 查询结果
   */
  async getU3C3DataById(id: number): Promise<U3C3DataResponseDto | null> {
    return this.getDataById("u3c3", id);
  }
}

