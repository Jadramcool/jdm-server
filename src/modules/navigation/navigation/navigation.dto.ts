import { Transform } from "class-transformer";
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";

/**
 * 创建导航DTO
 */
export class NavigationDto {
  @IsOptional()
  @IsString({ message: "导航名称必须是字符串" })
  @Transform((name) => name.value?.trim())
  name?: string;

  @IsOptional()
  @IsArray({ message: "分组ID列表必须是数组" })
  @IsNumber({}, { each: true, message: "分组ID必须是数字" })
  groupIds?: number[];

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
  @IsNumber({}, { message: "排序必须是数字" })
  sortOrder?: number;

  @IsOptional()
  @IsNumber({}, { message: "状态必须是数字" })
  status?: number;
}

/**
 * 获取网站信息DTO
 */
export class GetWebsiteInfoDto {
  @IsNotEmpty({ message: "网址是必填的" })
  @IsString({ message: "网址必须是字符串" })
  @Transform((param) => param.value?.trim())
  url: string;
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
  @IsString({ message: "路径必须是字符串" })
  path?: string;

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
