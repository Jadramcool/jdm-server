import { FilterHelper } from "@/utils";
import { checkUnique } from "@/utils/checkUnique";
import { Prisma } from "@prisma/client";
import { inject, injectable } from "inversify";
import { PrismaDB } from "../../../db";
import {
  AssignRoleToDepartmentDto,
  AssignUserToDepartmentDto,
  BatchAssignUsersToDepartmentDto,
  CreateDepartmentDto,
  DepartmentMemberDto,
  DepartmentTreeNodeDto,
  UpdateDepartmentDto,
} from "./department.dto";

@injectable()
export class DepartmentService {
  constructor(
    @inject(PrismaDB)
    private readonly PrismaDB: PrismaDB
  ) {}

  /**
   * 创建部门
   */
  public async createDepartment(
    createDepartmentDto: CreateDepartmentDto
  ): Promise<Jres> {
    try {
      const { parentId, code, ...departmentData } = createDepartmentDto;

      // 检查部门编码是否已存在
      const existingDeptCode = await checkUnique(
        this.PrismaDB,
        "department",
        "code",
        code
      );
      if (existingDeptCode) {
        return {
          data: null,
          code: 400,
          message: "部门编码已存在",
        };
      }

      // 如果有父部门，检查父部门是否存在并计算层级
      let level = 1;
      if (parentId) {
        const parentDept = await this.PrismaDB.prisma.department.findUnique({
          where: { id: parentId },
        });

        if (!parentDept) {
          return {
            data: null,
            code: 400,
            message: "父部门不存在",
          };
        }

        // 检查是否会形成循环引用
        if (await this.wouldCreateCycle(parentId, null)) {
          return {
            data: null,
            code: 400,
            message: "不能设置该父部门，会形成循环引用",
          };
        }

        level = parentDept.level + 1;
      }

      const department = await this.PrismaDB.prisma.department.create({
        data: {
          ...departmentData,
          code,
          parentId,
          level,
          status: createDepartmentDto.status || 1,
        },
        include: {
          parent: {
            select: { id: true, name: true, code: true },
          },
          manager: {
            select: {
              id: true,
              username: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          _count: {
            select: { users: true, children: true },
          },
        },
      });

      return {
        data: department,
        code: 200,
        message: "创建部门成功",
      };
    } catch (err) {
      return {
        data: null,
        code: 500,
        message: "创建部门失败",
        errMsg: err,
      };
    }
  }

  /**
   * 更新部门信息
   */
  public async updateDepartment(
    updateDepartmentDto: UpdateDepartmentDto
  ): Promise<Jres> {
    const { id, parentId, managerId, ...updateData } = updateDepartmentDto;

    try {
      // 检查部门是否存在
      const existingDept = await this.PrismaDB.prisma.department.findUnique({
        where: { id },
      });

      if (!existingDept) {
        return {
          data: null,
          code: 400,
          message: "部门不存在",
        };
      }

      // 如果更新了编码，检查新编码是否已被其他部门使用
      if (updateData.code && updateData.code !== existingDept.code) {
        const codeExists = await this.PrismaDB.prisma.department.findFirst({
          where: {
            code: updateData.code,
            id: { not: id },
          },
        });

        if (codeExists) {
          return {
            data: null,
            code: 400,
            message: "部门编码已存在",
          };
        }
      }

      // 如果更新了父部门
      let level = existingDept.level;
      if (parentId !== undefined) {
        if (parentId === null) {
          level = 1;
        } else {
          // 检查父部门是否存在
          const parentDept = await this.PrismaDB.prisma.department.findUnique({
            where: { id: parentId },
          });

          if (!parentDept) {
            return {
              data: null,
              code: 400,
              message: "父部门不存在",
            };
          }

          // 检查是否会形成循环引用
          if (await this.wouldCreateCycle(parentId, id)) {
            return {
              data: null,
              code: 400,
              message: "不能设置该父部门，会形成循环引用",
            };
          }

          level = parentDept.level + 1;
        }
      }

      const department = await this.PrismaDB.prisma.department.update({
        where: { id },
        data: {
          ...updateData,
          parentId,
          managerId,
        },
        include: {
          parent: {
            select: { id: true, name: true, code: true },
          },
          manager: {
            select: {
              id: true,
              username: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          _count: {
            select: { users: true, children: true },
          },
        },
      });

      return {
        data: department,
        code: 200,
        message: "更新部门成功",
      };
    } catch (err) {
      return {
        data: null,
        code: 500,
        message: "更新部门失败",
        errMsg: err,
      };
    }
  }

  /**
   * 获取部门列表
   * @param queryDto 查询参数
   * @returns 部门列表
   */
  public async getDepartmentList(config: ReqListConfig): Promise<Jres> {
    try {
      let { filters, options, pagination } = config;

      filters = filters || {};
      let sqlFilters = {};
      if (Object.keys(filters).length > 0) {
        sqlFilters = FilterHelper.addFilterCondition(filters, ["id", "name"]);
      }

      sqlFilters = {
        ...sqlFilters,
        isDeleted: false,
      };

      const [departments, total] = await Promise.all([
        this.PrismaDB.prisma.department.findMany({
          where: sqlFilters,
          orderBy: [
            { level: "asc" },
            { sortOrder: "asc" },
            { createdTime: "asc" },
          ],
          include: {
            parent: {
              select: { id: true, name: true, code: true },
            },
            manager: {
              select: {
                id: true,
                username: true,
                name: true,
                email: true,
                phone: true,
              },
            },
            _count: {
              select: {
                users: { where: { isDeleted: false } },
                children: { where: { isDeleted: false } },
              },
            },
          },
        }),
        this.PrismaDB.prisma.department.count({ where: sqlFilters }),
      ]);

      return {
        data: {
          list: departments.map((dept) => ({
            ...dept,
            memberCount: dept._count.users,
            childrenCount: dept._count.children,
          })),
          total,
        },
        code: 200,
        message: "获取部门列表成功",
      };
    } catch (err) {
      return {
        data: null,
        code: 500,
        message: "获取部门列表失败",
        errMsg: err,
      };
    }
  }

  /**
   * 获取部门树形结构
   */
  public async getDepartmentTree(parentId?: number): Promise<Jres> {
    try {
      const where: Prisma.DepartmentWhereInput = {
        isDeleted: false,
        parentId: parentId || null,
      };

      const departments = await this.PrismaDB.prisma.department.findMany({
        where,
        orderBy: [{ sortOrder: "asc" }, { createdTime: "asc" }],
        include: {
          manager: {
            select: { id: true, username: true, name: true },
          },
          _count: {
            select: {
              users: { where: { isDeleted: false } },
            },
          },
        },
      });

      const result: DepartmentTreeNodeDto[] = [];

      for (const dept of departments) {
        const childrenResult = await this.getDepartmentTree(dept.id);
        const children =
          childrenResult.data.length > 0 ? childrenResult.data : null;

        result.push({
          id: dept.id,
          name: dept.name,
          code: dept.code,
          description: dept.description,
          parentId: dept.parentId,
          managerId: dept.managerId,
          managerName: dept.manager?.name,
          level: dept.level,
          sortOrder: dept.sortOrder,
          status: dept.status,
          memberCount: dept._count.users,
          children,
          createdTime: dept.createdTime,
          updatedTime: dept.updatedTime,
        });
      }

      return {
        data: result,
        code: 200,
        message: "获取部门树成功",
      };
    } catch (err) {
      return {
        data: null,
        code: 500,
        message: "获取部门树失败",
        errMsg: err,
      };
    }
  }

  /**
   * 获取部门详情
   * @param id 部门ID
   * @returns 部门详情
   */
  public async getDepartmentDetail(id: number): Promise<Jres> {
    try {
      const department = await this.PrismaDB.prisma.department.findUnique({
        where: { id, isDeleted: false },
        include: {
          parent: {
            select: { id: true, name: true, code: true },
          },
          manager: {
            select: {
              id: true,
              username: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          users: {
            where: { isDeleted: false },
            select: {
              id: true,
              username: true,
              name: true,
              email: true,
              phone: true,
              position: true,
              joinedAt: true,
              status: true,
            },
            orderBy: [{ joinedAt: "asc" }],
          },
          _count: {
            select: {
              users: { where: { isDeleted: false } },
            },
          },
        },
      });

      if (!department) {
        return {
          data: null,
          code: 400,
          message: "部门不存在",
        };
      }

      const members: DepartmentMemberDto[] = department.users.map((user) => ({
        userId: user.id,
        username: user.username,
        name: user.name || "",
        email: user.email,
        phone: user.phone,
        position: user.position,
        joinedAt: user.joinedAt,
        status: user.status,
      }));

      const childrenResult = await this.getDepartmentTree(id);
      const children = childrenResult.data || [];

      return {
        data: {
          id: department.id,
          name: department.name,
          code: department.code,
          description: department.description,
          parentId: department.parentId,
          managerId: department.managerId,
          managerName: department.manager?.name,
          level: department.level,
          sortOrder: department.sortOrder,
          status: department.status,
          memberCount: department._count.users,
          children,
          createdTime: department.createdTime,
          updatedTime: department.updatedTime,
          members,
          parent: department.parent,
          manager: department.manager,
        },
        code: 200,
        message: "获取部门详情成功",
      };
    } catch (err) {
      return {
        data: null,
        code: 500,
        message: "获取部门详情失败",
        errMsg: err,
      };
    }
  }

  /**
   * 软删除部门
   * @param id 部门ID
   * @returns 删除结果
   */
  public async deleteDepartment(id: number): Promise<Jres> {
    try {
      // 检查部门是否存在
      const department = await this.PrismaDB.prisma.department.findUnique({
        where: { id, isDeleted: false },
        include: {
          children: { where: { isDeleted: false } },
          users: { where: { isDeleted: false } },
        },
      });
      if (!department) {
        return {
          data: null,
          code: 400,
          message: "部门不存在",
        };
      }

      // 检查是否有子部门
      if (department.children.length > 0) {
        return {
          data: null,
          code: 400,
          message: "该部门下还有子部门，无法删除",
        };
      }

      // 检查是否有用户
      if (department.users.length > 0) {
        return {
          data: null,
          code: 400,
          message: "该部门下还有用户，无法删除",
        };
      }

      const result = await this.PrismaDB.prisma.department.update({
        where: { id },
        data: {
          isDeleted: true,
          deletedTime: new Date(),
        },
      });

      return {
        data: result,
        code: 200,
        message: "删除部门成功",
      };
    } catch (err) {
      return {
        data: null,
        code: 500,
        message: "删除部门失败",
        errMsg: err,
      };
    }
  }

  /**
   * 分配用户到部门
   * @param assignDto 分配数据传输对象
   * @returns 分配结果
   */
  public async assignUserToDepartment(
    assignDto: AssignUserToDepartmentDto
  ): Promise<Jres> {
    try {
      const { userId, departmentId, position } = assignDto;

      // 检查用户和部门是否存在
      const [user, department] = await Promise.all([
        this.PrismaDB.prisma.user.findUnique({
          where: { id: userId, isDeleted: false },
          include: { department: true },
        }),
        this.PrismaDB.prisma.department.findUnique({
          where: { id: departmentId, isDeleted: false },
        }),
      ]);

      if (!user) {
        return {
          data: null,
          code: 400,
          message: "用户不存在",
        };
      }

      if (!department) {
        return {
          data: null,
          code: 400,
          message: "部门不存在",
        };
      }

      // 检查用户是否已经在该部门
      if (user.departmentId === departmentId) {
        return {
          data: null,
          code: 400,
          message: "用户已在该部门中",
        };
      }

      // 更新用户的部门信息
      const result = await this.PrismaDB.prisma.user.update({
        where: { id: userId },
        data: {
          departmentId,
          position,
          joinedAt: new Date(),
        },
        include: {
          department: {
            select: { id: true, name: true, code: true },
          },
        },
      });

      return {
        data: {
          id: result.id,
          username: result.username,
          name: result.name,
          email: result.email,
          phone: result.phone,
          position: result.position,
          joinedAt: result.joinedAt,
          department: result.department,
        },
        code: 200,
        message: "分配用户到部门成功",
      };
    } catch (err) {
      return {
        data: null,
        code: 500,
        message: "分配用户到部门失败",
        errMsg: err,
      };
    }
  }

  /**
   * 批量分配用户到部门
   */
  public async batchAssignUsersToDepartment(
    batchAssignDto: BatchAssignUsersToDepartmentDto
  ): Promise<Jres> {
    const { userIds, departmentId, defaultPosition } = batchAssignDto;

    try {
      // 检查部门是否存在
      const department = await this.PrismaDB.prisma.department.findUnique({
        where: { id: departmentId, isDeleted: false },
      });

      if (!department) {
        return {
          data: null,
          code: 400,
          message: "部门不存在",
        };
      }

      const results = [];
      const errors = [];

      for (const userId of userIds) {
        try {
          const result = await this.assignUserToDepartment({
            userId,
            departmentId,
            position: defaultPosition,
          });
          results.push(result);
        } catch (error) {
          errors.push({
            userId,
            error: error.message,
          });
        }
      }

      return {
        data: {
          success: results,
          errors,
          successCount: results.length,
          errorCount: errors.length,
        },
        code: 200,
        message: "批量分配用户到部门完成",
      };
    } catch (err) {
      return {
        data: null,
        code: 500,
        message: "批量分配用户到部门失败",
        errMsg: err,
      };
    }
  }

  /**
   * 从部门移除用户
   */
  public async removeUserFromDepartment(
    userId: number,
    departmentId: number
  ): Promise<Jres> {
    try {
      // 检查用户是否存在且在指定部门中
      const user = await this.PrismaDB.prisma.user.findUnique({
        where: { id: userId, isDeleted: false },
        include: { department: true },
      });

      if (!user) {
        return {
          data: null,
          code: 400,
          message: "用户不存在",
        };
      }

      if (user.departmentId !== departmentId) {
        return {
          data: null,
          code: 400,
          message: "用户不在该部门中",
        };
      }

      // 将用户从部门中移除
      const result = await this.PrismaDB.prisma.user.update({
        where: { id: userId },
        data: {
          departmentId: null,
          position: null,
          joinedAt: null,
        },
      });

      return {
        data: {
          id: result.id,
          username: result.username,
          name: result.name,
          email: result.email,
          phone: result.phone,
        },
        code: 200,
        message: "从部门移除用户成功",
      };
    } catch (err) {
      return {
        data: null,
        code: 500,
        message: "从部门移除用户失败",
        errMsg: err,
      };
    }
  }

  /**
   * 分配角色到部门
   */
  public async assignRoleToDepartment(
    assignDto: AssignRoleToDepartmentDto
  ): Promise<Jres> {
    try {
      const {
        roleId,
        departmentId,
        autoAssign = false,
        defaultPosition,
      } = assignDto;

      // 检查角色和部门是否存在
      const [role, department] = await Promise.all([
        this.PrismaDB.prisma.role.findUnique({
          where: { id: roleId, isDeleted: false },
        }),
        this.PrismaDB.prisma.department.findUnique({
          where: { id: departmentId, isDeleted: false },
        }),
      ]);

      if (!role) {
        return {
          data: null,
          code: 400,
          message: "角色不存在",
        };
      }

      if (!department) {
        return {
          data: null,
          code: 400,
          message: "部门不存在",
        };
      }

      // 检查是否已经分配
      const existing = await this.PrismaDB.prisma.roleDepartment.findUnique({
        where: {
          roleId_departmentId: {
            roleId,
            departmentId,
          },
        },
      });

      if (existing) {
        return {
          data: null,
          code: 400,
          message: "角色已分配到该部门",
        };
      }

      const roleDepartment = await this.PrismaDB.prisma.roleDepartment.create({
        data: {
          roleId,
          departmentId,
          autoAssign,
          defaultPosition,
        },
        include: {
          role: {
            select: { id: true, code: true, name: true },
          },
          department: {
            select: { id: true, name: true, code: true },
          },
        },
      });

      // 如果设置了自动分配，将角色分配给该部门的所有用户
      if (autoAssign) {
        const departmentUsers = await this.PrismaDB.prisma.user.findMany({
          where: {
            departmentId,
            isDeleted: false,
          },
          select: { id: true },
        });

        for (const userDept of departmentUsers) {
          try {
            await this.PrismaDB.prisma.userRole.upsert({
              where: {
                id: userDept.id,
              },
              update: {},
              create: {
                userId: userDept.id,
                roleId,
              },
            });
          } catch (error) {
            // 忽略已存在的错误
          }
        }
      }

      return {
        data: roleDepartment,
        code: 200,
        message: "分配角色到部门成功",
      };
    } catch (err) {
      return {
        data: null,
        code: 500,
        message: "分配角色到部门失败",
        errMsg: err,
      };
    }
  }

  /**
   * 从部门移除角色
   */
  public async removeRoleFromDepartment(
    roleId: number,
    departmentId: number
  ): Promise<Jres> {
    try {
      const roleDepartment =
        await this.PrismaDB.prisma.roleDepartment.findUnique({
          where: {
            roleId_departmentId: {
              roleId,
              departmentId,
            },
          },
        });

      if (!roleDepartment) {
        return {
          data: null,
          code: 400,
          message: "角色未分配到该部门",
        };
      }

      const result = await this.PrismaDB.prisma.roleDepartment.delete({
        where: { id: roleDepartment.id },
      });

      return {
        data: result,
        code: 200,
        message: "角色移除成功",
      };
    } catch (err) {
      return {
        data: null,
        code: 500,
        message: "移除角色失败",
        errMsg: err,
      };
    }
  }

  /**
   * 获取部门成员列表
   */
  public async getDepartmentMembers(
    departmentId: number,
    includeInactive = false
  ): Promise<Jres> {
    try {
      const where: Prisma.UserWhereInput = {
        departmentId,
        isDeleted: false,
      };

      const users = await this.PrismaDB.prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
          phone: true,
          position: true,
          joinedAt: true,
          status: true,
        },
        orderBy: [{ joinedAt: "asc" }],
      });

      const members = users.map((user) => ({
        userId: user.id,
        username: user.username,
        name: user.name || "",
        email: user.email,
        phone: user.phone,
        position: user.position,
        joinedAt: user.joinedAt,
        status: user.status,
      }));

      return {
        data: members,
        code: 200,
        message: "获取部门成员成功",
      };
    } catch (err) {
      return {
        data: null,
        code: 500,
        message: "获取部门成员失败",
        errMsg: err,
      };
    }
  }

  /**
   * 递归获取部门及其所有下级部门的ID列表
   * @param departmentId 部门ID
   * @returns 包含该部门及所有下级部门的ID数组
   */
  public async getAllSubDepartmentIds(departmentId: number): Promise<number[]> {
    const departmentIds = [departmentId];

    // 查找直接下级部门
    const subDepartments = await this.PrismaDB.prisma.department.findMany({
      where: {
        parentId: departmentId,
        isDeleted: false,
      },
      select: {
        id: true,
      },
    });

    // 递归获取每个下级部门的子部门
    for (const subDept of subDepartments) {
      const subDeptIds = await this.getAllSubDepartmentIds(subDept.id);
      departmentIds.push(...subDeptIds);
    }

    return departmentIds;
  }

  /**
   * 检查是否会形成循环引用
   * @param parentId 父部门ID
   * @param currentId 当前部门ID（更新时使用）
   * @returns 是否会形成循环
   */
  private async wouldCreateCycle(
    parentId: number,
    currentId?: number
  ): Promise<boolean> {
    if (currentId && parentId === currentId) {
      return true;
    }

    let currentParentId = parentId;
    const visited = new Set<number>();

    while (currentParentId) {
      if (currentId && currentParentId === currentId) {
        return true;
      }

      if (visited.has(currentParentId)) {
        return true;
      }

      visited.add(currentParentId);

      const parent = await this.PrismaDB.prisma.department.findUnique({
        where: { id: currentParentId },
        select: { parentId: true },
      });

      if (!parent) {
        break;
      }

      currentParentId = parent.parentId;
    }

    return false;
  }

  /**
   * 根据名称搜索部门
   * @param keyword 关键字
   * @param limit 限制数量
   * @returns 部门列表
   */
  public async searchDepartmentsByName(
    keyword: string,
    limit = 10
  ): Promise<Jres> {
    try {
      const departments = await this.PrismaDB.prisma.department.findMany({
        where: {
          isDeleted: false,
          OR: [
            { name: { contains: keyword } },
            { code: { contains: keyword } },
          ],
        },
        take: limit,
        orderBy: [{ level: "asc" }, { sortOrder: "asc" }],
        select: {
          id: true,
          name: true,
          code: true,
          level: true,
          parentId: true,
          _count: {
            select: {
              users: { where: { isDeleted: false } },
            },
          },
        },
      });

      return {
        data: departments,
        code: 200,
        message: "搜索部门成功",
      };
    } catch (err) {
      return {
        data: null,
        code: 500,
        message: "搜索部门失败",
        errMsg: err,
      };
    }
  }

  /**
   * 获取部门统计信息
   * @param departmentId 部门ID，不传则获取全部统计
   * @returns 统计信息
   */
  public async getDepartmentStats(departmentId?: number): Promise<Jres> {
    try {
      const where: Prisma.DepartmentWhereInput = {
        isDeleted: false,
      };

      if (departmentId) {
        where.id = departmentId;
      }

      const [totalDepartments, activeDepartments, totalMembers] =
        await Promise.all([
          this.PrismaDB.prisma.department.count({ where }),
          this.PrismaDB.prisma.department.count({
            where: { ...where, status: 1 },
          }),
          this.PrismaDB.prisma.user.count({
            where: {
              isDeleted: false,
              ...(departmentId
                ? { departmentId }
                : { departmentId: { not: null } }),
            },
          }),
        ]);

      const stats = {
        totalDepartments,
        activeDepartments,
        inactiveDepartments: totalDepartments - activeDepartments,
        totalMembers,
      };

      return {
        data: stats,
        code: 200,
        message: "获取部门统计成功",
      };
    } catch (err) {
      return {
        data: null,
        code: 500,
        message: "获取部门统计失败",
        errMsg: err,
      };
    }
  }
}
