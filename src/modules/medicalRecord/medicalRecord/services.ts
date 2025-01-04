import { FilterHelper } from "@/utils";
import { JWT } from "@jwt/index";
import dayjs from "dayjs";
import { inject, injectable } from "inversify";
import * as _ from "lodash";
import { PrismaDB } from "../../../db";

@injectable()
export class MedicalRecordService {
  constructor(
    @inject(PrismaDB) private readonly PrismaDB: PrismaDB,
    @inject(JWT) private readonly JWT: JWT
  ) {}

  // 获取挂号列表
  public async getAppointmentList(config: ReqListConfig) {
    let { filters = {}, options, pagination } = config;
    let sqlFilters = {};
    const keys = Object.keys(filters);
    if (keys.length > 0) {
      const tempFilters = FilterHelper.addFilterConditionAny(filters, ["date"]);
      const newFilters: Recordable = {};

      for (const [key, value] of Object.entries(tempFilters)) {
        _.set(newFilters, key, value);
      }

      sqlFilters = newFilters;
    }

    ["date"].forEach((timeField) => {
      if (keys.includes(timeField)) {
        const filterValue = filters[timeField];
        if (Array.isArray(filters[timeField])) {
          sqlFilters[timeField] = {
            gte: new Date(filters[timeField][0]),
            lte: new Date(filters[timeField][1]),
          };
        } else if (
          typeof filterValue === "string" ||
          typeof filterValue === "number" ||
          filterValue instanceof Date
        ) {
          sqlFilters[timeField] = new Date(
            dayjs(filterValue).format("YYYY-MM-DD")
          );
        } else {
          throw new Error(`Invalid date format for field ${timeField}`);
        }
      }
    });
    let result = [];
    // 总页数
    let totalPages = 1;
    // 查询总数

    let page = 1;
    let pageSize = 10;

    const commonQuery = {
      where: sqlFilters,
      include: {
        patient: {
          include: {
            user: true,
          },
        },
        doctorSchedule: {
          include: {
            doctor: {
              include: {
                user: true,
                department: true,
              },
            },
          },
        },
      },
      orderBy: {
        doctorSchedule: {
          date: "desc" as const,
        },
      },
    };

    const totalRecords = await this.PrismaDB.prisma.appointment.count({
      where: sqlFilters,
    });

    // 如果不显示分页，则直接返回所有数据
    if (
      options &&
      options.hasOwnProperty("showPagination") &&
      !options["showPagination"]
    ) {
      result = await this.PrismaDB.prisma.appointment.findMany({
        ...commonQuery,
      });
    } else {
      page = parseInt(pagination?.page as string) || 1;
      pageSize = parseInt(pagination?.pageSize as string) || 10;

      result = await this.PrismaDB.prisma.appointment.findMany({
        skip: (page - 1) * pageSize || 0,
        take: pageSize || 10,
        ...commonQuery,
      });

      totalPages = Math.ceil(totalRecords / pageSize);
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
        data: result,
        pagination: paginationData,
      },
    };
  }

  /**
   * 新建病例
   * @param medicalRecord
   */
  public async createMedicalRecord(medicalRecord: any, user: any) {
    await this.PrismaDB.prisma.medicalRecord.create({
      data: {
        ...medicalRecord,
        doctorId: user.doctor.id,
      },
    });
    try {
      return {
        data: null,
        code: 200,
        message: "挂号成功",
      };
    } catch (err) {
      return {
        data: null,
        code: 400,
        message: "创建排班记录失败",
        errMsg: err,
      };
    }
  }

  /**
   * 更新病例
   * @param medicalRecord
   */
  public async updateMedicalRecord(medicalRecord: any, user: any) {
    await this.PrismaDB.prisma.medicalRecord.update({
      where: {
        id: medicalRecord.id,
      },
      data: {
        ...medicalRecord,
      },
    });
    try {
      return {
        data: null,
        code: 200,
        message: "更新成功",
      };
    } catch (err) {
      return {
        data: null,
        code: 400,
        message: "更新失败",
        errMsg: err,
      };
    }
  }
}
