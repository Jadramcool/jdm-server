/*
 * @Author: jdm
 * @Date: 2025-06-06 16:01:30
 * @LastEditors: jdm 1051780106@qq.com
 * @LastEditTime: 2025-06-30 13:15:34
 * @FilePath: \jdm-server\src\db\external.ts
 * @Description: 外部数据库原生MySQL连接 - 高性能优化版本
 *
 * 功能特性:
 * 1. 双层缓存机制 - 查询结果缓存 + COUNT查询缓存
 * 2. 智能分页策略 - 针对不同偏移量使用不同优化策略
 * 3. 全文搜索优化 - 自动选择FULLTEXT或LIKE查询
 * 4. 性能监控 - 详细的查询统计和慢查询检测
 * 5. 连接池管理 - 自动连接池创建和配置优化
 * 6. 索引提示 - 强制使用最优索引避免全表扫描
 * 7. COUNT查询优化 - 使用表统计信息避免大表全扫描
 */
import mysql from "mysql2/promise";
import { inject, injectable } from "inversify";

/**
 * 查询日志配置类
 * 用于控制查询模块的日志输出
 */
export class QueryLogConfig {
  // 全局日志开关，控制所有查询相关日志
  // static enableLog: boolean = process.env.NODE_ENV !== "production";
  static enableLog: boolean = false;
}

/**
 * 缓存项接口
 * 定义每个缓存条目的数据结构
 */
interface CacheItem {
  data: any; // 缓存的数据内容
  timestamp: number; // 缓存创建时间戳
  ttl: number; // 生存时间(毫秒)
}

/**
 * 性能统计接口
 * 用于跟踪数据库查询的性能指标
 */
interface PerformanceStats {
  totalQueries: number; // 总查询次数
  cacheHits: number; // 缓存命中次数
  cacheMisses: number; // 缓存未命中次数
  avgQueryTime: number; // 平均查询时间(毫秒)
  slowQueries: number; // 慢查询次数(>1秒)
  totalQueryTime: number; // 总查询时间(毫秒)
}

/**
 * 查询缓存管理器
 * 实现高效的内存缓存，用于存储查询结果并提供性能统计
 *
 * 优化点:
 * 1. 可以添加最大缓存大小限制，防止内存溢出
 * 2. 可以实现LRU淘汰策略，而不仅仅是基于TTL
 * 3. 可以添加缓存命中率阈值自动调整TTL
 * 4. 可以添加缓存预热机制
 */
class QueryCache {
  private cache = new Map<string, CacheItem>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5分钟默认缓存时间
  private stats: PerformanceStats = {
    totalQueries: 0,
    cacheHits: 0,
    cacheMisses: 0,
    avgQueryTime: 0,
    slowQueries: 0,
    totalQueryTime: 0,
  };
  private cleanupInterval: NodeJS.Timeout | null = null;

  /**
   * 设置缓存项
   * @param key - 缓存键
   * @param data - 要缓存的数据
   * @param ttl - 生存时间(毫秒)，默认5分钟
   */
  set(key: string, data: any, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
    if (QueryLogConfig.enableLog) {
      console.log(`[缓存] 设置缓存: ${key.substring(0, 50)}... TTL: ${ttl}ms`);
    }
  }

  /**
   * 获取缓存项
   * @param key - 缓存键
   * @returns 缓存的数据，如果不存在或已过期则返回null
   */
  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) {
      this.stats.cacheMisses++;
      if (QueryLogConfig.enableLog) {
        console.log(`[缓存] 缓存未命中: ${key.substring(0, 50)}...`);
      }
      return null;
    }

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      this.stats.cacheMisses++;
      if (QueryLogConfig.enableLog) {
        console.log(`[缓存] 缓存已过期: ${key.substring(0, 50)}...`);
      }
      return null;
    }

    this.stats.cacheHits++;
    if (QueryLogConfig.enableLog) {
      console.log(`[缓存] 缓存命中: ${key.substring(0, 50)}...`);
    }
    return item.data;
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`[缓存] 清理缓存: ${size} 个条目`);
  }

  /**
   * 获取缓存统计信息
   * @returns 包含命中率、缓存大小等统计信息
   */
  getStats(): PerformanceStats & { cacheSize: number; hitRate: number } {
    const hitRate =
      this.stats.totalQueries > 0
        ? ((this.stats.cacheHits / this.stats.totalQueries) * 100).toFixed(2)
        : "0.00";
    return {
      ...this.stats,
      cacheSize: this.cache.size,
      hitRate: parseFloat(hitRate),
    };
  }

  /**
   * 更新查询性能统计
   * @param queryTime - 查询执行时间(毫秒)
   */
  updateQueryStats(queryTime: number): void {
    this.stats.totalQueries++;
    this.stats.totalQueryTime += queryTime;
    this.stats.avgQueryTime =
      this.stats.totalQueryTime / this.stats.totalQueries;

    if (queryTime > 1000) {
      // 记录超过1秒的慢查询
      this.stats.slowQueries++;
    }
  }

  /**
   * 启动定期清理过期缓存的任务
   */
  startCleanup(): void {
    // 避免多次启动清理任务
    if (this.cleanupInterval) {
      return;
    }

    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      let cleanedCount = 0;
      for (const [key, item] of this.cache.entries()) {
        if (now - item.timestamp > item.ttl) {
          this.cache.delete(key);
          cleanedCount++;
        }
      }
      if (cleanedCount > 0) {
        console.log(`[缓存] 定期清理: 移除 ${cleanedCount} 个过期缓存`);
      }
    }, 60000); // 每分钟清理一次
  }

  /**
   * 停止清理任务
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

/**
 * 查询参数接口
 * 定义分页查询的所有可能参数
 */
export interface QueryParams {
  page?: number; // 页码，从1开始
  pageSize?: number; // 每页大小，默认10，最大1000
  title?: string; // 标题搜索关键词
  type?: string; // 数据类型过滤
  date?: string; // 日期过滤(支持完整日期或部分匹配)
  startTime?: string; // 开始时间(范围查询)
  endTime?: string; // 结束时间(范围查询)
  sortBy?: string; // 排序字段，默认为'date'
  sortOrder?: "ASC" | "DESC"; // 排序方向，默认为'DESC'
}

/**
 * 分页查询结果接口
 * 标准的分页响应格式
 */
