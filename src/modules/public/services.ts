import { JWT } from "@jwt/index";
import { inject, injectable } from "inversify";
import { PrismaDB } from "../../db";

// 排序参数接口定义
interface SortParams {
  tableName: string;
  sourceId: number; // 要移动的项目ID
  targetId?: number; // 目标项目ID（如果为空则移动到最前面或最后面）
  position: "before" | "after" | "first" | "last"; // 相对位置
  sortField?: string; // 排序字段名，默认为 'sortOrder'
  parentId?: number; // 父级ID（用于层级结构）
  parentField?: string; // 父级字段名（用于层级结构）
}

@injectable()
export class PublicService {
  constructor(
    @inject(PrismaDB) private readonly PrismaDB: PrismaDB,
    @inject(JWT) private readonly JWT: JWT
  ) {}

  /**
   * 通用排序方法（优化版本：只更新被移动的项目）
   * 基于相对位置移动项目，支持拖拽排序的实际使用场景
   *
   * 算法特点：
   * - 高效：只更新被移动的项目，不重新分配所有项目的排序值
   * - 智能：通过计算合适的排序值插入到目标位置
   * - 稳定：使用中间值算法确保排序稳定性
   * - 安全：确保排序值不会小于0，避免负数排序值
   *
   * @param params 排序参数
   * @param params.tableName 表名
   * @param params.sourceId 要移动的项目ID
   * @param params.targetId 目标项目ID（position为before/after时必需）
   * @param params.position 相对位置：
   *   - 'before': 将源项目移动到目标项目的前面
   *   - 'after': 将源项目移动到目标项目的后面
   *   - 'first': 将源项目移动到最前面
   *   - 'last': 将源项目移动到最后面
   * @param params.sortField 排序字段名，默认为 'sortOrder'
   * @param params.parentId 父级ID（用于层级结构）
   * @param params.parentField 父级字段名（用于层级结构）
   * @returns 排序操作结果
   *
   * @example
   * // 拖拽排序 - 将导航项5移动到导航项3的后面
   * const result = await publicService.sort({
   *   tableName: 'navigation',
   *   sourceId: 5,
   *   targetId: 3,
   *   position: 'after'
   * });
   * // 返回: { data: { updatedCount: 1 }, code: 200, message: "排序成功，更新了 1 条记录" }
   *
   * @example
   * // 移动到最前面（计算最小排序值-10）
   * const result = await publicService.sort({
   *   tableName: 'navigation',
   *   sourceId: 5,
   *   position: 'first'
   * });
   *
   * @example
   * // 移动到最后面（计算最大排序值+10）
   * const result = await publicService.sort({
   *   tableName: 'navigation',
   *   sourceId: 5,
   *   position: 'last'
   * });
   *
   * @example
   * // 层级结构排序 - 将部门10移动到部门8的前面（同一父级下）
   * const result = await publicService.sort({
   *   tableName: 'department',
   *   sourceId: 10,
   *   targetId: 8,
   *   position: 'before',
   *   parentId: 3,
   *   parentField: 'parentId'
   * });
   *
   * @example
   * // 错误情况返回
   * // { data: null, code: 400, message: "参数错误", errMsg: "详细错误信息" }
   */
  async sort(params: SortParams) {
    try {
      const {
        tableName,
        sourceId,
        targetId,
        position,
        sortField = "sortOrder",
        parentId,
        parentField,
      } = params;

      // 参数验证
      if (!tableName || !sourceId || !position) {
        return {
          data: null,
          code: 400,
          message: "参数错误：表名、源项目ID和位置不能为空",
          errMsg: "参数验证失败",
        };
      }

      // 验证position参数
      if (!["before", "after", "first", "last"].includes(position)) {
        return {
          data: null,
          code: 400,
          message: "位置参数错误：必须是 before、after、first 或 last",
          errMsg: "位置参数无效",
        };
      }

      // 如果是before或after，必须提供targetId
      if ((position === "before" || position === "after") && !targetId) {
        return {
          data: null,
          code: 400,
          message: "使用 before 或 after 位置时，必须提供目标项目ID",
          errMsg: "缺少目标项目ID",
        };
      }

      // 获取对应的 Prisma 模型
      const model = this.getPrismaModel(tableName);
      if (!model) {
        return {
          data: null,
          code: 400,
          message: `不支持的表名: ${tableName}`,
          errMsg: "表名不存在",
        };
      }

      console.log(
        `开始排序操作 - 表: ${tableName}, 源ID: ${sourceId}, 目标ID: ${targetId}, 位置: ${position}`
      );

      // 使用事务执行排序操作
      const result = await this.PrismaDB.prisma.$transaction(async (tx) => {
        // 构建查询条件
        const filters: any = {};
        if (parentId && parentField) {
          filters[parentField] = parentId;
        }

        // 获取源项目信息
        const sourceItem = await model.findUnique({
          where: { id: sourceId },
          select: { id: true, [sortField]: true },
        });

        if (!sourceItem) {
          throw new Error("找不到要移动的项目");
        }

        let newSortOrder: number;

        // 根据position计算新的排序值
        switch (position) {
          case "first":
            // 移动到最前面：找到最小的排序值，然后减10，但不能小于0
            const firstItem = await model.findFirst({
              where: filters,
              orderBy: { [sortField]: "asc" },
              select: { [sortField]: true },
            });
            newSortOrder = firstItem
              ? this.validateSortValue(firstItem[sortField] - 10)
              : 10;
            break;

          case "last":
            // 移动到最后面：找到最大的排序值，然后加10
            const lastItem = await model.findFirst({
              where: filters,
              orderBy: { [sortField]: "desc" },
              select: { [sortField]: true },
            });
            newSortOrder = lastItem ? lastItem[sortField] + 10 : 10;
            break;

          case "before":
          case "after":
            // 获取目标项目信息
            const targetItem = await model.findUnique({
              where: { id: targetId },
              select: { id: true, [sortField]: true },
            });
            if (!targetItem) {
              throw new Error("找不到目标项目");
            }

            if (position === "before") {
              // 将源项目移动到目标项目之前（源项目排在目标项目前面）
              // 找到目标项目前一个项目的排序值
              const prevItem = await model.findFirst({
                where: {
                  ...filters,
                  [sortField]: { lt: targetItem[sortField] },
                },
                orderBy: { [sortField]: "desc" },
                select: { [sortField]: true },
              });

              if (prevItem) {
                // 在前一个项目和目标项目之间插入
                newSortOrder = Math.floor(
                  (prevItem[sortField] + targetItem[sortField]) / 2
                );
                // 如果计算出的值与现有值相同，则使用目标值减1，但不能小于0
                if (
                  newSortOrder === prevItem[sortField] ||
                  newSortOrder === targetItem[sortField]
                ) {
                  newSortOrder = this.validateSortValue(
                    targetItem[sortField] - 1
                  );
                }
              } else {
                // 目标项目是第一个，插入到它前面，但不能小于0
                newSortOrder = this.validateSortValue(
                  targetItem[sortField] - 10
                );
              }

              // 确保最终结果不小于0
              newSortOrder = this.validateSortValue(newSortOrder);
            } else {
              // 将源项目移动到目标项目之后（源项目排在目标项目后面）
              // 找到目标项目后一个项目的排序值
              const nextItem = await model.findFirst({
                where: {
                  ...filters,
                  [sortField]: { gt: targetItem[sortField] },
                },
                orderBy: { [sortField]: "asc" },
                select: { [sortField]: true },
              });

              if (nextItem) {
                // 在目标项目和后一个项目之间插入
                newSortOrder = Math.floor(
                  (targetItem[sortField] + nextItem[sortField]) / 2
                );
                // 如果计算出的值与现有值相同，则使用目标值加1
                if (
                  newSortOrder === targetItem[sortField] ||
                  newSortOrder === nextItem[sortField]
                ) {
                  newSortOrder = targetItem[sortField] + 1;
                }
              } else {
                // 目标项目是最后一个，插入到它后面
                newSortOrder = targetItem[sortField] + 10;
              }
            }
            break;

          default:
            throw new Error("无效的位置参数");
        }

        // 如果新排序值与当前值相同，无需更新
        if (sourceItem[sortField] === newSortOrder) {
          return 0;
        }

        // 只更新被移动的项目
        await model.update({
          where: { id: sourceId },
          data: { [sortField]: newSortOrder },
        });

        return 1; // 只更新了一条记录
      });

      console.log(`排序操作完成 - 成功更新 ${result} 条记录`);

      return {
        data: {
          updatedCount: result,
        },
        code: 200,
        message: `排序成功，更新了 ${result} 条记录`,
      };
    } catch (error) {
      console.error("排序操作失败:", error);
      return {
        data: null,
        code: 500,
        message: "排序操作失败",
        errMsg: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * 验证并修正排序值
   * 确保排序值不小于0，如果小于0则设为0
   *
   * @param sortValue 原始排序值
   * @returns 修正后的排序值（不小于0）
   */
  private validateSortValue(sortValue: number): number {
    return Math.max(0, sortValue);
  }

  /**
   * 获取 Prisma 模型对象
   * 根据表名返回对应的 Prisma 模型，用于执行数据库操作
   *
   * @param tableName 表名
   * @returns Prisma 模型对象或 null
   */
  private getPrismaModel(tableName: string): any {
    const modelMap: { [key: string]: any } = {
      // 系统相关表
      sysConfig: this.PrismaDB.prisma.sysConfig,
      sys_config: this.PrismaDB.prisma.sysConfig,

      // 用户相关表
      user: this.PrismaDB.prisma.user,
      role: this.PrismaDB.prisma.role,
      department: this.PrismaDB.prisma.department,

      // 导航相关表
      navigation: this.PrismaDB.prisma.navigation,
      navigationGroup: this.PrismaDB.prisma.navigationGroup,
      navigation_group: this.PrismaDB.prisma.navigationGroup,
      navigationGroupNavigation: this.PrismaDB.prisma.navigationGroupNavigation,

      // 通知相关表
      notice: this.PrismaDB.prisma.notice,
      userNotice: this.PrismaDB.prisma.userNotice,
      user_notice: this.PrismaDB.prisma.userNotice,

      // 待办事项表
      todo: this.PrismaDB.prisma.todo,

      // 操作日志表
      operationLog: this.PrismaDB.prisma.operationLog,
      operation_log: this.PrismaDB.prisma.operationLog,
    };

    return modelMap[tableName] || null;
  }

  /**
   * 批量重置排序
   * 将指定表的所有记录按照指定规则重新排序
   *
   * @param tableName 表名
   * @param sortField 排序字段名，默认为 'sortOrder'
   * @param orderBy 排序依据字段，默认为 'createdTime'
   * @param orderDirection 排序方向，默认为 'asc'
   * @param filters 筛选条件，默认为空对象
   * @returns 重置结果
   *
   * @example
   * // 重置导航表排序
   * await publicService.resetSort('navigation', 'sortOrder', 'createdTime', 'asc', { isDeleted: false });
   */
  public async resetSort(data: {
    tableName: string;
    sortField: string;
    orderBy: string;
    orderDirection: "asc" | "desc";
    filters: any;
  }) {
    const {
      tableName,
      sortField = "sortOrder",
      orderBy = "id",
      orderDirection,
      filters,
    } = data;
    try {
      // 参数验证
      if (!tableName || typeof tableName !== "string") {
        return {
          code: 400,
          message: "表名不能为空",
          errMsg: "tableName 参数是必填的字符串类型",
        };
      }

      const model = this.getPrismaModel(tableName);
      if (!model) {
        return {
          code: 400,
          message: "不支持的表名",
          errMsg: `表名 '${tableName}' 不存在或不支持排序操作`,
        };
      }
      // 查询所有需要重新排序的记录
      const records = await model.findMany({
        where: filters,
        orderBy: { [orderBy]: orderDirection },
        select: { id: true },
      });

      if (records.length === 0) {
        return {
          code: 200,
          message: "没有需要重置排序的记录",
          data: { updatedCount: 0, tableName, sortField },
        };
      }
      // 构建批量更新操作
      const updateOperations = records.map((record, index) => {
        return model.update({
          where: { id: record.id },
          data: { [sortField]: (index + 1) * 10 }, // 使用 10 的倍数，便于后续插入
        });
      });

      // 执行批量更新
      const results = await this.PrismaDB.prisma.$transaction(updateOperations);

      console.log(`✅ 重置排序完成 - 成功更新 ${results.length} 条记录`);

      return {
        code: 200,
        message: "重置排序成功",
        data: {
          updatedCount: results.length,
          tableName,
          sortField,
          orderBy,
          orderDirection,
        },
      };
    } catch (error) {
      console.error("重置排序失败:", error);
      return {
        code: 500,
        message: "重置排序失败",
        errMsg: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
