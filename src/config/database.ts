/*
 * @Author: jdm
 * @Date: 2024-12-17
 * @Description: 数据库配置文件
 */
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";
import type { PoolConfig } from "mariadb";
import type { DatabaseOptions } from "../types/prisma";

// 重新导出类型以便其他模块使用
export type { DatabaseOptions };

/**
 * 创建PrismaClient实例
 * @param config 数据库配置
 * @returns PrismaClient实例
 */
export function createPrismaClient(config: DatabaseOptions = {}) {
  const {
    enableQueryLog = process.env.NODE_ENV === "development",
    connectionLimit = 10,
    connectionTimeout = 5000,
  } = config;

  const dbUrl = process.env.DATABASE_URL || "mysql://localhost:3306/test";
  const url = new URL(dbUrl);
  const poolConfig: PoolConfig = {
    host: url.hostname,
    port: Number(url.port) || 3306,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
    connectionLimit,
    connectTimeout: connectionTimeout,
  };
  const adapter = new PrismaMariaDb(poolConfig);

  return new PrismaClient({
    adapter,
    omit: {
      user: {
        password: true,
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

export type ConfiguredPrismaClient = ReturnType<typeof createPrismaClient>;

/**
 * 数据库连接健康检查
 * @param prisma PrismaClient实例
 * @returns 连接状态
 */
export async function checkDatabaseHealth(
  prisma: ConfiguredPrismaClient
): Promise<{
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
