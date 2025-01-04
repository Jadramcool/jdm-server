import { JWT } from "@/jwt";
import { UtilService } from "@/utils/utils";
import type { Request, Response } from "express";
import { inject } from "inversify"; // 装饰器 用于依赖注入
import { controller, httpGet as Get } from "inversify-express-utils";
import { MyScheduleService } from "./services";

@controller("/schedule/mySchedule")
export class MySchedule {
  constructor(
    @inject(MyScheduleService)
    private readonly MyScheduleService: MyScheduleService,
    @inject(UtilService)
    private readonly UtilService: UtilService
  ) {}

  @Get("/list", JWT.authenticateJwt())
  public async getScheduleList(req: Request, res: Response) {
    const config = this.UtilService.parseQueryParams(req);
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.MyScheduleService.getScheduleList(config);
    res.sendResult(data, code, message, errMsg);
  }

  // @Post("/create", JWT.authenticateJwt())
  // public async createSchedule(req: Request, res: Response) {
  //   let {
  //     data = null,
  //     code = 200,
  //     message = "",
  //     errMsg = "",
  //   }: Jres = await this.MyScheduleService.createSchedule(req.body);
  //   res.sendResult(data, code, message, errMsg);
  // }

  // 同意日期，批量设置医生
  // @Post("/updateByDate", JWT.authenticateJwt())
  // public async updateScheduleByDate(req: Request, res: Response) {
  //   let {
  //     data = null,
  //     code = 200,
  //     message = "",
  //     errMsg = "",
  //   }: Jres = await this.MyScheduleService.updateScheduleByDate(req.body);
  //   res.sendResult(data, code, message, errMsg);
  // }

  // @Put("/update", JWT.authenticateJwt())
  // public async updateSchedule(req: Request, res: Response) {
  //   let {
  //     data = null,
  //     code = 200,
  //     message = "",
  //     errMsg = "",
  //   }: Jres = await this.MyScheduleService.updateSchedule(req.body);
  //   res.sendResult(data, code, message, errMsg);
  // }

  // @Delete("/delete/:id", JWT.authenticateJwt())
  // public async deleteSchedule(req: Request, res: Response) {
  //   const roleId = Number(req.params.id);
  //   let {
  //     data = null,
  //     code = 200,
  //     message = "",
  //     errMsg = "",
  //   }: Jres = await this.MyScheduleService.deleteSchedule(roleId);
  //   res.sendResult(data, code, message, errMsg);
  // }

  // 批量删除用户
  // @Delete("/batchDelete", JWT.authenticateJwt())
  // public async batchDeleteUser(req: Request, res: Response) {
  //   const ids = req.body?.ids ? req.body.ids : [];

  //   let {
  //     data = null,
  //     code = 200,
  //     message = "",
  //     errMsg = "",
  //   }: Jres = await this.MyScheduleService.deleteSchedule(ids);
  //   res.sendResult(data, code, message, errMsg);
  // }

  // @Get("/detail/:id", JWT.authenticateJwt())
  // public async getRole(req: Request, res: Response) {
  //   const roleId = Number(req.params.id);
  //   let {
  //     data = null,
  //     code = 200,
  //     message = "",
  //     errMsg = "",
  //   }: Jres = await this.MyScheduleService.getRole(roleId);
  //   res.sendResult(data, code, message, errMsg);
  // }
}
