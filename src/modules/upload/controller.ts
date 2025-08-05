import { JWT } from "@/jwt";
import type { Request, Response } from "express";
import * as fs from "fs";
import { inject } from "inversify"; // 装饰器 用于依赖注入
import { controller, httpPost as Post } from "inversify-express-utils";
import multer from "multer";
import * as path from "path";
import { UploadService } from "./services";

/**
 * @swagger
 * components:
 *   schemas:
 *     UploadResult:
 *       type: object
 *       properties:
 *         fileUrl:
 *           type: string
 *           description: 文件访问URL
 *         fileName:
 *           type: string
 *           description: 文件名
 *         fileSize:
 *           type: number
 *           description: 文件大小（字节）
 *         mimeType:
 *           type: string
 *           description: 文件MIME类型
 *         originalName:
 *           type: string
 *           description: 原始文件名
 *         uploadTime:
 *           type: string
 *           format: date-time
 *           description: 上传时间
 *     BatchUploadResult:
 *       type: object
 *       properties:
 *         successFiles:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/UploadResult'
 *           description: 成功上传的文件列表
 *         failedFiles:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               fileName:
 *                 type: string
 *               error:
 *                 type: string
 *           description: 上传失败的文件列表
 *         totalCount:
 *           type: number
 *           description: 总文件数
 *         successCount:
 *           type: number
 *           description: 成功上传数
 *         failedCount:
 *           type: number
 *           description: 失败上传数
 *     UnifiedUploadResult:
 *       type: object
 *       properties:
 *         local:
 *           $ref: '#/components/schemas/UploadResult'
 *           description: 本地上传结果
 *         oss:
 *           $ref: '#/components/schemas/UploadResult'
 *           description: OSS上传结果
 *         target:
 *           type: string
 *           enum: [local, oss, both]
 *           description: 实际上传目标
 *     ApiResponse:
 *       type: object
 *       properties:
 *         data:
 *           description: 响应数据
 *         code:
 *           type: number
 *           description: 状态码
 *         message:
 *           type: string
 *           description: 响应消息
 *         errMsg:
 *           type: string
 *           description: 错误信息
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

@controller("/upload")
export class Upload {
  constructor(
    @inject(UploadService) private readonly UploadService: UploadService
  ) {}

  /**
   * @swagger
   * /upload:
   *   post:
   *     tags:
   *       - 文件上传
   *     summary: 统一文件上传接口
   *     description: 支持多种文件类型预设和上传目标配置的统一文件上传接口
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
   *               fileType:
   *                 type: string
   *                 enum: [image, document, audio, video, archive, avatar, all]
   *                 default: all
   *                 description: 文件类型预设
   *               target:
   *                 type: string
   *                 enum: [local, oss, both]
   *                 default: local
   *                 description: 上传目标
   *               folder:
   *                 type: string
   *                 description: 存储文件夹名称
   *                 default: files
   *               maxSize:
   *                 type: number
   *                 description: 自定义最大文件大小（字节）
   *               allowedMimeTypes:
   *                 type: array
   *                 items:
   *                   type: string
   *                 description: 自定义允许的MIME类型
   *               allowedExtensions:
   *                 type: array
   *                 items:
   *                   type: string
   *                 description: 自定义允许的文件扩展名
   *             required:
   *               - file
   *     responses:
   *       200:
   *         description: 文件上传成功
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/UnifiedUploadResult'
   *       400:
   *         description: 请求参数错误
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiResponse'
   *       401:
   *         description: 未授权
   *       413:
   *         description: 文件大小超过限制
   *       415:
   *         description: 不支持的文件类型
   *       500:
   *         description: 服务器内部错误
   */
  @Post("/", JWT.authenticateJwt())
  public async unifiedUpload(req: Request, res: Response) {
    try {
      // 创建临时multer配置用于处理文件上传
      const tempUpload = multer({
        storage: multer.diskStorage({
          destination: (req: any, file: any, cb: any) => {
            const uploadDir = "./uploads/";
            if (!fs.existsSync(uploadDir)) {
              fs.mkdirSync(uploadDir, { recursive: true });
            }
            cb(null, uploadDir);
          },
          filename: (req: any, file: any, cb: any) => {
            const timestamp = Date.now();
            const randomStr = Math.random().toString(36).substring(2, 8);
            const ext = path.extname(file.originalname);
            const baseName = path.basename(file.originalname, ext);
            const fileName = `${timestamp}_${randomStr}_${baseName}${ext}`;
            cb(null, fileName);
          },
        }),
        limits: {
          fileSize: 100 * 1024 * 1024, // 临时设置为100MB，后续会在服务层进行具体验证
        },
      });

      // 先处理文件上传，获取表单数据
      await new Promise<void>((resolve, reject) => {
        tempUpload.single("file")(req, res, (err: any) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });

      // 从req.body获取表单参数（multer处理后的数据）
      const {
        fileType = "all",
        target = "local",
        folder = "files",
        maxSize,
        allowedMimeTypes,
        allowedExtensions,
      } = req.body;

      // 解析JSON字符串参数（前端通过JSON.stringify传递的数组参数）
      let parsedAllowedMimeTypes = allowedMimeTypes;
      let parsedAllowedExtensions = allowedExtensions;

      try {
        if (typeof allowedMimeTypes === "string") {
          parsedAllowedMimeTypes = JSON.parse(allowedMimeTypes);
        }
      } catch (e) {
        // 如果解析失败，保持原值
      }

      try {
        if (typeof allowedExtensions === "string") {
          parsedAllowedExtensions = JSON.parse(allowedExtensions);
        }
      } catch (e) {
        // 如果解析失败，保持原值
      }

      const options = {
        fileType: fileType as any,
        target: target as any,
        folder,
        customConfig: {
          ...(maxSize && { maxSize: parseInt(maxSize) }),
          ...(parsedAllowedMimeTypes && {
            allowedMimeTypes: Array.isArray(parsedAllowedMimeTypes)
              ? parsedAllowedMimeTypes
              : [parsedAllowedMimeTypes],
          }),
          ...(parsedAllowedExtensions && {
            allowedExtensions: Array.isArray(parsedAllowedExtensions)
              ? parsedAllowedExtensions
              : [parsedAllowedExtensions],
          }),
        },
      };

      const result = await this.UploadService.unifiedUpload(req, options);
      res.sendResult(result.data, result.code, result.message);
    } catch (err: any) {
      console.error("统一文件上传失败:", err);
      res.sendResult(
        null,
        err.code || 500,
        err.message || "文件上传失败",
        err.error || "UNIFIED_UPLOAD_ERROR"
      );
    }
  }

  /**
   * @swagger
   * /upload/validate:
   *   post:
   *     tags:
   *       - 文件上传
   *     summary: 文件预验证
   *     description: 在实际上传前验证文件的类型和大小是否符合要求
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               fileName:
   *                 type: string
   *                 description: 文件名
   *                 example: "document.pdf"
   *               fileSize:
   *                 type: number
   *                 description: 文件大小（字节）
   *                 example: 1048576
   *               mimeType:
   *                 type: string
   *                 description: 文件MIME类型
   *                 example: "application/pdf"
   *             required:
   *               - fileName
   *               - fileSize
   *               - mimeType
   *     responses:
   *       200:
   *         description: 文件验证通过
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       type: object
   *                       properties:
   *                         valid:
   *                           type: boolean
   *                           example: true
   *       400:
   *         description: 文件验证失败或参数错误
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiResponse'
   *       401:
   *         description: 未授权
   *       500:
   *         description: 服务器内部错误
   */
  @Post("/validate", JWT.authenticateJwt())
  public async validateFile(req: Request, res: Response) {
    try {
      const { fileName, fileSize, mimeType } = req.body;

      if (!fileName || !fileSize || !mimeType) {
        return res.sendResult(
          null,
          400,
          "缺少必要的文件信息",
          "MISSING_FILE_INFO"
        );
      }

      // 验证文件大小（10MB限制）
      const maxSize = 10 * 1024 * 1024;
      if (fileSize > maxSize) {
        return res.sendResult(
          null,
          400,
          `文件大小超过限制，最大允许 ${(maxSize / 1024 / 1024).toFixed(1)}MB`,
          "FILE_SIZE_EXCEEDED"
        );
      }

      // 验证文件类型
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "application/pdf",
        "text/plain",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ];

      if (!allowedTypes.includes(mimeType)) {
        return res.sendResult(
          null,
          400,
          `不支持的文件类型: ${mimeType}`,
          "UNSUPPORTED_FILE_TYPE"
        );
      }

      res.sendResult({ valid: true }, 200, "文件验证通过");
    } catch (err: any) {
      console.error("文件验证失败:", err);
      res.sendResult(null, 500, "文件验证失败", "FILE_VALIDATION_ERROR");
    }
  }
}
