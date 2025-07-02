import { JWT } from "@/jwt";
import type { Request, Response } from "express";
import { inject } from "inversify"; // 装饰器 用于依赖注入
import { controller, httpPost as Post } from "inversify-express-utils";
import { UploadService } from "./services";

@controller("/upload")
export class Upload {
  constructor(
    @inject(UploadService) private readonly UploadService: UploadService
  ) {}

  @Post("/avatar", JWT.authenticateJwt())
  public async uploadAvatar(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.UploadService.uploadAvatar(req);
    res.sendResult(data, code, message, errMsg);
  }

  @Post("/avatar/oss", JWT.authenticateJwt())
  public async uploadAvatarToOSS(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.UploadService.uploadAvatarToOSS(req);
    res.sendResult(data, code, message, errMsg);
  }

  @Post("/file/oss", JWT.authenticateJwt())
  public async uploadFileToOSS(req: Request, res: Response) {
    const folder = req.body.folder || "files"; // 可以通过请求体指定文件夹
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.UploadService.uploadFileToOSS(req, folder);
    res.sendResult(data, code, message, errMsg);
  }

  @Post("/file", JWT.authenticateJwt())
  public async uploadFile(req: Request, res: Response) {
    try {
      const file = await this.UploadService.commonUpload(req);
      const baseUrl = process.env.BASE_URL || "http://localhost:3000";
      const fileUrl = `${baseUrl}/uploads/${file.filename}`;

      res.sendResult(
        {
          fileUrl,
          fileName: file.filename,
          fileSize: file.size,
          mimeType: file.mimetype,
          originalName: file.originalname,
        },
        200,
        "文件上传成功"
      );
    } catch (err: any) {
      res.sendResult(null, 500, "文件上传失败", err.message);
    }
  }
}
