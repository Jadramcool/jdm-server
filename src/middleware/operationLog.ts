/**
 * 操作日志中间件
 * 自动记录接口操作日志
 */
import { OperationStatus, OperationType } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { Container } from "inversify";
import "reflect-metadata";
import { JWT } from "../jwt";
import { OperationLogService } from "../modules/sys/operation-log/services";
import {
  IOperationLogContext,
  IOperationLogMiddlewareConfig,
  OPERATION_LOG_CONSTANTS,
} from "../modules/sys/operation-log/typings";
import { RouteInfoManager } from "../utils/routeInfoManager";

/**
 * 操作日志中间件类
 */
export class OperationLogMiddleware {
  private config: IOperationLogMiddlewareConfig;
  private operationLogService: OperationLogService;
  private jwtService: JWT;
  private container: Container;
  private routeInfoManager: RouteInfoManager;

  constructor(
    container: Container,
    config?: Partial<IOperationLogMiddlewareConfig>
  ) {
    this.config = {
      ...OPERATION_LOG_CONSTANTS.DEFAULT_CONFIG,
      ...config,
    };
    this.container = container;
    this.operationLogService = container.get(OperationLogService);
    this.jwtService = container.get(JWT);
    this.routeInfoManager = container.get(RouteInfoManager);
  }

