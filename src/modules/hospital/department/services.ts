import { FilterHelper } from "@/utils";
import { JWT } from "@jwt/index";
import { Department } from "@prisma/client";
import { plainToClass } from "class-transformer";
import { validate } from "class-validator";
import { inject, injectable } from "inversify";
import { PrismaDB } from "../../../db";
import { DepartmentDto } from "./department.dto";

@injectable()
export class DepartmentService {
  constructor(
    @inject(PrismaDB) private readonly PrismaDB: PrismaDB,
    @inject(JWT) private readonly JWT: JWT
  ) {}

  // 获取科室列表
  public async getDepartmentList(config: ReqListConfig) {
    let { filters, options, pagination } = config;

    filters = filters || {};
    let sqlFilters = {};
    if (Object.keys(filters).length > 0) {
      sqlFilters = FilterHelper.addFilterCondition(filters, [
        "name",
        "content",
      ]);
    }

    let result = [];
    // 总页数
    let totalPages = 1;

    // 查询总数
    const totalRecords = await this.PrismaDB.prisma.department.count({
      where: sqlFilters,
    });

    const {
      showPagination = true,
      with_menu: withMenu = false,
      with_user: withUser = false,
    } = options || {};
    const page = parseInt(pagination?.page as string) || 1;
    const pageSize = parseInt(pagination?.pageSize as string) || 10;

    const commonQuery: any = {
      where: sqlFilters,
      orderBy: {
        createdTime: "desc",
      },
    };

    // 不显示分页，返回所有数据
    if (!showPagination) {
      result = await this.PrismaDB.prisma.department.findMany(commonQuery);
    } else {
      // 分页查询
      result = await this.PrismaDB.prisma.department.findMany({
        ...commonQuery,
        skip: (page - 1) * pageSize,
        take: pageSize,
      });
      totalPages = Math.ceil(totalRecords / pageSize);
    }

    let res = result;

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
   * 获取科室详情
   * @param departmentId
   */
  public async getDepartment(departmentId: number) {
    try {
      const result = await this.PrismaDB.prisma.department.findUnique({
        where: { id: departmentId },
        include: {
          doctors: true,
        },
      });

      return {
        data: result,
        code: 200,
        message: "获取科室详情成功",
      };
    } catch (err) {
      return {
        data: null,
        code: 400,
        message: "获取科室详情失败",
        errMsg: err,
      };
    }
  }

  /**
   * 创建科室
   * @param department
   */
  public async createDepartment(department: DepartmentDto) {
    try {
      let departmentDto = plainToClass(DepartmentDto, department);
      const errors = await validate(departmentDto);
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

      const { name } = department;
      // 检查 name 是否已存在
      const existingDepartment =
        await this.PrismaDB.prisma.department.findFirst({
          where: {
            OR: [{ name }],
          },
        });
      if (existingDepartment) {
        throw new Error("科室名称已存在");
      }

      const result = await this.PrismaDB.prisma.department.create({
        data: department,
      });

      return {
        data: {
          ...result,
        },
        code: 200,
        message: "创建科室成功",
      };
    } catch (err) {
      console.error(err);
      return {
        data: null,
        code: 400,
        message: "创建科室失败",
        errMsg: err,
      };
    }
  }

  /**
   * 更新科室
   * @param department
   */
  public async updateDepartment(department: Department) {
    try {
      const result = await this.PrismaDB.prisma.department.update({
        where: { id: department.id },
        data: department,
      });
      return {
        data: result,
        code: 200,
        message: "更新科室成功",
      };
    } catch (err) {
      return {
        data: null,
        code: 400,
        message: "更新科室失败",
        errMsg: err,
      };
    }
  }

  /**
   * 删除科室
   * @param departmentId
   */
  public async deleteDepartment(departmentId: number) {
    try {
      await this.PrismaDB.prisma.$transaction(async (prisma) => {
        // 判断是否有用户使用该科室
        const users = await this.PrismaDB.prisma.userRole.findMany({
          where: {
            roleId: departmentId,
          },
        });
        if (users.length > 0) {
          throw "该科室下存在医生，不能删除";
        }

        // 删除科室
        await this.PrismaDB.prisma.role.delete({
          where: {
            id: departmentId,
          },
        });
      });
      return {
        data: null,
        code: 200,
        message: "删除科室成功",
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
}
