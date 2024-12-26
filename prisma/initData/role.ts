import { Prisma } from "@prisma/client";

// 自定义菜单创建输入
interface CustomRoleCreateInput extends Prisma.RoleCreateInput {
  id: number;
}

export const roles: CustomRoleCreateInput[] = [
  {
    id: 1,
    name: "管理员",
    code: "ADMIN",
  },
  {
    id: 2,
    name: "医生",
    code: "DOCTOR",
  },
  {
    id: 3,
    name: "患者",
    code: "PATIENT",
  },
];
