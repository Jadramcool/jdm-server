import { Prisma } from "@prisma/client";

interface CustomRoleCreateInput extends Prisma.RoleCreateInput {
  id: number;
}

export const roles: CustomRoleCreateInput[] = [
  {
    id: 1,
    name: "管理员",
    code: "ADMIN",
  },
];
