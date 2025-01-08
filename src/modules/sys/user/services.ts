import { FilterHelper } from "@/utils";
import { JWT } from "@jwt/index";
import { Prisma, Role, User as UserModel } from "@prisma/client";
import { plainToClass } from "class-transformer";
import { validate } from "class-validator";
import { inject, injectable } from "inversify";
import _ from "lodash";
import { PrismaDB } from "../../../db";
import type { User } from "../typings";
import { UserDto } from "./user.dto";

interface UserWithRoles extends UserModel {
  roles: Role[];
}

type UserWithRolesPrisma = Prisma.UserGetPayload<{
  include: {
    roles: {
      select: {
        role: true;
      };
    };
  };
}>;

// Exclude keys from user
function exclude<User, K extends keyof User>(
  user: User,
  keys: K[]
): Omit<User, K> {
  const filteredEntries = Object.entries(user)
    .filter(([key]) => !keys.includes(key as K))
    .map(([key, value]) => [key, value]);
  return Object.fromEntries(filteredEntries) as Omit<User, K>;
}

@injectable()
export class UserManagerService {
  constructor(
    @inject(PrismaDB) private readonly PrismaDB: PrismaDB,
    @inject(JWT) private readonly JWT: JWT
  ) {}

  // 获取用户列表
  public async getUserList(config: ReqListConfig) {
    let { filters, options, pagination } = config;
    // 过滤条件

    filters = filters || {};
    // filters["role__in"] = filters["role"];

    let sqlFilters = {};
    const keys = Object.keys(filters);
    if (keys.length > 0) {
      // 添加基础过滤条件
      sqlFilters = FilterHelper.addFilterCondition(filters, [
        "id",
        "username",
        "sex",
        "status",
        "roleType",
        "role",
      ]);

      // 遍历时间字段并添加范围过滤条件
      ["createdTime", "updatedTime"].forEach((timeField) => {
        if (keys.includes(timeField)) {
          _.set(sqlFilters, timeField, {
            gte: new Date(filters[timeField][0]),
            lte: new Date(filters[timeField][1]),
          });
        }
      });
    }

    sqlFilters["isDeleted"] = false;

    // 查询中间关联表roleId
    if (sqlFilters["role"]) {
      sqlFilters = {
        ...sqlFilters,
        roles: {
          some: {
            roleId: sqlFilters["role"],
          },
        },
      };
      delete sqlFilters["role"];
    }
    let result = [];
    // 总页数
    let totalPages = 1;

    // 查询总数
    const totalRecords = await this.PrismaDB.prisma.user.count({
      where: sqlFilters,
    });

    let page = 1;
    let pageSize = 10;

    // 如果不显示分页，则直接返回所有数据
    if (
      options &&
      options.hasOwnProperty("showPagination") &&
      !options["showPagination"]
    ) {
      result = await this.PrismaDB.prisma.user.findMany({
        where: sqlFilters,
        include: {
          roles: {
            select: {
              role: true,
            },
          },
        },
      });
    } else {
      page = parseInt(pagination?.page as string) || 1;
      pageSize = parseInt(pagination?.pageSize as string) || 10;

      result = await this.PrismaDB.prisma.user.findMany({
        skip: (page - 1) * pageSize || 0,
        take: pageSize || 10,
        where: sqlFilters,
        include: {
          roles: {
            select: {
              role: true,
            },
          },
        },
        orderBy: {
          createdTime: "desc",
        },
      });

      totalPages = Math.ceil(totalRecords / pageSize);
    }

    const formattedResult: UserWithRoles[] = result.map(
      (user: UserWithRolesPrisma) => ({
        ...user,
        roles: user.roles.map((role: { role: Role }): Role => role.role), // 只保留 role 字段的值
      })
    );

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
        data: formattedResult,
        pagination: paginationData,
      },
    };
  }

  /**
   * 创建用户
   * @param user
   */
  public async createUser(user: UserDto) {
    // 把前端传的值合并到了类里面
    try {
      let userDto = plainToClass(UserDto, user);
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

      const { username, phone } = user;

      // 检查 username 或 phone 是否已存在
      const existingUser = await this.PrismaDB.prisma.user.findFirst({
        where: {
          OR: [{ username }, { phone }],
        },
      });
      if (existingUser) {
        return {
          code: 400,
          message: "用户名或手机号已存在",
          errMsg: "用户名或手机号已存在",
        };
      }

      let result = null;

      await this.PrismaDB.prisma.$transaction(async (prisma) => {
        const { roles, roleType, ...createData } = user;

        // 创建用户信息
        result = await this.PrismaDB.prisma.user.create({
          data: {
            ...createData,
            roleType: roleType,
            password: process.env.DEFAULT_PASSWORD,
          },
        });

        const { id } = result;

        if (roleType === "doctor") {
          await prisma.doctor.create({
            data: {
              userId: id,
            },
          });
        }

        if (roleType === "patient") {
          await prisma.patient.create({
            data: {
              userId: id,
            },
          });
        }

        // 创建用户角色关系
        if (roles) {
          await prisma.userRole.createMany({
            data: roles.map((roleId: any) => ({
              userId: id,
              roleId: roleId,
            })),
          });
        }
      });
      return {
        data: {
          ...result,
          token: this.JWT.createToken(result),
        },
        code: 200,
        message: "创建用户成功",
      };
    } catch (err) {
      console.log(err);
      return err;
    }
  }

  /**
   * 更新用户
   * @param user
   */
  public async updateUser(user: User) {
    try {
      const { phone } = user;
      // 检查 phone 是否已存在
      const existingUser = await this.PrismaDB.prisma.user.findFirst({
        where: {
          phone,
        },
      });
      if (existingUser && existingUser.id !== user.id) {
        return {
          code: 400,
          message: "用户名或手机号已存在",
          errMsg: "用户名或手机号已存在",
        };
      }

      let result = null;

      await this.PrismaDB.prisma.$transaction(async (prisma) => {
        const { id, roles, ...updateData } = user;

        // 更新用户信息
        result = await prisma.user.update({
          where: { id },
          data: updateData,
        });

        // 查询角色关系，如果没有变化，则不做任何操作
        const existingRoles = await prisma.userRole.findMany({
          where: {
            userId: id,
          },
          select: { roleId: true },
        });

        if (
          existingRoles.length === roles.length &&
          existingRoles.every((role) => roles.includes(role.roleId))
        ) {
          return;
        }

        // 删除用户角色关系
        await prisma.userRole.deleteMany({
          where: {
            userId: id,
          },
        });

        // 创建用户角色关系
        await prisma.userRole.createMany({
          data: roles.map((roleId) => ({
            userId: id,
            roleId: roleId,
          })),
        });
      });

      return {
        data: {
          ...result,
        },
        code: 200,
        message: "更新用户成功",
      };
    } catch (err) {
      return err;
    }
  }

  /**
   * 删除用户
   * @param userId
   */
  public async deleteUser(userId: number | number[]) {
    try {
      if (Array.isArray(userId)) {
        await this.PrismaDB.prisma.user.updateMany({
          where: {
            id: {
              in: userId,
            },
          },
          data: {
            isDeleted: true,
          },
        });
      } else {
        await this.PrismaDB.prisma.user.update({
          where: { id: userId },
          data: {
            isDeleted: true,
          },
        });
      }
      return {
        data: null,
        code: 200,
        message: "删除用户成功",
      };
    } catch (err) {
      console.log(err);
      return err;
    }
  }

  /**
   * 启用/禁用用户
   * @param userId
   * @param status  1:启用 0:禁用
   */
  public async updateUserStatus(userId: number, status: number) {
    try {
      await this.PrismaDB.prisma.user.update({
        where: { id: userId },
        data: {
          status,
        },
      });

      return {
        data: {},
        code: 200,
        message: status === 1 ? "启用用户成功" : "禁用用户成功",
      };
    } catch (err) {
      console.log(err);
      return err;
    }
  }

  /**
   * 获取用户信息
   * @param user
   */
  public async getUserInfo(userId: number) {
    try {
      const result = await this.PrismaDB.prisma.user.findUnique({
        where: { id: userId },
      });
      if (!result) {
        return {
          code: 400,
          errMsg: "用户不存在",
        };
      }
      delete result.password;
      return {
        data: {
          ...result,
          token: this.JWT.createToken(result),
        },
        code: 200,
        message: "获取用户信息成功",
      };
    } catch (err) {
      console.log(err);
      return err;
    }
  }
}
