import { JWT } from "@/jwt";
import { UtilService } from "@/utils/utils";
import type { Request, Response } from "express";
import { inject } from "inversify"; // 装饰器 用于依赖注入
import {
  controller,
  httpGet as Get,
  httpPut as Put,
} from "inversify-express-utils";
import { XiaoChengService } from "./services";

@controller("/xiaocheng")
export class XiaoCheng {
  constructor(
    @inject(XiaoChengService)
    private readonly XiaoChengService: XiaoChengService,
    @inject(UtilService)
    private readonly UtilService: UtilService
  ) {}

  @Put("/login", JWT.authenticateJwt())
  public async xiaochengLogin(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.XiaoChengService.xiaochengLogin(req.body);
    res.sendResult(data, code, message, errMsg);
  }

  @Get("/projects")
  public async xiaochengProjects(req: Request, res: Response) {
    const token: string = req.query["token"] as string;
    delete req.query["token"];
    if (!token) {
      res.sendResult(null, 400, "token不存在");
      return;
    }
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.XiaoChengService.xiaochengProjects(req.query, token);
    res.sendResult(data, code, message, errMsg);
  }

  @Get("/joined_tasks")
  public async xiaochengJoinedTasks(req: Request, res: Response) {
    const token: string = req.query["token"] as string;
    delete req.query["token"];
    if (!token) {
      res.sendResult(null, 400, "token不存在");
      return;
    }
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.XiaoChengService.xiaochengJoinedTasks(
      req.query,
      token
    );
    res.sendResult(data, code, message, errMsg);
  }

  @Get("/tasks")
  public async xiaochengProjectTasks(req: Request, res: Response) {
    const token: string = req.query["token"] as string;
    delete req.query["token"];
    if (!token) {
      res.sendResult(null, 400, "token不存在");
      return;
    }
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.XiaoChengService.xiaochengProjectTasks(
      req.query,
      token
    );
    res.sendResult(data, code, message, errMsg);
  }
}
