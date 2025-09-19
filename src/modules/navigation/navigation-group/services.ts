import { FilterHelper, FlattenHelper, PaginationHelper } from "@/utils";
import { UtilService } from "@/utils/utils";
import { PrismaClient } from "@prisma/client";
import { plainToClass } from "class-transformer";
import { validate } from "class-validator";
import { inject, injectable } from "inversify";
import { PrismaDB } from "../../../db";
import {
  NavigationGroupDto,
  UpdateNavigationGroupDto,
} from "./navigation-group.dto";

const prisma = new PrismaClient();

/**
 * 导航组服务类
 * 提供导航组相关的业务逻辑处理
 */
@injectable()
export class NavigationGroupService {
  constructor(
    @inject(PrismaDB) private readonly PrismaDB: PrismaDB,
    @inject(UtilService) private UtilService: UtilService
  ) {}

  /**
   * 创建导航组
   * @param navigationGroupData 导航组数据
   * @param user 当前用户信息
   * @returns 创建结果
   */
  public async createNavigationGroup(
    navigationGroupData: NavigationGroupDto,
    user: any
  ): Promise<Jres> {
    try {
      // 参数验证
      const dto = plainToClass(NavigationGroupDto, navigationGroupData);
      const errors = await validate(dto);

      if (errors.length > 0) {
        const errorMessages = errors
          .map((error) => Object.values(error.constraints || {}).join(", "))
          .join("; ");
        return {
          code: 400,
          message: `参数验证失败: ${errorMessages}`,
          data: null,
        };
      }

      // 检查导航组名称是否已存在
      const existingGroup = await prisma.navigationGroup.findFirst({
        where: {
          name: navigationGroupData.name,
        },
      });

      if (existingGroup) {
        return {
          code: 400,
          message: "导航组名称已存在",
          data: null,
        };
      }

      // 创建导航组
      const navigationGroup = await prisma.navigationGroup.create({
        data: {
          name: navigationGroupData.name,
          icon: navigationGroupData.icon || null,
          description: navigationGroupData.description || null,
          status: navigationGroupData.status || 1,
          createdTime: new Date(),
          updatedTime: new Date(),
        },
      });

      return {
        code: 200,
        message: "导航组创建成功",
        data: navigationGroup,
      };
    } catch (error) {
      console.error("创建导航组失败:", error);
      return {
        code: 500,
        message: "创建导航组失败",
        data: null,
      };
    }
  }

  /**
   * 更新导航组
   * @param updateData 更新数据
   * @param user 当前用户信息
   * @returns 更新结果
   */
  public async updateNavigationGroup(
    updateData: UpdateNavigationGroupDto,
    user: any
  ): Promise<Jres> {
    try {
      // 参数验证
      const dto = plainToClass(UpdateNavigationGroupDto, updateData);
      const errors = await validate(dto);

      if (errors.length > 0) {
        const errorMessages = errors
          .map((error) => Object.values(error.constraints || {}).join(", "))
          .join("; ");
        return {
          code: 400,
          message: `参数验证失败: ${errorMessages}`,
          data: null,
        };
      }

      // 检查导航组是否存在
      const existingGroup = await prisma.navigationGroup.findFirst({
        where: {
          id: updateData.id,
        },
      });

      if (!existingGroup) {
        return {
          code: 404,
          message: "导航组不存在",
          data: null,
        };
      }

      // 如果更新名称，检查名称是否已被其他导航组使用
      if (updateData.name && updateData.name !== existingGroup.name) {
        const nameExists = await prisma.navigationGroup.findFirst({
          where: {
            name: updateData.name,
            id: { not: updateData.id },
          },
        });

        if (nameExists) {
          return {
            code: 400,
            message: "导航组名称已存在",
            data: null,
          };
        }
      }

      // 构建更新数据，过滤掉undefined值
      const updateFields: any = {
        updatedTime: new Date(),
      };

      if (updateData.name !== undefined) updateFields.name = updateData.name;
      if (updateData.icon !== undefined) updateFields.icon = updateData.icon;
      if (updateData.description !== undefined)
        updateFields.description = updateData.description;
      if (updateData.status !== undefined)
        updateFields.status = updateData.status;

      // 使用事务更新导航组和关联导航
      const result = await prisma.$transaction(async (transactionPrisma) => {
        // 更新导航组
        const updatedGroup = await transactionPrisma.navigationGroup.update({
          where: { id: updateData.id },
          data: updateFields,
        });

        // 如果导航组被禁用（status = 0），同时禁用所有关联的导航
        if (updateData.status === 0) {
          // 获取该导航组下的所有导航ID
          const navigationGroupNavigations =
            await transactionPrisma.navigationGroupNavigation.findMany({
              where: {
                groupId: updateData.id,
              },
              select: {
                navigationId: true,
              },
            });

          // 提取导航ID数组
          const navigationIds = navigationGroupNavigations.map(
            (item) => item.navigationId
          );

          // 如果有关联的导航，则批量禁用
          if (navigationIds.length > 0) {
            await transactionPrisma.navigation.updateMany({
              where: {
                id: { in: navigationIds },
              },
              data: {
                status: 0, // 禁用状态
                updatedTime: new Date(),
              },
            });
          }
        }

        return updatedGroup;
      });

      return {
        code: 200,
        message:
          updateData.status === 0
            ? "导航组已禁用，同时禁用了所有关联的导航"
            : "导航组更新成功",
        data: result,
      };
    } catch (error) {
      console.error("更新导航组失败:", error);
      return {
        code: 500,
        message: "更新导航组失败",
        data: null,
      };
    }
  }

