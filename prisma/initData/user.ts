/**
 * 用户种子数据类型定义
 * 定义了用户初始化数据的结构和字段含义
 */
export interface UserSeedData {
  /** 用户唯一标识 */
  id: number;
  
  /** 用户名（登录账号） */
  username: string;
  
  /** 用户昵称 */
  name?: string;
  
  /** 手机号码 */
  phone?: string;
  
  /** 邮箱地址 */
  email?: string;
  
  /** 性别：MALE-男性，FEMALE-女性，OTHER-其他 */
  sex?: "MALE" | "FEMALE" | "OTHER";
  
  /** 头像URL */
  avatar?: string;
  
  /** 生日 */
  birthday?: string;
  
  /** 创建时间 */
  createdTime?: string;
  
  /** 更新时间 */
  updatedTime?: string;
  
  /** 删除时间 */
  deletedTime?: string;
  
  /** 密码（已加密） */
  password: string;
  
  /** 是否已删除：false-未删除，true-已删除 */
  isDeleted: boolean;
  
  /** 用户状态：0-正常，1-禁用 */
  status: number;
  
  /** 角色类型 */
  roleType?: string;
  
  /** 城市 */
  city?: string;
  
  /** 地址 */
  address?: string;
  
  /** 详细地址 */
  addressDetail?: string;
}

/**
 * 用户初始化数据
 * 
 * 系统默认包含两个用户：
 * 1. 管理员用户 - 拥有系统最高权限
 * 2. 普通用户 - 系统普通用户权限
 */
export const users: UserSeedData[] = [
  // ==================== 系统内置用户 ====================
  // 管理员用户 - 拥有系统最高权限
  
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
  
  // 普通用户 - 系统普通用户权限
  
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

