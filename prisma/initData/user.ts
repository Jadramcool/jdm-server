// 用户数据类型定义
export interface UserSeedData {
  id: number;
  username: string;
  name?: string;
  phone?: string;
  email?: string;
  sex?: "MALE" | "FEMALE" | "OTHER";
  avatar?: string;
  birthday?: string;
  createdTime?: string;
  updatedTime?: string;
  deletedTime?: string;
  password: string;
  isDeleted: boolean;
  status: number;
  roleType?: string;
  city?: string;
  address?: string;
  addressDetail?: string;
}

// 用户初始化数据
export const users: UserSeedData[] = [
  {
    id: 1,
    username: "admin",
    name: "管理员",
    phone: "15952054087",
    email: "1051780106@qq.com",
    sex: "MALE",
    password: "$2a$10$p4mX7pi1Nqv/4AR6e/Deb.BJfuJU2NKPsi1Aaj7z/FDy.ZS3eCJLW",
    isDeleted: false,
    status: 0,
    roleType: "admin",
  },
  {
    id: 2,
    username: "user",
    name: "用户",
    phone: "19000000001",
    email: "user@example.com",
    sex: "OTHER",
    createdTime: "2025-08-01T08:54:12.418Z",
    updatedTime: "2025-08-01T08:54:12.418Z",
    password: "123456..",
    isDeleted: false,
    status: 1,
    roleType: "user",
  },
];

