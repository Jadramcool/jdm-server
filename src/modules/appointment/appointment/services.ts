import { FilterHelper } from "@/utils";
import { JWT } from "@jwt/index";
import dayjs from "dayjs";
import { inject, injectable } from "inversify";
import * as _ from "lodash";
import { PrismaDB } from "../../../db";

@injectable()
export class AppointmentService {
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
   * 挂号
   * @param schedule
   */
  public async registered(schedule: any, user: any) {
    try {
      const { scheduleId } = schedule;
      const patientId = user?.patient?.id;
      const patientAppoint = await this.PrismaDB.prisma.appointment.findFirst({
        where: {
          patientId: patientId,
          doctorScheduleId: scheduleId,
        },
      });

      const scheduleInfo = await this.PrismaDB.prisma.doctorSchedule.findFirst({
        where: {
          id: scheduleId,
        },
      });
      if (!patientAppoint) {
        await this.PrismaDB.prisma.appointment.create({
          data: {
            patientId: patientId,
            doctorScheduleId: scheduleId,
            appointmentDate: scheduleInfo.date,
            status: "UNFINISHED",
          },
        });
      } else {
        throw "该日期已挂过号";
      }
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
   * 取消挂号
   * @param appointmentId 挂号ID
   */
  public async cancelAppointment(appointmentId: number) {
    try {
      await this.PrismaDB.prisma.appointment.update({
        where: {
          id: appointmentId,
        },
        data: {
          status: "CANCELED",
        },
      });
      return {
        data: null,
        code: 200,
        message: "挂号成功",
      };
    } catch (err) {
      return {
        data: null,
        code: 400,
        message: "挂号失败",
        errMsg: err,
      };
    }
  }

  // 医生当日当前时间段挂号列表
  public async getDoctorAppointmentList(config: ReqListConfig) {
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

  // 叫号
  public async call(appointmentId: number) {
    try {
      await this.PrismaDB.prisma.appointment.update({
        where: {
          id: appointmentId,
        },
        data: {
          status: "CALLED",
        },
      });
      return {
        data: null,
        code: 200,
        message: "叫号成功",
      };
    } catch (err) {
      return {
        data: null,
        code: 400,
        message: "叫号失败",
        errMsg: err,
      };
    }
  }

  // 完成就诊
  public async finish(appointmentId: number) {
    try {
      await this.PrismaDB.prisma.appointment.update({
        where: {
          id: appointmentId,
        },
        data: {
          status: "FINISHED",
        },
      });
      return {
        data: null,
        code: 200,
        message: "叫号成功",
      };
    } catch (err) {
      return {
        data: null,
        code: 400,
        message: "叫号失败",
        errMsg: err,
      };
    }
  }

  /**
   * 获取挂号详情
   * @param appointmentId
   */
  public async getAppointment(appointmentId: number) {
    try {
      let result;
      result = await this.PrismaDB.prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          medicalRecord: {
            include: {
              doctor: {
                include: {
                  user: true,
                },
              },
            },
          },
          patient: {
            include: {
              user: true,
            },
          },
        },
      });

      return {
        data: result,
        code: 200,
        message: "获取挂号详情成功",
      };
    } catch (err) {
      return {
        data: null,
        code: 400,
        message: "获取挂号详情失败",
        errMsg: err,
      };
    }
  }
}
