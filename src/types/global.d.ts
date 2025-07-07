/*
 * @Description: 全局类型定义增强
 * @Author: jdm
 * @Date: 2024-12-19
 */

import type { OptimizedPrismaClient } from './prisma';

// 扩展全局类型定义
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      DATABASE_URL: string;
      DB_CONNECTION_LIMIT?: string;
      DB_CONNECTION_TIMEOUT?: string;
      DB_QUERY_TIMEOUT?: string;
      JWT_SECRET: string;
      JWT_EXPIRES_IN?: string;
    }
  }
}

// 模块声明增强
declare module 'inversify' {
  interface Container {
    get<T>(serviceIdentifier: 'PrismaClient'): OptimizedPrismaClient;
  }
}

export {};