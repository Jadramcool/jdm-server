import { Prisma } from "@prisma/client";

/**
 * 角色种子数据类型
 * 扩展Prisma的角色创建输入类型，添加id字段
 */
export interface RoleSeedData extends Prisma.RoleCreateInput {
  id: number;
}

/**
 * 角色初始化数据
 *
 * 系统默认包含两个角色：
 * 1. 管理员角色 - 拥有系统最高权限
 * 2. 普通用户角色 - 系统普通用户权限
 */
export const roles: RoleSeedData[] = [
  // ==================== 系统内置角色 ====================
  // 管理员角色 - 拥有系统最高权限
  {
    id: 1,
    code: "ADMIN",
    name: "管理员",
    description: "系统管理员，拥有所有权限",
    isDeleted: false,
  },

  // 普通用户角色 - 系统普通用户权限
  {
    id: 2,
    code: "USER",
    name: "用户",
    description: "普通用户，拥有基本权限",
    isDeleted: false,
  },
];
