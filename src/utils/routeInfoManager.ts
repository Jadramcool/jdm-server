/**
 * 路由信息管理器
 * 用于动态获取和管理应用程序的路由信息
 */
import { injectable } from "inversify";

/**
 * 路由端点信息接口
 */
export interface IRouteEndpoint {
  route: string; // 完整路由信息，如 "GET /api/user/list"
  method: string; // HTTP方法
  path: string; // 路径
}

/**
 * 控制器路由信息接口
 */
export interface IControllerRouteInfo {
  controller: string; // 控制器名称
  endpoints: IRouteEndpoint[]; // 端点列表
}

/**
 * 路径到模块名的映射接口
 */
export interface IPathModuleMapping {
  path: string; // 路径模式
  moduleName: string; // 模块名称
  controllerName: string; // 控制器名称
}

@injectable()
export class RouteInfoManager {
  private routeInfoList: IControllerRouteInfo[] = [];
  private pathModuleMappings: IPathModuleMapping[] = [];
  private isInitialized = false;

  /**
   * 初始化路由信息
   * @param routeInfo 从inversify-express-utils获取的路由信息
   */
  public initialize(routeInfo: any[]): void {
    this.routeInfoList = routeInfo;
    this.generatePathModuleMappings();
    this.isInitialized = true;
    console.log(
      `✅ 路由信息管理器已初始化，共加载 ${this.pathModuleMappings.length} 个路径映射`
    );
  }

  /**
   * 生成路径到模块名的映射
   */
  private generatePathModuleMappings(): void {
    this.pathModuleMappings = [];

    this.routeInfoList.forEach((routeInfo) => {
      const controllerName = routeInfo.controller;
      const endpoints = routeInfo.endpoints || [];

      // 为每个端点创建映射
      endpoints.forEach((endpoint: any) => {
        const route = endpoint.route;
        const parts = route.split(" ");
        const method = parts[0];
        const path = parts[1] || route;

        // 提取模块名称
        const moduleName = this.extractModuleNameFromController(controllerName);

        // 创建路径映射
        const mapping: IPathModuleMapping = {
          path: `/api${path}`,
          moduleName: moduleName,
          controllerName: controllerName,
        };

        this.pathModuleMappings.push(mapping);
      });
    });

    // 按路径长度排序，确保更具体的路径优先匹配
    this.pathModuleMappings.sort((a, b) => b.path.length - a.path.length);
  }

  /**
   * 从控制器名称提取模块名称
   * @param controllerName 控制器名称
   * @returns 模块名称
   */
  private extractModuleNameFromController(controllerName: string): string {
    // 控制器名称映射到中文模块名
    const controllerModuleMap: { [key: string]: string } = {
      User: "用户认证",
      UserManager: "用户管理",
      Role: "角色管理",
      Menu: "菜单管理",
      ConfigController: "系统配置",
      DepartmentController: "部门管理",
      OperationLogController: "操作日志",
      Notice: "通知管理",
      Todo: "待办事项",
      Upload: "文件上传",
      AiChat: "AI聊天",
    };

    return controllerModuleMap[controllerName] || controllerName;
  }

  /**
   * 根据请求路径获取模块名称
   * @param requestPath 请求路径
   * @returns 模块名称
   */
  public getModuleNameByPath(requestPath: string): string {
    if (!this.isInitialized) {
      console.warn("⚠️ 路由信息管理器尚未初始化，使用默认模块名");

      return this.getDefaultModuleName(requestPath);
    }

    // 查找最匹配的路径映射（优先精确匹配）
    let bestMatch: IPathModuleMapping | null = null;

    let bestMatchScore = 0;
    for (const mapping of this.pathModuleMappings) {
      if (this.isPathMatch(requestPath, mapping.path)) {
        // 计算匹配分数（路径越具体分数越高）
        const score = mapping.path.split("/").length;
        if (score > bestMatchScore) {
          bestMatch = mapping;
          bestMatchScore = score;
        }
      }
    }

    if (bestMatch) {
      return bestMatch.moduleName;
    }

    // 如果没有找到匹配的映射，使用默认逻辑
    return this.getDefaultModuleName(requestPath);
  }

