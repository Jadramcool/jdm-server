import { FilterHelper } from "@/utils";
import { JWT } from "@jwt/index";
import dayjs from "dayjs";
import { inject, injectable } from "inversify";
import * as _ from "lodash";
import { PrismaDB } from "../../../db";

@injectable()
export class MyScheduleService {
  constructor(
    @inject(PrismaDB) private readonly PrismaDB: PrismaDB,
    @inject(JWT) private readonly JWT: JWT
  ) {}

  // 获取排班列表
  public async getScheduleList(config: ReqListConfig) {
    let { filters = {}, options, pagination, sort, user } = config;
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

    const doctorId = user.doctor.id;
    sqlFilters["doctorId"] = doctorId;
    let result = [];
    // 总页数
    let totalPages = 1;
    // 查询总数
    const totalRecords = await this.PrismaDB.prisma.doctorSchedule.count({
      where: sqlFilters,
    });

    let page = 1;
    let pageSize = 10;

    const orderBy = sort;

    // 如果不显示分页，则直接返回所有数据
    if (
      options &&
      options.hasOwnProperty("showPagination") &&
      !options["showPagination"]
    ) {
      result = await this.PrismaDB.prisma.doctorSchedule.findMany({
        where: sqlFilters,
        include: {
          doctor: {
            include: {
              user: true,
              department: true,
            },
          },
        },
        orderBy: orderBy ? orderBy : { date: "desc" },
      });
    } else {
      page = parseInt(pagination?.page as string) || 1;
      pageSize = parseInt(pagination?.pageSize as string) || 10;

      result = await this.PrismaDB.prisma.doctorSchedule.findMany({
        skip: (page - 1) * pageSize || 0,
        take: pageSize || 10,
        where: sqlFilters,
        include: {
          doctor: {
            include: {
              user: true,
              department: true,
            },
          },
        },
        orderBy: orderBy ? orderBy : { date: "desc" },
      });

      totalPages = Math.ceil(totalRecords / pageSize);
    }
    console.log(
      "%c [ result ]-91",
      "font-size:13px; background:pink; color:#bf2c9f;",
      result
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

    // 是否按照date字段进行分组，按照排班日期返回数据，建议不分页的时候使用
    if (options?.groupBy) {
      // 按照 date 字段进行分组
      const groupedSchedules = result.reduce((acc, schedule) => {
        const dateKey = schedule.date.toISOString().split("T")[0]; // 获取日期部分
        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }
        acc[dateKey].push(schedule);
        return acc;
      }, {});

      // 将分组结果转换为数组
      result = Object.keys(groupedSchedules).map((dateKey) => ({
        date: dateKey,
        schedule: groupedSchedules[dateKey],
      }));
    }

    return {
      data: {
        data: result,
        pagination: paginationData,
      },
    };
  }

  /**
   * 根据日期创建排班记录
   * @param schedule
   */
  public async updateScheduleByDate(schedules: any) {
    try {
      for (const schedule of schedules) {
        const { doctorIds, date, timePeriod } = schedule;
        const localDate = new Date(dayjs(date).format("YYYY-MM-DD"));

        // 检查 是否存在当天的排班记录
        const dateSchedules =
          await this.PrismaDB.prisma.doctorSchedule.findMany({
            where: {
              AND: [{ date: localDate }, { timePeriod }],
            },
          });
        await this.PrismaDB.prisma.$transaction(async (prisma) => {
          if (dateSchedules.length === 0) {
            const res = await prisma.doctorSchedule.createMany({
              data: doctorIds.map((doctorId: any) => ({
                doctorId,
                date: localDate,
                timePeriod,
              })),
            });
          } else {
            // 此次提交数据中， doctorIds 中不存在的，则删除
            const deleteDoctorSchedules = dateSchedules.filter(
              (schedule) => !doctorIds.includes(schedule.doctorId)
            );
            // 此次提交数据中，存在的 doctorIds，则更新
            const oldDoctorSchedules = dateSchedules.filter((schedule) =>
              doctorIds.includes(schedule.doctorId)
            );
            // 删除不存在的 排班记录 的记录
            await prisma.doctorSchedule.deleteMany({
              where: {
                id: {
                  in: deleteDoctorSchedules.map((schedule) => schedule.id),
                },
              },
            });
            // 此次提交数据中，存在的 doctorIds，则更新
            const existingDoctorIds = dateSchedules.map((s) => s.doctorId);
            const newDoctorIds = doctorIds.filter(
              (id: number) => !existingDoctorIds.includes(id)
            );

            // 创建新的排班记录
            if (newDoctorIds.length > 0) {
              await prisma.doctorSchedule.createMany({
                data: newDoctorIds.map((doctorId: number) => ({
                  doctorId,
                  date: localDate,
                  timePeriod,
                })),
              });
            }
          }
        });
      }
      return {
        data: null,
        code: 200,
        message: "创建排班记录成功",
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
   * 删除排班记录
   * @param scheduleId
   */
  public async deleteSchedule(scheduleId: number | number[]) {
    try {
      // 输入验证
      if (Array.isArray(scheduleId) && scheduleId.length === 0) {
        console.warn("Invalid or empty scheduleId array provided.");
        return;
      }

      if (Array.isArray(scheduleId)) {
        await this.PrismaDB.prisma.doctorSchedule.deleteMany({
          where: {
            id: {
              in: scheduleId,
            },
          },
        });
      } else {
        await this.PrismaDB.prisma.doctorSchedule.delete({
          where: { id: scheduleId },
        });
      }
      return {
        data: null,
        code: 200,
        message: "删除排班记录成功",
      };
    } catch (err) {
      console.log(err);
      return err;
    }
  }
}
