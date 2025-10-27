import { FilterHelper, PaginationHelper } from "@/utils";
import { ConfigType } from "@prisma/client";
import { inject, injectable } from "inversify";
import { PrismaDB } from "../../../db";
import { UtilService } from "../../../utils/utils";

interface CreateConfigData {
  key: string;
  value: string;
  description?: string;
  type?: ConfigType;
  category?: string;
  name?: string;
}

interface UpdateConfigData {
  id: number;
  value?: string;
  description?: string;
  type?: ConfigType;
  category?: string;
}

interface ConfigListQuery {
  category?: string;
  type?: string;
  keyword?: string;
  page?: string;
  pageSize?: string;
}

@injectable()
export class BlogConfigService {
  constructor(
    @inject(PrismaDB) private readonly PrismaDB: PrismaDB,
    @inject(UtilService) private readonly utilService: UtilService
  ) {}

  /**
   * 创建博客配置
   */
  async createConfig(data: CreateConfigData): Promise<Jres> {
    try {
      // 检查配置键是否已存在
      const existingConfig = await this.PrismaDB.prisma.blogConfig.findUnique({
        where: { key: data.key },
      });

      if (existingConfig) {
        return {
          code: 400,
          message: "配置键已存在",
          data: null,
        };
      }

      const config = await this.PrismaDB.prisma.blogConfig.create({
        data: {
          key: data.key,
          value: data.value,
          description: data.description || "",
          category: data.category || "general",
          type: data.type || ConfigType.STRING,
          name: data.name,
        },
      });

      return {
        code: 200,
        message: "配置创建成功",
        data: config,
      };
    } catch (error) {
      console.error("创建博客配置失败:", error);
      return {
        code: 500,
        message: "创建配置失败",
        data: null,
        errMsg: error instanceof Error ? error.message : "未知错误",
      };
    }
  }

  // 获取所有配置
  async getAllConfigs(): Promise<Jres> {
    try {
      const configs = await this.PrismaDB.prisma.blogConfig.findMany({
        orderBy: [{ createdTime: "asc" }],
      });
      const configsMap = configs.reduce((acc, config) => {
        acc[config.key] = config.value;
        return acc;
      }, {} as Record<string, string>);

      return {
        code: 200,
        message: "获取所有配置成功",
        data: configsMap,
      };
    } catch (error) {
      console.error("获取所有配置失败:", error);
      return {
        code: 500,
        message: "获取所有配置失败",
        data: null,
        errMsg: error instanceof Error ? error.message : "未知错误",
      };
    }
  }

