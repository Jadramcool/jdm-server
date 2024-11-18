export interface User {
  id: number; // 用户ID
  username: string; // 用户名 (唯一)
  name?: string | null; // 用户姓名
  phone?: string | null; // 电话号码 (唯一)
  email?: string | null; // 邮箱 (唯一)
  sex?: Sex | null; // 性别
  birthday?: Date | null; // 生日
  createdTime: Date; // 创建时间
  updatedTime?: Date | null; // 更新时间
  deletedTime?: Date | null; // 删除时间
  password?: string; // 密码
  isDeleted?: boolean; // 是否已删除
  status?: number; // 用户状态 (0: 未激活, 1: 激活)
  roles?: Role[]; // 角色列表
}
