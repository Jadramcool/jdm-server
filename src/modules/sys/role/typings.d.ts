export interface Role {
  id: number; // 角色ID
  name: string; // 角色名称
  code: string; // 角色编码
  description?: string; // 角色描述
  createdTime: Date; // 创建时间
  updatedTime?: Date | null; // 更新时间
  deletedTime?: Date | null; // 删除时间
  isDeleted?: boolean; // 是否已删除
}
