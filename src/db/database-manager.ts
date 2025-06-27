/**
 * @Author: jdm
 * @Date: 2025-01-27
 * @LastEditors: jdm
 * @LastEditTime: 2025-01-27
 * @FilePath: \jdm-server\src\db\database-manager.ts
 * @Description: 数据库管理工具 - 数据库状态查询
 */
import mysql from "mysql2/promise";

// 数据库配置接口
interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  charset?: string;
  timezone?: string;
}

// 数据库状态检查结果接口
interface DatabaseStatus {
  tables: string[];
  tableExists: boolean;
  columns: Array<{ Field: string; Type: string }>;
  indexes: Array<{ Key_name: string; Column_name: string; Index_type: string }>;
  recordCount: number;
}

export class DatabaseManager {
  private pool: mysql.Pool;
  private config: DatabaseConfig;

  constructor(config: DatabaseConfig) {
    this.config = config;
    this.pool = mysql.createPool({
      ...config,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
    console.log("[数据库管理器] 连接池创建完成");
  }

  /**
   * 检查数据库状态
   * @param tableName 表名，默认为 'scraped_data'
   * @returns 数据库状态信息
   */
  async checkDatabaseStatus(
    tableName: string = "scraped_data"
  ): Promise<DatabaseStatus> {
    console.log(`[数据库管理器] 检查表 ${tableName} 的状态...`);

    try {
      // 检查所有表
      const [tables] = (await this.pool.execute("SHOW TABLES")) as any;
      const tableList = tables.map(
        (table: any) => Object.values(table)[0] as string
      );

      // 检查目标表是否存在
      const tableExists = tableList.includes(tableName);

      if (!tableExists) {
        console.log(`[数据库管理器] ❌ 表 ${tableName} 不存在！`);
        return {
          tables: tableList,
          tableExists: false,
          columns: [],
          indexes: [],
          recordCount: 0,
        };
      }

      // 检查表结构
      const [columns] = (await this.pool.execute(
        `DESCRIBE ${tableName}`
      )) as any;

      // 检查现有索引
      const [indexes] = (await this.pool.execute(
        `SHOW INDEX FROM ${tableName}`
      )) as any;

      // 检查数据量
      const [count] = (await this.pool.execute(
        `SELECT COUNT(*) as total FROM ${tableName}`
      )) as any;

      const status: DatabaseStatus = {
        tables: tableList,
        tableExists: true,
        columns,
        indexes,
        recordCount: count[0].total,
      };

      console.log(`[数据库管理器] ✅ 表 ${tableName} 状态检查完成`);
      console.log(
        `[数据库管理器] 记录数: ${status.recordCount}, 索引数: ${status.indexes.length}`
      );

      return status;
    } catch (error: any) {
      console.error(`[数据库管理器] 检查数据库状态失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 关闭数据库连接
   */
  async close(): Promise<void> {
    await this.pool.end();
    console.log("[数据库管理器] 连接池已关闭");
  }
}

// 导出一个便捷的工厂函数，用于非依赖注入环境
export function createDatabaseManager(config: DatabaseConfig): DatabaseManager {
  // 创建一个简单的实例，不使用依赖注入
  const manager = Object.create(DatabaseManager.prototype);
  manager.config = config;
  manager.pool = mysql.createPool({
    ...config,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
  console.log("[数据库管理器] 连接池创建完成（工厂模式）");
  return manager;
}

