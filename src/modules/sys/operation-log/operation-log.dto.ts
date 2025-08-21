// 操作日志DTO层用来验证数据
import { IsNotEmpty, IsOptional, IsEnum, IsString, IsNumber, IsDateString } from "class-validator";
import { Transform, Type } from "class-transformer";
import { OperationType, OperationStatus } from "@prisma/client";

/**
 * 创建操作日志DTO
 */
export class CreateOperationLogDto {
  @IsOptional()
  @IsNumber({}, { message: "用户ID必须是数字" })
  userId?: number;

  @IsOptional()
  @IsString({ message: "用户名必须是字符串" })
  username?: string;

  @IsNotEmpty({ message: "操作类型是必填的" })
  @IsEnum(OperationType, { message: "操作类型不正确" })
  operationType: OperationType;

  @IsOptional()
  @IsString({ message: "模块名必须是字符串" })
  module?: string;

  @IsOptional()
  @IsString({ message: "操作描述必须是字符串" })
  description?: string;

  @IsOptional()
  @IsString({ message: "请求方法必须是字符串" })
  method?: string;

  @IsOptional()
  @IsString({ message: "请求URL必须是字符串" })
  url?: string;

  @IsOptional()
  @IsString({ message: "请求参数必须是字符串" })
  params?: string;

  @IsOptional()
  @IsString({ message: "返回结果必须是字符串" })
  result?: string;

  @IsOptional()
  @IsEnum(OperationStatus, { message: "操作状态不正确" })
  status?: OperationStatus;

  @IsOptional()
  @IsString({ message: "错误信息必须是字符串" })
  errorMessage?: string;

  @IsOptional()
  @IsString({ message: "IP地址必须是字符串" })
  ipAddress?: string;

  @IsOptional()
  @IsString({ message: "用户代理必须是字符串" })
  userAgent?: string;

  @IsOptional()
  @IsNumber({}, { message: "执行时长必须是数字" })
  duration?: number;
}

/**
 * 查询操作日志DTO
 */
export class QueryOperationLogDto {
  @IsOptional()
  @IsNumber({}, { message: "用户ID必须是数字" })
  @Type(() => Number)
  userId?: number;

  @IsOptional()
  @IsString({ message: "用户名必须是字符串" })
  @Transform(({ value }) => value?.trim())
  username?: string;

  @IsOptional()
  @IsEnum(OperationType, { message: "操作类型不正确" })
  operationType?: OperationType;

  @IsOptional()
  @IsString({ message: "模块名必须是字符串" })
  @Transform(({ value }) => value?.trim())
  module?: string;

  @IsOptional()
  @IsEnum(OperationStatus, { message: "操作状态不正确" })
  status?: OperationStatus;

  @IsOptional()
  @IsString({ message: "IP地址必须是字符串" })
  @Transform(({ value }) => value?.trim())
  ipAddress?: string;

  @IsOptional()
  @IsDateString({}, { message: "开始时间格式不正确" })
  startTime?: string;

  @IsOptional()
  @IsDateString({}, { message: "结束时间格式不正确" })
  endTime?: string;

  @IsOptional()
  @IsNumber({}, { message: "页码必须是数字" })
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsNumber({}, { message: "每页数量必须是数字" })
  @Type(() => Number)
  pageSize?: number = 10;
}

/**
 * 操作日志响应DTO
 */
export class OperationLogResponseDto {
  id: number;
  userId?: number;
  username?: string;
  operationType: OperationType;
  module?: string;
  description?: string;
  method?: string;
  url?: string;
  params?: string;
  result?: string;
  status: OperationStatus;
  errorMessage?: string;
  ipAddress?: string;
  userAgent?: string;
  duration?: number;
  createdTime: Date;
  user?: {
    id: number;
    username: string;
    name?: string;
  };
}

/**
 * 操作日志分页响应DTO
 */
export class OperationLogPageResponseDto {
  list: OperationLogResponseDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * 操作日志统计DTO
 */
export class OperationLogStatsDto {
  totalCount: number;
  todayCount: number;
  successCount: number;
  failedCount: number;
  operationTypeStats: {
    type: OperationType;
    count: number;
  }[];
  moduleStats: {
    module: string;
    count: number;
  }[];
}