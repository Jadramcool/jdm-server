import { Prisma } from "@prisma/client";
// 角色数据类型定义

interface CustomRoleCreateInput extends Prisma.RoleCreateInput {
  id: number;
}

// 角色初始化数据
export const roles: CustomRoleCreateInput[] = [
  {
    id: 1,
    code: "ADMIN",
    name: "管理员",
    description: null,
    isDeleted: false,
  },
  {
    id: 2,
    code: "USER",
    name: "用户",
    description: null,
    isDeleted: false,
  },
];

