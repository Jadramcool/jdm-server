import { Prisma } from "@prisma/client";

export const users: Prisma.UserCreateInput[] = [
  {
    name: "用户",
    roleType: "user",
    username: "user",
    password: "123456..",
    email: "user@example.com",
    phone: "19000000001",
    status: 1,
  },
];
