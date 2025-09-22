import { Transform } from "class-transformer";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

/**
 * 创建导航组DTO
 */
export class NavigationGroupDto {
  @IsNotEmpty({ message: "导航组名称是必填的" })
  @IsString({ message: "导航组名称必须是字符串" })
  @Transform((param) => param.value?.trim())
  name: string;

  @IsOptional()
  @IsString({ message: "图标必须是字符串" })
  icon?: string;

  @IsOptional()
  @IsString({ message: "描述必须是字符串" })
  description?: string;

  @IsOptional()
  @IsNumber({}, { message: "排序必须是数字" })
  sortOrder?: number;

  @IsOptional()
  @IsNumber({}, { message: "状态必须是数字" })
  status?: number;
}

/**
 * 更新导航组DTO
 */
export class UpdateNavigationGroupDto {
  @IsNotEmpty({ message: "导航组ID是必填的" })
  @IsNumber({}, { message: "导航组ID必须是数字" })
  id: number;

  @IsOptional()
  @IsString({ message: "导航组名称必须是字符串" })
  @Transform((param) => param.value?.trim())
  name?: string;

  @IsOptional()
  @IsString({ message: "图标必须是字符串" })
  icon?: string;

  @IsOptional()
  @IsString({ message: "描述必须是字符串" })
  description?: string;

  @IsOptional()
  @IsNumber({}, { message: "排序必须是数字" })
  sortOrder?: number;

  @IsOptional()
  @IsNumber({}, { message: "状态必须是数字" })
  status?: number;
}
