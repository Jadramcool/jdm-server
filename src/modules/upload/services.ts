import * as dotenv from "dotenv";
import type { Request } from "express";
import fs from "fs";
import { inject, injectable } from "inversify";
import multer from "multer";
import path from "path";
import { PrismaDB } from "../../db";
import { JWT } from "../../jwt";
import {
  AliyunOSSManager,
  createOSSManager,
  validateOSSConfig,
} from "../../utils/aliyun_oss_manager";

@injectable()
export class UploadService {
  private upload: any;
  private ossManager: AliyunOSSManager | null = null;

  constructor(
    @inject(PrismaDB) private readonly prismaDB: PrismaDB,
    @inject(JWT) private readonly jwt: JWT
  ) {
    // 初始化OSS管理器
    this.initOSSManager();
    this.upload = multer({
      storage: multer.diskStorage({
        destination: (req, file, cb) => {
          cb(null, "./uploads/");
        },
        filename: (req, file, cb) => {
          const fileName = req.body.fileName || file.originalname;
          cb(null, `${fileName}`);
        },
      }),
    });
  }

  /**
   * 初始化OSS管理器
   */
  private initOSSManager() {
    // 加载.env.oss文件中的OSS配置
    const ossEnvPath = path.resolve(process.cwd(), ".env.oss");
    if (fs.existsSync(ossEnvPath)) {
      dotenv.config({ path: ossEnvPath });
    }

    const ossConfig = {
      region: process.env.OSS_REGION || "",
      accessKeyId: process.env.OSS_ACCESS_KEY_ID || "",
      accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || "",
      bucket: process.env.OSS_BUCKET_NAME || "",
    };

    if (validateOSSConfig(ossConfig)) {
      this.ossManager = createOSSManager(ossConfig);
      console.log("OSS配置加载成功，OSS上传功能已启用");
    } else {
      console.warn(
        "OSS配置不完整，OSS上传功能将不可用。请检查.env.oss文件中的配置"
      );
    }
  }

  /**
   * 公共文件上传方法
   * @param req
   * @param type  single,array,fields,none,any
   * @param fieldName 文件字段名
   * @param maxCount 最大上传数量
   * @fields 上传多个文件
   */
  public async commonUpload(
    req: Request,
    type: string = "single",
    fieldName: any = "file",
    maxCount: number = 1,
    fields: any = []
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      let uploadFile = null;
      if (type === "single") {
        uploadFile = this.upload[type](fieldName);
      } else if (type === "array") {
        uploadFile = this.upload[type](fieldName, maxCount);
      } else if (type === "fields") {
        uploadFile = this.upload[type](fields);
      } else {
        uploadFile = this.upload[type]();
      }

      uploadFile(req, {}, async (err: any) => {
        if (err) {
          return reject({ code: 400, message: "文件上传失败", error: err });
        }

        resolve(req.file);
      });
    });
  }

  /**
   * OSS文件上传方法
   * @param req
   * @param objectPath OSS中的文件路径
   * @param type 上传类型
   * @param fieldName 文件字段名
   * @param maxCount 最大上传数量
   * @param fields 多文件字段
   */
  public async ossUpload(
    req: Request,
    objectPath?: string,
    type: string = "single",
    fieldName: any = "file",
    maxCount: number = 1,
    fields: any = []
  ): Promise<any> {
    if (!this.ossManager) {
      throw new Error("OSS未配置，无法使用OSS上传功能");
    }

    // 先使用本地上传获取文件
    const file = await this.commonUpload(
      req,
      type,
      fieldName,
      maxCount,
      fields
    );

    if (!file) {
      throw new Error("文件上传失败");
    }

    try {
      // 生成OSS对象路径
      const fileName = file.filename;
      const fileExtension = path.extname(fileName);
      const timestamp = Date.now();
      const finalObjectPath = objectPath || `uploads/${timestamp}_${fileName}`;

      // 上传到OSS
      const localFilePath = path.join("./uploads/", fileName);
      const result = await this.ossManager.uploadFile(
        finalObjectPath,
        localFilePath
      );

      // 删除本地临时文件
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }

      return {
        url: result.url,
        name: result.name,
        size: file.size,
        mimetype: file.mimetype,
        originalname: file.originalname,
      };
    } catch (error) {
      // 如果OSS上传失败，删除本地文件
      const localFilePath = path.join("./uploads/", file.filename);
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }
      throw error;
    }
  }

  /**
   * 上传头像（本地存储）
   * @param req
   */
  public async uploadAvatar(req: Request) {
    try {
      const file = await this.commonUpload(req);
      const baseUrl = process.env.BASE_URL || "http://localhost:3000";
      const fileUrl = `${baseUrl}/uploads/${file.filename}`;

      // 示例：保存文件路径到数据库
      await this.prismaDB.prisma.user.update({
        where: { id: req.user.id },
        data: { avatar: fileUrl },
      });

      return {
        data: { fileUrl },
        code: 200,
        message: "文件上传成功",
      };
    } catch (err) {
      return {
        data: null,
        code: 500,
        message: "服务器内部错误",
        error: err,
      };
    }
  }

  /**
   * 上传头像到OSS
   * @param req
   */
  public async uploadAvatarToOSS(req: Request) {
    console.log("🚀 ~ UploadService ~ uploadAvatarToOSS ~ req:", req.user);
    try {
      const uploadResult = await this.ossUpload(
        req,
        `avatars/${Date.now()}_avatar`
      );

      // 示例：保存OSS文件路径到数据库
      await this.prismaDB.prisma.user.update({
        where: { id: req.user.id }, // 假设用户ID为1
        data: { avatar: uploadResult.url },
      });

      return {
        data: {
          fileUrl: uploadResult.url,
          fileName: uploadResult.name,
          fileSize: uploadResult.size,
          mimeType: uploadResult.mimetype,
        },
        code: 200,
        message: "文件上传到OSS成功",
      };
    } catch (err) {
      return {
        data: null,
        code: 500,
        message: "OSS上传失败",
        error: err,
      };
    }
  }

  /**
   * 通用文件上传到OSS
   * @param req
   * @param folder OSS文件夹路径
   */
  public async uploadFileToOSS(req: Request, folder: string = "files") {
    try {
      const uploadResult = await this.ossUpload(
        req,
        `${folder}/${Date.now()}_file`
      );

      return {
        data: {
          fileUrl: uploadResult.url,
          fileName: uploadResult.name,
          fileSize: uploadResult.size,
          mimeType: uploadResult.mimetype,
        },
        code: 200,
        message: "文件上传到OSS成功",
      };
    } catch (err) {
      return {
        data: null,
        code: 500,
        message: "OSS上传失败",
        error: err,
      };
    }
  }
}