  /**
   * 获取配置列表
   */
  async getConfigList(config: ReqListConfig): Promise<Jres> {
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
          "category",
          "type",
          "keyword",
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

      const showPagination = options?.showPagination !== false; // 默认启用分页

      const page = Math.max(1, parseInt(pagination?.page as string) || 1);
      const pageSize = Math.max(
        1,
        Math.min(100, parseInt(pagination?.pageSize as string) || 10)
      ); // 限制最大页面大小为100

      const resp = await PaginationHelper.executePagedQuery(
        this.PrismaDB.prisma.blogConfig,
        sqlFilters,
        {
          showPagination,
          page,
          pageSize,
          orderBy: [{ createdTime: "asc" }],
        }
      );
      return {
        code: 200,
        message: "",
        data: resp,
      };
    } catch (error) {
      console.error("获取配置列表失败:", error);
      return {
        code: 500,
        message: "获取配置列表失败",
        data: null,
        errMsg: error instanceof Error ? error.message : "未知错误",
      };
    }
  }

  /**
   * 根据分类获取配置
   */
  async getConfigsByCategory(category: string): Promise<Jres> {
    try {
      const configs = await this.PrismaDB.prisma.blogConfig.findMany({
        where: {
          category,
        },
        orderBy: {
          key: "asc",
        },
      });

      // 转换为键值对格式
      const configMap: Record<string, any> = {};
      configs.forEach((config) => {
        let value: any = config.value;

        // BlogConfig模型中没有type字段，直接使用value
        value = config.value;

        configMap[config.key] = value;
      });

      return {
        code: 200,
        message: "",
        data: configMap,
      };
    } catch (error) {
      console.error("获取分类配置失败:", error);
      return {
        code: 500,
        message: "获取分类配置失败",
        data: null,
        errMsg: error instanceof Error ? error.message : "未知错误",
      };
    }
  }

  /**
   * 根据键获取配置
   */
  async getConfigByKey(key: string): Promise<Jres> {
    try {
      const config = await this.PrismaDB.prisma.blogConfig.findUnique({
        where: {
          key,
        },
      });

      if (!config) {
        return {
          code: 404,
          message: "配置不存在",
          data: null,
        };
      }

      // BlogConfig模型中没有type字段，直接使用value
      let value: any = config.value;

      return {
        code: 200,
        message: "",
        data: config,
      };
    } catch (error) {
      console.error("获取配置失败:", error);
      return {
        code: 500,
        message: "获取配置失败",
        data: null,
        errMsg: error instanceof Error ? error.message : "未知错误",
      };
    }
  }

  /**
   * 根据ID获取配置
   */
  async getConfigById(id: number): Promise<Jres> {
    try {
      const config = await this.PrismaDB.prisma.blogConfig.findUnique({
        where: {
          id,
        },
      });

      if (!config) {
        return {
          code: 404,
          message: "配置不存在",
          data: null,
        };
      }

      return {
        code: 200,
        message: "",
        data: config,
      };
    } catch (error) {
      console.error("获取配置失败:", error);
      return {
        code: 500,
        message: "获取配置失败",
        data: null,
        errMsg: error instanceof Error ? error.message : "未知错误",
      };
    }
  }

  /**
   * 更新配置
   */
  async updateConfig(data: UpdateConfigData): Promise<Jres> {
    const { id, ...updateData } = data;
    try {
      const existingConfig = await this.PrismaDB.prisma.blogConfig.findUnique({
        where: {
          id,
        },
      });

      if (!existingConfig) {
        return {
          code: 404,
          message: "配置不存在",
          data: null,
        };
      }

      const config = await this.PrismaDB.prisma.blogConfig.update({
        where: { id },
        data: {
          ...updateData,
          updatedTime: new Date(),
        },
      });

      return {
        code: 200,
        message: "配置更新成功",
        data: config,
      };
    } catch (error) {
      console.error("更新配置失败:", error);
      return {
        code: 500,
        message: "更新配置失败",
        data: null,
        errMsg: error instanceof Error ? error.message : "未知错误",
      };
    }
  }

  /**
   * 删除配置
   */
  async deleteConfig(id: number): Promise<Jres> {
    try {
      const existingConfig = await this.PrismaDB.prisma.blogConfig.findUnique({
        where: {
          id,
        },
      });

      if (!existingConfig) {
        return {
          code: 404,
          message: "配置不存在",
          data: null,
        };
      }

      await this.PrismaDB.prisma.blogConfig.delete({
        where: { id },
      });

      return {
        code: 200,
        message: "配置删除成功",
        data: null,
      };
    } catch (error) {
      console.error("删除配置失败:", error);
      return {
        code: 500,
        message: "删除配置失败",
        data: null,
        errMsg: error instanceof Error ? error.message : "未知错误",
      };
    }
  }

  /**
   * 获取配置分类列表
   */
  async getConfigCategories(): Promise<Jres> {
    try {
      const categories = await this.PrismaDB.prisma.blogConfig.findMany({
        select: {
          category: true,
        },
        distinct: ["category"],
        orderBy: {
          category: "asc",
        },
      });

      const categoryList = categories.map((item) => item.category);

      return {
        code: 200,
        message: "",
        data: categoryList,
      };
    } catch (error) {
      console.error("获取配置分类失败:", error);
      return {
        code: 500,
        message: "获取配置分类失败",
        data: null,
        errMsg: error instanceof Error ? error.message : "未知错误",
      };
    }
  }

  /**
   * 获取配置统计信息
   */
  async getConfigStats(): Promise<Jres> {
    try {
      const [totalConfigs, categoryStats] = await Promise.all([
        this.PrismaDB.prisma.blogConfig.count(),
        this.PrismaDB.prisma.blogConfig.groupBy({
          by: ["category"],
          _count: {
            id: true,
          },
        }),
      ]);

      const categoryCount = categoryStats.reduce((acc, item) => {
        acc[item.category] = item._count.id;
        return acc;
      }, {} as Record<string, number>);

      return {
        code: 200,
        message: "",
        data: {
          totalConfigs,
          categoryCount,
        },
      };
    } catch (error) {
      console.error("获取配置统计失败:", error);
      return {
        code: 500,
        message: "获取配置统计失败",
        data: null,
        errMsg: error instanceof Error ? error.message : "未知错误",
      };
    }
  }
}
