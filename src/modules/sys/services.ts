import { inject, injectable } from "inversify";
import { PrismaDB } from "../../db";
import { plainToClass } from "class-transformer";
import { validate } from "class-validator";

@injectable()
export class SystemService {
  constructor(@inject(PrismaDB) private readonly PrismaDB: PrismaDB) {}
  // 获取菜单
  public async getPermissionList(userId: number = 1) {
    try {
      const result = await this.PrismaDB.prisma.permission.findMany({});
      return {
        data: result,
        message: "",
      };
    } catch (err) {
      return {
        data: [],
        message: err.message,
      };
    }
  }
}
