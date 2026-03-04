/*
 * @Author: jdm
 * @Date: 2024-12-17
 * @Description: 数据库配置文件
 */
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";
import type { PoolConfig } from "mariadb";
import type { DatabaseOptions } from "../types/prisma";

export type { DatabaseOptions };

/**
 * 从环境变量获取数据库配置
 */
function getDatabaseConfig() {
  const dbUrl = process.env.DATABASE_URL || "mysql://localhost:3306/test";
  const url = new URL(dbUrl);

  return {
    host: url.hostname,
    port: Number(url.port) || 3306,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || "10", 10),
    connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT || "10000", 10),
    idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || "30000", 10),
  };
}

/**
 * 创建PrismaClient实例
 * @param config 数据库配置
 * @returns PrismaClient实例
 */
export function createPrismaClient(config: DatabaseOptions = {}) {
  const isDevelopment = process.env.NODE_ENV === "development";

  const dbConfig = getDatabaseConfig();

  const poolConfig: PoolConfig = {
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.database,
    connectionLimit: config.connectionLimit ?? dbConfig.connectionLimit,
    connectTimeout: config.connectionTimeout ?? dbConfig.connectTimeout,
    idleTimeout: dbConfig.idleTimeout,
  };

  const adapter = new PrismaMariaDb(poolConfig);

  return new PrismaClient({
    adapter,
    omit: {
      user: {
        password: true,
      },
    },
    log: isDevelopment
      ? [
        { emit: "event", level: "query" },
        { emit: "stdout", level: "error" },
        { emit: "stdout", level: "info" },
        { emit: "stdout", level: "warn" },
      ]
      : [{ emit: "stdout", level: "error" }],
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
