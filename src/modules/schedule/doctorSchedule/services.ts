import { FilterHelper } from "@/utils";
import { JWT } from "@jwt/index";
import { plainToClass } from "class-transformer";
import { validate } from "class-validator";
import dayjs from "dayjs";
import { inject, injectable } from "inversify";
import * as _ from "lodash";
import { PrismaDB } from "../../../db";
import { ScheduleDto } from "./schedule.dto";

@injectable()
export class DoctorScheduleService {
  constructor(
    @inject(PrismaDB) private readonly PrismaDB: PrismaDB,
    @inject(JWT) private readonly JWT: JWT
  ) {}

  // 获取排班列表
  public async getScheduleList(config: ReqListConfig) {
    let { filters = {}, options, pagination, sort } = config;
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
        schedules: groupedSchedules[dateKey],
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
   * 创建排班记录 - 与更新完全相同
   * @param schedule
   */
  public async createSchedule(schedule: ScheduleDto) {
    try {
      // 1. 参数验证
      const userDto = plainToClass(ScheduleDto, schedule);
      const errors = await validate(userDto);
      if (errors.length > 0) {
        const errorMessages = errors.map((error) => ({
          property: error.property,
          value: Object.values(error.constraints),
        }));
        return {
          code: 400,
          message: "参数验证失败",
          errMsg: "参数验证失败",
          data: errorMessages,
        };
      }

      const { doctorId, date } = schedule;
      const today = dayjs().startOf("day").toDate(); // 当前日期

      // 2. 查找已存在的排班记录
      const existingSchedule =
        await this.PrismaDB.prisma.doctorSchedule.findMany({
          where: {
            doctorId,
            date: { gte: today }, // 只查找当天及之后的排班记录
          },
          select: {
            id: true,
            date: true,
            timePeriod: true,
          },
        });

      // 将已有的排班记录按日期存储
      const existingScheduleMap = existingSchedule.reduce((acc, schedule) => {
        acc[dayjs(schedule.date).format("YYYY-MM-DD")] = schedule;
        return acc;
      }, {} as Record<string, any>);

      // 3. 处理排班数据
      const result = await this.PrismaDB.prisma.$transaction(async (prisma) => {
        if (Array.isArray(date)) {
          for (const dateItem of date) {
            const dateKey = dayjs(dateItem.date).format("YYYY-MM-DD");

            if (existingScheduleMap[dateKey]) {
              // 更新已存在的排班
              if (
                existingScheduleMap[dateKey].timePeriod !== dateItem.timePeriod
              ) {
                await prisma.doctorSchedule.update({
                  where: { id: existingScheduleMap[dateKey].id },
                  data: { timePeriod: dateItem.timePeriod },
                });
              }
            } else {
              // 创建新的排班
              const localDate = new Date(dayjs(dateKey).format("YYYY-MM-DD"));
              await prisma.doctorSchedule.create({
                data: {
                  doctorId,
                  date: localDate,
                  timePeriod: dateItem.timePeriod,
                },
              });
            }
          }
        }
      });

      // 4. 返回成功响应
      return {
        data: result,
        code: 200,
        message: "创建排班记录成功",
      };
    } catch (err) {
      // 5. 错误处理
      return {
        data: null,
        code: 400,
        message: "创建排班记录失败",
        errMsg: err instanceof Error ? err.message : err,
      };
    }
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
   * 更新排班记录-其实在前端新增约等于更新了，因为要处理未来所有的数据
   * @param schedule
   */
  public async updateSchedule(schedule: any) {
    try {
      // 1. 参数验证
      const userDto = plainToClass(ScheduleDto, schedule);
      const errors = await validate(userDto);
      if (errors.length > 0) {
        const errorMessages = errors.map((error) => ({
          property: error.property,
          value: Object.values(error.constraints),
        }));
        return {
          code: 400,
          message: "参数验证失败",
          errMsg: "参数验证失败",
          data: errorMessages,
        };
      }

      const { doctorId, date } = schedule;
      const today = dayjs().startOf("day").toDate(); // 当前日期

      // 2. 查找已存在的排班记录
      const existingSchedule =
        await this.PrismaDB.prisma.doctorSchedule.findMany({
          where: {
            doctorId,
            date: { gte: today }, // 只查找当天及之后的排班记录
          },
          select: {
            id: true,
            date: true,
            timePeriod: true,
          },
        });

      // 将已有的排班记录按日期存储
      const existingScheduleMap = existingSchedule.reduce((acc, schedule) => {
        acc[dayjs(schedule.date).format("YYYY-MM-DD")] = schedule;
        return acc;
      }, {} as Record<string, any>);

      // 3. 处理排班数据
      const result = await this.PrismaDB.prisma.$transaction(async (prisma) => {
        if (Array.isArray(date)) {
          for (const dateItem of date) {
            const dateKey = dayjs(dateItem.date).format("YYYY-MM-DD");

            if (existingScheduleMap[dateKey]) {
              // 更新已存在的排班
              if (
                existingScheduleMap[dateKey].timePeriod !== dateItem.timePeriod
              ) {
                await prisma.doctorSchedule.update({
                  where: { id: existingScheduleMap[dateKey].id },
                  data: { timePeriod: dateItem.timePeriod },
                });
              }
            } else {
              // 创建新的排班
              const localDate = new Date(dayjs(dateKey).format("YYYY-MM-DD"));
              await prisma.doctorSchedule.create({
                data: {
                  doctorId,
                  date: localDate,
                  timePeriod: dateItem.timePeriod,
                },
              });
            }
          }
        }
      });

      // 4. 返回成功响应
      return {
        data: result,
        code: 200,
        message: "创建排班记录成功",
      };
    } catch (err) {
      // 5. 错误处理
      return {
        data: null,
        code: 400,
        message: "创建排班记录失败",
        errMsg: err instanceof Error ? err.message : err,
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
