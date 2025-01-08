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
import { PatientService } from "./services";

@controller("/hospital/patient")
export class Patient {
  constructor(
    @inject(PatientService)
    private readonly PatientService: PatientService,
    @inject(UtilService)
    private readonly UtilService: UtilService
  ) {}

  @Get("/list", JWT.authenticateJwt())
  public async getPatientList(req: Request, res: Response) {
    // 将query的key-value value的json参数转换为对象
    const config = this.UtilService.parseQueryParams(req);
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.PatientService.getPatientList(config);
    res.sendResult(data, code, message, errMsg);
  }

  @Post("/create", JWT.authenticateJwt())
  public async createPatient(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.PatientService.createPatient(req.body);
    res.sendResult(data, code, message, errMsg);
  }

  @Put("/update", JWT.authenticateJwt())
  public async updatePatient(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.PatientService.updatePatient(req.body);
    res.sendResult(data, code, message, errMsg);
  }

  @Delete("/delete/:id", JWT.authenticateJwt())
  public async deletePatient(req: Request, res: Response) {
    const patientId = Number(req.params.id);
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.PatientService.deletePatient(patientId);
    res.sendResult(data, code, message, errMsg);
  }

  // 批量删除用户
  @Delete("/batchDelete", JWT.authenticateJwt())
  public async batchDeletePatient(req: Request, res: Response) {
    const ids = req.body?.ids ? req.body.ids : [];

    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.PatientService.deletePatient(ids);
    res.sendResult(data, code, message, errMsg);
  }

  @Get("/detail/:id", JWT.authenticateJwt())
  public async getPatient(req: Request, res: Response) {
    const patientId = Number(req.params.id);
    const query = req.query;
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.PatientService.getPatient(patientId, query);
    res.sendResult(data, code, message, errMsg);
  }

  // 启用/禁用用户
  @Put("/status/:id", JWT.authenticateJwt())
  public async updatePatientStatus(req: Request, res: Response) {
    const userId = Number(req.params.id);
    const status = Number(req.body.status);
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.PatientService.updatePatientStatus(userId, status);
    res.sendResult(data, code, message, errMsg);
  }
}
