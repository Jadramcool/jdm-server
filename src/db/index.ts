import { PrismaClient } from "@prisma/client";
import { injectable, inject } from "inversify";

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
