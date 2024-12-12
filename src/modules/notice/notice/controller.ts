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
  httpDelete as Delete,
  httpGet as Get,
  httpPost as Post,
  httpPut as Put,
  controller,
} from "inversify-express-utils";
import { NoticeService } from "./services";

@controller("/notice")
export class Notice {
  constructor(
    @inject(NoticeService)
    private readonly NoticeService: NoticeService,
    @inject(UtilService)
    private readonly UtilService: UtilService
  ) {}

  @Get("/list", JWT.authenticateJwt())
  public async getNoticeList(req: Request, res: Response) {
    // 将query的key-value value的json参数转换为对象
    const config = this.UtilService.parseQueryParams(req);
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.NoticeService.getNoticeList(config);
    res.sendResult(data, code, message, errMsg);
  }

  @Get("/detail/:id", JWT.authenticateJwt())
  public async getNoticeDetail(req: Request, res: Response) {
    const noticeId = Number(req.params.id);
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.NoticeService.getNoticeDetail(noticeId);
    res.sendResult(data, code, message, errMsg);
  }

  @Post("/create", JWT.authenticateJwt())
  public async createNotice(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.NoticeService.createNotice(req.body, req.user);
    res.sendResult(data, code, message, errMsg);
  }

  @Put("/update", JWT.authenticateJwt())
  public async updateNotice(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.NoticeService.updateNotice(req.body, req.user);
    res.sendResult(data, code, message, errMsg);
  }

  @Delete("/delete/:id", JWT.authenticateJwt())
  public async deleteNotice(req: Request, res: Response) {
    const roleId = Number(req.params.id);
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.NoticeService.deleteNotice(roleId);
    res.sendResult(data, code, message, errMsg);
  }
  // 发送公告
  @Post("/send", JWT.authenticateJwt())
  public async sendNotice(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.NoticeService.sendNotice(req.body);
    res.sendResult(data, code, message, errMsg);
  }

  // 获取用户公告列表
  @Get("/userNotice", JWT.authenticateJwt())
  public async getUserNoticeList(req: Request, res: Response) {
    // 将query的key-value value的json参数转换为对象
    const config = this.UtilService.parseQueryParams(req);
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.NoticeService.getUserNoticeList(config);
    res.sendResult(data, code, message, errMsg);
  }

  // 用户阅读公告
  @Put("/read", JWT.authenticateJwt())
  public async userReadNotice(req: Request, res: Response) {
    console.log(req.body);
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.NoticeService.userReadNotice(req.body, req.user);
    res.sendResult(data, code, message, errMsg);
  }
}