export interface PaginatedResult<T> {
  data: T[]; // 当前页的数据数组
  pagination: {
    totalRecords: number; // 总记录数
    page: number; // 当前页码
    pageSize: number; // 每页大小
    totalPages: number; // 总页数
  };
}

/**
 * 外部数据库连接管理类
 * 提供高性能的MySQL数据库访问，包含以下核心功能:
 *
 * 核心特性:
 * 1. 智能连接池管理 - 自动创建和配置优化的连接池
 * 2. 双层缓存系统 - 查询结果缓存 + COUNT查询专用缓存
 * 3. 多策略分页优化 - 根据偏移量自动选择最优查询策略
 * 4. 全文搜索智能切换 - 自动选择FULLTEXT或LIKE查询
 * 5. COUNT查询超级优化 - 使用表统计信息避免大表全扫描
 * 6. 性能监控和统计 - 详细的查询性能分析
 * 7. 生产环境优化 - 条件日志输出和性能调优
 *
 * 优化建议:
 * 1. 可以添加读写分离支持
 * 2. 可以实现查询结果的序列化缓存(Redis)
 * 3. 可以添加SQL注入防护的参数验证
 * 4. 可以实现动态表名和字段映射
 * 5. 可以添加数据库健康检查和自动重连
 * 6. 可以实现查询超时控制
 * 7. 可以添加慢查询日志记录到文件
 */
@injectable()
export class ExternalDB {
  private pool: mysql.Pool | null = null; // MySQL连接池实例
  private cache = new QueryCache(); // 查询结果缓存管理器
  private countCache = new Map<string, { count: number; timestamp: number }>(); // COUNT查询专用缓存
  private readonly countCacheTTL = 10 * 60 * 1000; // COUNT缓存10分钟TTL
  private readonly enableDebugLog = process.env.NODE_ENV !== "production"; // 调试日志开关

  /**
   * 构造函数
   * @param config - MySQL连接配置，通过依赖注入提供
   */
  constructor(
    @inject("ExternalDBConfig") private config: mysql.ConnectionOptions
  ) {
    this.cache.startCleanup();
    console.log("[数据库] ExternalDB 初始化完成");
  }

  /**
   * 性能日志记录方法
   * 根据执行时间自动分级记录日志，并更新性能统计
   * @param operation - 操作名称
   * @param startTime - 操作开始时间戳
   * @param details - 额外的详细信息
   */
  private logPerformance(
    operation: string,
    startTime: number,
    details?: any
  ): void {
    const duration = Date.now() - startTime;
    // 根据执行时间自动分级: >1秒=WARN, >500ms=INFO, 其他=DEBUG
    const level = duration > 1000 ? "WARN" : duration > 500 ? "INFO" : "DEBUG";

    // 生产环境只输出非DEBUG级别的日志
    if (this.enableDebugLog || level !== "DEBUG") {
      console.log(
        `[${level}] [数据库] ${operation} - 耗时: ${duration}ms${
          details ? ` - ${JSON.stringify(details)}` : ""
        }`
      );
    }

    // 更新缓存管理器中的性能统计
    this.cache.updateQueryStats(duration);
  }

  /**
   * 获取或创建数据库连接池
   * 使用单例模式，确保整个应用只有一个连接池实例
   * 连接池配置已针对高并发场景优化
   * @returns MySQL连接池实例
   */
  private async getPool(): Promise<mysql.Pool> {
    if (!this.pool) {
      const startTime = Date.now();
      this.pool = mysql.createPool({
        ...this.config,
        connectionLimit: 20, // 连接池大小，根据并发需求调整
        // acquireTimeout: 60000,      // 获取连接超时时间
        // timeout: 60000,             // 查询超时时间
        // reconnect: true,            // 自动重连

        // 性能和兼容性优化配置
        charset: "utf8mb4", // 支持emoji和特殊字符
        timezone: "+00:00", // 统一使用UTC时区
        supportBigNumbers: true, // 支持大数字
        bigNumberStrings: true, // 大数字返回字符串格式
        dateStrings: false, // 日期返回Date对象
        debug: false, // 关闭调试模式
        multipleStatements: false, // 禁用多语句执行(安全考虑)
      });

      this.logPerformance("连接池创建", startTime, {
        connectionLimit: 20,
        charset: "utf8mb4",
      });
    }
    return this.pool;
  }

  /**
   * 生成查询结果的缓存键
   * 包含表名、查询参数和选择字段，确保缓存键的唯一性
   * @param tableName - 表名
   * @param params - 查询参数
   * @param selectFields - 选择的字段
   * @returns 缓存键字符串
   */
  private generateCacheKey(
    tableName: string,
    params: QueryParams,
    selectFields: string
  ): string {
    return `${tableName}:${JSON.stringify(params)}:${selectFields}`;
  }

  /**
   * 生成COUNT查询的缓存键
   * 排除分页参数(page, pageSize)，因为COUNT结果与分页无关
   * @param tableName - 表名
   * @param params - 查询参数
   * @returns COUNT缓存键字符串
   */
  private generateCountCacheKey(
    tableName: string,
    params: QueryParams
  ): string {
    const countParams = { ...params };
    delete countParams.page; // COUNT查询不需要页码
    delete countParams.pageSize; // COUNT查询不需要页大小
    return `count:${tableName}:${JSON.stringify(countParams)}`;
  }

  /**
   * 构建ORDER BY子句
   * 支持动态排序字段和排序方向，包含安全性验证
   * @param params - 查询参数对象
   * @param tableName - 表名，用于字段验证
   * @returns ORDER BY子句字符串
   */
  private buildOrderByClause(params: QueryParams, tableName: string): string {
    const sortBy = params.sortBy || "date"; // 默认按日期排序
    const sortOrder = params.sortOrder || "DESC"; // 默认降序

    // 安全性验证：防止SQL注入，只允许特定字段排序
    const allowedSortFields = {
      u3c3: [
        "id",
        "title",
        "type",
        "date",
        "created_at",
        "updated_at",
        "size_format",
      ],
      execution_logs: ["id", "title", "date", "status"],
    };

    const validFields = allowedSortFields[tableName] || ["id", "date"];
    const safeSortBy = validFields.includes(sortBy) ? sortBy : "date";
    const safeSortOrder = ["ASC", "DESC"].includes(sortOrder.toUpperCase())
      ? sortOrder.toUpperCase()
      : "DESC";

    // 记录排序策略
    if (QueryLogConfig.enableLog) {
      console.log(
        `[排序策略] 表: ${tableName}, 字段: ${safeSortBy}, 方向: ${safeSortOrder}`
      );
      if (safeSortBy !== sortBy) {
        console.warn(
          `[排序安全] 字段 "${sortBy}" 不在允许列表中，已替换为 "${safeSortBy}"`
        );
      }
    }

    return `ORDER BY ${safeSortBy} ${safeSortOrder}`;
  }

