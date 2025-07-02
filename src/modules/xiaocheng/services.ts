import { HttpService } from "@/utils/http";
import { JWT } from "@jwt/index";
import { inject, injectable } from "inversify";
import { PrismaDB } from "../../db";
import { XiaoChengLoginForm } from "./typings";

@injectable()
export class XiaoChengService {
  private readonly baseURL = "https://teamdo.vxiaocheng.com";
  constructor(
    @inject(PrismaDB) private readonly PrismaDB: PrismaDB,
    @inject(JWT) private readonly JWT: JWT,
    @inject(HttpService)
    private readonly HttpService: HttpService
  ) {}
  async xiaochengLogin(content: XiaoChengLoginForm) {
    const request = this.HttpService.createRequest<{
      code: number;
      data: any;
      message: string;
    }>({
      url: `${this.baseURL}/iteamdo/user/logined_user/`,
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      data: content,
    });

    try {
      const response: any = await request;
      return this.handleResponse(response);
    } catch (error: any) {
      this.handleError(error);
    }
  }

  async xiaochengProjects(content: any, token: string) {
    const params = {};
    Object.entries(content).forEach(([key, value]: any) => {
      params[key] = encodeURIComponent(value);
    });
    const request = () =>
      this.HttpService.createRequest<{
        code: number;
        data: any;
        message: string;
      }>({
        url: `${this.baseURL}/iteamdo/project/projects/`,
        method: "GET",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `${token}`,
        },
        params,
      });

    try {
      const response: any = await request();
      return this.handleResponse(response);
    } catch (error: any) {
      this.handleError(error);
    }
  }

  async xiaochengJoinedTasks(content: any, token: string) {
    const params = {};
    Object.entries(content).forEach(([key, value]: any) => {
      params[key] = encodeURIComponent(value);
    });
    const request = () =>
      this.HttpService.createRequest<{
        code: number;
        data: any;
        message: string;
      }>({
        url: `${this.baseURL}/iteamdo/user/joined_tasks/`,
        method: "GET",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `${token}`,
        },
        params,
      });

    try {
      const response: any = await request();
      return this.handleResponse(response);
    } catch (error: any) {
      this.handleError(error);
    }
  }

  async xiaochengProjectTasks(content: any, token: string) {
    const params = {};
    Object.entries(content).forEach(([key, value]: any) => {
      params[key] = encodeURIComponent(value);
    });
    const request = () =>
      this.HttpService.createRequest<{
        code: number;
        data: any;
        message: string;
      }>({
        url: `${this.baseURL}/iteamdo/project/lane/tasks/`,
        method: "GET",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `${token}`,
        },
        params,
      });

    try {
      const response: any = await request();
      return this.handleResponse(response);
    } catch (error: any) {
      this.handleError(error);
    }
  }

  private handleResponse(response: any) {
    if (response.code !== 200) {
      throw new Error(`[${response.code}] ${response.message}`);
    }
    return {
      data: response.data,
      code: response.code,
      message: response.state,
    };
  }

  private handleError(error: any) {
    console.error("[ThirdParty Error]", {
      url: error.request?.url,
      status: error.response?.status,
      message: error.message,
    });
    throw new Error("第三方服务调用失败");
  }
}
