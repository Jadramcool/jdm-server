/*
 * @Description: Prisma类型定义
 * @Author: jdm
 * @Date: 2024-12-19
 */

import { PrismaClient } from '@prisma/client';

/**
 * 带有omit配置的PrismaClient类型
 * 用于解决依赖注入中的类型兼容性问题
 */
export type OptimizedPrismaClient = PrismaClient<{
  datasources: {
    db: {
      url: string;
    };
  };
  omit: {
    user: {
      password: true;
    };
  };
  log: (
    | { emit: 'event'; level: 'query' }
    | { emit: 'stdout'; level: 'error' }
    | { emit: 'stdout'; level: 'info' }
    | { emit: 'stdout'; level: 'warn' }
  )[];
  errorFormat: 'pretty';
}>;

/**
 * 数据库配置选项
 */
export interface DatabaseOptions {
  enableQueryLog?: boolean;
  connectionLimit?: number;
  connectionTimeout?: number;
  queryTimeout?: number;
}