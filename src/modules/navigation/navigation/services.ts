import { FilterHelper } from "@/utils";
import { JWT } from "@jwt/index";
import { User } from "@prisma/client";
import { plainToClass } from "class-transformer";
import { validate } from "class-validator";
import { inject, injectable } from "inversify";
import { PrismaDB } from "../../../db";
import { NavigationDto, UpdateNavigationDto } from "./navigation.dto";

@injectable()
export class NavigationService {
  constructor(
    @inject(PrismaDB) private readonly PrismaDB: PrismaDB,
    @inject(JWT) private readonly JWT: JWT
  ) {}

  /**
   * 获取导航列表
   * @param config 查询配置参数
   * @returns 导航列表数据
   */
  public async getNavigationList(config: ReqListConfig) {
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
          "name", // 使用数据库实际字段名
          "path",
          "description",
          "status",
          "groupId",
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

      // 默认只查询未删除的记录
      sqlFilters["isDeleted"] = false;

      let result = [];
      let totalPages = 1;

      // 查询总记录数
      const totalRecords = await this.PrismaDB.prisma.navigation.count({
        where: sqlFilters,
      });

      let page = 1;
      let pageSize = 10;

      // 判断是否需要分页
      if (
        options &&
        options.hasOwnProperty("showPagination") &&
        !options["showPagination"]
      ) {
        // 不分页，查询所有数据
        result = await this.PrismaDB.prisma.navigation.findMany({
          where: sqlFilters,
          orderBy: [
            { sortOrder: "asc" }, // 按排序字段升序
            { createdTime: "desc" }, // 再按创建时间降序
          ],
        });
      } else {
        // 分页查询
        page = Math.max(1, parseInt(pagination?.page as string) || 1);
        pageSize = Math.max(1, Math.min(100, parseInt(pagination?.pageSize as string) || 10)); // 限制最大页面大小

        result = await this.PrismaDB.prisma.navigation.findMany({
          skip: (page - 1) * pageSize,
          take: pageSize,
          where: sqlFilters,
          orderBy: [
            { sortOrder: "asc" }, // 按排序字段升序
            { createdTime: "desc" }, // 再按创建时间降序
          ],
        });

        totalPages = Math.ceil(totalRecords / pageSize);
      }

      // 构建分页信息
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
        code: 200,
        message: "获取导航列表成功",
      };
    } catch (err) {
      console.error('获取导航列表失败:', err);
      return {
        data: null,
        code: 500,
        message: "获取导航列表失败",
        errMsg: err instanceof Error ? err.message : String(err),
      };
    }
  }

  /**
   * 获取导航详细信息
   * @param navigationId 导航ID
   * @returns 导航详细信息
   */
  public async getNavigationDetail(navigationId: number) {
    try {
      // 验证参数
      if (!navigationId || isNaN(navigationId)) {
        return {
          data: null,
          code: 400,
          message: "导航ID无效",
          errMsg: "导航ID必须是有效的数字",
        };
      }

      const result = await this.PrismaDB.prisma.navigation.findUnique({
        where: { id: navigationId },
      });

      if (!result) {
        return {
          data: null,
          code: 404,
          message: "导航不存在",
          errMsg: "导航不存在",
        };
      }

      if (result.isDeleted) {
        return {
          data: null,
          code: 400,
          message: "导航已被删除",
          errMsg: "导航已被删除",
        };
      }

      return {
        data: result,
        code: 200,
        message: "获取导航信息成功",
      };
    } catch (err) {
      console.error('获取导航详情失败:', err);
      return {
        data: null,
        code: 500,
        message: "获取导航详情失败",
        errMsg: err instanceof Error ? err.message : String(err),
      };
    }
  }

  /**
   * 创建导航
   * @param navigation 导航数据
   * @param user 当前用户
   * @returns 创建结果
   */
  public async createNavigation(navigation: NavigationDto, user: User) {
    try {
      // 验证输入参数
      const navigationDto = plainToClass(NavigationDto, navigation);
      const errors = await validate(navigationDto);
      if (errors.length > 0) {
        const errorMessages = errors.map((error) => {
          return {
            property: error.property,
            value: Object.values(error.constraints || {}),
          };
        });
        return {
          code: 400,
          message: "参数验证失败",
          errMsg: "参数验证失败",
          data: errorMessages,
        };
      }

      // 构建创建数据，映射DTO字段到数据库字段
      const createData = {
        name: navigation.title, // DTO的title映射到数据库的name字段
        path: '', // 默认路径，可根据需要调整
        icon: null, // 默认图标
        description: null, // 默认描述
        groupId: null, // 默认分组
        sortOrder: 0, // 默认排序
        status: 1, // 默认启用状态
        isDeleted: false, // 默认未删除
      };

      const result = await this.PrismaDB.prisma.navigation.create({
        data: createData,
      });

      return {
        data: result,
        code: 200,
        message: "创建导航成功",
      };
    } catch (err) {
      console.error('创建导航失败:', err);
      return {
        data: null,
        code: 400,
        message: "创建导航失败",
        errMsg: err instanceof Error ? err.message : String(err),
      };
    }
  }

  /**
   * 更新导航
   * @param navigation 导航更新数据
   * @param user 当前用户
   * @returns 更新结果
   */
  public async updateNavigation(navigation: UpdateNavigationDto, user: User) {
    try {
      // 验证输入参数
      const navigationDto = plainToClass(UpdateNavigationDto, navigation);
      const errors = await validate(navigationDto);
      if (errors.length > 0) {
        const errorMessages = errors.map((error) => {
          return {
            property: error.property,
            value: Object.values(error.constraints || {}),
          };
        });
        return {
          code: 400,
          message: "参数验证失败",
          errMsg: "参数验证失败",
          data: errorMessages,
        };
      }

      // 验证导航是否存在
      const existingNavigation = await this.PrismaDB.prisma.navigation.findUnique({
        where: { id: navigation.id },
      });

      if (!existingNavigation) {
        return {
          data: null,
          code: 404,
          message: "导航不存在",
          errMsg: "导航不存在",
        };
      }

      if (existingNavigation.isDeleted) {
        return {
          data: null,
          code: 400,
          message: "导航已被删除，无法更新",
          errMsg: "导航已被删除",
        };
      }

      // 构建更新数据，过滤掉不允许更新的字段
      const { id, ...updateData } = navigation;
      
      // 如果包含title字段，映射到name字段
      if (updateData.title) {
        updateData.name = updateData.title;
        delete updateData.title;
      }

      // 过滤掉undefined值
      const filteredUpdateData = Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => value !== undefined)
      );

      // 确保updatedTime会被自动更新
      const result = await this.PrismaDB.prisma.navigation.update({
        where: { id: navigation.id },
        data: filteredUpdateData,
      });

      return {
        data: result,
        code: 200,
        message: "更新导航成功",
      };
    } catch (err) {
      console.error('更新导航失败:', err);
      return {
        data: null,
        code: 400,
        message: "更新导航失败",
        errMsg: err instanceof Error ? err.message : String(err),
      };
    }
  }

  /**
   * 删除导航（软删除）
   * @param navigationId 导航ID
   * @param user 当前用户
   * @returns 删除结果
   */
  public async deleteNavigation(navigationId: number, user?: User) {
    try {
      // 验证导航是否存在
      const existingNavigation = await this.PrismaDB.prisma.navigation.findUnique({
        where: { id: navigationId },
      });

      if (!existingNavigation) {
        return {
          data: null,
          code: 404,
          message: "导航不存在",
          errMsg: "导航不存在",
        };
      }

      if (existingNavigation.isDeleted) {
        return {
          data: null,
          code: 400,
          message: "导航已被删除",
          errMsg: "导航已被删除",
        };
      }

      // 执行软删除
      await this.PrismaDB.prisma.$transaction(async (prisma) => {
        await prisma.navigation.update({
          where: {
            id: navigationId,
          },
          data: {
            isDeleted: true,
            deletedTime: new Date(),
          },
        });
      });

      return {
        data: null,
        code: 200,
        message: "删除导航成功",
      };
    } catch (err) {
      console.error('删除导航失败:', err);
      return {
        data: null,
        code: 400,
        message: "删除导航失败",
        errMsg: err instanceof Error ? err.message : String(err),
      };
    }
  }
}
