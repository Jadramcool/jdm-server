import { inject, injectable } from "inversify";
import { PrismaDB } from "../../../db";

@injectable()
export class PermissionService {
  constructor(@inject(PrismaDB) private readonly PrismaDB: PrismaDB) {}
  // 获取菜单
  public async getPermissionList(query: Recordable) {
    const result = await this.PrismaDB.prisma.permission.findMany({});
    try {
      return {
        data: result,
        code: 200,
        message: "获取权限菜单成功",
      };
    } catch (err) {
      console.log(err);
      return err;
    }
  }
}
