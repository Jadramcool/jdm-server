/*
 * @Author: Assistant
 * @Date: 2024-12-19
 * @Description: 部门管理模块数据传输对象
 */

import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";

/**
 * 创建部门DTO
 */
export class CreateDepartmentDto {
  @IsString()
  name: string;

  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  parentId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  managerId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  status?: number;
}

/**
 * 更新部门DTO
 */
export class UpdateDepartmentDto {
  @Type(() => Number)
  @IsInt()
  id: number;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  parentId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  managerId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

/**
 * 部门查询DTO
 */
export class DepartmentQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 10;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  parentId?: number;

  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  includeChildren?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  status?: number;
}

/**
 * 分配用户到部门DTO
 */
export class AssignUserToDepartmentDto {
  @Type(() => Number)
  @IsInt()
  userId: number;

  @Type(() => Number)
  @IsInt()
  departmentId: number;

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  status?: number;
}

/**
 * 角色分配到部门DTO
 */
export class AssignRoleToDepartmentDto {
  @Type(() => Number)
  @IsInt()
  roleId: number;

  @Type(() => Number)
  @IsInt()
  departmentId: number;

  @IsOptional()
  @IsBoolean()
  autoAssign?: boolean;

  @IsOptional()
  @IsString()
  defaultPosition?: string;
}

/**
 * 批量分配用户到部门DTO
 */
export class BatchAssignUsersToDepartmentDto {
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  userIds: number[];

  @Type(() => Number)
  @IsInt()
  departmentId: number;

  @IsOptional()
  @IsString()
  defaultPosition?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  status?: number;
}

/**
 * 部门成员DTO
 */
export class DepartmentMemberDto {
  userId: number;

  username: string;

  name: string;

  email?: string;

  phone?: string;

  position?: string;

  joinedAt?: Date;

  status?: number;
}

/**
 * 部门树节点DTO
 */
export class DepartmentTreeNodeDto {
  id: number;

  name: string;

  code: string;

  description?: string;

  parentId?: number;

  managerId?: number;

  managerName?: string;

  level: number;

  sortOrder: number;

  /** 包含子部门的总成员数量 */
  memberCount: number;

  /** 直接属于该部门的成员数量（不包含子部门） */
  directMemberCount: number;

  children: DepartmentTreeNodeDto[];

  createdTime: Date;

  updatedTime: Date;

  status?: number;
}

/**
 * 部门详情DTO
 */
export class DepartmentDetailDto extends DepartmentTreeNodeDto {
  members: DepartmentMemberDto[];

  parent?: {
    id: number;
    name: string;
    code: string;
  };

  manager?: {
    id: number;
    username: string;
    name: string;
    email?: string;
    phone?: string;
  };
}

