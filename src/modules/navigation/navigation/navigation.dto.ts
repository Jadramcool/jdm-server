import { Transform } from "class-transformer";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

/**
 * 创建导航DTO
 */
export class NavigationDto {
  @IsNotEmpty({ message: "导航标题是必填的" })
  @Transform((role) => role.value.trim())
  title: string;

  @IsNotEmpty({ message: "类型是必填的" })
  type: "NOTICE" | "INFO" | "ACTIVITY";
}

/**
 * 更新导航DTO
 */
export class UpdateNavigationDto {
  @IsNotEmpty({ message: "导航ID是必填的" })
  @IsNumber({}, { message: "导航ID必须是数字" })
  id: number;

  @IsOptional()
  @IsString({ message: "导航名称必须是字符串" })
  @Transform((param) => param.value?.trim())
  name?: string;

  @IsOptional()
  @IsString({ message: "导航标题必须是字符串" })
  @Transform((param) => param.value?.trim())
  title?: string;

  @IsOptional()
  @IsString({ message: "路径必须是字符串" })
  path?: string;

  @IsOptional()
  @IsString({ message: "图标必须是字符串" })
  icon?: string;

  @IsOptional()
  @IsString({ message: "描述必须是字符串" })
  description?: string;

  @IsOptional()
  @IsNumber({}, { message: "分组ID必须是数字" })
  groupId?: number;

  @IsOptional()
  @IsNumber({}, { message: "排序必须是数字" })
  sortOrder?: number;

  @IsOptional()
  @IsNumber({}, { message: "状态必须是数字" })
  status?: number;
}
