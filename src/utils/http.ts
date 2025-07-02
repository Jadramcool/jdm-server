import { createAlova } from "alova";
import adapterFetch from "alova/fetch";
import { injectable } from "inversify";

@injectable()
export class HttpService {
  private readonly alovaInstance: any;

  constructor() {
    this.alovaInstance = createAlova({
      requestAdapter: adapterFetch(),
      responded: async (response) => {
        const data = await response.json();
        return data;
      },
      // beforeRequest(method) {
      //   console.log(method.config);
      // },
    });
  }

  /**
   * 创建通用请求方法
   * @param config 请求配置
   */
  createRequest<T>(config: {
    url: string;
    method: "GET" | "POST" | "PUT" | "DELETE";
    headers?: Record<string, string>;
    params?: Record<string, any>;
    data?: any;
  }): Promise<T> {
    const { url, method, headers = {}, params = {}, data } = config;
    if (method === "GET") {
      return this.alovaInstance.Get(url, {
        headers,
        params,
      });
    }
    if (method === "POST") {
      return this.alovaInstance.Post(url, data, {
        headers,
      });
    }
    if (method === "PUT") {
      return this.alovaInstance.Put(url, data, {
        headers,
      });
    }
    if (method === "DELETE") {
      return this.alovaInstance.Delete(url, {
        headers,
      });
    }
  }
}
