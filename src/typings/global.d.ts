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
}

export {};
