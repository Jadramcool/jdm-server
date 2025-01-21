import { Prisma } from "@prisma/client";

export const users: Prisma.UserCreateInput[] = [
  {
    name: "医生",
    roleType: "doctor",
    username: "doctor",
    password: "123456..",
    email: "doctor@example.com",
    phone: "19000000001",
    status: 1,
  },
  {
    name: "患者",
    roleType: "patient",
    username: "patient3",
    password: "123456..",
    email: "patient@example.com",
    phone: "19000000002",
    status: 1,
  },
];
