/*
 * @Author: Jay
 * @Date: 2024-05-11 17:56:25
 * @LastEditors: jdm
 * @LastEditTime: 2024-08-21 15:42:05
 * @FilePath: \APP\src\modules\sys\user\controller.ts
 * @Description:
 *
 */
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
import { DoctorService } from "./services";

@controller("/hospital/doctor")
export class Doctor {
  constructor(
    @inject(DoctorService)
    private readonly DoctorService: DoctorService,
    @inject(UtilService)
    private readonly UtilService: UtilService
  ) {}

  @Get("/list", JWT.authenticateJwt())
  public async getDoctorList(req: Request, res: Response) {
    // 将query的key-value value的json参数转换为对象
    const query: any = req.query;
    const config = this.UtilService.parseQueryParams(req);
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.DoctorService.getDoctorList(config);
    res.sendResult(data, code, message, errMsg);
  }

  @Post("/create", JWT.authenticateJwt())
  public async createDoctor(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.DoctorService.createDoctor(req.body);
    res.sendResult(data, code, message, errMsg);
  }

  @Put("/update", JWT.authenticateJwt())
  public async updateDoctor(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.DoctorService.updateDoctor(req.body);
    res.sendResult(data, code, message, errMsg);
  }

  @Delete("/delete/:id", JWT.authenticateJwt())
  public async deleteDoctor(req: Request, res: Response) {
    const doctorId = Number(req.params.id);
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.DoctorService.deleteDoctor(doctorId);
    res.sendResult(data, code, message, errMsg);
  }

  // 批量删除用户
  @Delete("/batchDelete", JWT.authenticateJwt())
  public async batchDeleteDoctor(req: Request, res: Response) {
    const ids = req.body?.ids ? req.body.ids : [];

    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.DoctorService.deleteDoctor(ids);
    res.sendResult(data, code, message, errMsg);
  }

  @Get("/detail/:id", JWT.authenticateJwt())
  public async getDoctor(req: Request, res: Response) {
    const doctorId = Number(req.params.id);
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.DoctorService.getDoctor(doctorId);
    res.sendResult(data, code, message, errMsg);
  }

  // 启用/禁用用户
  @Put("/status/:id", JWT.authenticateJwt())
  public async updateDoctorStatus(req: Request, res: Response) {
    const userId = Number(req.params.id);
    const status = Number(req.body.status);
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.DoctorService.updateDoctorStatus(userId, status);
    res.sendResult(data, code, message, errMsg);
  }
}
