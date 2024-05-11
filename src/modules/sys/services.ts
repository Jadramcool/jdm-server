import { inject, injectable } from "inversify";
import { PrismaDB } from "../../db";
import { UserDto } from "./user.dto";
import { plainToClass } from "class-transformer";
import { validate } from "class-validator";

@injectable()
export class SystemService {
  constructor(@inject(PrismaDB) private readonly PrismaDB: PrismaDB) {}
  // 获取菜单
  public async getPremissionList(userId: number = 1) {
    try {
      const result = await this.PrismaDB.prisma.premission.findMany({});
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
