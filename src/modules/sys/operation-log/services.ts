import { OperationStatus } from "@prisma/client";
import { inject, injectable } from "inversify";
import _ from "lodash";
import { PrismaDB } from "../../../db";
import { FilterHelper } from "../../../utils";
import {
  ICreateOperationLog,
  IOperationLogService,
  IOperationLogStats,
  ReqListConfig,
} from "./typings";

@injectable()
export class OperationLogService implements IOperationLogService {
  constructor(@inject(PrismaDB) private readonly prismaDB: PrismaDB) {}

  /**
   * 创建操作日志
   * @param data 操作日志数据
   * @returns 创建的操作日志
   */
  public async createLog(data: ICreateOperationLog) {
    try {
      const operationLog = await this.prismaDB.prisma.operationLog.create({
        data: {
          userId: data.userId,
          username: data.username,
          operationType: data.operationType,
          module: data.module,
          description: data.description,
          method: data.method,
          url: data.url,
          params: data.params,
          result: data.result,
          status: data.status || OperationStatus.SUCCESS,
          errorMessage: data.errorMessage,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          duration: data.duration,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
            },
          },
        },
      });

      return {
        success: true,
        data: operationLog,
        message: "操作日志创建成功",
      };
    } catch (error) {
      console.error("创建操作日志失败:", error);
      return {
        success: false,
        data: null,
        message: "操作日志创建失败",
        error: error.message,
      };
    }
  }

  /**
   * 查询操作日志列表
   * @param config 查询配置参数
   * @returns 操作日志列表
   */
  public async getLogList(config: ReqListConfig) {
    try {
      let { filters, options, pagination } = config;
      filters = filters || {};

      let sqlFilters = {};
      const keys = Object.keys(filters);
      if (keys.length > 0) {
        // 添加基础过滤条件
        sqlFilters = FilterHelper.addFilterCondition(filters, [
          "id",
          "userId",
          "username",
          "operationType",
          "module",
          "status",
          "ipAddress",
          "method",
          "url",
        ]);

        // 遍历时间字段并添加范围过滤条件
        ["createdTime", "updatedTime"].forEach((timeField) => {
          if (keys.includes(timeField)) {
            _.set(sqlFilters, timeField, {
              gte: new Date(filters[timeField][0]),
              lte: new Date(filters[timeField][1]),
            });
          }
        });
      }
      let result = [];
      let totalPages = 1;

      // !如果没有操作类型，则默认查询非查看操作
      if (!filters.operationType) {
        sqlFilters["operationType"] = {
          notIn: ["VIEW"],
        };
      }
      // 查询总数
      const totalRecords = await this.prismaDB.prisma.operationLog.count({
        where: sqlFilters,
      });

      let page = 1;
      let pageSize = 10;

      // 如果不显示分页，则直接返回所有数据
      if (
        options &&
        options.hasOwnProperty("showPagination") &&
        !options["showPagination"]
      ) {
        result = await this.prismaDB.prisma.operationLog.findMany({
          where: sqlFilters,
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdTime: "desc",
          },
        });
      } else {
        page = parseInt(pagination?.page as string) || 1;
        pageSize = parseInt(pagination?.pageSize as string) || 10;

        result = await this.prismaDB.prisma.operationLog.findMany({
          skip: (page - 1) * pageSize || 0,
          take: pageSize || 10,
          where: sqlFilters,
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdTime: "desc",
          },
        });

        totalPages = Math.ceil(totalRecords / pageSize);
      }

      // 分页信息
      const paginationData =
        options?.showPagination !== false
          ? {
              page,
              pageSize,
              totalRecords,
              totalPages,
            }
          : null;

      return {
        data: {
          data: result,
          pagination: paginationData,
        },
      };
    } catch (error) {
      console.error("查询操作日志列表失败:", error);
      return {
        success: false,
        data: null,
        message: "查询操作日志列表失败",
        error: error.message,
      };
    }
  }

  /**
   * 根据ID获取操作日志详情
   * @param id 操作日志ID
   * @returns 操作日志详情
   */
  public async getLogById(id: number) {
    try {
      const operationLog = await this.prismaDB.prisma.operationLog.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
            },
          },
        },
      });

      if (!operationLog) {
        return {
          success: false,
          data: null,
          message: "操作日志不存在",
        };
      }

      return {
        success: true,
        data: operationLog,
        message: "查询成功",
      };
    } catch (error) {
      console.error("查询操作日志详情失败:", error);
      return {
        success: false,
        data: null,
        message: "查询操作日志详情失败",
        error: error.message,
      };
    }
  }

  /**
   * 删除操作日志
   * @param id 操作日志ID
   * @returns 删除结果
   */
  public async deleteLog(id: number) {
    try {
      const operationLog = await this.prismaDB.prisma.operationLog.findUnique({
        where: { id },
      });

      if (!operationLog) {
        return {
          success: false,
          data: null,
          message: "操作日志不存在",
        };
      }

      await this.prismaDB.prisma.operationLog.delete({
        where: { id },
      });

      return {
        success: true,
        data: null,
        message: "删除成功",
      };
    } catch (error) {
      console.error("删除操作日志失败:", error);
      return {
        success: false,
        data: null,
        message: "删除操作日志失败",
        error: error.message,
      };
    }
  }

  /**
   * 批量删除操作日志
   * @param ids 操作日志ID数组
   * @returns 删除结果
   */
  public async batchDeleteLogs(ids: number[]) {
    try {
      const result = await this.prismaDB.prisma.operationLog.deleteMany({
        where: {
          id: {
            in: ids,
          },
        },
      });

      return {
        success: true,
        data: {
          deletedCount: result.count,
        },
        message: `成功删除 ${result.count} 条操作日志`,
      };
    } catch (error) {
      console.error("批量删除操作日志失败:", error);
      return {
        success: false,
        data: null,
        message: "批量删除操作日志失败",
        error: error.message,
      };
    }
  }

  /**
   * 清理过期日志
   * @param days 保留天数
   * @returns 清理结果
   */
  public async cleanExpiredLogs(days: number = 30) {
    try {
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - days);

      const result = await this.prismaDB.prisma.operationLog.deleteMany({
        where: {
          createdTime: {
            lt: expiredDate,
          },
        },
      });

      return {
        success: true,
        data: {
          deletedCount: result.count,
          expiredDate,
        },
        message: `成功清理 ${result.count} 条过期日志`,
      };
    } catch (error) {
      console.error("清理过期日志失败:", error);
      return {
        success: false,
        data: null,
        message: "清理过期日志失败",
        error: error.message,
      };
    }
  }

  /**
   * 获取操作日志统计
   * @returns 统计数据
   */
  public async getLogStats(): Promise<IOperationLogStats> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // 总数统计
      const totalCount = await this.prismaDB.prisma.operationLog.count();

      // 今日操作数量
      const todayCount = await this.prismaDB.prisma.operationLog.count({
        where: {
          createdTime: {
            gte: today,
            lt: tomorrow,
          },
        },
      });

      // 成功操作数量
      const successCount = await this.prismaDB.prisma.operationLog.count({
        where: {
          status: OperationStatus.SUCCESS,
        },
      });

      // 失败操作数量
      const failedCount = await this.prismaDB.prisma.operationLog.count({
        where: {
          status: OperationStatus.FAILED,
        },
      });

      // 操作类型统计
      const operationTypeStats =
        await this.prismaDB.prisma.operationLog.groupBy({
          by: ["operationType"],
          _count: {
            operationType: true,
          },
          orderBy: {
            _count: {
              operationType: "desc",
            },
          },
        });

      // 模块统计
      const moduleStats = await this.prismaDB.prisma.operationLog.groupBy({
        by: ["module"],
        _count: {
          module: true,
        },
        where: {
          module: {
            not: null,
          },
        },
        orderBy: {
          _count: {
            module: "desc",
          },
        },
        take: 10, // 只取前10个模块
      });

      const stats: IOperationLogStats = {
        totalCount,
        todayCount,
        successCount,
        failedCount,
        operationTypeStats: operationTypeStats.map((item) => ({
          type: item.operationType,
          count: item._count.operationType,
        })),
        moduleStats: moduleStats.map((item) => ({
          module: item.module || "未知模块",
          count: item._count.module,
        })),
      };

      return stats;
    } catch (error) {
      console.error("获取操作日志统计失败:", error);
      throw error;
    }
  }

  /**
   * 异步创建操作日志（用于中间件）
   * @param data 操作日志数据
   */
  public async createLogAsync(data: ICreateOperationLog): Promise<void> {
    // 异步执行，不阻塞主流程
    setImmediate(async () => {
      try {
        await this.createLog(data);
      } catch (error) {
        console.error("异步创建操作日志失败:", error);
      }
    });
  }

  /**
   * 批量创建操作日志
   * @param dataList 操作日志数据数组
   * @returns 创建结果
   */
  public async batchCreateLogs(dataList: ICreateOperationLog[]) {
    try {
      const result = await this.prismaDB.prisma.operationLog.createMany({
        data: dataList.map((data) => ({
          userId: data.userId,
          username: data.username,
          operationType: data.operationType,
          module: data.module,
          description: data.description,
          method: data.method,
          url: data.url,
          params: data.params,
          result: data.result,
          status: data.status || OperationStatus.SUCCESS,
          errorMessage: data.errorMessage,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          duration: data.duration,
        })),
      });

      return {
        success: true,
        data: {
          createdCount: result.count,
        },
        message: `成功创建 ${result.count} 条操作日志`,
      };
    } catch (error) {
      console.error("批量创建操作日志失败:", error);
      return {
        success: false,
        data: null,
        message: "批量创建操作日志失败",
        error: error.message,
      };
    }
  }
}
