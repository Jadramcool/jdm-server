import { inject, injectable } from "inversify";
import { PrismaDB } from "../../../db";
import { UtilService } from "../../../utils/utils";

interface CreateConfigData {
  key: string;
  value: string;
  description?: string;
  type?: string;
  category?: string;
}

interface UpdateConfigData {
  value?: string;
  description?: string;
  type?: string;
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
    @inject(PrismaDB) private readonly prismaService: PrismaDB,
    @inject(UtilService) private readonly utilService: UtilService
  ) {}

  /**
   * 创建博客配置
   */
  async createConfig(data: CreateConfigData): Promise<Jres> {
    try {
      // 检查配置键是否已存在
      const existingConfig =
        await this.prismaService.prisma.blogConfig.findUnique({
          where: { key: data.key },
        });

      if (existingConfig) {
        return {
          code: 400,
          message: "配置键已存在",
          data: null,
        };
      }

      const config = await this.prismaService.prisma.blogConfig.create({
        data: {
          key: data.key,
          value: data.value,
          description: data.description || "",
          category: data.category || "general",
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

  /**
   * 获取配置列表
   */
  async getConfigList(query: ConfigListQuery): Promise<Jres> {
    try {
      const { category, type, keyword, page, pageSize } = query;

      // 构建查询条件
      const where: any = {};

      if (category) {
        where.category = category;
      }

      // type字段在BlogConfig模型中不存在，移除此条件

      if (keyword) {
        where.OR = [
          { key: { contains: keyword } },
          { description: { contains: keyword } },
          { value: { contains: keyword } },
        ];
      }

      // 如果提供了分页参数
      if (page && pageSize) {
        const pageNum = parseInt(page);
        const size = parseInt(pageSize);
        const skip = (pageNum - 1) * size;

        const [configs, total] = await Promise.all([
          this.prismaService.prisma.blogConfig.findMany({
            where,
            orderBy: {
              createdTime: "desc",
            },
            skip,
            take: size,
          }),
          this.prismaService.prisma.blogConfig.count({ where }),
        ]);

        return {
          code: 200,
          message: "",
          data: {
            data: configs,
            total,
            page: pageNum,
            pageSize: size,
            totalPages: Math.ceil(total / size),
          },
        };
      }

      // 不分页
      const configs = await this.prismaService.prisma.blogConfig.findMany({
        where,
        orderBy: {
          createdTime: "desc",
        },
      });

      return {
        code: 200,
        message: "",
        data: configs,
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
      const configs = await this.prismaService.prisma.blogConfig.findMany({
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
      const config = await this.prismaService.prisma.blogConfig.findUnique({
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
      const config = await this.prismaService.prisma.blogConfig.findUnique({
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
  async updateConfig(id: number, data: UpdateConfigData): Promise<Jres> {
    try {
      const existingConfig =
        await this.prismaService.prisma.blogConfig.findUnique({
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

      const config = await this.prismaService.prisma.blogConfig.update({
        where: { id },
        data: {
          ...data,
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
   * 批量更新配置
   */
  async updateConfigs(
    configs: Array<{ key: string; value: string }>
  ): Promise<Jres> {
    try {
      const updatePromises = configs.map(({ key, value }) =>
        this.prismaService.prisma.blogConfig.updateMany({
          where: {
            key,
          },
          data: {
            value,
          },
        })
      );

      await Promise.all(updatePromises);

      return {
        code: 200,
        message: "配置批量更新成功",
        data: null,
      };
    } catch (error) {
      console.error("批量更新配置失败:", error);
      return {
        code: 500,
        message: "批量更新配置失败",
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
      const existingConfig =
        await this.prismaService.prisma.blogConfig.findUnique({
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

      await this.prismaService.prisma.blogConfig.delete({
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
      const categories = await this.prismaService.prisma.blogConfig.findMany({
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
        this.prismaService.prisma.blogConfig.count(),
        this.prismaService.prisma.blogConfig.groupBy({
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
