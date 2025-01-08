import { FilterHelper } from "@/utils";
import { JWT } from "@jwt/index";
import { Patient, Prisma, Role, User } from "@prisma/client";
import { plainToClass } from "class-transformer";
import { validate } from "class-validator";
import { inject, injectable } from "inversify";
import * as _ from "lodash";
import { PrismaDB } from "../../../db";
import { PatientDto } from "./patient.dto";

interface PatientWithUser extends Patient {
  user: User;
}

type PatientWithUsersPrisma = Prisma.PatientGetPayload<{
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
export class PatientService {
  constructor(
    @inject(PrismaDB) private readonly PrismaDB: PrismaDB,
    @inject(JWT) private readonly JWT: JWT
  ) {}

  // 获取患者列表
  public async getPatientList(config: ReqListConfig) {
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
    const totalRecords = await this.PrismaDB.prisma.patient.count({
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
      },
    };
    // 不显示分页，返回所有数据
    if (!showPagination) {
      result = await this.PrismaDB.prisma.patient.findMany(commonQuery);
    } else {
      // 分页查询
      result = await this.PrismaDB.prisma.patient.findMany({
        ...commonQuery,
        skip: (page - 1) * pageSize,
        take: pageSize,
      });
      totalPages = Math.ceil(totalRecords / pageSize);
    }

    let res = result;

    result.forEach((patient: PatientWithUsersPrisma) => {
      patient.user = {
        ...patient.user,
        roles: patient.user.roles.map((role: { role: Role }): any => role.role),
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
   * 获取患者详情
   * @param patientId
   */
  public async getPatient(patientId: number, options: any) {
    try {
      const result = await this.PrismaDB.prisma.patient.findUnique({
        where: { id: patientId },
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
          // 如果options.with_appointment 为 true，则查询关联的预约记录
          appointment: options?.with_appointment
            ? {
                where: {
                  status: "FINISHED",
                },
                orderBy: {
                  appointmentDate: "desc",
                },
              }
            : undefined,
          medicalRecord: options?.with_medicalRecord
            ? {
                include: {
                  appointment: {
                    include: {
                      doctorSchedule: true,
                    },
                  },
                  doctor: {
                    include: {
                      user: true,
                    },
                  },
                },
                orderBy: {
                  appointment: {
                    appointmentDate: "desc",
                  },
                },
              }
            : undefined,
        },
      });

      const { user } = result;

      const patientWithRoles = {
        ...result,
        user: {
          ...user,
          roles: user.roles.map((role: { role: Role }): any => role.role), // 获取角色名称
        },
      };

      return {
        data: patientWithRoles,
        code: 200,
        message: "获取患者详情成功",
      };
    } catch (err) {
      return {
        data: null,
        code: 400,
        message: "获取患者详情失败",
        errMsg: err,
      };
    }
  }

  /**
   * 创建患者
   * @param patient
   */
  public async createPatient(patient: PatientDto) {
    try {
      const newPatient: Recordable = {};
      for (const [key, value] of Object.entries(patient)) {
        _.set(newPatient, key, value);
      }
      let patientDto = plainToClass(PatientDto, newPatient);
      const errors = await validate(patientDto);
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

      const { username, phone } = newPatient.user;
      // 检查 username 是否已存在
      const existingPatient = await this.PrismaDB.prisma.user.findFirst({
        where: {
          OR: [{ username, phone }],
        },
      });
      if (existingPatient) {
        throw "患者用户名/手机号已存在";
      }

      let patientResult = null;

      await this.PrismaDB.prisma.$transaction(async (prisma) => {
        const createData: PatientWithUser | any = {};

        for (const [relation, data] of Object.entries(newPatient)) {
          if (!data) continue;
          if (relation === "user") {
            const { roles, ...userCreateData } = data;

            const createdUser = await prisma.user.create({
              data: {
                ...userCreateData,
                roleType: "patient",
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
          } else {
            // 针对其他关系的默认处理逻辑
            createData[relation] = data;
          }
        }

        patientResult = await prisma.patient.create({
          data: createData,
          include: {
            user: true,
          },
        });
      });

      return {
        data: {
          ...patientResult,
        },
        code: 200,
        message: "创建患者成功",
      };
    } catch (err) {
      console.error(err);
      return {
        data: null,
        code: 400,
        message: "创建患者失败",
        errMsg: err,
      };
    }
  }

  /**
   * 更新患者
   * @param patient
   */
  public async updatePatient(patient: Patient) {
    try {
      const newPatient: Recordable = {};

      for (const [key, value] of Object.entries(patient)) {
        _.set(newPatient, key, value);
      }
      const { phone } = newPatient.user;
      if (phone) {
        // 检查 phone 是否已存在
        const existingUser = await this.PrismaDB.prisma.user.findFirst({
          where: {
            phone,
          },
          include: {
            patient: true,
          },
        });

        if (
          existingUser &&
          existingUser.patient &&
          existingUser.patient["id"] !== newPatient.id
        ) {
          return {
            code: 400,
            message: "用户名或手机号已存在",
            errMsg: "用户名或手机号已存在",
          };
        }
      }
      let patientResult = null;

      const { id, ...relations } = newPatient;
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
                const patientUser = await prisma.patient.findUnique({
                  where: { id },
                  select: { userId: true },
                });

                const { userId } = patientUser;
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
          } else {
            // 针对其他关系的默认处理逻辑
            updateData[relation] = data;
          }
        }
        patientResult = await prisma.patient.update({
          where: { id: id },
          data: updateData,
          include: {
            user: true,
          },
        });
      });

      return {
        data: patientResult,
        code: 200,
        message: "更新患者成功",
      };
    } catch (err) {
      return {
        data: null,
        code: 400,
        message: "更新患者失败",
        errMsg: err,
      };
    }
  }

  /**
   * 删除患者
   * @param patientId
   */
  public async deletePatient(patientId: number) {
    try {
      let deleteResult = null;
      if (Array.isArray(patientId)) {
        await this.PrismaDB.prisma.$transaction(async (prisma) => {
          // 找到要删除的患者，并获取对应的 userId
          const needDeletePatient = await prisma.patient.findMany({
            where: {
              id: {
                in: patientId,
              },
            },
            select: {
              userId: true,
            },
          });
          // 删除患者记录
          deleteResult = await prisma.patient.deleteMany({
            where: {
              id: {
                in: patientId,
              },
            },
          });
          // 删除对应的用户记录
          const deletePatientUserId: number[] = needDeletePatient.map(
            (deletePatient: any) => deletePatient.userId
          );

          // 删除对应的用户记录-=>逻辑删除
          await prisma.user.updateMany({
            where: {
              id: {
                in: deletePatientUserId,
              },
            },
            data: {
              isDeleted: true,
            },
          });
        });
      } else {
        await this.PrismaDB.prisma.$transaction(async (prisma) => {
          deleteResult = await prisma.patient.delete({
            where: { id: patientId },
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
        message: "删除患者成功",
      };
    } catch (err) {
      console.error(err);
      return err;
    }
  }

  /**
   * 启用/禁用用户
   * @param patientId
   * @param status  1:启用 0:禁用
   */
  public async updatePatientStatus(patientId: number, status: number) {
    try {
      await this.PrismaDB.prisma.patient.update({
        where: { id: patientId },
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
        message: status === 1 ? "启用患者成功" : "禁用患者成功",
      };
    } catch (err) {
      console.error(err);
      return err;
    }
  }
}
