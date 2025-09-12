/**
 * 分页查询助手类
 * 提供通用的分页查询功能，支持Prisma ORM
 */

// 分页查询选项接口
interface PaginationOptions {
  showPagination?: boolean;
  page?: number;
  pageSize?: number;
  orderBy?: any[];
  include?: any;
  select?: any;
}

// 分页查询结果接口
interface PaginationResult<T = any> {
  data: T[];
  pagination: PaginationInfo | null;
}

// 分页信息接口
interface PaginationInfo {
  page: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// 验证后的分页参数接口
interface ValidatedPaginationParams {
  page: number;
  pageSize: number;
}

// 分页错误类
class PaginationError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "PaginationError";
  }
}

// 导出接口和错误类供外部使用
export {
  PaginationError,
  PaginationInfo,
  PaginationOptions,
  PaginationResult,
  ValidatedPaginationParams,
};

export class PaginationHelper {
  /**
   * 通用分页查询方法
   * @param model Prisma模型对象
   * @param whereConditions 查询条件
   * @param options 查询选项
   * @returns 包含数据和分页信息的对象
   * @throws {PaginationError} 当参数无效或查询失败时抛出错误
   */
  static async executePagedQuery<T = any>(
    model: any,
    whereConditions: any = {},
    options: PaginationOptions = {}
  ): Promise<PaginationResult<T>> {
    try {
      // 参数验证
      this.validateModel(model);
      this.validateWhereConditions(whereConditions);

      const {
        showPagination = true,
        page = 1,
        pageSize = 10,
        orderBy = [{ createdTime: "desc" }],
        include,
        select,
      } = options;

      // 验证分页参数
      const validatedParams = this.validatePaginationParams(page, pageSize);

      // 验证排序参数
      this.validateOrderBy(orderBy);

      // 验证include和select不能同时使用
      if (include && select) {
        throw new PaginationError(
          "include和select参数不能同时使用",
          "INVALID_QUERY_OPTIONS"
        );
      }

      let data: T[] = [];
      let totalRecords = 0;

      // 并行执行总数查询和数据查询（分页时）
      if (!showPagination) {
        // 不分页，只查询数据
        const queryOptions = this.buildQueryOptions({
          whereConditions,
          orderBy,
          include,
          select,
        });

        [data, totalRecords] = await Promise.all([
          model.findMany(queryOptions),
          model.count({ where: whereConditions }),
        ]);
      } else {
        // 分页查询，并行执行
        const queryOptions = this.buildQueryOptions({
          whereConditions,
          orderBy,
          include,
          select,
          skip: (validatedParams.page - 1) * validatedParams.pageSize,
          take: validatedParams.pageSize,
        });

        [data, totalRecords] = await Promise.all([
          model.findMany(queryOptions),
          model.count({ where: whereConditions }),
        ]);
      }

      // 构建分页信息
      const paginationData = showPagination
        ? this.buildPaginationInfo(
            validatedParams.page,
            validatedParams.pageSize,
            totalRecords
          )
        : null;

      return { data, pagination: paginationData };
    } catch (error) {
      if (error instanceof PaginationError) {
        throw error;
      }

      // 处理Prisma错误
      if (error.code) {
        throw new PaginationError(
          `数据库查询失败: ${error.message}`,
          "DATABASE_ERROR"
        );
      }

      // 处理其他未知错误
      throw new PaginationError(
        `分页查询失败: ${error.message}`,
        "UNKNOWN_ERROR"
      );
    }
  }

  /**
   * 验证Prisma模型对象
   * @param model Prisma模型对象
   * @throws {PaginationError} 当模型无效时抛出错误
   */
  private static validateModel(model: any): void {
    if (!model) {
      throw new PaginationError("模型对象不能为空", "INVALID_MODEL");
    }

    if (
      typeof model.findMany !== "function" ||
      typeof model.count !== "function"
    ) {
      throw new PaginationError("无效的Prisma模型对象", "INVALID_MODEL");
    }
  }