  /**
   * 构建WHERE子句 - 高度优化版本
   * 支持全文搜索、类型过滤、日期范围、时间范围等多种查询条件
   * 全文搜索自动选择最优模式(布尔模式 vs 自然语言模式)
   * @param params - 查询参数对象
   * @param tableName - 表名，用于特定表的优化
   * @returns 包含WHERE子句、参数数组和全文搜索标识的对象
   */
  private buildWhereClause(
    params: QueryParams,
    tableName: string
  ): { whereClause: string; values: any[]; hasFullTextSearch: boolean } {
    const conditions: string[] = [];
    const values: any[] = [];
    let hasFullTextSearch = false;

    // title搜索优化 - 智能搜索策略选择
    // ==================== 标题搜索优化模块 ====================
    // 支持多种搜索策略：精确匹配、通配符、全文搜索、模糊搜索等
    // 智能识别中英文、数字、空格等特征，自动选择最优搜索方案
    if (params.title) {
      const title = params.title.trim();

      // 如果搜索词为空，跳过处理
      if (!title) {
        return { whereClause: "", values: [], hasFullTextSearch: false };
      }

      // ========== 搜索词特征检测 ==========
      const searchFeatures = {
        hasChinese: /[\u4e00-\u9fa5]/.test(title), // 中文字符检测
        hasEnglish: /[a-zA-Z]/.test(title), // 英文字符检测
        hasNumbers: /\d/.test(title), // 数字字符检测
        hasSpaces: title.includes(" "), // 空格检测
        isQuoted: title.startsWith('"') && title.endsWith('"'), // 引号包围检测
        hasWildcard: title.includes("*") || title.includes("?"), // 通配符检测
        length: title.length, // 搜索词长度
        wordCount: title.split(" ").filter((w) => w.length > 0).length, // 词数统计
      };

      let searchStrategy = "";
      let searchCondition = "";
      let searchValues: any[] = [];

      // ========== 搜索策略选择（按优先级排序） ==========

      if (searchFeatures.isQuoted) {
        // 策略1: 精确匹配搜索 - 最高优先级
        // 用途：当用户明确需要精确匹配时（用引号包围）
        const exactTitle = title.slice(1, -1);
        searchCondition = "title = ?";
        searchValues = [exactTitle];
        searchStrategy = "精确匹配";
      } else if (searchFeatures.hasWildcard) {
        // 策略2: 通配符搜索
        // 用途：支持 * 和 ? 通配符模式匹配
        const wildcardTitle = title.replace(/\*/g, "%").replace(/\?/g, "_");
        searchCondition = "title LIKE ?";
        searchValues = [wildcardTitle];
        searchStrategy = "通配符匹配";
      } else if (searchFeatures.length === 1) {
        // 策略3: 单字符前缀搜索
        // 用途：单字符搜索使用前缀匹配，性能优于全模糊匹配
        searchCondition = "title LIKE ?";
        searchValues = [`${title}%`];
        searchStrategy = "单字符前缀匹配";
      } else if (searchFeatures.hasSpaces) {
        // 策略4: 多词搜索处理
        const words = title.split(" ").filter((w) => w.length > 0);
        if (searchFeatures.hasChinese) {
          // 策略4a: 中文多词搜索
          // 支持"苹果 香蕉"这样的中文多词AND查询
          if (tableName === "u3c3" && words.length >= 2) {
            // 优先使用全文搜索布尔模式
            const booleanQuery = words.map((word) => `+${word}*`).join(" ");
            searchCondition = "MATCH(title) AGAINST(? IN BOOLEAN MODE)";
            searchValues = [booleanQuery];
            hasFullTextSearch = true;
            searchStrategy = "中文多词全文搜索";
          } else {
            // 降级到多个LIKE条件的AND组合
            const titleConditions = words
              .map(() => "title LIKE ?")
              .join(" AND ");
            searchCondition = `(${titleConditions})`;
            searchValues = words.map((word) => `%${word}%`);
            searchStrategy = "中文多词LIKE搜索";
          }
        } else {
          // 策略4b: 英文多词搜索 - 针对ngram索引优化
          if (tableName === "u3c3" && words.length >= 2) {
            // 针对ngram索引：使用自然语言模式，让MySQL自动优化多词查询
            // ngram索引在自然语言模式下对多词查询有更好的性能
            const naturalQuery = words.join(" ");
            searchCondition =
              "MATCH(title) AGAINST(? IN NATURAL LANGUAGE MODE)";
            searchValues = [naturalQuery];
            hasFullTextSearch = true;
            searchStrategy = "英文多词全文搜索(ngram自然语言模式)";

            if (QueryLogConfig.enableLog) {
              console.log(
                `[ngram优化] 英文多词: "${naturalQuery}" - 使用自然语言模式提升性能`
              );
            }
          } else {
            // 降级到LIKE搜索的AND组合
            const titleConditions = words
              .map(() => "title LIKE ?")
              .join(" AND ");
            searchCondition = `(${titleConditions})`;
            searchValues = words.map((word) => `%${word}%`);
            searchStrategy = "英文多词LIKE搜索";
          }
        }
      } else if (searchFeatures.hasChinese) {
        // 策略5: 中文单词搜索
        if (tableName === "u3c3" && searchFeatures.length >= 2) {
          // 中文全文搜索（布尔模式）- 解决最小词长限制问题
          searchCondition = "MATCH(title) AGAINST(? IN BOOLEAN MODE)";
          searchValues = [`+${title}*`];
          hasFullTextSearch = true;
          searchStrategy = "中文全文搜索(布尔模式)";
        } else {
          // 中文模糊搜索
          searchCondition = "title LIKE ?";
          searchValues = [`%${title}%`];
          searchStrategy = "中文模糊搜索";
        }
      } else if (searchFeatures.length >= 4 && searchFeatures.hasEnglish) {
        // 策略6: 英文长词搜索 - 针对ngram索引优化
        // 用途：4个字符以上的英文词，使用ngram索引的自然语言模式
        if (tableName === "u3c3") {
          // 针对ngram索引优化：使用自然语言模式，性能更好
          // ngram索引对自然语言查询有更好的优化
          searchCondition = "MATCH(title) AGAINST(? IN NATURAL LANGUAGE MODE)";
          searchValues = [title];
          hasFullTextSearch = true;
          searchStrategy = "英文长词全文搜索(ngram自然语言模式)";

          if (QueryLogConfig.enableLog) {
            console.log(
              `[ngram优化] 英文词: "${title}" - 使用自然语言模式提升性能`
            );
          }
        } else {
          searchCondition = "title LIKE ?";
          searchValues = [`%${title}%`];
          searchStrategy = "英文长词模糊搜索";
        }
      } else if (searchFeatures.hasNumbers && searchFeatures.length >= 3) {
        // 策略7: 数字搜索
        // 用途：ID、编号、版本号等数字内容搜索
        searchCondition = "title LIKE ?";
        searchValues = [`%${title}%`];
        searchStrategy = "数字模糊搜索";
      } else {
        // 策略8: 默认模糊搜索
        // 用途：短关键词或其他未匹配的情况
        searchCondition = "title LIKE ?";
        searchValues = [`%${title}%`];
        searchStrategy = "标准模糊搜索";
      }

      // ========== 应用搜索条件 ==========
      conditions.push(searchCondition);
      values.push(...searchValues);

      // ========== 搜索日志记录 ==========
      // 记录选择的搜索策略和关键参数
      if (QueryLogConfig.enableLog) {
        if (
          searchFeatures.hasSpaces &&
          (searchFeatures.hasChinese || !searchFeatures.hasChinese)
        ) {
          const words = title.split(" ").filter((w) => w.length > 0);
          console.log(
            `[搜索策略] ${searchStrategy} - 词组: [${words.join(", ")}]${
              hasFullTextSearch ? ` - 布尔查询: "${searchValues[0]}"` : ""
            }`
          );
        } else {
          console.log(
            `[搜索策略] ${searchStrategy} - 关键词: "${title}"${
              searchFeatures.length > 1
                ? ` (长度: ${searchFeatures.length})`
                : ""
            }`
          );
        }

        // 详细特征分析日志
        console.log(
          `[搜索分析] 表: ${tableName}, 特征: 中文=${searchFeatures.hasChinese}, 英文=${searchFeatures.hasEnglish}, 数字=${searchFeatures.hasNumbers}, 空格=${searchFeatures.hasSpaces}, 引号=${searchFeatures.isQuoted}, 通配符=${searchFeatures.hasWildcard}, 词数=${searchFeatures.wordCount}`
        );
      }
    }

    // 添加软删除过滤条件（排除已删除的数据）
    if (tableName === "u3c3") {
      // 方案1：如果数据已标准化，使用简单条件
      // conditions.push("is_deleted = 0");

      // 方案2：如果需要兼容NULL值，优化OR条件
      conditions.push("is_deleted = 0");

      // 方案3：使用COALESCE函数
      // conditions.push("COALESCE(is_deleted, 0) = 0");
    }

    // u3c3表特有的type查询（需要type字段索引）
    if (tableName === "u3c3" && params.type) {
      conditions.push("type = ?");
      values.push(params.type);
    }

    // u3c3表特有的date查询优化
    if (tableName === "u3c3" && params.date) {
      // 如果是完整日期，使用精确匹配
      if (/^\d{4}-\d{2}-\d{2}$/.test(params.date)) {
        conditions.push("DATE(date) = ?");
        values.push(params.date);
      } else {
        // 否则使用LIKE查询
        conditions.push("date LIKE ?");
        values.push(`%${params.date}%`);
      }
    }

    // 创建时间范围查询（需要date字段索引）
    if (params.startTime && params.endTime) {
      // 范围查询使用BETWEEN优化
      conditions.push("date BETWEEN ? AND ?");
      values.push(params.startTime, params.endTime);
    } else {
      if (params.startTime) {
        conditions.push("date >= ?");
        values.push(params.startTime);
      }
      if (params.endTime) {
        conditions.push("date <= ?");
        values.push(params.endTime);
      }
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // ========== SQL语句打印 ==========
    // 打印完整的WHERE子句和参数，便于调试和分析
    if (QueryLogConfig.enableLog) {
      if (whereClause) {
        console.log(`[SQL构建] WHERE子句: ${whereClause}`);
        console.log(
          `[SQL参数] 参数值: [${values
            .map((v) => (typeof v === "string" ? `"${v}"` : v))
            .join(", ")}]`
        );

        // 构建完整的示例SQL语句（用于调试）
        let debugSql = whereClause;
        values.forEach((value, index) => {
          const placeholder = typeof value === "string" ? `'${value}'` : value;
          debugSql = debugSql.replace("?", placeholder);
        });
        console.log(`[完整WHERE] ${debugSql}`);
      } else {
        console.log(`[SQL构建] 无WHERE条件，查询所有记录`);
      }
    }

    return { whereClause, values, hasFullTextSearch };
  }

  /**
   * 超级优化的COUNT查询 - 针对大数据表（强制避免全表扫描）
   * 多策略智能选择最优COUNT方法:
   * 1. 无条件查询: 使用表统计信息 (最快)
   * 2. 有条件查询: 根据全文搜索类型选择优化策略
   * 3. 兜底方案: 使用索引估算避免全表扫描
   * @param tableName - 表名
   * @param whereClause - WHERE子句
   * @param values - 查询参数
   * @param hasFullTextSearch - 是否包含全文搜索
   * @returns 记录总数
   */
  private async getOptimizedCount(
    tableName: string,
    whereClause: string,
    values: any[],
    hasFullTextSearch: boolean
  ): Promise<number> {
    const startTime = Date.now();
    const pool = await this.getPool();

    // 对于无条件查询，强制使用表统计信息（百万级数据绝对不能全表扫描）
    if (!whereClause) {
      if (QueryLogConfig.enableLog) {
        console.log(
          `[数据库] 检测到无条件COUNT查询，强制使用统计信息避免全表扫描`
        );
      }

      try {
        // 方法1：使用SHOW TABLE STATUS（最快最准确）
        const [statusResult] = (await pool.query(
          `SHOW TABLE STATUS LIKE '${tableName}'`
        )) as any;

        if (statusResult[0]?.Rows && statusResult[0].Rows > 0) {
          this.logPerformance(`COUNT查询(表状态) - ${tableName}`, startTime, {
            method: "table_status",
            result: statusResult[0].Rows,
            data_length: statusResult[0].Data_length,
            avg_row_length: statusResult[0].Avg_row_length,
          });
          return parseInt(statusResult[0].Rows);
        }

        // 方法2：使用information_schema作为备选
        const [result] = (await pool.execute(
          "SELECT table_rows, data_length FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?",
          [tableName]
        )) as any;

        if (result[0]?.table_rows && result[0].table_rows > 0) {
          this.logPerformance(`COUNT查询(统计信息) - ${tableName}`, startTime, {
            method: "table_stats",
            result: result[0].table_rows,
            data_length: result[0].data_length,
          });
          return parseInt(result[0].table_rows);
        }
      } catch (error) {
        console.warn(`[数据库] 获取表统计信息失败: ${error}`);
      }

      // 方法3：使用索引估算（最后的备选方案）
      try {
        if (QueryLogConfig.enableLog) {
          console.log(`[数据库] 统计信息不可用，使用索引估算`);
        }
        // 使用AUTO_INCREMENT值估算（如果表有自增主键）
        const [autoIncResult] = (await pool.query(
          `SHOW TABLE STATUS LIKE '${tableName}'`
        )) as any;

        if (autoIncResult[0]?.Auto_increment) {
          // 获取最小ID
          const [minResult] = (await pool.execute(
            `SELECT MIN(id) as min_id FROM ${tableName}`
          )) as any;

          const estimatedCount =
            autoIncResult[0].Auto_increment - (minResult[0]?.min_id || 1);
          this.logPerformance(`COUNT查询(自增估算) - ${tableName}`, startTime, {
            method: "auto_increment_estimation",
            result: estimatedCount,
            auto_increment: autoIncResult[0].Auto_increment,
            min_id: minResult[0]?.min_id,
          });
          return estimatedCount;
        }

        // 最后的备选：使用ID范围估算
        const [minMaxResult] = (await pool.execute(
          `SELECT MIN(id) as min_id, MAX(id) as max_id FROM ${tableName} USE INDEX (PRIMARY)`
        )) as any;

        if (minMaxResult[0]?.min_id && minMaxResult[0]?.max_id) {
          const estimatedCount =
            minMaxResult[0].max_id - minMaxResult[0].min_id + 1;
          this.logPerformance(
            `COUNT查询(ID范围估算) - ${tableName}`,
            startTime,
            {
              method: "id_range_estimation",
              result: estimatedCount,
              min_id: minMaxResult[0].min_id,
              max_id: minMaxResult[0].max_id,
            }
          );
          return estimatedCount;
        }
      } catch (error) {
        console.warn(`[数据库] 索引估算失败: ${error}`);
      }

      // 如果所有估算方法都失败，返回一个合理的默认值
      if (QueryLogConfig.enableLog) {
        console.warn(`[数据库] 所有COUNT估算方法失败，返回默认值`);
      }
      return 1000000; // 返回一个合理的默认值，避免全表扫描
    }

    // 对于有条件的查询，使用优化的COUNT
    let countQuery: string;
    let method: string;
    if (hasFullTextSearch) {
      // 全文搜索使用精确COUNT
      countQuery = `SELECT COUNT(*) as total FROM ${tableName} ${whereClause}`;
      method = "fulltext_count";
    } else {
      // 其他查询尝试使用索引优化
      countQuery = `SELECT COUNT(1) as total FROM ${tableName} ${whereClause}`;
      method = "indexed_count";
    }

    const [countResult] = (await pool.execute(countQuery, values)) as any;
    const total = parseInt(countResult[0].total) || 0;

    this.logPerformance(`COUNT查询 - ${tableName}`, startTime, {
      method,
      hasWhere: !!whereClause,
      paramCount: values.length,
      result: total,
    });

    return total;
  }

  /**
   * 主查询方法 - 高度优化的分页查询
   * 这是整个类的核心方法，集成了多种优化策略:
   * 1. 智能缓存机制
   * 2. 动态字段选择
   * 3. 多策略查询优化(全文搜索、浅分页、深分页、游标分页等)
   * 4. 查询计划分析
   * 5. 性能监控和日志记录
   *
   * @param tableName - 要查询的表名
   * @param params - 查询参数，包括分页、搜索、过滤条件等
   * @param selectFields - 要选择的字段，默认为"*"
   * @returns 分页查询结果，包含数据和分页信息
   */
  async queryWithPagination<T>(
    tableName: string,
    params: QueryParams = {},
    selectFields: string = "*"
  ): Promise<PaginatedResult<T>> {
    const overallStartTime = Date.now();
    // 参数验证和标准化 - 确保参数在合理范围内
    const page = Math.max(1, parseInt(String(params.page)) || 1); // 页码最小为1
    const pageSize = Math.max(
      1,
      Math.min(1000, parseInt(String(params.pageSize)) || 10)
    ); // 限制最大页面大小为1000
    const offset = (page - 1) * pageSize; // 计算偏移量

    if (QueryLogConfig.enableLog) {
      console.log(
        `[数据库] 开始分页查询 - 表: ${tableName}, 页码: ${page}, 页大小: ${pageSize}, 偏移: ${offset}`
      );
      console.log(`[数据库] 查询参数:`, JSON.stringify(params, null, 2));
    }

    // 生成缓存键 - 包含表名、参数和字段信息确保唯一性
    const cacheKey = this.generateCacheKey(
      tableName,
      { ...params, page, pageSize },
      selectFields
    );

    // 检查缓存 - 优先返回缓存结果，提升响应速度
    const cachedResult = this.cache.get(cacheKey);
    if (cachedResult) {
      this.logPerformance(
        `分页查询(缓存命中) - ${tableName}`,
        overallStartTime,
        {
          page,
          pageSize,
          resultCount: cachedResult.data.length,
        }
      );
      return cachedResult;
    }

    const pool = await this.getPool();
    const { whereClause, values, hasFullTextSearch } = this.buildWhereClause(
      params,
      tableName
    );

    if (QueryLogConfig.enableLog) {
      console.log(`[数据库] WHERE条件: ${whereClause}`);
      console.log(`[数据库] 参数值:`, values);
      console.log(`[数据库] 全文搜索: ${hasFullTextSearch}`);
    }

    // 优化的COUNT查询（带缓存） - 使用多策略获取总记录数
    const countStartTime = Date.now();
    const countCacheKey = this.generateCountCacheKey(tableName, params);
    let total: number;

    const cachedCount = this.countCache.get(countCacheKey);
    if (
      cachedCount &&
      Date.now() - cachedCount.timestamp < this.countCacheTTL
    ) {
      total = cachedCount.count;
      if (QueryLogConfig.enableLog) {
        console.log(`[数据库] COUNT缓存命中: ${total}`);
      }
    } else {
      total = await this.getOptimizedCount(
        tableName,
        whereClause,
        values,
        hasFullTextSearch
      );
      this.countCache.set(countCacheKey, {
        count: total,
        timestamp: Date.now(),
      });
      if (QueryLogConfig.enableLog) {
        console.log(`[数据库] COUNT查询完成: ${total} 条记录`);
      }
    }

    // 如果请求的页面超出范围，返回空结果 - 避免不必要的数据查询
    if (offset >= total && total > 0) {
      const result = {
        data: [],
        pagination: {
          totalRecords: total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
      };
      this.cache.set(cacheKey, result, 60000); // 缓存1分钟

      this.logPerformance(
        `分页查询(超出范围) - ${tableName}`,
        overallStartTime,
        {
          page,
          pageSize,
          totalRecords: total,
          requestedOffset: offset,
        }
      );

      return result;
    }

    // 优化字段选择 - 根据表配置和查询类型动态选择字段
    let optimizedSelectFields = selectFields;
    if (selectFields === "*") {
      // 避免SELECT *，明确指定需要的字段（这里保持兼容性暂时使用*）
      optimizedSelectFields = "*";
      if (QueryLogConfig.enableLog) {
        console.log(
          `[数据库] 字段优化: ${selectFields} -> ${optimizedSelectFields}`
        );
      }
    }

    // 超级优化的数据查询 - 针对大数据表性能优化
    const queryStartTime = Date.now();
    let dataQuery: string;
    let queryValues = [...values];
    let queryType: string;

    // 将LIMIT和OFFSET直接拼接到SQL中，避免参数化问题
    const limitClause = `LIMIT ${parseInt(String(pageSize))}`;
    const offsetClause = offset > 0 ? `OFFSET ${parseInt(String(offset))}` : "";

    // 构建ORDER BY子句
    const orderByClause = this.buildOrderByClause(params, tableName);
    const sortBy = params.sortBy || "date";

    // 智能查询策略选择 - 根据查询条件和分页位置选择最优策略
    if (hasFullTextSearch) {
      // 全文搜索查询 - 使用MySQL全文索引和相关性排序
      queryType = "fulltext";
      dataQuery =
        `SELECT ${optimizedSelectFields} FROM ${tableName} ${whereClause} ${orderByClause} ${limitClause} ${offsetClause}`.trim();
    } else {
      // 无条件查询的超级优化
      if (!whereClause) {
        if (offset === 0) {
          // 第一页：使用索引直接获取最新记录 - 最常见的查询场景
          queryType = "first_page_optimized";
          // 只有按date DESC排序时才使用特定索引优化
          const indexHint =
            sortBy === "date" && params.sortOrder !== "ASC"
              ? "USE INDEX (idx_date_desc)"
              : "";
          dataQuery = `SELECT ${optimizedSelectFields} FROM ${tableName} ${indexHint} ${orderByClause} ${limitClause}`;
        } else if (offset < 10000) {
          // 浅分页：直接使用LIMIT OFFSET - OFFSET较小，性能影响不大
          queryType = "shallow_pagination";
          const indexHint =
            sortBy === "date" && params.sortOrder !== "ASC"
              ? "USE INDEX (idx_date_desc)"
              : "";
          dataQuery = `SELECT ${optimizedSelectFields} FROM ${tableName} ${indexHint} ${orderByClause} ${limitClause} ${offsetClause}`;
        } else {
          // 深分页：使用游标分页（仅支持date字段） - 避免大OFFSET性能问题
          queryType = "cursor_pagination";
          if (sortBy === "date") {
            // 先获取offset位置的date值
            const [cursorResult] = (await pool.execute(
              `SELECT date FROM ${tableName} USE INDEX (idx_date_desc) ${orderByClause} LIMIT 1 OFFSET ${offset}`
            )) as any;

            if (cursorResult[0]?.date) {
              const cursorTime = cursorResult[0].date;
              const operator = params.sortOrder === "ASC" ? ">=" : "<=";
              const secondarySort = params.sortOrder === "ASC" ? "ASC" : "DESC";
              dataQuery = `SELECT ${optimizedSelectFields} FROM ${tableName} WHERE date ${operator} ? ORDER BY date ${secondarySort}, id ${secondarySort} ${limitClause}`;
              queryValues = [cursorTime];
            } else {
              // 如果游标查询失败，回退到普通查询
              queryType = "fallback_deep_pagination";
              dataQuery = `SELECT ${optimizedSelectFields} FROM ${tableName} ${orderByClause} ${limitClause} ${offsetClause}`;
            }
          } else {
            // 非date字段的深分页直接使用LIMIT OFFSET
            queryType = "deep_pagination_non_date";
            dataQuery = `SELECT ${optimizedSelectFields} FROM ${tableName} ${orderByClause} ${limitClause} ${offsetClause}`;
          }
        }
      } else {
        // 有条件查询的优化
        if (offset === 0) {
          // 第一页查询优化 - 去除OFFSET提升性能
          queryType = "first_page_with_condition";
          dataQuery = `SELECT ${optimizedSelectFields} FROM ${tableName} ${whereClause} ${orderByClause} ${limitClause}`;
        } else {
          // 深度分页优化 - 直接使用LIMIT OFFSET
          queryType = "deep_pagination_with_condition";
          dataQuery = `SELECT ${optimizedSelectFields} FROM ${tableName} ${whereClause} ${orderByClause} ${limitClause} ${offsetClause}`;
        }
      }
    }

    // 调试日志 - 开发环境下输出详细的查询信息
    if (QueryLogConfig.enableLog) {
      console.log(`[数据库] 查询类型: ${queryType}`);
      console.log(`[数据库] SQL语句: ${dataQuery}`);
      console.log(`[数据库] 查询参数: ${JSON.stringify(queryValues)}`);
    }

    // 执行查询前先分析查询计划（仅在调试模式下） - 帮助识别性能瓶颈
    if (QueryLogConfig.enableLog && !hasFullTextSearch) {
      try {
        const [explainResult] = (await pool.execute(
          `EXPLAIN ${dataQuery}`,
          queryValues
        )) as any;
        console.log(`[数据库] 查询计划:`, explainResult);
      } catch (error) {
        console.warn(`[数据库] 查询计划分析失败: ${error}`);
      }
    }

    // 执行查询，只传递WHERE条件的参数
    const [rows] =
      queryValues.length > 0
        ? ((await pool.execute(dataQuery, queryValues)) as any)
        : ((await pool.query(dataQuery)) as any);

    this.logPerformance(`数据查询 - ${tableName}`, queryStartTime, {
      queryType,
      paramCount: queryValues.length,
      resultCount: rows.length,
    });

    // 构建返回结果
    const result = {
      data: rows,
      pagination: {
        totalRecords: total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };

    // 缓存结果（根据数据特性调整缓存时间） - 智能缓存策略
    const cacheTTL = hasFullTextSearch ? 60000 : 300000; // 全文搜索缓存1分钟，普通查询5分钟
    this.cache.set(cacheKey, result, cacheTTL);

    this.logPerformance(`分页查询完成 - ${tableName}`, overallStartTime, {
      page,
      pageSize,
      totalRecords: total,
      resultCount: rows.length,
      totalPages: result.pagination.totalPages,
      queryType,
      cached: false,
    });

    return result;
  }

  // 获取优化的字段列表
  private getOptimizedFields(tableName: string): string {
    const fieldMaps: Record<string, string> = {
      crawler: "id, title, type, date",
      execution_logs: "id, title, date",
    };
    return fieldMaps[tableName] || "id, title, date";
  }

  /**
   * 获取爬虫数据
   * 专门用于查询u3c3表的便捷方法
   * @param params - 查询参数，支持搜索、分页、过滤等
   * @returns 分页的爬虫数据结果
   */
  async getU3C3Data(
    tableName: string = "u3c3",
    params: QueryParams = {}
  ): Promise<PaginatedResult<any>> {
    return this.queryWithPagination(tableName, params);
  }

  /**
   * 获取执行日志
   * 专门用于查询execution_logs表的便捷方法
   * @param params - 查询参数，支持搜索、分页、过滤等
   * @returns 分页的执行日志结果
   */
  async getExecutionLogs(
    params: QueryParams = {}
  ): Promise<PaginatedResult<any>> {
    return this.queryWithPagination("execution_logs", params);
  }

  /**
   * 清除所有缓存
   * 在数据更新或需要强制刷新时使用
   * 注意：清除缓存会导致后续查询性能暂时下降
   */
  clearCache(): void {
    this.cache.clear();
    this.countCache.clear();
    if (QueryLogConfig.enableLog) {
      console.log("[数据库] 缓存已清除");
    }
  }

  /**
   * 获取缓存统计信息
   * 用于监控缓存性能和命中率
   * @returns 包含命中率、查询次数、缓存大小等统计信息
   */
  getCacheStats(): {
    queryCache: number;
    countCache: number;
  } & PerformanceStats & { hitRate: number } {
    const cacheStats = this.cache.getStats();
    return {
      queryCache: cacheStats.cacheSize,
      countCache: this.countCache.size,
      ...cacheStats,
    };
  }

  /**
   * 打印详细的性能报告
   * 包含缓存命中率、查询统计、平均响应时间等关键指标
   * 用于性能分析和优化决策
   */
  printPerformanceReport(): void {
    if (QueryLogConfig.enableLog) {
      const stats = this.getCacheStats();
      console.log("\n=== 数据库性能报告 ===");
      console.log(`总查询次数: ${stats.totalQueries}`);
      console.log(`缓存命中率: ${stats.hitRate}%`);
      console.log(`缓存命中次数: ${stats.cacheHits}`);
      console.log(`缓存未命中次数: ${stats.cacheMisses}`);
      console.log(`平均查询时间: ${stats.avgQueryTime.toFixed(2)}ms`);
      console.log(`慢查询次数: ${stats.slowQueries}`);
      console.log(`总查询时间: ${stats.totalQueryTime}ms`);
      console.log(`查询缓存大小: ${stats.queryCache}`);
      console.log(`COUNT缓存大小: ${stats.countCache}`);
      console.log("========================\n");
    }
  }

  /**
   * 通用新增数据方法
   * @param tableName 表名
   * @param data 要新增的数据对象
   * @returns 新增结果，包含插入的ID和影响行数
   */
  async createData(
    tableName: string,
    data: any
  ): Promise<{ id: number; affectedRows: number }> {
    const startTime = Date.now();
    const pool = await this.getPool();

    try {
      // 过滤掉undefined的字段
      const fields = Object.keys(data).filter((key) => data[key] !== undefined);
      const values = fields.map((field) => data[field]);

      if (fields.length === 0) {
        throw new Error("没有要插入的字段");
      }

      // 添加创建时间和更新时间
      if (!fields.includes("created_at")) {
        fields.push("created_at");
        values.push(new Date());
      }
      if (!fields.includes("updated_at")) {
        fields.push("updated_at");
        values.push(new Date());
      }

      const insertQuery = `INSERT INTO ${tableName} (${fields.join(
        ", "
      )}) VALUES (${fields.map(() => "?").join(", ")})`;

      if (QueryLogConfig.enableLog) {
        console.log(`[数据库] 新增SQL: ${insertQuery}`);
        console.log(`[数据库] 新增参数:`, values);
      }

      const [result] = (await pool.execute(insertQuery, values)) as any;

      this.logPerformance(`新增${tableName}数据`, startTime, {
        insertId: result.insertId,
        affectedRows: result.affectedRows,
      });

      return {
        id: result.insertId,
        affectedRows: result.affectedRows,
      };
    } catch (error) {
      console.error(`[数据库] 新增${tableName}数据失败:`, error);
      throw error;
    }
  }

  /**
   * 新增u3c3数据（兼容性方法）
   * @param data 要新增的数据对象
   * @returns 新增结果，包含插入的ID和影响行数
   */
  async createU3C3Data(
    data: any
  ): Promise<{ id: number; affectedRows: number }> {
    return this.createData("u3c3", data);
  }

  /**
   * 通用更新数据方法
   * @param tableName 表名
   * @param id 数据ID
   * @param data 要更新的数据对象
   * @param enableSoftDelete 是否启用软删除检查，默认true
   * @returns 更新结果
   */
  async updateData(
    tableName: string,
    id: number,
    data: any,
    enableSoftDelete: boolean = true
  ): Promise<{ affectedRows: number }> {
    const startTime = Date.now();
    const pool = await this.getPool();

    try {
      // 过滤掉undefined的字段
      const fields = Object.keys(data).filter((key) => data[key] !== undefined);
      const values = fields.map((field) => data[field]);

      if (fields.length === 0) {
        throw new Error("没有要更新的字段");
      }

      // 添加更新时间
      if (!fields.includes("updated_at")) {
        fields.push("updated_at");
        values.push(new Date());
      }

      const setClause = fields.map((field) => `${field} = ?`).join(", ");
      const whereClause = enableSoftDelete
        ? `WHERE id = ? AND (is_deleted = 0 OR is_deleted IS NULL)`
        : `WHERE id = ?`;
      const updateQuery = `UPDATE ${tableName} SET ${setClause} ${whereClause}`;
      values.push(id);

      if (QueryLogConfig.enableLog) {
        console.log(`[数据库] 更新SQL: ${updateQuery}`);
        console.log(`[数据库] 更新参数:`, values);
      }

      const [result] = (await pool.execute(updateQuery, values)) as any;

      this.logPerformance(`更新${tableName}数据`, startTime, {
        id,
        affectedRows: result.affectedRows,
      });

      if (result.affectedRows === 0) {
        throw new Error("数据不存在或已被删除");
      }

      return {
        affectedRows: result.affectedRows,
      };
    } catch (error) {
      console.error(`[数据库] 更新${tableName}数据失败:`, error);
      throw error;
    }
  }

  /**
   * 更新u3c3数据（兼容性方法）
   * @param id 数据ID
   * @param data 要更新的数据对象
   * @returns 更新结果
   */
  async updateU3C3Data(
    id: number,
    data: any
  ): Promise<{ affectedRows: number }> {
    return this.updateData("u3c3", id, data);
  }

  /**
   * 通用软删除数据方法
   * @param tableName 表名
   * @param id 数据ID
   * @param hardDelete 是否硬删除，默认false（软删除）
   * @returns 删除结果
   */
  async deleteData(
    tableName: string,
    id: number,
    hardDelete: boolean = false
  ): Promise<{ affectedRows: number }> {
    const startTime = Date.now();
    const pool = await this.getPool();

    try {
      let deleteQuery: string;
      let values: any[];

      if (hardDelete) {
        // 硬删除
        deleteQuery = `DELETE FROM ${tableName} WHERE id = ?`;
        values = [id];
      } else {
        // 软删除
        deleteQuery = `UPDATE ${tableName} SET is_deleted = 1 WHERE id = ?`;
        values = [id];
      }
      console.log("🚀 ~ ExternalDB ~ deleteQuery:", deleteQuery, values);

      if (QueryLogConfig.enableLog) {
        console.log(
          `[数据库] ${hardDelete ? "硬" : "软"}删除SQL: ${deleteQuery}`
        );
        console.log(`[数据库] 删除参数:`, values);
      }

      const [result] = (await pool.execute(deleteQuery, values)) as any;
      console.log("🚀 ~ ExternalDB ~ result:", result);

      this.logPerformance(
        `${hardDelete ? "硬" : "软"}删除${tableName}数据`,
        startTime,
        {
          id,
          affectedRows: result.affectedRows,
        }
      );

      if (result.affectedRows === 0) {
        throw new Error("数据不存在或已被删除");
      }

      return {
        affectedRows: result.affectedRows,
      };
    } catch (error) {
      console.error(
        `[数据库] ${hardDelete ? "硬" : "软"}删除${tableName}数据失败:`,
        error
      );
      throw error;
    }
  }

  /**
   * 软删除u3c3数据（兼容性方法）
   * @param id 数据ID
   * @returns 删除结果
   */
  async deleteU3C3Data(id: number): Promise<{ affectedRows: number }> {
    return this.deleteData("u3c3", id);
  }

  /**
   * 通用根据ID获取数据方法
   * @param tableName 表名
   * @param id 数据ID
   * @param enableSoftDelete 是否启用软删除检查，默认true
   * @param selectFields 要查询的字段，默认为*
   * @param cacheTTL 缓存时间（毫秒），默认10分钟
   * @returns 查询结果
   */
  async getDataById(
    tableName: string,
    id: number,
    enableSoftDelete: boolean = true,
    selectFields: string = "*",
    cacheTTL: number = 600000
  ): Promise<any> {
    const startTime = Date.now();
    const pool = await this.getPool();

    try {
      // 生成缓存键
      const cacheKey = `${tableName}:single:${id}:${selectFields}`;

      // 检查缓存
      const cachedResult = this.cache.get(cacheKey);
      if (cachedResult) {
        this.logPerformance(`根据ID获取${tableName}数据(缓存)`, startTime, {
          id,
          cached: true,
        });
        return cachedResult;
      }

      const whereClause = enableSoftDelete
        ? `WHERE id = ? AND (is_deleted = 0 OR is_deleted IS NULL)`
        : `WHERE id = ?`;
      const selectQuery = `SELECT ${selectFields} FROM ${tableName} ${whereClause}`;
      const values = [id];

      if (QueryLogConfig.enableLog) {
        console.log(`[数据库] 根据ID查询SQL: ${selectQuery}`);
        console.log(`[数据库] 查询参数:`, values);
      }

      const [rows] = (await pool.execute(selectQuery, values)) as any;

      this.logPerformance(`根据ID获取${tableName}数据`, startTime, {
        id,
        found: rows.length > 0,
      });

      const result = rows.length > 0 ? rows[0] : null;

      // 缓存结果
      this.cache.set(cacheKey, result, cacheTTL);

      if (!result) {
        throw new Error("数据不存在或已被删除");
      }

      return result;
    } catch (error) {
      console.error(`[数据库] 根据ID获取${tableName}数据失败:`, error);
      throw error;
    }
  }

  /**
   * 根据ID获取u3c3数据（兼容性方法）
   * @param id 数据ID
   * @returns 查询结果
   */
  async getU3C3DataById(id: number): Promise<any> {
    return this.getDataById("u3c3", id);
  }

  /**
   * 关闭数据库连接
   * 应用关闭时调用，确保所有连接正确释放
   * 包含缓存清理等清理工作
   */
  async close(): Promise<void> {
    // 停止缓存清理
    this.cache.stopCleanup();

    // 关闭连接池
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      if (QueryLogConfig.enableLog) {
        console.log("[数据库] 连接池已关闭");
      }
    }

    // 清理缓存
    this.clearCache();
  }
}
