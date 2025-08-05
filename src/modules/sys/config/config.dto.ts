import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  Min,
} from "class-validator";

/**
 * 配置类型枚举
 */
export enum ConfigType {
  STRING = "STRING",
  NUMBER = "NUMBER",
  BOOLEAN = "BOOLEAN",
  JSON = "JSON",
  ARRAY = "ARRAY",
  FILE = "FILE",
  EMAIL = "EMAIL",
  URL = "URL",
  PASSWORD = "PASSWORD",
}

/**
 * 系统配置DTO
 */
export class ConfigDto {
  id?: number;

  @IsNotEmpty({ message: "配置键名是必填的" })
  @Transform(({ value }) => value?.trim())
  key: string;

  @IsOptional()
  @Transform(({ value }) => value?.trim())
  name?: string;

  @IsOptional()
  value?: string;

  @IsEnum(ConfigType, { message: "配置类型必须是有效的枚举值" })
  type: ConfigType;

  @IsOptional()
  @Transform(({ value }) => value?.trim())
  category?: string;

  @IsOptional()
  @Transform(({ value }) => value?.trim())
  description?: string;

  @IsOptional()
  @IsBoolean({ message: "isSystem必须是布尔值" })
  isSystem?: boolean;

  @IsOptional()
  @IsBoolean({ message: "isPublic必须是布尔值" })
  isPublic?: boolean;

  @IsOptional()
  @IsInt({ message: "排序必须是整数" })
  @Min(0, { message: "排序不能小于0" })
  sortOrder?: number;
}

/**
 * 批量更新配置DTO
 */
export class BatchUpdateConfigDto {
  @IsNotEmpty({ message: "配置列表不能为空" })
  configs: ConfigDto[];
}

/**
 * 配置查询DTO
 */
export class ConfigQueryDto {
  @IsOptional()
  category?: string;

  @IsOptional()
  @IsEnum(ConfigType)
  type?: ConfigType;

  @IsOptional()
  @IsBoolean()
  isSystem?: boolean;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  keyword?: string;

  @IsOptional()
  @IsInt({ message: "页码必须是整数" })
  @Min(1, { message: "页码不能小于1" })
  page?: number = 1;

  @IsOptional()
  @IsInt({ message: "每页数量必须是整数" })
  @Min(1, { message: "每页数量不能小于1" })
  pageSize?: number = 10;
}

