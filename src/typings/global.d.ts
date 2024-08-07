declare global {
  namespace Express {
    interface User {
      id: number;
      email: string;
      name: string;
    }

    interface Response {
      sendResult(
        data: any,
        code: number,
        message?: string,
        errMsg?: string
      ): void;
    }
  }

  // 返回结果
  interface Jres {
    data: any;
    code?: number;
    message?: string;
    errMsg?: string;
  }

  interface Filters {
    [key: string]: string | number | boolean | undefined | object;
    // 具体的过滤条件键值对
  }

  interface WithOptions {
    [key: string]: string | number | boolean | undefined;
  }

  interface Pagination {
    // 页码
    page: number | string;
    // 每页数量
    pageSize: number | string;
  }

  interface ReqListConfig {
    filters?: Filters;
    options?: WithOptions;
    // pageInfo?: PageInfo;
    // page: string | number;
    pagination: Pagination;
    [key: string]: string | number;
  }
}

export {};
