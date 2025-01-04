import { JWT } from "@/jwt";
import { UtilService } from "@/utils/utils";
import type { Request, Response } from "express";
import { inject } from "inversify"; // 装饰器 用于依赖注入
import {
  controller,
  httpDelete as Delete,
  httpGet as Get,
  httpPost as Post,
  httpPut as Put,
} from "inversify-express-utils";
import { DoctorScheduleService } from "./services";

@controller("/schedule/doctorSchedule")
export class DoctorSchedule {
  constructor(
    @inject(DoctorScheduleService)
    private readonly DoctorScheduleService: DoctorScheduleService,
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
    }: Jres = await this.DoctorScheduleService.getScheduleList(config);
    res.sendResult(data, code, message, errMsg);
  }

  @Post("/create", JWT.authenticateJwt())
  public async createSchedule(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.DoctorScheduleService.createSchedule(req.body);
    res.sendResult(data, code, message, errMsg);
  }

  // 同意日期，批量设置医生
  @Post("/updateByDate", JWT.authenticateJwt())
  public async updateScheduleByDate(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.DoctorScheduleService.updateScheduleByDate(req.body);
    res.sendResult(data, code, message, errMsg);
  }

  @Put("/update", JWT.authenticateJwt())
  public async updateSchedule(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.DoctorScheduleService.updateSchedule(req.body);
    res.sendResult(data, code, message, errMsg);
  }

  @Delete("/delete/:id", JWT.authenticateJwt())
  public async deleteSchedule(req: Request, res: Response) {
    const scheduleId = Number(req.params.id);
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.DoctorScheduleService.deleteSchedule(scheduleId);
    res.sendResult(data, code, message, errMsg);
  }

  // 批量删除用户
  @Delete("/batchDelete", JWT.authenticateJwt())
  public async batchDeleteUser(req: Request, res: Response) {
    const ids = req.body?.ids ? req.body.ids : [];

    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.DoctorScheduleService.deleteSchedule(ids);
    res.sendResult(data, code, message, errMsg);
  }

  @Get("/detail/:id", JWT.authenticateJwt())
  public async getSchedule(req: Request, res: Response) {
    const scheduleId = Number(req.params.id);
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.DoctorScheduleService.getSchedule(scheduleId);
    res.sendResult(data, code, message, errMsg);
  }

  // 获取当前的排班信息
  @Get("/current", JWT.authenticateJwt())
  public async getCurrentSchedule(req: Request, res: Response) {
    const config = this.UtilService.parseQueryParams(req);
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.DoctorScheduleService.getCurrentSchedule(config);
    res.sendResult(data, code, message, errMsg);
  }
}
