import { FilterHelper } from "@/utils";
import { JWT } from "@jwt/index";
import { Doctor, Prisma, Role, User } from "@prisma/client";
import { plainToClass } from "class-transformer";
import { validate } from "class-validator";
import dayjs from "dayjs";
import { inject, injectable } from "inversify";
import * as _ from "lodash";
import { PrismaDB } from "../../../db";
import { DoctorDto } from "./doctor.dto";

interface DoctorWithUser extends Doctor {
  user: User;
}

type DoctorWithUsersPrisma = Prisma.DoctorGetPayload<{
  include: {
    user: {
      include: {
        roles: {
          select: {
            role: true;
          };
        };
      };
    };
  };
}>;

@injectable()
export class DoctorService {
  constructor(
    @inject(PrismaDB) private readonly PrismaDB: PrismaDB,
    @inject(JWT) private readonly JWT: JWT
  ) {}

  // 获取医生列表
  public async getDoctorList(config: ReqListConfig) {
    let { filters, options, pagination } = config;
    filters = filters || {};

    let sqlFilters = {};
    const keys = Object.keys(filters);

    if (keys.length > 0) {
      const tempFilters = FilterHelper.addFilterConditionAny(filters);
      const newFilters: Recordable = {};

      for (const [key, value] of Object.entries(tempFilters)) {
        _.set(newFilters, key, value);
      }

      sqlFilters = newFilters;
    }

    // 查询user关联表roleId
    if (sqlFilters["user"] && sqlFilters["user"]["role"] !== undefined) {
      const userFilter = { ...sqlFilters["user"] };
      userFilter.roles = {
        some: {
          roleId: userFilter.role,
        },
      };
      delete userFilter.role;
      sqlFilters["user"] = userFilter;
    }
    // 设置用户未被删除
    if (!sqlFilters["user"]) {
      sqlFilters["user"] = {};
    }
    sqlFilters["user"]["isDeleted"] = false;

    let result = [];
    // 总页数
    let totalPages = 1;

    // 查询总数
    const totalRecords = await this.PrismaDB.prisma.doctor.count({
      where: sqlFilters,
    });

    const { showPagination = true } = options || {};
    const page = parseInt(pagination?.page as string) || 1;
    const pageSize = parseInt(pagination?.pageSize as string) || 10;

    const commonQuery: any = {
      where: sqlFilters,
      orderBy: {
        createdTime: "desc",
      },
      include: {
        user: {
          include: {
            roles: {
              select: {
                role: true,
              },
            },
          },
        },
        department: true,
      },
    };
    // 不显示分页，返回所有数据
    if (!showPagination) {
      result = await this.PrismaDB.prisma.doctor.findMany(commonQuery);
    } else {
      // 分页查询
      result = await this.PrismaDB.prisma.doctor.findMany({
        ...commonQuery,
        skip: (page - 1) * pageSize,
        take: pageSize,
      });
      totalPages = Math.ceil(totalRecords / pageSize);
    }

    let res = result;

    result.forEach((doctor: DoctorWithUsersPrisma) => {
      doctor.user = {
        ...doctor.user,
        roles: doctor.user.roles.map((role: { role: Role }): any => role.role),
      };
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
   * 获取医生详情
   * @param doctorId
   */
  public async getDoctor(doctorId: number) {
    try {
      const result = await this.PrismaDB.prisma.doctor.findUnique({
        where: { id: doctorId },
        include: {
          user: {
            include: {
              roles: {
                select: {
                  role: true,
                },
              },
            },
          },
        },
      });

      const { user } = result;

      const doctorWithRoles = {
        ...result,
        user: {
          ...user,
          roles: user.roles.map((role: { role: Role }): any => role.role), // 获取角色名称
        },
      };

      return {
        data: doctorWithRoles,
        code: 200,
        message: "获取医生详情成功",
      };
    } catch (err) {
      return {
        data: null,
        code: 400,
        message: "获取医生详情失败",
        errMsg: err,
      };
    }
  }

  /**
   * 获取医生个人详情
   */
  public async getDoctorInfo(userInfo: UserWithDoctor) {
    try {
      const doctorId = userInfo.doctor.id;
      const result = await this.PrismaDB.prisma.doctor.findUnique({
        where: { id: doctorId },
        include: {
          user: {
            include: {
              roles: {
                select: {
                  role: true,
                },
              },
            },
          },
          department: true,
          doctorSchedule: {
            where: {
              date: {
                gte: new Date(dayjs().format("YYYY-MM-DD")),
              },
            },
            include: {
              appointment: {
                include: {
                  patient: {
                    include: {
                      user: true,
                    },
                  },
                },
              },
              _count: {
                select: {
                  appointment: true,
                },
              },
            },
          },
          _count: {
            select: {
              doctorSchedule: {
                where: {
                  date: {
                    gte: new Date(dayjs().format("YYYY-MM-DD")),
                  },
                },
              },
            },
          },
        },
      });

      const { user } = result;

      const doctorWithRoles = {
        ...result,
        user: {
          ...user,
          roles: user.roles.map((role: { role: Role }): any => role.role), // 获取角色名称
        },
      };

      return {
        data: doctorWithRoles,
        code: 200,
        message: "获取医生详情成功",
      };
    } catch (err) {
      return {
        data: null,
        code: 400,
        message: "获取医生详情失败",
        errMsg: err,
      };
    }
  }

  /**
   * 创建医生
   * @param doctor
   */
  public async createDoctor(doctor: DoctorDto) {
    try {
      const newDoctor: Recordable = {};
      for (const [key, value] of Object.entries(doctor)) {
        _.set(newDoctor, key, value);
      }
      let doctorDto = plainToClass(DoctorDto, newDoctor);
      const errors = await validate(doctorDto);
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

      const { username, phone } = newDoctor.user;
      // 检查 username 是否已存在
      const existingDoctor = await this.PrismaDB.prisma.user.findFirst({
        where: {
          OR: [{ username, phone }],
        },
      });
      if (existingDoctor) {
        throw "医生用户名/手机号已存在";
      }

      let doctorResult = null;

      await this.PrismaDB.prisma.$transaction(async (prisma) => {
        const createData: DoctorWithUser | any = {};

        for (const [relation, data] of Object.entries(newDoctor)) {
          if (!data) continue;
          if (relation === "user") {
            const { roles, ...userCreateData } = data;

            const createdUser = await prisma.user.create({
              data: {
                ...userCreateData,
                roleType: "doctor",
                password: process.env.DEFAULT_PASSWORD,
              },
            });

            if (roles) {
              await prisma.userRole.createMany({
                data: roles.map((roleId: any) => ({
                  userId: createdUser.id,
                  roleId: roleId,
                })),
              });
            }

            // 关联 User
            createData[relation] = { connect: { id: createdUser.id } };
          } else if (relation === "departmentId") {
            // 将 departmentId 替换为 department 并使用 connect
            createData.department = { connect: { id: data } };
          } else {
            // 针对其他关系的默认处理逻辑
            createData[relation] = data;
          }
        }

        doctorResult = await prisma.doctor.create({
          data: createData,
          include: {
            user: true,
          },
        });
      });

      return {
        data: {
          ...doctorResult,
        },
        code: 200,
        message: "创建医生成功",
      };
    } catch (err) {
      console.error(err);
      return {
        data: null,
        code: 400,
        message: "创建医生失败",
        errMsg: err,
      };
    }
  }

  /**
   * 更新医生
   * @param doctor
   */
  public async updateDoctor(doctor: Doctor) {
    try {
      const newDoctor: Recordable = {};

      for (const [key, value] of Object.entries(doctor)) {
        _.set(newDoctor, key, value);
      }
      const { phone } = newDoctor.user;
      if (phone) {
        // 检查 phone 是否已存在
        const existingUser = await this.PrismaDB.prisma.user.findFirst({
          where: {
            phone,
          },
          include: {
            doctor: true,
          },
        });

        if (
          existingUser &&
          existingUser.doctor &&
          existingUser.doctor["id"] !== newDoctor.id
        ) {
          return {
            code: 400,
            message: "用户名或手机号已存在",
            errMsg: "用户名或手机号已存在",
          };
        }
      }
      let doctorResult = null;

      const { id, ...relations } = newDoctor;
      await this.PrismaDB.prisma.$transaction(async (prisma) => {
        // 构建更新数据
        const updateData: Record<string, any> = {};

        for (const [relation, data] of Object.entries(relations)) {
          if (!data) continue;

          if (relation === "user") {
            // 处理 User 更新
            const userUpdateData: Record<string, any> = {};
            for (const key of Object.keys(data)) {
              if (key === "roles") {
                const doctorUser = await prisma.doctor.findUnique({
                  where: { id },
                  select: { userId: true },
                });

                const { userId } = doctorUser;
                // 查询角色关系，如果没有变化，则不做任何操作
                const existingRoles = await prisma.userRole.findMany({
                  where: {
                    userId: userId,
                  },
                  select: { roleId: true },
                });
                if (
                  existingRoles.length === data.roles.length &&
                  existingRoles.every((role) =>
                    data.roles.includes(role.roleId)
                  )
                ) {
                  continue;
                }

                // 删除用户角色关系
                await prisma.userRole.deleteMany({
                  where: {
                    userId: userId,
                  },
                });

                // 创建用户角色关系
                await prisma.userRole.createMany({
                  data: data.roles.map((roleId) => ({
                    userId: userId,
                    roleId: roleId,
                  })),
                });
                delete data.roles;
              } else {
                userUpdateData[key] = data[key];
              }
            }
            updateData[relation] = { update: userUpdateData };
          } else if (relation === "departmentId") {
            // 将 departmentId 替换为 department 并使用 connect
            updateData.department = { connect: { id: data } };
          } else {
            // 针对其他关系的默认处理逻辑
            updateData[relation] = data;
          }
        }
        doctorResult = await prisma.doctor.update({
          where: { id: id },
          data: updateData,
          include: {
            user: true,
            department: true,
          },
        });
      });

      return {
        data: doctorResult,
        code: 200,
        message: "更新医生成功",
      };
    } catch (err) {
      return {
        data: null,
        code: 400,
        message: "更新医生失败",
        errMsg: err,
      };
    }
  }

  /**
   * 删除医生
   * @param doctorId
   */
  public async deleteDoctor(doctorId: number) {
    try {
      let deleteResult = null;
      if (Array.isArray(doctorId)) {
        await this.PrismaDB.prisma.$transaction(async (prisma) => {
          // 找到要删除的医生，并获取对应的 userId
          const needDeleteDoctor = await prisma.doctor.findMany({
            where: {
              id: {
                in: doctorId,
              },
            },
            select: {
              userId: true,
            },
          });
          // 删除医生记录
          deleteResult = await prisma.doctor.deleteMany({
            where: {
              id: {
                in: doctorId,
              },
            },
          });
          // 删除对应的用户记录
          const deleteDoctorUserId: number[] = needDeleteDoctor.map(
            (deleteDoctor: any) => deleteDoctor.userId
          );

          // 删除对应的用户记录-=>逻辑删除
          await prisma.user.updateMany({
            where: {
              id: {
                in: deleteDoctorUserId,
              },
            },
            data: {
              isDeleted: true,
            },
          });
        });
      } else {
        await this.PrismaDB.prisma.$transaction(async (prisma) => {
          deleteResult = await prisma.doctor.delete({
            where: { id: doctorId },
          });
          await prisma.user.update({
            where: { id: deleteResult.userId },
            data: {
              isDeleted: true,
            },
          });
        });
      }
      return {
        data: deleteResult,
        code: 200,
        message: "删除医生成功",
      };
    } catch (err) {
      console.error(err);
      return err;
    }
  }

  /**
   * 启用/禁用用户
   * @param doctorId
   * @param status  1:启用 0:禁用
   */
  public async updateDoctorStatus(doctorId: number, status: number) {
    try {
      await this.PrismaDB.prisma.doctor.update({
        where: { id: doctorId },
        data: {
          user: {
            update: {
              status,
            },
          },
        },
      });

      return {
        data: {},
        code: 200,
        message: status === 1 ? "启用医生成功" : "禁用医生成功",
      };
    } catch (err) {
      console.error(err);
      return err;
    }
  }
}