  /**
   * 验证查询条件
   * @param whereConditions 查询条件
   * @throws {PaginationError} 当查询条件无效时抛出错误
   */
  private static validateWhereConditions(whereConditions: any): void {
    if (whereConditions !== null && typeof whereConditions !== "object") {
      throw new PaginationError(
        "查询条件必须是对象类型",
        "INVALID_WHERE_CONDITIONS"
      );
    }
  }

  /**
   * 验证排序参数
   * @param orderBy 排序参数
   * @throws {PaginationError} 当排序参数无效时抛出错误
   */
  private static validateOrderBy(orderBy: any[]): void {
    if (!Array.isArray(orderBy)) {
      throw new PaginationError("排序参数必须是数组类型", "INVALID_ORDER_BY");
    }

    if (orderBy.length === 0) {
      throw new PaginationError("排序参数不能为空数组", "INVALID_ORDER_BY");
    }
  }

  /**
   * 构建查询选项
   * @param options 查询选项参数
   * @returns 构建好的查询选项对象
   */
  private static buildQueryOptions(options: {
    whereConditions: any;
    orderBy: any[];
    include?: any;
    select?: any;
    skip?: number;
    take?: number;
  }): any {
    const { whereConditions, orderBy, include, select, skip, take } = options;

    const queryOptions: any = {
      where: whereConditions,
      orderBy,
    };

    if (skip !== undefined) queryOptions.skip = skip;
    if (take !== undefined) queryOptions.take = take;
    if (include) queryOptions.include = include;
    if (select) queryOptions.select = select;

    return queryOptions;
  }

