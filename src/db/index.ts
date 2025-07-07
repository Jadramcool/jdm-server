/*
 * @Author: jdm
 * @Date: 2024-04-23 15:44:52
 * @LastEditors: jdm
 * @LastEditTime: 2024-09-04 15:41:43
 * @FilePath: \APP\src\db\index.ts
 * @Description:
 *
 */
import { PrismaClient } from "@prisma/client";
import { inject, injectable } from "inversify";
import type { OptimizedPrismaClient } from "../types/prisma";

// 注入器
@injectable()
export class PrismaDB {
  prisma: OptimizedPrismaClient;
  constructor(
    @inject("PrismaClient")
    prismaClient: OptimizedPrismaClient
  ) {
    this.prisma = prismaClient;
  }

  /**
   * 优雅关闭数据库连接
   */
  async disconnect() {
    await this.prisma.$disconnect();
  }

  /**
   * 检查数据库连接状态
   */
  async isConnected(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
