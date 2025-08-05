import { ConfigType } from "@prisma/client";
import { inject, injectable } from "inversify";
import { PrismaDB } from "../../../db";

/**
 * 配置管理工具类
 * 提供便捷的配置获取和设置方法
 */
@injectable()
export class ConfigUtil {
  private static instance: ConfigUtil;
  private configCache: Map<string, any> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存

  constructor(
    @inject(PrismaDB)
    private readonly prisma: PrismaDB
  ) {
    ConfigUtil.instance = this;
  }

  /**
   * 获取单例实例
   */
  static getInstance(): ConfigUtil {
    return ConfigUtil.instance;
  }

  /**
   * 获取配置值（带缓存）
   */
  async get<T = any>(key: string, defaultValue?: T): Promise<T> {
    // 检查缓存
    if (this.isCacheValid(key)) {
      return this.configCache.get(key) as T;
    }

    try {
      const config = await this.prisma.prisma.sysConfig.findUnique({
        where: { key },
      });

      if (!config) {
        return defaultValue as T;
      }

      const value = this.parseConfigValue(config.value, config.type);

      // 更新缓存
      this.setCache(key, value);

      return value as T;
    } catch (error) {
      console.error(`获取配置失败: ${key}`, error);
      return defaultValue as T;
    }
  }

  /**
   * 设置配置值
   */
  async set(key: string, value: any, type?: ConfigType): Promise<boolean> {
    try {
      const stringValue = this.stringifyConfigValue(
        value,
        type || ConfigType.STRING
      );

      await this.prisma.prisma.sysConfig.upsert({
        where: { key },
        update: { value: stringValue },
        create: {
          key,
          value: stringValue,
          type: type || ConfigType.STRING,
          category: "CUSTOM",
        },
      });

      // 清除缓存
      this.clearCache(key);

      return true;
    } catch (error) {
      console.error(`设置配置失败: ${key}`, error);
      return false;
    }
  }

  /**
   * 获取字符串配置
   */
  async getString(key: string, defaultValue = ""): Promise<string> {
    return await this.get<string>(key, defaultValue);
  }

  /**
   * 获取数字配置
   */
  async getNumber(key: string, defaultValue = 0): Promise<number> {
    return await this.get<number>(key, defaultValue);
  }

  /**
   * 获取布尔配置
   */
  async getBoolean(key: string, defaultValue = false): Promise<boolean> {
    return await this.get<boolean>(key, defaultValue);
  }

  /**
   * 获取JSON配置
   */
  async getJson<T = any>(key: string, defaultValue: T = {} as T): Promise<T> {
    return await this.get<T>(key, defaultValue);
  }

  /**
   * 获取数组配置
   */
  async getArray<T = any>(key: string, defaultValue: T[] = []): Promise<T[]> {
    return await this.get<T[]>(key, defaultValue);
  }

  /**
   * 批量获取配置
   */
  async getMultiple(keys: string[]): Promise<Record<string, any>> {
    const result: Record<string, any> = {};

    for (const key of keys) {
      result[key] = await this.get(key);
    }

    return result;
  }

  /**
   * 获取分类下的所有配置
   */
  async getByCategory(category: string): Promise<Record<string, any>> {
    try {
      const configs = await this.prisma.prisma.sysConfig.findMany({
        where: { category },
        orderBy: { sortOrder: "asc" },
      });

      const result: Record<string, any> = {};

      for (const config of configs) {
        const value = this.parseConfigValue(config.value, config.type);
        result[config.key] = value;

        // 更新缓存
        this.setCache(config.key, value);
      }

      return result;
    } catch (error) {
      console.error(`获取分类配置失败: ${category}`, error);
      return {};
    }
  }

  /**
   * 检查配置是否存在
   */
  async exists(key: string): Promise<boolean> {
    try {
      const config = await this.prisma.prisma.sysConfig.findUnique({
        where: { key },
        select: { id: true },
      });

      return !!config;
    } catch (error) {
      return false;
    }
  }

  /**
   * 删除配置
   */
  async delete(key: string): Promise<boolean> {
    try {
      await this.prisma.prisma.sysConfig.delete({
        where: { key },
      });

      // 清除缓存
      this.clearCache(key);

      return true;
    } catch (error) {
      console.error(`删除配置失败: ${key}`, error);
      return false;
    }
  }

  /**
   * 清除所有缓存
   */
  clearAllCache(): void {
    this.configCache.clear();
    this.cacheExpiry.clear();
  }

  /**
   * 清除指定配置的缓存
   */
  private clearCache(key: string): void {
    this.configCache.delete(key);
    this.cacheExpiry.delete(key);
  }

  /**
   * 设置缓存
   */
  private setCache(key: string, value: any): void {
    this.configCache.set(key, value);
    this.cacheExpiry.set(key, Date.now() + this.CACHE_TTL);
  }

  /**
   * 检查缓存是否有效
   */
  private isCacheValid(key: string): boolean {
    if (!this.configCache.has(key)) {
      return false;
    }

    const expiry = this.cacheExpiry.get(key);
    if (!expiry || Date.now() > expiry) {
      this.clearCache(key);
      return false;
    }

    return true;
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
      case ConfigType.PASSWORD:
        return String(value);
      case ConfigType.NUMBER:
        return String(Number(value));
      case ConfigType.BOOLEAN:
        return String(Boolean(value));
      case ConfigType.JSON:
      case ConfigType.ARRAY:
        return JSON.stringify(value);
      default:
        return String(value);
    }
  }
}

/**
 * 全局配置获取函数
 */
export const getConfig = async <T = any>(
  key: string,
  defaultValue?: T
): Promise<T> => {
  const configUtil = ConfigUtil.getInstance();
  if (!configUtil) {
    throw new Error("ConfigUtil not initialized");
  }
  return await configUtil.get(key, defaultValue);
};

/**
 * 全局配置设置函数
 */
export const setConfig = async (
  key: string,
  value: any,
  type?: ConfigType
): Promise<boolean> => {
  const configUtil = ConfigUtil.getInstance();
  if (!configUtil) {
    throw new Error("ConfigUtil not initialized");
  }
  return await configUtil.set(key, value, type);
};

