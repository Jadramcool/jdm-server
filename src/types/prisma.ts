/*
 * @Description: Prisma类型定义
 * @Author: jdm
 * @Date: 2024-12-19
 */

/**
 * 数据库配置选项
 */
export interface DatabaseOptions {
  enableQueryLog?: boolean;
  connectionLimit?: number;
  connectionTimeout?: number;
  queryTimeout?: number;
}
