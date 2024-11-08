import { inject, injectable } from "inversify";
import { PrismaDB } from "../../../db";

@injectable()
export class MenuService {
  constructor(@inject(PrismaDB) private readonly PrismaDB: PrismaDB) {}
  // 获取菜单
  public async getMenuList(query: Recordable) {
    const result = await this.PrismaDB.prisma.menu.findMany({});
    try {
      return {
        data: result,
        code: 200,
        message: "获取菜单成功",
      };
    } catch (err) {
      console.log(err);
      return err;
    }
  }
}
