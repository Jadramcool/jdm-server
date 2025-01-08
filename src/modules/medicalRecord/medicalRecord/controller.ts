import { JWT } from "@/jwt";
import { UtilService } from "@/utils/utils";
import type { Request, Response } from "express";
import { inject } from "inversify"; // 装饰器 用于依赖注入
import {
  controller,
  httpGet as Get,
  httpPost as Post,
  httpPut as Put,
} from "inversify-express-utils";
import { MedicalRecordService } from "./services";

@controller("/medicalRecord")
export class MedicalRecord {
  constructor(
    @inject(MedicalRecordService)
    private readonly MedicalRecordService: MedicalRecordService,
    @inject(UtilService)
    private readonly UtilService: UtilService
  ) {}

  @Get("/list", JWT.authenticateJwt())
  public async getMedicalRecordList(req: Request, res: Response) {
    const config = this.UtilService.parseQueryParams(req);
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.MedicalRecordService.getMedicalRecordList(config);
    res.sendResult(data, code, message, errMsg);
  }

  // 新建病例
  @Post("/create", JWT.authenticateJwt())
  public async createMedicalRecord(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.MedicalRecordService.createMedicalRecord(
      req.body,
      req.user
    );
    res.sendResult(data, code, message, errMsg);
  }

  @Put("/update", JWT.authenticateJwt())
  public async updateMedicalRecord(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.MedicalRecordService.updateMedicalRecord(
      req.body,
      req.user
    );
    res.sendResult(data, code, message, errMsg);
  }

  @Get("/detail/:id", JWT.authenticateJwt())
  public async getMedicalRecord(req: Request, res: Response) {
    const id = Number(req.params.id);
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.MedicalRecordService.getMedicalRecord(id);
    res.sendResult(data, code, message, errMsg);
  }
}
