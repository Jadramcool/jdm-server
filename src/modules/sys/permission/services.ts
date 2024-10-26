import { inject, injectable } from "inversify";
import { PrismaDB } from "../../../db";

@injectable()
export class PermissionService {
  constructor(@inject(PrismaDB) private readonly PrismaDB: PrismaDB) {}
  // 获取菜单
  public async getPermissionList(userId: number) {
    const result = await this.PrismaDB.prisma.permission.findMany({});
    try {
      return {
        data: result,
        code: 200,
        message: "获取用户信息成功",
      };
    } catch (err) {
      console.log(err);
      return err;
    }
  }
}