  /**
   * 检查请求路径是否匹配映射路径
   * @param requestPath 请求路径
   * @param mappingPath 映射路径
   * @returns 是否匹配
   */
  private isPathMatch(requestPath: string, mappingPath: string): boolean {
    // 移除查询参数
    const cleanRequestPath = requestPath.split("?")[0];

    // 精确匹配
    if (cleanRequestPath === mappingPath) {
      return true;
    }

    // 路径参数匹配（如 /api/user/:id 匹配 /api/user/123）
    const mappingParts = mappingPath.split("/");
    const requestParts = cleanRequestPath.split("/");

    if (mappingParts.length !== requestParts.length) {
      // 如果长度不同，检查是否是前缀匹配（用于处理子路径）
      if (mappingParts.length < requestParts.length) {
        // 检查映射路径是否是请求路径的前缀
        for (let i = 0; i < mappingParts.length; i++) {
          const mappingPart = mappingParts[i];
          const requestPart = requestParts[i];

          if (mappingPart.startsWith(":")) {
            continue;
          }

          if (mappingPart !== requestPart) {
            return false;
          }
        }
        return true; // 前缀匹配成功
      }
      return false;
    }

    // 完全匹配检查
    for (let i = 0; i < mappingParts.length; i++) {
      const mappingPart = mappingParts[i];
      const requestPart = requestParts[i];

      // 如果是路径参数（以:开头），则跳过比较
      if (mappingPart.startsWith(":")) {
        continue;
      }

      // 普通路径部分必须完全匹配
      if (mappingPart !== requestPart) {
        return false;
      }
    }

    return true;
  }

  /**
   * 获取默认模块名称（回退逻辑）
   * @param path 请求路径
   * @returns 模块名称
   */
  private getDefaultModuleName(path: string): string {
    // 从路径中提取模块名
    const pathParts = path.split("/").filter((part) => part);
    if (pathParts.length >= 2) {
      const modulePart = pathParts[1]; // 通常是 /api/moduleName 的格式

      // 简单的模块名映射
      const moduleMap: { [key: string]: string } = {
        user: "用户管理",
        system: "系统管理",
        notice: "通知管理",
        upload: "文件上传",
        aiChat: "AI聊天",
      };

      return moduleMap[modulePart] || modulePart;
    }

    return "未知模块";
  }

  /**
   * 获取所有路由信息
   * @returns 路由信息列表
   */
  public getAllRouteInfo(): IControllerRouteInfo[] {
    return this.routeInfoList;
  }

  /**
   * 获取所有路径映射
   * @returns 路径映射列表
   */
  public getAllPathMappings(): IPathModuleMapping[] {
    return this.pathModuleMappings;
  }

  /**
   * 检查是否已初始化
   * @returns 是否已初始化
   */
  public getIsInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * 打印路由映射信息（调试用）
   */
  public printRouteMappings(): void {
    console.log("\n📋 动态路由映射信息:");
    console.log("=".repeat(50));

    const groupedMappings = this.pathModuleMappings.reduce((acc, mapping) => {
      if (!acc[mapping.moduleName]) {
        acc[mapping.moduleName] = [];
      }
      acc[mapping.moduleName].push(mapping);
      return acc;
    }, {} as { [key: string]: IPathModuleMapping[] });

    Object.entries(groupedMappings).forEach(([moduleName, mappings]) => {
      console.log(`\n📁 ${moduleName} (${mappings.length}个路径):`);
      mappings.forEach((mapping) => {
        console.log(`   └─ ${mapping.path}`);
      });
    });

    console.log("\n" + "=".repeat(50));
  }
}

