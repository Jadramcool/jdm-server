// 操作日志模块类型定义
import { OperationStatus, OperationType } from "@prisma/client";

// 通用列表配置类型
export interface ReqListConfig {
  filters?: Record<string, any>;
  options?: {
    showPagination?: boolean;
    [key: string]: any;
  };
  pagination?: {
    page?: string | number;
    pageSize?: string | number;
  };
}

/**
 * 操作日志创建参数接口
 */
export interface ICreateOperationLog {
  userId?: number;
  username?: string;
  operationType: OperationType;
  module?: string;
  description?: string;
  method?: string;
  url?: string;
  params?: string;
  result?: string;
  status?: OperationStatus;
  errorMessage?: string;
  ipAddress?: string;
  userAgent?: string;
  duration?: number;
}

/**
 * 操作日志查询参数接口
 */
export interface IQueryOperationLog {
  userId?: number;
  username?: string;
  operationType?: OperationType;
  module?: string;
  status?: OperationStatus;
  ipAddress?: string;
  startTime?: string;
  endTime?: string;
  page?: number;
  pageSize?: number;
}

/**
 * 操作日志过滤条件接口
 */
export interface IOperationLogFilter {
  userId?: number;
  username?: string;
  operationType?: OperationType;
  module?: string;
  status?: OperationStatus;
  ipAddress?: string;
  createdTime?: {
    gte?: Date;
    lte?: Date;
  };
}

/**
 * 操作日志统计接口
 */
export interface IOperationLogStats {
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

/**
 * 操作日志中间件配置接口
 */
export interface IOperationLogMiddlewareConfig {
  // 是否启用操作日志记录
  enabled?: boolean;
  // 排除的路径（不记录日志）
  excludePaths?: string[];
  // 排除的方法（不记录日志）
  excludeMethods?: string[];
  // 包含的方法（只记录这些方法的日志，优先级高于excludeMethods）
  includeMethods?: string[];
  // 是否记录请求参数
  logParams?: boolean;
  // 是否记录响应结果
  logResult?: boolean;
  // 参数最大长度（超过则截断）
  maxParamsLength?: number;
  // 结果最大长度（超过则截断）
  maxResultLength?: number;
  // 是否异步记录日志
  async?: boolean;
}

/**
 * 操作日志上下文接口
 */
export interface IOperationLogContext {
  userId?: number;
  username?: string;
  operationType?: OperationType;
  module?: string;
  description?: string;
  startTime?: number;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * 操作日志装饰器选项接口
 */
export interface IOperationLogDecoratorOptions {
  // 操作类型
  operationType: OperationType;
  // 模块名
  module?: string;
  // 操作描述
  description?: string;
  // 是否记录参数
  logParams?: boolean;
  // 是否记录结果
  logResult?: boolean;
}

/**
 * HTTP请求信息接口
 */
export interface IRequestInfo {
  method: string;
  url: string;
  params?: any;
  query?: any;
  body?: any;
  headers?: any;
  ip?: string;
  userAgent?: string;
}

/**
 * HTTP响应信息接口
 */
export interface IResponseInfo {
  statusCode: number;
  data?: any;
  message?: string;
  error?: any;
}

/**
 * 操作日志服务接口
 */
export interface IOperationLogService {
  /**
   * 创建操作日志
   */
  createLog(data: ICreateOperationLog): Promise<any>;

  /**
   * 查询操作日志列表
   */
  getLogList(config: ReqListConfig): Promise<any>;

  /**
   * 根据ID获取操作日志详情
   */
  getLogById(id: number): Promise<any>;

  /**
   * 删除操作日志
   */
  deleteLog(id: number): Promise<any>;

  /**
   * 批量删除操作日志
   */
  batchDeleteLogs(ids: number[]): Promise<any>;

  /**
   * 清理过期日志
   */
  cleanExpiredLogs(days: number): Promise<any>;

  /**
   * 获取操作日志统计
   */
  getLogStats(): Promise<IOperationLogStats>;
}

/**
 * 操作日志常量
 */
export const OPERATION_LOG_CONSTANTS = {
  // 默认配置
  DEFAULT_CONFIG: {
    enabled: true,
    excludePaths: ["/health", "/metrics"],
    excludeMethods: ["OPTIONS"],
    logParams: true,
    logResult: false,
    maxParamsLength: 2000,
    maxResultLength: 2000,
    async: true,
  } as IOperationLogMiddlewareConfig,

  // 模块名称映射
  MODULE_NAMES: {
    "/api/aiChat": "AI聊天",
    "/api/notice": "通知公告",
    "/api/system/config": "系统配置",
    "/api/system/department": "部门管理",
    "/api/system/menu": "菜单管理",
    "/api/system/operation-log": "操作日志",
    "/api/system/role": "角色管理",
    "/api/system/user": "用户管理",
    "/api/todo": "待办事项",
    "/api/upload": "文件上传",
    "/api/user": "用户认证",
    "/api/navigation": "导航",
  },

  // 操作类型描述映射
  OPERATION_TYPE_DESCRIPTIONS: {
    [OperationType.CREATE]: "新增",
    [OperationType.UPDATE]: "修改",
    [OperationType.DELETE]: "删除",
    [OperationType.VIEW]: "查看",
    [OperationType.LOGIN]: "登录",
    [OperationType.LOGOUT]: "登出",
    [OperationType.EXPORT]: "导出",
    [OperationType.IMPORT]: "导入",
    [OperationType.OTHER]: "其他",
  },
};
