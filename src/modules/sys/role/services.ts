import { FilterHelper } from "@/utils";
import { JWT } from "@jwt/index";
import { Menu, Prisma, Role as RoleModel } from "@prisma/client";
import { plainToClass } from "class-transformer";
import { validate } from "class-validator";
import { inject, injectable } from "inversify";
import { PrismaDB } from "../../../db";
import { RoleDto } from "./role.dto";
import { Role } from "./typings";

interface RoleWithMenus extends RoleModel {
  menus: Menu[];
}

type RoleWithMenusPrisma = Prisma.RoleGetPayload<{
  include: {
    menus: {
      select: {
        menu: true;
      };
    };
  };
}>;

@injectable()
export class RoleService {
  constructor(
    @inject(PrismaDB) private readonly PrismaDB: PrismaDB,
    @inject(JWT) private readonly JWT: JWT
  ) {}

  // 获取角色列表
  public async getRoleList(config: ReqListConfig) {
    let { filters, options, pagination } = config;

    filters = filters || {};
    let sqlFilters = {};
    if (Object.keys(filters).length > 0) {
      sqlFilters = FilterHelper.addFilterCondition(filters, [
        "id",
        "name",
        "code",
      ]);
    }

    console.log("sqlFilters", sqlFilters);
    let result = [];
    // 总页数
    let totalPages = 1;

    // 查询总数
    const totalRecords = await this.PrismaDB.prisma.role.count({
      where: sqlFilters,
    });

    const { showPagination = true, with_menu: withMenu = false } =
      options || {};
    const page = parseInt(pagination?.page as string) || 1;
    const pageSize = parseInt(pagination?.pageSize as string) || 10;

    const commonQuery = {
      where: sqlFilters,
      include: withMenu
        ? {
            menus: {
              select: { menu: true },
            },
          }
        : undefined,
    };

    // 不显示分页，返回所有数据
    if (!showPagination) {
      result = withMenu
        ? await this.PrismaDB.prisma.role.findMany(commonQuery)
        : await this.PrismaDB.prisma.user.findMany({ where: sqlFilters });
    } else {
      // 分页查询
      result = await this.PrismaDB.prisma.role.findMany({
        ...commonQuery,
        skip: (page - 1) * pageSize,
        take: pageSize,
      });
      totalPages = Math.ceil(totalRecords / pageSize);
    }

    let res = result;

    // 包含菜单
    if (withMenu) {
      const formattedResult: RoleWithMenus[] = result.map(
        (role: RoleWithMenusPrisma) => ({
          ...role,
          menus: role.menus.map((menu: { menu: Menu }): Menu => menu.menu), // 只保留 role 字段的值
        })
      );
      res = formattedResult;
    }

    // 分页信息
    const paginationData =
      options?.showPagination !== false
        ? {
            page,
            pageSize,
            totalRecords,
            totalPages,
          }
        : null;

    return {
      data: {
        data: res,
        pagination: paginationData,
      },
    };
  }

  /**
   * 获取角色详情
   * @param roleId
   */
  public async getRole(roleId: number) {
    const roleRes = await this.PrismaDB.prisma.role.findUnique({
      where: { id: roleId },
      include: {
        menus: {
          select: {
            menu: true,
          },
        },
      },
    });

    // 包含菜单
    const menus: Menu[] = roleRes.menus.map(
      (menu: { menu: Menu }): Menu => menu.menu
    );
    const role = { ...roleRes, menus };
    return {
      data: role,
      code: 200,
      message: "获取角色详情成功",
    };
  }

  /**
   * 创建角色
   * @param role
   */
  public async createRole(role: RoleDto) {
    try {
      let userDto = plainToClass(RoleDto, role);
      const errors = await validate(userDto);
      if (errors.length > 0) {
        const errorMessages = errors.map((error) => {
          return {
            property: error.property,
            value: Object.values(error.constraints),
          };
        });
        return {
          code: 400,
          message: "参数验证失败",
          errMsg: "参数验证失败",
          data: errorMessages,
        };
      }

      const { name, code } = role;
      // 检查 name 或 code 是否已存在
      const existingRole = await this.PrismaDB.prisma.role.findFirst({
        where: {
          OR: [{ name }, { code }],
        },
      });
      if (existingRole) {
        return {
          code: 400,
          message: "角色名称或代码已存在",
          errMsg: "角色名称或代码已存在",
        };
      }

      const result = await this.PrismaDB.prisma.role.create({
        data: role,
      });

      return {
        data: {
          ...result,
        },
        code: 200,
        message: "创建角色成功",
      };
    } catch (err) {
      console.log(err);
      return err;
    }
  }

  /**
   * 更新角色
   * @param user
   */
  public async updateRole(role: Role) {
    try {
      const result = await this.PrismaDB.prisma.role.update({
        where: { id: role.id },
        data: role,
      });
      return {
        data: result,
        code: 200,
        message: "更新角色成功",
      };
    } catch (err) {
      console.log(err);
      return err;
    }
  }

  /**
   * 删除角色
   * @param roleId
   */
  public async deleteRole(roleId: number) {
    try {
      await this.PrismaDB.prisma.$transaction(async (prisma) => {
        // 判断是否有用户使用该角色
        const users = await this.PrismaDB.prisma.userRole.findMany({
          where: {
            roleId: roleId,
          },
        });
        if (users.length > 0) {
          throw "该角色已被用户使用，不能删除";
        }

        // 删除角色
        await this.PrismaDB.prisma.role.delete({
          where: {
            id: roleId,
          },
        });
      });
      return {
        data: null,
        code: 200,
        message: "删除角色成功",
      };
    } catch (err) {
      return {
        data: null,
        code: 400,
        message: "删除菜单失败",
        errMsg: err,
      };
    }
  }

  /**
   * 分配角色权限
   * @param data
   */
  public async updateRoleMenu(data: any) {
    try {
      await this.PrismaDB.prisma.$transaction(async (prisma) => {
        const { roleId, menuIds } = data;

        // 查询当前角色和菜单的关系
        const existingRelations = await prisma.roleMenu.findMany({
          where: { roleId: roleId },
          select: { menuId: true }, // 只取 menuId 字段
        });

        // 提取当前存在的菜单 ID
        const existingMenuIds = existingRelations.map(
          (relation) => relation.menuId
        );

        // 计算需要添加的菜单 ID
        const menuIdsToAdd = menuIds.filter(
          (menuId: number) => !existingMenuIds.includes(menuId)
        );

        // 计算需要删除的菜单 ID
        const menuIdsToRemove = existingMenuIds.filter(
          (menuId: number) => !menuIds.includes(menuId)
        );

        // 执行删除操作
        if (menuIdsToRemove.length > 0) {
          await prisma.roleMenu.deleteMany({
            where: {
              roleId: roleId,
              menuId: { in: menuIdsToRemove },
            },
          });
        }

        // 执行新增操作
        if (menuIdsToAdd.length > 0) {
          await prisma.roleMenu.createMany({
            data: menuIdsToAdd.map((menuId: number) => ({
              roleId: roleId,
              menuId: menuId,
            })),
          });
        }
      });

      return {
        data: null,
        code: 200,
        message: "分配角色-菜单成功",
      };
    } catch (err) {
      return {
        data: null,
        code: 400,
        message: "分配角色-菜单失败",
        errMsg: err,
      };
    }
  }
}
