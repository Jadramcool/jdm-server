import type { Request } from "express";
import { inject, injectable } from "inversify";
import multer from "multer";
import { PrismaDB } from "../../db";
import { JWT } from "../../jwt";

@injectable()
export class UploadService {
  private upload: any;

  constructor(
    @inject(PrismaDB) private readonly prismaDB: PrismaDB,
    @inject(JWT) private readonly jwt: JWT
  ) {
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
   * 上传头像
   * @param file
   */
  public async uploadAvatar(req: Request) {
    try {
      const file = await this.commonUpload(req);
      const baseUrl = process.env.BASE_URL || "http://localhost:3000";
      const fileUrl = `${baseUrl}/uploads/${file.filename}`;
      console.log("======================");
      console.log(req.user.id);
      console.log("======================");

      // 示例：保存文件路径到数据库
      await this.prismaDB.prisma.user.update({
        where: { id: 1 }, // 假设用户ID为1
        data: { avatar: fileUrl },
      });

      return {
        data: { fileUrl },
        code: 200,
        message: "文件上传成功",
      };
    } catch (err) {
      console.log("🚀 ~ uploadAvatar ~ err:", err);

      return {
        data: null,
        code: 500,
        message: "服务器内部错误",
        error: err,
      };
    }
  }
}