  /**
   * 解析JWT token获取用户信息
   * @param req Express请求对象
   * @returns 用户信息或null
   */
  private async parseJwtToken(req: Request): Promise<any> {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7); // 移除 'Bearer ' 前缀
        const payload = this.jwtService.verifyToken(token) as any;
        return payload;
      }
    } catch (error) {
      // Token无效或不存在，返回null（静默处理，避免日志污染）
    }
    return null;
  }

  /**
   * 获取中间件函数
   */
  public getMiddleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      // 检查是否启用日志记录
      if (!this.config.enabled) {
        return next();
      }

      // 检查是否为排除的路径
      if (this.isExcludedPath(req.path)) {
        return next();
      }

      // 检查是否应该记录该方法的日志
      if (!this.shouldLogMethod(req.method)) {
        return next();
      }

      // 记录开始时间
      const startTime = Date.now();

      // 尝试解析JWT token获取用户信息
      const user = await this.parseJwtToken(req);

      // 创建操作日志上下文
      const logContext: IOperationLogContext = {
        userId: user?.id || null, // 未认证用户为null
        username: user?.username || "-", // 未认证用户 -
        operationType: this.getOperationType(req.method, req.path),
        module: this.getModuleName(req.path),
        description: this.getOperationDescription(req.method, req.path),
        startTime,
        ipAddress: this.getClientIP(req),
        userAgent: req.get("User-Agent"),
      };

      // 保存原始的res.json方法
      const originalJson = res.json;
      const originalSend = res.send;
      const originalEnd = res.end;

      // 保存中间件实例的引用
      const middleware = this;

      // 添加标志防止重复记录
      let isLogged = false;

      /**
       * 记录操作日志的通用方法
       */
      const logOperation = (body?: any) => {
        if (!isLogged) {
          isLogged = true;
          setImmediate(() => {
            middleware.recordOperationLog(
              req,
              res,
              logContext,
              startTime,
              body
            );
          });
        }
      };

      // 重写res.json方法以捕获响应数据
      res.json = function (body: any) {
        // 记录操作日志
        logOperation(body);

        // 调用原始方法
        return originalJson.call(this, body);
      };

      // 重写res.send方法
      res.send = function (body: any) {
        // 记录操作日志
        logOperation(body);

        // 调用原始方法
        return originalSend.call(this, body);
      };

      // 重写res.end方法
      res.end = function (chunk?: any, encoding?: any) {
        // 记录操作日志
        logOperation(chunk);

        // 调用原始方法
        return originalEnd.call(this, chunk, encoding);
      };

      next();
    };
  }

  /**
   * 记录操作日志
   */
  private async recordOperationLog(
    req: Request,
    res: Response,
    logContext: IOperationLogContext,
    startTime: number,
    responseBody?: any
  ) {
    try {
      const endTime = Date.now();
      const duration = endTime - startTime;

      // 判断操作状态
      // 首先检查HTTP状态码，然后检查响应体中的业务状态码
      let status: OperationStatus = OperationStatus.SUCCESS;

      if (res.statusCode < 200 || res.statusCode >= 400) {
        // HTTP状态码表示失败
        status = OperationStatus.FAILED;
      } else if (responseBody && typeof responseBody === "object") {
        // 检查响应体中的业务状态码
        const businessCode = responseBody.code;
        if (businessCode && businessCode !== 200) {
          // 业务状态码表示失败
          status = OperationStatus.FAILED;
        }
      }

      // 准备请求参数
      let params = "";
      if (this.config.logParams) {
        const requestParams = {
          query: req.query,
          body: req.body,
          params: req.params,
        };
        params = this.truncateString(
          JSON.stringify(requestParams),
          this.config.maxParamsLength || 2000
        );
      }

      // 准备响应结果
      let result = "";
      if (this.config.logResult && responseBody) {
        result = this.truncateString(
          typeof responseBody === "string"
            ? responseBody
            : JSON.stringify(responseBody),
          this.config.maxResultLength || 2000
        );
      }

      // 准备错误信息
      let errorMessage = "";
      if (status === OperationStatus.FAILED) {
        if (responseBody && typeof responseBody === "object") {
          // 优先使用业务错误信息
          if (responseBody.errMsg) {
            errorMessage =
              typeof responseBody.errMsg === "object"
                ? responseBody.errMsg.zhCN ||
                  responseBody.errMsg.message ||
                  "操作失败"
                : responseBody.errMsg;
          } else {
            errorMessage = responseBody.message || "操作失败";
          }
        } else if (typeof responseBody === "string") {
          errorMessage = responseBody;
        } else {
          errorMessage = `HTTP ${res.statusCode} 错误`;
        }
      }

      // 创建操作日志数据
      const logData = {
        userId: logContext.userId,
        username: logContext.username,
        operationType: logContext.operationType!,
        module: logContext.module,
        description: logContext.description,
        method: req.method,
        url: req.originalUrl || req.url,
        params,
        result,
        status,
        errorMessage: errorMessage || undefined,
        ipAddress: logContext.ipAddress,
        userAgent: logContext.userAgent,
        duration,
      };

      // 异步或同步记录日志
      if (this.config.async) {
        this.operationLogService.createLogAsync(logData);
      } else {
        await this.operationLogService.createLog(logData);
      }
    } catch (error) {
      console.error("❌ 记录操作日志失败:", error);
    }
  }

  /**
   * 检查是否为排除的路径
   */
  private isExcludedPath(path: string): boolean {
    return (
      this.config.excludePaths?.some((excludePath) =>
        path.includes(excludePath)
      ) || false
    );
  }

  /**
   * 检查是否应该记录该方法的日志
   * @param method HTTP方法
   * @returns 是否应该记录日志
   */
  private shouldLogMethod(method: string): boolean {
    const upperMethod = method.toUpperCase();

    // 如果配置了includeMethods，只记录包含的方法（优先级最高）
    if (this.config.includeMethods && this.config.includeMethods.length > 0) {
      return this.config.includeMethods.includes(upperMethod);
    }

    // 如果配置了excludeMethods，排除指定的方法
    if (this.config.excludeMethods && this.config.excludeMethods.length > 0) {
      return !this.config.excludeMethods.includes(upperMethod);
    }

    // 默认记录所有方法
    return true;
  }

  /**
   * 根据HTTP方法和路径获取操作类型
   */
  private getOperationType(method: string, path?: string): OperationType {
    // 特殊路径的操作类型映射
    if (path) {
      if (path.includes("/login")) {
        return OperationType.LOGIN;
      }
      if (path.includes("/logout")) {
        return OperationType.LOGOUT;
      }
      if (path.includes("/export")) {
        return OperationType.EXPORT;
      }
      if (path.includes("/import")) {
        return OperationType.IMPORT;
      }
    }

    // 默认的HTTP方法映射
    const methodMap: { [key: string]: OperationType } = {
      GET: OperationType.VIEW,
      POST: OperationType.CREATE,
      PUT: OperationType.UPDATE,
      PATCH: OperationType.UPDATE,
      DELETE: OperationType.DELETE,
    };
    return methodMap[method.toUpperCase()] || OperationType.OTHER;
  }

  /**
   * 根据路径获取模块名称
   */
  /**
   * 根据路径获取模块名称（使用动态路由信息）
   * @param path 请求路径
   * @returns 模块名称
   */
  private getModuleName(path: string): string {
    // 优先使用动态路由信息管理器
    const dynamicModuleName = this.routeInfoManager.getModuleNameByPath(path);
    if (dynamicModuleName && dynamicModuleName !== "未知模块") {
      return dynamicModuleName;
    }

    // 回退到预定义的模块名称映射
    for (const [pathPattern, moduleName] of Object.entries(
      OPERATION_LOG_CONSTANTS.MODULE_NAMES
    )) {
      if (path.includes(pathPattern)) {
        return moduleName;
      }
    }

    // 最后回退到从路径中提取模块名
    const pathParts = path.split("/").filter((part) => part);
    if (pathParts.length >= 2) {
      return pathParts[1]; // 通常是 /api/moduleName 的格式
    }

    return "未知模块";
  }

  /**
   * 获取操作描述
   */
  private getOperationDescription(method: string, path: string): string {
    const operationType = this.getOperationType(method, path);
    const moduleName = this.getModuleName(path);
    const operationDesc =
      OPERATION_LOG_CONSTANTS.OPERATION_TYPE_DESCRIPTIONS[operationType];

    return `${operationDesc}${moduleName}`;
  }

  /**
   * 获取客户端IP地址
   */
  private getClientIP(req: Request): string {
    return (
      (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
      (req.headers["x-real-ip"] as string) ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.ip ||
      "未知IP"
    );
  }

  /**
   * 截断字符串
   */
  private truncateString(str: string, maxLength: number): string {
    if (str.length <= maxLength) {
      return str;
    }
    return str.substring(0, maxLength) + "...[已截断]";
  }
}

/**
 * 创建操作日志中间件实例
 */
export function createOperationLogMiddleware(
  container: Container,
  config?: Partial<IOperationLogMiddlewareConfig>
) {
  const middleware = new OperationLogMiddleware(container, config);
  return middleware.getMiddleware();
}

/**
 * 操作日志装饰器
 * 用于在控制器方法上标记操作类型和描述
 */
export function OperationLog(options: {
  operationType: OperationType;
  module?: string;
  description?: string;
}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    // 在方法上添加元数据
    Reflect.defineMetadata("operationLog", options, target, propertyKey);
    return descriptor;
  };
}

/**
 * 获取方法的操作日志元数据
 */
export function getOperationLogMetadata(target: any, propertyKey: string) {
  return Reflect.getMetadata("operationLog", target, propertyKey);
}
