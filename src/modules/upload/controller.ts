import { JWT } from "@/jwt";
import type { Request, Response } from "express";
import { inject } from "inversify"; // 装饰器 用于依赖注入
import { controller, httpPost as Post } from "inversify-express-utils";
import { UploadService } from "./services";

/**
 * @swagger
 * tags:
 *   name: Upload
 *   description: 文件上传相关接口
 */
@controller("/upload")
export class Upload {
  constructor(
    @inject(UploadService) private readonly UploadService: UploadService
  ) {}

  /**
   * @swagger
   * /upload/avatar:
   *   post:
   *     summary: 上传头像到本地
   *     tags: [Upload]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               avatar:
   *                 type: string
   *                 format: binary
   *                 description: 头像文件
   *     responses:
   *       200:
   *         description: 头像上传成功
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 code:
   *                   type: number
   *                   example: 200
   *                 message:
   *                   type: string
   *                   example: "上传成功"
   *                 data:
   *                   type: object
   *                   properties:
   *                     url:
   *                       type: string
   *                       description: 头像访问地址
   *                     filename:
   *                       type: string
   *                       description: 文件名
   *       400:
   *         description: 请求参数错误
   *       401:
   *         description: 未授权
   *       413:
   *         description: 文件过大
   */
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

  /**
   * @swagger
   * /upload/avatar/oss:
   *   post:
   *     summary: 上传头像到OSS
   *     description: 将头像文件上传到阿里云OSS存储
   *     tags: [Upload]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               avatar:
   *                 type: string
   *                 format: binary
   *                 description: 头像文件
   *     responses:
   *       200:
   *         description: 头像上传成功
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 code:
   *                   type: number
   *                   example: 200
   *                 message:
   *                   type: string
   *                   example: "上传成功"
   *                 data:
   *                   type: object
   *                   properties:
   *                     url:
   *                       type: string
   *                       description: OSS访问地址
   *                     filename:
   *                       type: string
   *                       description: 文件名
   *       400:
   *         description: 请求参数错误
   *       401:
   *         description: 未授权
   *       413:
   *         description: 文件过大
   *       500:
   *         description: OSS上传失败
   */
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

  /**
   * @swagger
   * /upload/file/oss:
   *   post:
   *     summary: 上传文件到OSS
   *     description: 将文件上传到阿里云OSS存储，支持指定文件夹
   *     tags: [Upload]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               file:
   *                 type: string
   *                 format: binary
   *                 description: 要上传的文件
   *               folder:
   *                 type: string
   *                 description: OSS存储文件夹名称
   *                 default: "files"
   *     responses:
   *       200:
   *         description: 文件上传成功
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 code:
   *                   type: number
   *                   example: 200
   *                 message:
   *                   type: string
   *                   example: "上传成功"
   *                 data:
   *                   type: object
   *                   properties:
   *                     url:
   *                       type: string
   *                       description: OSS访问地址
   *                     filename:
   *                       type: string
   *                       description: 文件名
   *                     fileSize:
   *                       type: number
   *                       description: 文件大小（字节）
   *                     mimeType:
   *                       type: string
   *                       description: 文件MIME类型
   *       400:
   *         description: 请求参数错误
   *       401:
   *         description: 未授权
   *       413:
   *         description: 文件过大
   *       500:
   *         description: OSS上传失败
   */
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

  /**
   * @swagger
   * /upload/file:
   *   post:
   *     summary: 上传文件到本地
   *     description: 将文件上传到本地服务器存储
   *     tags: [Upload]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               file:
   *                 type: string
   *                 format: binary
   *                 description: 要上传的文件
   *     responses:
   *       200:
   *         description: 文件上传成功
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 code:
   *                   type: number
   *                   example: 200
   *                 message:
   *                   type: string
   *                   example: "文件上传成功"
   *                 data:
   *                   type: object
   *                   properties:
   *                     fileUrl:
   *                       type: string
   *                       description: 文件访问地址
   *                       example: "http://localhost:3000/uploads/filename.jpg"
   *                     fileName:
   *                       type: string
   *                       description: 服务器保存的文件名
   *                     fileSize:
   *                       type: number
   *                       description: 文件大小（字节）
   *                     mimeType:
   *                       type: string
   *                       description: 文件MIME类型
   *                     originalName:
   *                       type: string
   *                       description: 原始文件名
   *       400:
   *         description: 请求参数错误
   *       401:
   *         description: 未授权
   *       413:
   *         description: 文件过大
   *       500:
   *         description: 文件上传失败
   */
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