  /**
   * 删除导航组（硬删除）
   * @param navigationGroupId 导航组ID
   * @param user 当前用户信息
   * @returns 删除结果
   */
  public async deleteNavigationGroup(
    navigationGroupId: number,
    user: any
  ): Promise<Jres> {
    try {
      // 参数验证
      if (!navigationGroupId || typeof navigationGroupId !== "number") {
        return {
          code: 400,
          message: "导航组ID无效",
          data: null,
        };
      }

      // 检查导航组是否存在
      const existingGroup = await prisma.navigationGroup.findFirst({
        where: {
          id: navigationGroupId,
        },
      });

      if (!existingGroup) {
        return {
          code: 404,
          message: "导航组不存在",
          data: null,
        };
      }

      // 检查是否有关联的导航项
      const relatedNavigations =
        await prisma.navigationGroupNavigation.findMany({
          where: {
            groupId: navigationGroupId,
          },
        });

      if (relatedNavigations.length > 0) {
        return {
          code: 400,
          message: "该导航组下还有导航项，无法删除",
          data: null,
        };
      }

      // 硬删除导航组
      const deletedGroup = await prisma.navigationGroup.delete({
        where: { id: navigationGroupId },
      });

      return {
        code: 200,
        message: "导航组删除成功",
        data: deletedGroup,
      };
    } catch (error) {
      console.error("删除导航组失败:", error);
      return {
        code: 500,
        message: "删除导航组失败",
        data: null,
      };
    }
  }

  /**
   * 获取导航组详情
   * @param navigationGroupId 导航组ID
   * @param user 当前用户信息
   * @returns 导航组详情
   */
  public async getNavigationGroupDetail(
    navigationGroupId: number,
    user: any
  ): Promise<Jres> {
    try {
      // 参数验证
      if (!navigationGroupId || typeof navigationGroupId !== "number") {
        return {
          code: 400,
          message: "导航组ID无效",
          data: null,
        };
      }

      // 查询导航组详情
      const navigationGroup = await prisma.navigationGroup.findFirst({
        where: {
          id: navigationGroupId,
        },
      });

      if (!navigationGroup) {
        return {
          code: 404,
          message: "导航组不存在",
          data: null,
        };
      }

      return {
        code: 200,
        message: "获取导航组详情成功",
        data: navigationGroup,
      };
    } catch (error) {
      console.error("获取导航组详情失败:", error);
      return {
        code: 500,
        message: "获取导航组详情失败",
        data: null,
      };
    }
  }

  public async getNavigationGroupList(config: ReqListConfig): Promise<Jres> {
    try {
      let { filters, options, pagination } = config;

      // 初始化过滤条件
      filters = filters || {};
      let sqlFilters: any = {};

      const keys = Object.keys(filters);
      if (keys.length > 0) {
        // 添加基础过滤条件
        sqlFilters = FilterHelper.addFilterCondition(filters, [
          "id",
          "name",
          "groupId",
          "description",
          "status",
        ]);

        // 遍历时间字段并添加范围过滤条件
        ["createdTime", "updatedTime"].forEach((timeField) => {
          if (keys.includes(timeField) && Array.isArray(filters[timeField])) {
            sqlFilters[timeField] = {
              gte: new Date(filters[timeField][0]),
              lte: new Date(filters[timeField][1]),
            };
          }
        });
      }

      // 硬删除模式下，不需要过滤isDeleted字段

      // 优化分页参数处理
      const showPagination = options?.showPagination !== false; // 默认启用分页
      const page = Math.max(1, parseInt(pagination?.page as string) || 1);
      const pageSize = Math.max(
        1,
        Math.min(100, parseInt(pagination?.pageSize as string) || 10)
      ); // 限制最大页面大小为100

      let include = {};

      if (options?.with_navigation) {
        include["navigations"] = {
          include: {
            navigation: true,
          },
        };
      }

      // 处理导航数量查询 - 仅在只需要数量时使用聚合查询
      if (options?.with_navigation_count && !options?.with_navigation) {
        include["_count"] = {
          select: {
            navigations: true,
          },
        };
      }

      const resp = await PaginationHelper.executePagedQuery(
        this.PrismaDB.prisma.navigationGroup,
        sqlFilters,
        {
          showPagination,
          page,
          pageSize,
          orderBy: [{ sortOrder: "asc" }, { createdTime: "asc" }],
          include,
        }
      );

      // 如果包含navigation数据，进行扁平化处理
      if (options?.with_navigation && resp.data) {
        // 扁平化navigation数据，将中间表的navigation字段提取出来
        resp.data = FlattenHelper.flattenData(resp.data, {
          relationField: "navigations",
          targetField: "navigation",
        });
      }

      // 处理导航数量
      if (
        options?.with_navigation_count &&
        resp.data &&
        Array.isArray(resp.data)
      ) {
        resp.data = resp.data.map((group: any) => ({
          ...group,
          navigationCount: options?.with_navigation
            ? group.navigations?.length || 0 // 有导航数据时直接通过数组长度计算
            : group._count?.navigations || 0, // 仅需数量时使用聚合查询结果
          _count: undefined, // 移除原始的 _count 字段
        }));
      }

      return {
        data: resp,
        code: 200,
        message: "获取导航组列表成功",
      };
    } catch (error) {
      console.error("获取导航组列表失败:", error);
      return {
        code: 500,
        message: "获取导航组列表失败",
        data: null,
      };
    }
  }
}

