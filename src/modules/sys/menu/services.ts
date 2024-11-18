import { FilterHelper } from "@/utils";
import { checkUnique } from "@/utils/checkUnique";
import { inject, injectable } from "inversify";
import { PrismaDB } from "../../../db";
import { MenuDto } from "./menu.dto";

@injectable()
export class MenuService {
  constructor(@inject(PrismaDB) private readonly PrismaDB: PrismaDB) {}
  // 获取菜单
  public async getMenuList(config: ReqListConfig) {
    let { filters, options, pagination } = config;
    // 过滤条件

    filters = filters || {};
    let sqlFilters = {};
    if (Object.keys(filters).length > 0) {
      sqlFilters = FilterHelper.addFilterCondition(filters, ["id", "name"]);
    }

    const result = await this.PrismaDB.prisma.menu.findMany({
      where: sqlFilters,
    });

    try {
      return {
        data: result,
        code: 200,
        message: "获取菜单成功",
      };
    } catch (err) {
      return {
        data: null,
        code: 500,
        message: "获取菜单失败",
        errMsg: err,
      };
    }
  }

  /**
   * 创建菜单
   */
  public async createMenu(menu: MenuDto) {
    try {
      const { code } = menu;
      // 检查 code 是否已存在
      const existingMenuCode = await checkUnique(
        this.PrismaDB,
        "menu",
        "code",
        code
      );
      if (existingMenuCode) {
        return {
          code: 400,
          message: "该菜单权限代码已存在",
          errMsg: "该菜单权限代码已存在",
        };
      }

      const result = await this.PrismaDB.prisma.menu.create({
        data: menu,
      });

      return {
        code: 200,
        data: result,
        message: "新增菜单成功",
      };
    } catch (err) {
      console.log("🚀 ~ createMenu ~ err:", err);
      return {
        data: null,
        code: 404,
        message: "新增菜单失败",
        errMsg: err,
      };
    }
  }

  /**
   * 创建菜单
   */
  public async updateMenu(menu: MenuDto) {
    try {
      const { code } = menu;
      // 检查 phone 是否已存在
      const existingMenuCode = await this.PrismaDB.prisma.menu.findFirst({
        where: {
          code,
        },
      });

      if (existingMenuCode && existingMenuCode?.id !== menu.id) {
        return {
          code: 400,
          message: "该菜单权限代码已存在",
          errMsg: "该菜单权限代码已存在",
        };
      }
      const { id, ...extraData } = menu;
      const result = await this.PrismaDB.prisma.menu.update({
        where: {
          id: menu.id,
        },
        data: extraData,
      });

      return {
        code: 200,
        data: result,
        message: "更新菜单成功",
      };
    } catch (err) {
      console.log(err);
      return {
        data: null,
        code: 404,
        message: "更新菜单失败",
        errMsg: err,
      };
    }
  }

  /**
   * 删除菜单
   * @param menuId
   */
  public async deleteMenu(menuId: number | number[]) {
    try {
      if (Array.isArray(menuId)) {
        await this.PrismaDB.prisma.menu.deleteMany({
          where: {
            id: {
              in: menuId,
            },
          },
        });
      } else {
        await this.PrismaDB.prisma.menu.delete({
          where: { id: menuId },
        });
      }
      return {
        data: null,
        code: 200,
        message: "删除菜单成功",
      };
    } catch (err) {
      console.log(err);
      return {
        data: null,
        code: 404,
        message: "删除菜单失败",
        errMsg: err,
      };
    }
  }
}
