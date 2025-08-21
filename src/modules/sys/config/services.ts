import { FilterHelper } from "@/utils";
import { ConfigType } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { inject, injectable } from "inversify";
import _ from "lodash";
import { PrismaDB } from "../../../db";
import { checkUnique } from "../../../utils/checkUnique";
import { BatchUpdateConfigDto, ConfigDto } from "./config.dto";

@injectable()
export class ConfigService {
  constructor(
    @inject(PrismaDB)
    private readonly PrismaDB: PrismaDB
  ) {}

  /**
   * 获取配置列表
   */
  async getConfigList(config: ReqListConfig) {
    let { filters, options, pagination } = config;
    const where: any = {};

    // 处理过滤条件
    filters = filters || {};

    // 处理布尔值字段的类型转换（前端可能传来 int 类型）
    if (filters.isSystem !== undefined) {
      filters.isSystem = this.convertToBoolean(filters.isSystem);
    }
    if (filters.isPublic !== undefined) {
      filters.isPublic = this.convertToBoolean(filters.isPublic);
    }

    let sqlFilters = {};
    const keys = Object.keys(filters);
    if (keys.length > 0) {
      // 添加基础过滤条件
      sqlFilters = FilterHelper.addFilterCondition(filters, [
        "id",
        "key",
        "category",
        "type",
        "isSystem",
        "isPublic",
        "keyword",
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
    // 分页参数
    const page = parseInt(pagination?.page as string) || 1;
    const pageSize = parseInt(pagination?.pageSize as string) || 10;

    const [configs, total] = await Promise.all([
      this.PrismaDB.prisma.sysConfig.findMany({
        where: sqlFilters,
        orderBy: [{ sortOrder: "asc" }, { createdTime: "desc" }],
        skip: pageSize ? (page - 1) * pageSize : undefined,
        take: pageSize,
      }),
      this.PrismaDB.prisma.sysConfig.count({ where: sqlFilters }),
    ]);

    // 解析配置值并处理敏感信息
    const processedConfigs = configs.map((config) => ({
      ...config,
      value: this.parseConfigValue(config.value, config.type),
      // 密码类型不返回实际值
      ...(config.type === ConfigType.PASSWORD && { value: "******" }),
    }));

    // 分页信息
    const paginationData = pageSize
      ? {
          page,
          pageSize,
          totalRecords: total,
          totalPages: Math.ceil(total / pageSize),
        }
      : null;

    return {
      data: {
        data: processedConfigs,
        pagination: paginationData,
      },
      code: 200,
      message: "获取配置列表成功",
      errMsg: "",
    };
  }

  /**
   * 根据ID获取配置
   */
  async getConfigById(id: number) {
    try {
      const config = await this.PrismaDB.prisma.sysConfig.findUnique({
        where: { id },
      });

      if (!config) {
        return {
          data: null,
          code: 404,
          message: "配置不存在",
          errMsg: "配置不存在",
        };
      }

      const result = {
        ...config,
        value:
          config.type === ConfigType.PASSWORD
            ? "******"
            : this.parseConfigValue(config.value, config.type),
      };

      return {
        data: result,
        code: 200,
        message: "获取配置成功",
        errMsg: "",
      };
    } catch (error) {
      return {
        data: null,
        code: 500,
        message: "获取配置失败",
        errMsg: error.message,
      };
    }
  }

  /**
   * 根据键名获取配置值
   */
  async getConfigByKey(key: string) {
    try {
      const config = await this.PrismaDB.prisma.sysConfig.findUnique({
        where: { key },
      });

      if (!config) {
        return {
          data: null,
          code: 404,
          message: "配置不存在",
          errMsg: "配置不存在",
        };
      }

      const value = this.parseConfigValue(config.value, config.type);
      return {
        data: value,
        code: 200,
        message: "获取配置值成功",
        errMsg: "",
      };
    } catch (error) {
      return {
        data: null,
        code: 500,
        message: "获取配置值失败",
        errMsg: error.message,
      };
    }
  }

  /**
   * 获取公开配置（前端可访问）
   */
  async getPublicConfigs() {
    const configs = await this.PrismaDB.prisma.sysConfig.findMany({
      where: { isPublic: true },
      select: {
        key: true,
        value: true,
        type: true,
        category: true,
        description: true,
      },
      orderBy: [{ sortOrder: "asc" }, { createdTime: "desc" }],
    });

    const result = {};
    configs.forEach((config) => {
      result[config.key] = this.parseConfigValue(config.value, config.type);
    });

    return {
      data: result,
      code: 200,
      message: "获取公开配置成功",
      errMsg: "",
    };
  }

  /**
   * 创建配置
   * @param configDto 配置数据传输对象
   * @returns 创建的配置记录
   */
  async createConfig(configDto: ConfigDto) {
    try {
      // 验证必填字段
      if (!configDto.key?.trim()) {
        return {
          data: null,
          code: 400,
          message: "配置键名不能为空",
          errMsg: "配置键名不能为空",
        };
      }

      if (!configDto.type) {
        return {
          data: null,
          code: 400,
          message: "配置类型不能为空",
          errMsg: "配置类型不能为空",
        };
      }

      // 检查键名唯一性
      const isUnique = await checkUnique(
        this.PrismaDB,
        "sysConfig",
        "key",
        configDto.key.trim()
      );
      if (isUnique) {
        return {
          data: null,
          code: 409,
          message: `配置键名 '${configDto.key}' 已存在，请使用其他键名`,
          errMsg: `配置键名 '${configDto.key}' 已存在，请使用其他键名`,
        };
      }

      // 处理配置值
      const value = this.stringifyConfigValue(configDto.value, configDto.type);

      // 构建创建数据
      const createData = {
        key: configDto.key.trim(),
        name: configDto.name?.trim() || null,
        value,
        type: configDto.type,
        category: configDto.category?.trim() || "SYSTEM",
        description: configDto.description?.trim() || null,
        isSystem:
          configDto.isSystem !== undefined
            ? this.convertToBoolean(configDto.isSystem)
            : false,
        isPublic:
          configDto.isPublic !== undefined
            ? this.convertToBoolean(configDto.isPublic)
            : false,
        sortOrder:
          configDto.sortOrder !== undefined
            ? Math.max(0, configDto.sortOrder)
            : 0,
      };

      const result = await this.PrismaDB.prisma.sysConfig.create({
        data: createData,
      });

      return {
        data: result,
        code: 200,
        message: "创建配置成功",
        errMsg: "",
      };
    } catch (error) {
      console.error("❌ ~ ConfigService ~ createConfig ~ 配置创建失败:", error);
      return {
        data: null,
        code: 500,
        message: "创建配置失败",
        errMsg: error.message,
      };
    }
  }

  /**
   * 更新配置
   * @param id 配置ID
   * @param configDto 配置数据传输对象
   * @returns Jres格式的响应对象
   */
  async updateConfig(id: number, configDto: ConfigDto) {
    try {
      // 验证ID
      if (!id || id <= 0) {
        return {
          data: null,
          code: 400,
          message: "配置ID无效",
          errMsg: "配置ID无效",
        };
      }

      // 查找现有配置
      const existingConfig = await this.PrismaDB.prisma.sysConfig.findUnique({
        where: { id },
      });

      if (!existingConfig) {
        return {
          data: null,
          code: 404,
          message: `配置不存在 (ID: ${id})`,
          errMsg: `配置不存在 (ID: ${id})`,
        };
      }

      // 如果修改了键名，检查唯一性
      if (configDto.key && configDto.key.trim() !== existingConfig.key) {
        const trimmedKey = configDto.key.trim();
        if (!trimmedKey) {
          return {
            data: null,
            code: 400,
            message: "配置键名不能为空",
            errMsg: "配置键名不能为空",
          };
        }

        const isUnique = await checkUnique(
          this.PrismaDB,
          "sysConfig",
          "key",
          trimmedKey
        );
        if (isUnique) {
          return {
            data: null,
            code: 409,
            message: `配置键名 '${trimmedKey}' 已存在，请使用其他键名`,
            errMsg: `配置键名 '${trimmedKey}' 已存在，请使用其他键名`,
          };
        }
      }

      // 处理配置值
      const value =
        configDto.value !== undefined
          ? this.stringifyConfigValue(
              configDto.value,
              configDto.type || existingConfig.type
            )
          : existingConfig.value;

      // 构建更新数据
      const updateData = {
        key: configDto.key?.trim() || existingConfig.key,
        name:
          configDto.name !== undefined
            ? configDto.name?.trim() || null
            : existingConfig.name,
        value,
        type: configDto.type || existingConfig.type,
        category:
          configDto.category !== undefined
            ? configDto.category?.trim() || "SYSTEM"
            : existingConfig.category,
        description:
          configDto.description !== undefined
            ? configDto.description?.trim() || null
            : existingConfig.description,
        isSystem:
          configDto.isSystem !== undefined
            ? this.convertToBoolean(configDto.isSystem)
            : existingConfig.isSystem,
        isPublic:
          configDto.isPublic !== undefined
            ? this.convertToBoolean(configDto.isPublic)
            : existingConfig.isPublic,
        sortOrder:
          configDto.sortOrder !== undefined
            ? Math.max(0, configDto.sortOrder)
            : existingConfig.sortOrder,
      };

      const result = await this.PrismaDB.prisma.sysConfig.update({
        where: { id },
        data: updateData,
      });

      return {
        data: result,
        code: 200,
        message: "配置更新成功",
        errMsg: "",
      };
    } catch (error) {
      console.error("❌ ~ ConfigService ~ updateConfig ~ 配置更新失败:", error);
      return {
        data: null,
        code: 500,
        message: "配置更新失败",
        errMsg: error.message || "配置更新失败",
      };
    }
  }

  /**
   * 批量更新配置
   * @param batchDto 批量更新配置数据传输对象
   * @returns Jres格式的响应对象
   */
  async batchUpdateConfigs(batchDto: BatchUpdateConfigDto) {
    try {
      if (!batchDto.configs || batchDto.configs.length === 0) {
        return {
          data: null,
          code: 400,
          message: "批量更新配置列表不能为空",
          errMsg: "批量更新配置列表不能为空",
        };
      }

      const results = [];
      const errors = [];
      let successCount = 0;
      let skipCount = 0;

      for (let i = 0; i < batchDto.configs.length; i++) {
        const configDto = batchDto.configs[i];

        if (configDto.id) {
          const result = await this.updateConfig(configDto.id, configDto);
          if (result.code === 200) {
            results.push(result.data);
            successCount++;
          } else {
            errors.push({
              index: i + 1,
              configId: configDto.id,
              error: result.message,
            });
          }
        } else {
          skipCount++;
        }
      }

      if (errors.length > 0) {
        console.error("❌ ~ 批量更新错误详情:", errors);
        return {
          data: {
            results,
            successCount,
            skipCount,
            errors,
          },
          code: 207, // 部分成功
          message: `批量更新部分失败: ${errors.length}/${batchDto.configs.length} 个配置更新失败`,
          errMsg: `批量更新部分失败: ${errors.length}/${batchDto.configs.length} 个配置更新失败`,
        };
      }

      return {
        data: {
          results,
          successCount,
          skipCount,
        },
        code: 200,
        message: "批量更新配置成功",
        errMsg: "",
      };
    } catch (error) {
      console.error(
        "❌ ~ ConfigService ~ batchUpdateConfigs ~ 批量更新失败:",
        error
      );
      return {
        data: null,
        code: 500,
        message: "批量更新配置失败",
        errMsg: error.message || "批量更新配置失败",
      };
    }
  }

  /**
   * 删除配置
   * @param id 配置ID
   * @returns Jres格式的响应对象
   */
  async deleteConfig(id: number) {
    try {
      // 验证ID
      if (!id || id <= 0) {
        return {
          data: null,
          code: 400,
          message: "配置ID无效",
          errMsg: "配置ID无效",
        };
      }

      // 查找配置
      const config = await this.PrismaDB.prisma.sysConfig.findUnique({
        where: { id },
      });

      if (!config) {
        return {
          data: null,
          code: 404,
          message: `配置不存在 (ID: ${id})`,
          errMsg: `配置不存在 (ID: ${id})`,
        };
      }

      // 检查是否为系统配置
      if (config.isSystem) {
        return {
          data: null,
          code: 403,
          message: `系统配置 '${config.key}' 不能删除`,
          errMsg: `系统配置 '${config.key}' 不能删除`,
        };
      }

      const result = await this.PrismaDB.prisma.sysConfig.delete({
        where: { id },
      });

      return {
        data: result,
        code: 200,
        message: "配置删除成功",
        errMsg: "",
      };
    } catch (error) {
      console.error("❌ ~ ConfigService ~ deleteConfig ~ 配置删除失败:", error);
      return {
        data: null,
        code: 500,
        message: "配置删除失败",
        errMsg: error.message || "配置删除失败",
      };
    }
  }

  /**
   * 解析配置值
   */
  private parseConfigValue(value: string | null, type: ConfigType): any {
    if (value === null || value === undefined) {
      return null;
    }

    try {
      switch (type) {
        case ConfigType.STRING:
        case ConfigType.FILE:
        case ConfigType.EMAIL:
        case ConfigType.URL:
        case ConfigType.PASSWORD:
          return value;
        case ConfigType.NUMBER:
          return Number(value);
        case ConfigType.BOOLEAN:
          return value === "true" || value === "1";
        case ConfigType.JSON:
        case ConfigType.ARRAY:
          return JSON.parse(value);
        default:
          return value;
      }
    } catch (error) {
      console.error(`解析配置值失败: ${error.message}`);
      return value;
    }
  }

  /**
   * 序列化配置值
   */
  private stringifyConfigValue(value: any, type: ConfigType): string {
    if (value === null || value === undefined) {
      return null;
    }

    switch (type) {
      case ConfigType.STRING:
      case ConfigType.FILE:
      case ConfigType.EMAIL:
      case ConfigType.URL:
        return String(value);
      case ConfigType.NUMBER:
        return String(Number(value));
      case ConfigType.BOOLEAN:
        return String(Boolean(value));
      case ConfigType.PASSWORD:
        // 密码需要加密存储
        return bcrypt.hashSync(String(value), 10);
      case ConfigType.JSON:
      case ConfigType.ARRAY:
        return JSON.stringify(value);
      default:
        return String(value);
    }
  }

  /**
   * 验证密码
   */
  async validatePassword(key: string, password: string) {
    try {
      const config = await this.PrismaDB.prisma.sysConfig.findUnique({
        where: { key, type: ConfigType.PASSWORD },
      });

      if (!config || !config.value) {
        return {
          data: { isValid: false },
          code: 404,
          message: "配置不存在或密码为空",
          errMsg: "配置不存在或密码为空",
        };
      }

      const isValid = bcrypt.compareSync(password, config.value);
      return {
        data: { isValid },
        code: 200,
        message: "验证完成",
        errMsg: "",
      };
    } catch (error) {
      return {
        data: { isValid: false },
        code: 500,
        message: "验证失败",
        errMsg: error.message,
      };
    }
  }

  /**
   * 将前端传来的值转换为布尔值
   * 支持多种格式：int(0/1)、string("true"/"false"/"0"/"1")、boolean
   */
  private convertToBoolean(value: any): boolean {
    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "number") {
      return value === 1;
    }

    if (typeof value === "string") {
      const lowerValue = value.toLowerCase();
      return lowerValue === "true" || lowerValue === "1";
    }

    return Boolean(value);
  }
}
