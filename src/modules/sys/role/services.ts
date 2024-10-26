import { FilterHelper } from "@/utils";
import { JWT } from "@jwt/index";
import { inject, injectable } from "inversify";
import { PrismaDB } from "../../../db";

@injectable()
export class RoleManageService {
  constructor(
    @inject(PrismaDB) private readonly PrismaDB: PrismaDB,
    @inject(JWT) private readonly JWT: JWT
  ) {}

  public async getRoleList(config: ReqListConfig) {
    let { filters, options, pagination } = config;

    filters = filters || {};
    let sqlFilters = {};
    if (Object.keys(filters).length > 0) {
      sqlFilters = FilterHelper.addFilterCondition(filters, [
        "username",
        "sex",
      ]);
    }

    console.log("sqlFilters", sqlFilters);
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
    if (options["showPagination"] && !options["showPagination"]) {
      result = await this.PrismaDB.prisma.user.findMany({
        where: sqlFilters,
      });
    } else {
      page = parseInt(pagination.page as string);
      pageSize = parseInt(pagination.pageSize as string);

      result = await this.PrismaDB.prisma.user.findMany({
        skip: (page - 1) * pageSize || 0,
        take: pageSize || 10,
        where: sqlFilters,
      });

      totalPages = Math.ceil(totalRecords / pageSize);
    }

    console.log("-------filters", typeof filters, filters);
    console.log("-------", new Date().toLocaleString());

    // 过滤掉密码
    const res = result.map((item) => {
      return exclude(item, ["password"]);
    });

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
   * 创建用户
   * @param user
   */
  public async createRole(role) {}

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
      // 删除密码
    } catch (err) {
      console.log(err);
      return err;
    }
  }
}