  /**
   * 构建分页信息
   * @param page 当前页码
   * @param pageSize 每页数量
   * @param totalRecords 总记录数
   * @returns 分页信息对象
   */
  private static buildPaginationInfo(
    page: number,
    pageSize: number,
    totalRecords: number
  ): PaginationInfo {
    const totalPages = Math.ceil(totalRecords / pageSize);

    return {
      page,
      pageSize,
      totalRecords,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }

  /**
   * 构建标准分页响应格式
   * @param data 数据列表
   * @param pagination 分页信息
   * @param listKey 数据列表的键名，默认为'list'
   * @returns 标准化的分页响应对象
   */
  static buildPaginationResponse<T = any>(
    data: T[],
    pagination: PaginationInfo | null,
    listKey: string = "list"
  ): { [key: string]: any } {
    if (!Array.isArray(data)) {
      throw new PaginationError("数据必须是数组类型", "INVALID_DATA");
    }

    if (typeof listKey !== "string" || listKey.trim() === "") {
      throw new PaginationError("列表键名必须是非空字符串", "INVALID_LIST_KEY");
    }

    const response: any = {};
    response[listKey] = data;

    if (pagination) {
      response.pagination = pagination;
    }

    return response;
  }

  /**
   * 验证分页参数
   * @param page 页码
   * @param pageSize 每页数量
   * @returns 验证后的分页参数
   * @throws {PaginationError} 当参数无效时抛出错误
   */
  static validatePaginationParams(
    page?: number | string,
    pageSize?: number | string
  ): ValidatedPaginationParams {
    // 验证页码
    let validPage: number;
    if (page === undefined || page === null || page === "") {
      validPage = 1;
    } else {
      const parsedPage =
        typeof page === "number" ? page : parseInt(String(page), 10);

      if (isNaN(parsedPage)) {
        throw new PaginationError("页码必须是有效的数字", "INVALID_PAGE");
      }

      if (parsedPage < 1) {
        throw new PaginationError("页码必须大于0", "INVALID_PAGE");
      }

      if (parsedPage > 10000) {
        throw new PaginationError("页码不能超过10000", "INVALID_PAGE");
      }

      validPage = parsedPage;
    }

    // 验证每页数量
    let validPageSize: number;
    if (pageSize === undefined || pageSize === null || pageSize === "") {
      validPageSize = 10;
    } else {
      const parsedPageSize =
        typeof pageSize === "number"
          ? pageSize
          : parseInt(String(pageSize), 10);

      if (isNaN(parsedPageSize)) {
        throw new PaginationError(
          "每页数量必须是有效的数字",
          "INVALID_PAGE_SIZE"
        );
      }

      if (parsedPageSize < 1) {
        throw new PaginationError("每页数量必须大于0", "INVALID_PAGE_SIZE");
      }

      if (parsedPageSize > 100) {
        throw new PaginationError("每页数量不能超过100", "INVALID_PAGE_SIZE");
      }

      validPageSize = parsedPageSize;
    }

    return { page: validPage, pageSize: validPageSize };
  }

  /**
   * 计算分页偏移量
   * @param page 页码
   * @param pageSize 每页数量
   * @returns 偏移量和限制数量
   * @throws {PaginationError} 当参数无效时抛出错误
   */
  static calculateOffset(
    page: number,
    pageSize: number
  ): { skip: number; take: number } {
    try {
      const validParams = this.validatePaginationParams(page, pageSize);

      const skip = (validParams.page - 1) * validParams.pageSize;

      // 检查偏移量是否过大（防止性能问题）
      if (skip > 1000000) {
        throw new PaginationError(
          "偏移量过大，请减少页码或每页数量",
          "OFFSET_TOO_LARGE"
        );
      }

      return {
        skip,
        take: validParams.pageSize,
      };
    } catch (error) {
      if (error instanceof PaginationError) {
        throw error;
      }
      throw new PaginationError(
        `计算偏移量失败: ${error.message}`,
        "CALCULATE_OFFSET_ERROR"
      );
    }
  }

  /**
   * 计算总页数
   * @param totalRecords 总记录数
   * @param pageSize 每页数量
   * @returns 总页数
   * @throws {PaginationError} 当参数无效时抛出错误
   */
  static calculateTotalPages(totalRecords: number, pageSize: number): number {
    // 验证总记录数
    if (typeof totalRecords !== "number" || isNaN(totalRecords)) {
      throw new PaginationError(
        "总记录数必须是有效的数字",
        "INVALID_TOTAL_RECORDS"
      );
    }

    if (totalRecords < 0) {
      throw new PaginationError("总记录数不能为负数", "INVALID_TOTAL_RECORDS");
    }

    // 验证每页数量
    if (typeof pageSize !== "number" || isNaN(pageSize)) {
      throw new PaginationError(
        "每页数量必须是有效的数字",
        "INVALID_PAGE_SIZE"
      );
    }

    if (pageSize <= 0) {
      throw new PaginationError("每页数量必须大于0", "INVALID_PAGE_SIZE");
    }

    if (pageSize > 100) {
      throw new PaginationError("每页数量不能超过100", "INVALID_PAGE_SIZE");
    }

    // 如果总记录数为0，返回0页
    if (totalRecords === 0) {
      return 0;
    }

    return Math.ceil(totalRecords / pageSize);
  }

  /**
   * 创建简化的分页查询方法（向后兼容）
   * @param model Prisma模型对象
   * @param page 页码
   * @param pageSize 每页数量
   * @param whereConditions 查询条件
   * @param orderBy 排序条件
   * @returns 分页查询结果
   */
  static async simplePagedQuery<T = any>(
    model: any,
    page: number = 1,
    pageSize: number = 10,
    whereConditions: any = {},
    orderBy: any[] = [{ createdTime: "desc" }]
  ): Promise<PaginationResult<T>> {
    return this.executePagedQuery<T>(model, whereConditions, {
      showPagination: true,
      page,
      pageSize,
      orderBy,
    });
  }

  /**
   * 获取所有数据（不分页）
   * @param model Prisma模型对象
   * @param whereConditions 查询条件
   * @param orderBy 排序条件
   * @returns 所有数据
   */
  static async getAllData<T = any>(
    model: any,
    whereConditions: any = {},
    orderBy: any[] = [{ createdTime: "desc" }]
  ): Promise<T[]> {
    const result = await this.executePagedQuery<T>(model, whereConditions, {
      showPagination: false,
      orderBy,
    });
    return result.data;
  }
}

