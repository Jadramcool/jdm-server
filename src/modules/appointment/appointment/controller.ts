import { JWT } from "@/jwt";
import { UtilService } from "@/utils/utils";
import type { Request, Response } from "express";
import { inject } from "inversify"; // 装饰器 用于依赖注入
import {
  controller,
  httpGet as Get,
  httpPost as Post,
} from "inversify-express-utils";
import { AppointmentService } from "./services";

@controller("/appointment")
export class Appointment {
  constructor(
    @inject(AppointmentService)
    private readonly AppointmentService: AppointmentService,
    @inject(UtilService)
    private readonly UtilService: UtilService
  ) {}

  @Get("/list", JWT.authenticateJwt())
  public async getAppointmentList(req: Request, res: Response) {
    const config = this.UtilService.parseQueryParams(req);
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.AppointmentService.getAppointmentList(config);
    res.sendResult(data, code, message, errMsg);
  }

  // 挂号
  @Post("/registered", JWT.authenticateJwt())
  public async registered(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.AppointmentService.registered(req.body, req.user);
    res.sendResult(data, code, message, errMsg);
  }

  // 同意日期，批量设置医生
  @Post("/cancel/:id", JWT.authenticateJwt())
  public async cancelAppointment(req: Request, res: Response) {
    const appointmentId = Number(req.params.id);
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.AppointmentService.cancelAppointment(appointmentId);
    res.sendResult(data, code, message, errMsg);
  }

  // 医生当日当前时间段挂号列表
  @Get("/doctorAppointmentList", JWT.authenticateJwt())
  public async getDoctorAppointmentList(req: Request, res: Response) {
    const config = this.UtilService.parseQueryParams(req);
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.AppointmentService.getDoctorAppointmentList(config);
    res.sendResult(data, code, message, errMsg);
  }

  @Post("/call/:id", JWT.authenticateJwt())
  public async call(req: Request, res: Response) {
    const appointmentId = Number(req.params.id);
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.AppointmentService.call(appointmentId);
    res.sendResult(data, code, message, errMsg);
  }

  @Post("/finish/:id", JWT.authenticateJwt())
  public async finish(req: Request, res: Response) {
    const appointmentId = Number(req.params.id);
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.AppointmentService.finish(appointmentId);
    res.sendResult(data, code, message, errMsg);
  }

  @Get("/detail/:id", JWT.authenticateJwt())
  public async getAppointment(req: Request, res: Response) {
    const appointmentId = Number(req.params.id);
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.AppointmentService.getAppointment(appointmentId);
    res.sendResult(data, code, message, errMsg);
  }
}
