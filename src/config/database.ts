/*
 * @Author: jdm
 * @Date: 2024-12-17
 * @Description: 数据库配置文件
 */
import { PrismaClient } from "@prisma/client";
import type { DatabaseOptions, OptimizedPrismaClient } from "../types/prisma";

// 重新导出类型以便其他模块使用
export type { DatabaseOptions, OptimizedPrismaClient };

/**
 * 创建优化的PrismaClient实例
 * @param config 数据库配置
 * @returns PrismaClient实例
 */
export function createOptimizedPrismaClient(
  config: DatabaseOptions = {}
): OptimizedPrismaClient {
  const {
    enableQueryLog = process.env.NODE_ENV === "development",
    connectionLimit = 10,
    connectionTimeout = 20000,
    queryTimeout = 60000,
  } = config;

  return new PrismaClient({
    // 数据源配置
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // 默认隐藏敏感字段（Prisma 6.4.1+ 原生支持omit功能）
    omit: {
      user: {
        password: true, // 默认隐藏用户密码字段
      },
    },
    // 日志配置
    log: enableQueryLog
      ? [
          {
            emit: "event",
            level: "query",
          },
          {
            emit: "stdout",
            level: "error",
          },
          {
            emit: "stdout",
            level: "info",
          },
          {
            emit: "stdout",
            level: "warn",
          },
        ]
      : [
          {
            emit: "stdout",
            level: "error",
          },
        ],
    // 错误格式
    errorFormat: "pretty",
  });
}

/**
 * 数据库连接健康检查
 * @param prisma PrismaClient实例
 * @returns 连接状态
 */
export async function checkDatabaseHealth(prisma: OptimizedPrismaClient | PrismaClient): Promise<{
  isConnected: boolean;
  latency?: number;
  error?: string;
}> {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;

    return {
      isConnected: true,
      latency,
    };
  } catch (error) {
    return {
      isConnected: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * 优雅关闭数据库连接
 * @param prisma PrismaClient实例
 */
export async function gracefulDisconnect(prisma: OptimizedPrismaClient | PrismaClient): Promise<void> {
  try {
    console.log("🔌 正在关闭数据库连接...");
    await prisma.$disconnect();
    console.log("✅ 数据库连接已关闭");
  } catch (error) {
    console.error("❌ 关闭数据库连接时出错:", error);
    throw error;
  }
}

