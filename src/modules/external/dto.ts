/*
 * @Author: jdm
 * @Date: 2025-01-27 10:00:00
 * @LastEditors: jdm 1051780106@qq.com
 * @LastEditTime: 2025-01-27 10:00:00
 * @FilePath: \jdm-server\src\modules\external\dto.ts
 * @Description: 外部数据模块的数据传输对象定义
 */

/**
 * u3c3数据创建DTO
 */
export interface CreateU3C3DataDto {
  title: string; // 标题，必填
  type?: string; // 类型，可选
  content?: string; // 内容，可选
  url?: string; // 链接，可选
  size?: number; // 大小，可选
  date?: string | Date; // 日期，可选
  description?: string; // 描述，可选
  tags?: string; // 标签，可选
  status?: number; // 状态，可选
  priority?: number; // 优先级，可选
  category?: string; // 分类，可选
  author?: string; // 作者，可选
  source?: string; // 来源，可选
  metadata?: string; // 元数据，可选
}

/**
 * u3c3数据更新DTO
 */
export interface UpdateU3C3DataDto {
  title?: string; // 标题，可选
  type?: string; // 类型，可选
  content?: string; // 内容，可选
  url?: string; // 链接，可选
  size?: number; // 大小，可选
  date?: string | Date; // 日期，可选
  description?: string; // 描述，可选
  tags?: string; // 标签，可选
  status?: number; // 状态，可选
  priority?: number; // 优先级，可选
  category?: string; // 分类，可选
  author?: string; // 作者，可选
  source?: string; // 来源，可选
  metadata?: string; // 元数据，可选
}

/**
 * u3c3数据响应DTO
 */
export interface U3C3DataResponseDto {
  id: number; // 主键ID
  title: string; // 标题
  type?: string; // 类型
  content?: string; // 内容
  url?: string; // 链接
  size?: number; // 大小
  date?: string | Date; // 日期
  description?: string; // 描述
  tags?: string; // 标签
  status?: number; // 状态
  priority?: number; // 优先级
  category?: string; // 分类
  author?: string; // 作者
  source?: string; // 来源
  metadata?: string; // 元数据
  is_deleted?: boolean; // 是否删除
  created_at?: Date; // 创建时间
  updated_at?: Date; // 更新时间
}

/**
 * 数据验证错误接口
 */
export interface ValidationError {
  field: string; // 字段名
  message: string; // 错误信息
  value?: any; // 错误值
}

/**
 * API响应基础接口
 */
export interface ApiResponse<T = any> {
  code: number; // 响应码
  message: string; // 响应消息
  data?: T; // 响应数据
  errors?: ValidationError[]; // 验证错误列表
}

/**
 * 操作结果接口
 */
export interface OperationResult {
  success: boolean; // 操作是否成功
  id?: number; // 操作的数据ID
  affectedRows?: number; // 影响的行数
  message: string; // 操作消息
  data?: any; // 操作返回的数据
  error?: string; // 错误信息
}

