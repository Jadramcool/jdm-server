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

// 注入器
@injectable()
export class PrismaDB {
  prisma: PrismaClient;
  constructor(
    @inject("PrismaClient")
    PrismaClient: () => PrismaClient
  ) {
    this.prisma = PrismaClient();
  }
}
