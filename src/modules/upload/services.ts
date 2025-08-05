import * as dotenv from "dotenv";
import type { Request } from "express";
import fs from "fs";
import { inject, injectable } from "inversify";
import multer from "multer";
import path from "path";
import { PrismaDB } from "../../db";
import {
  AliyunOSSManager,
  createOSSManager,
  validateOSSConfig,
} from "../../utils/aliyun_oss_manager";

/**
 * 文件上传配置接口
 */
interface UploadConfig {
  maxFileSize: number; // 最大文件大小（字节）
  allowedMimeTypes: string[]; // 允许的文件类型
  allowedExtensions: string[]; // 允许的文件扩展名
}

/**
 * 上传目标类型
 */
type UploadTarget = "local" | "oss" | "both";

/**
 * 文件类型预设
 */
type FileTypePreset =
  | "image"
  | "document"
  | "audio"
  | "video"
  | "archive"
  | "avatar"
  | "all";

/**
 * 统一上传请求参数
 */
interface UnifiedUploadOptions {
  fileType?: FileTypePreset; // 文件类型预设
  target?: UploadTarget; // 上传目标
  folder?: string; // 文件夹名称
  maxCount?: number; // 最大文件数量（批量上传时）
  customConfig?: Partial<UploadConfig>; // 自定义配置
}

/**
 * 统一上传结果
 */
interface UnifiedUploadResult {
  local?: UploadResult; // 本地上传结果
  oss?: UploadResult; // OSS上传结果
  target: UploadTarget; // 实际上传目标
}

/**
 * 上传结果接口
 */
interface UploadResult {
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  originalName: string;
  uploadTime: Date;
}

/**
 * 批量上传结果接口
 */
interface BatchUploadResult {
  successFiles: UploadResult[];
  failedFiles: { fileName: string; error: string }[];
  totalCount: number;
  successCount: number;
  failedCount: number;
}

/**
 * 文件上传服务类
 *
 * 提供完整的文件上传功能，包括：
 * - 本地文件上传
 * - 阿里云OSS文件上传
 * - 头像上传（本地和OSS）
 * - 批量文件上传
 * - 文件类型和大小验证
 * - 安全文件名生成
 * - 临时文件清理
 *
 * 支持多种文件格式：图片、文档、音频、视频等
 * 具备完善的错误处理和日志记录机制
 */
@injectable()
export class UploadService {
  /** Multer实例，用于处理文件上传 */
  private upload: any;
  /** 阿里云OSS管理器实例，可能为null（未配置OSS时） */
  private ossManager: AliyunOSSManager | null = null;

  /**
   * 文件类型预设配置
   *
   * 提供常用的文件类型组合，方便快速配置上传限制
   */
  private readonly fileTypePresets: Record<FileTypePreset, UploadConfig> = {
    // 图片文件预设
    image: {
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedMimeTypes: [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/bmp",
        "image/svg+xml",
      ],
      allowedExtensions: [
        ".jpg",
        ".jpeg",
        ".png",
        ".gif",
        ".webp",
        ".bmp",
        ".svg",
      ],
    },

    // 文档文件预设
    document: {
      maxFileSize: 20 * 1024 * 1024, // 20MB
      allowedMimeTypes: [
        "application/pdf",
        "text/plain",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      ],
      allowedExtensions: [
        ".pdf",
        ".txt",
        ".doc",
        ".docx",
        ".xls",
        ".xlsx",
        ".ppt",
        ".pptx",
      ],
    },

    // 音频文件预设
    audio: {
      maxFileSize: 50 * 1024 * 1024, // 50MB
      allowedMimeTypes: [
        "audio/mpeg",
        "audio/wav",
        "audio/ogg",
        "audio/mp4",
        "audio/aac",
        "audio/flac",
      ],
      allowedExtensions: [".mp3", ".wav", ".ogg", ".m4a", ".aac", ".flac"],
    },

    // 视频文件预设
    video: {
      maxFileSize: 100 * 1024 * 1024, // 100MB
      allowedMimeTypes: [
        "video/mp4",
        "video/mpeg",
        "video/quicktime",
        "video/x-msvideo",
        "video/webm",
      ],
      allowedExtensions: [".mp4", ".mpeg", ".mov", ".avi", ".webm"],
    },

    // 压缩文件预设
    archive: {
      maxFileSize: 100 * 1024 * 1024, // 100MB
      allowedMimeTypes: [
        "application/zip",
        "application/x-rar-compressed",
        "application/x-7z-compressed",
        "application/gzip",
        "application/x-tar",
      ],
      allowedExtensions: [".zip", ".rar", ".7z", ".gz", ".tar"],
    },

    // 头像专用预设
    avatar: {
      maxFileSize: 5 * 1024 * 1024, // 5MB
      allowedMimeTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
      allowedExtensions: [".jpg", ".jpeg", ".png", ".gif", ".webp"],
    },

    // 全部类型（通用配置）
    all: {
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedMimeTypes: [
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
      ],
      allowedExtensions: [
        ".jpg",
        ".jpeg",
        ".png",
        ".gif",
        ".webp",
        ".pdf",
        ".txt",
        ".doc",
        ".docx",
        ".xls",
        ".xlsx",
      ],
    },
  };

  /**
   * 构造函数 - 初始化文件上传服务
   *
   * 依赖注入：
   * @param prismaDB - 数据库操作实例，用于保存文件信息到用户表
   * @param jwt - JWT服务实例，用于用户身份验证
   *
   * 初始化流程：
   * 1. 初始化OSS管理器（如果配置了OSS）
   * 2. 初始化Multer文件上传配置
   */
  constructor(@inject(PrismaDB) private readonly prismaDB: PrismaDB) {
    // 初始化OSS管理器 - 加载OSS配置并创建管理器实例
    this.initOSSManager();
    // 初始化multer配置 - 设置文件存储、命名和验证规则
    this.initMulterConfig();
  }

  /**
   * 初始化Multer文件上传配置
   *
   * 配置内容：
   * - 文件存储位置和命名规则
   * - 文件大小限制
   * - 文件类型过滤器
   *
   * 安全措施：
   * - 自动创建上传目录
   * - 生成唯一且安全的文件名
   * - 严格的文件类型验证
   */
  private initMulterConfig() {
    this.upload = multer({
      storage: multer.diskStorage({
        destination: (req, file, cb) => {
          // 确保上传目录存在，避免上传失败
          const uploadDir = "./uploads/";
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
          // 生成唯一且安全的文件名，防止文件名冲突和安全问题
          const timestamp = Date.now(); // 时间戳确保唯一性
          const randomStr = Math.random().toString(36).substring(2, 8); // 随机字符串增加唯一性
          const ext = path.extname(file.originalname); // 保留原始扩展名
          const baseName = path.basename(file.originalname, ext); // 获取不含扩展名的文件名
          const fileName = `${timestamp}_${randomStr}_${baseName}${ext}`;
          cb(null, fileName);
        },
      }),
      limits: {
        fileSize: this.fileTypePresets.all.maxFileSize, // 使用通用配置的文件大小限制
      },
      fileFilter: (req, file, cb) => {
        // 使用自定义验证函数检查文件类型和扩展名
        this.validateFile(file, this.fileTypePresets.all, cb);
      },
    });
  }

  /**
   * 初始化阿里云OSS管理器
   *
   * 功能说明：
   * - 从.env.oss文件加载OSS配置信息
   * - 验证配置完整性
   * - 创建OSS管理器实例
   *
   * 配置项：
   * - OSS_REGION: 阿里云OSS区域
   * - OSS_ACCESS_KEY_ID: 访问密钥ID
   * - OSS_ACCESS_KEY_SECRET: 访问密钥Secret
   * - OSS_BUCKET_NAME: 存储桶名称
   *
   * 注意：如果配置不完整，OSS功能将不可用，但不影响本地上传
   */
  private initOSSManager() {
    // 尝试加载.env.oss文件中的OSS配置
    const ossEnvPath = path.resolve(process.cwd(), ".env.oss");
    if (fs.existsSync(ossEnvPath)) {
      dotenv.config({ path: ossEnvPath });
    }

    // 从环境变量中读取OSS配置信息
    const ossConfig = {
      region: process.env.OSS_REGION || "", // OSS服务区域
      accessKeyId: process.env.OSS_ACCESS_KEY_ID || "", // 访问密钥ID
      accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || "", // 访问密钥Secret
      bucket: process.env.OSS_BUCKET_NAME || "", // 存储桶名称
      endpoint:
        process.env.OSS_ENDPOINT ||
        `https://${process.env.OSS_REGION}.aliyuncs.com`, // OSS访问端点
    };

    // 验证OSS配置是否完整并创建管理器实例
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
   * 验证上传文件是否符合安全要求
   *
   * 安全验证包括：
   * 1. MIME类型验证 - 防止恶意文件上传
   * 2. 文件扩展名验证 - 双重安全检查
   *
   * @param file 上传的文件对象，包含文件信息
   * @param config 上传配置对象，定义允许的文件类型和扩展名
   * @param cb Multer回调函数，用于返回验证结果
   *
   * 验证失败时会返回具体的错误信息，帮助用户了解问题
   */
  private validateFile(
    file: Express.Multer.File,
    config: UploadConfig,
    cb: multer.FileFilterCallback
  ) {
    // 第一层验证：检查文件MIME类型是否在允许列表中
    // MIME类型是浏览器识别的文件类型，但可能被伪造
    if (!config.allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error(`不支持的文件类型: ${file.mimetype}`));
    }

    // 第二层验证：检查文件扩展名是否在允许列表中
    // 扩展名验证作为额外的安全措施，防止MIME类型伪造
    const ext = path.extname(file.originalname).toLowerCase();
    if (!config.allowedExtensions.includes(ext)) {
      return cb(new Error(`不支持的文件扩展名: ${ext}`));
    }

    // 验证通过，允许上传
    cb(null, true);
  }

  /**
   * 生成安全且唯一的文件名
   *
   * 安全措施：
   * - 时间戳确保文件名唯一性
   * - 随机字符串增加额外的唯一性保障
   * - 清理特殊字符，防止路径遍历攻击
   * - 限制文件名长度，避免文件系统问题
   * - 保留原始扩展名，确保文件类型正确
   *
   * @param originalName 用户上传的原始文件名
   * @param prefix 可选的文件名前缀，用于分类管理
   * @returns 处理后的安全文件名
   *
   * 示例：
   * - 输入："我的文档.pdf"
   * - 输出："1640995200000_abc123_我的文档.pdf"
   * - 带前缀："avatar_1640995200000_abc123_我的文档.pdf"
   */
  private generateSafeFileName(
    originalName: string,
    prefix: string = ""
  ): string {
    const timestamp = Date.now(); // 当前时间戳，确保唯一性
    const randomStr = Math.random().toString(36).substring(2, 8); // 6位随机字符串
    const ext = path.extname(originalName); // 保留原始文件扩展名

    // 清理文件名：保留字母、数字、中文字符，其他字符替换为下划线
    const baseName = path
      .basename(originalName, ext)
      .replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "_") // 替换特殊字符为下划线
      .substring(0, 50); // 限制基础文件名长度为50字符

    // 根据是否有前缀生成最终文件名
    return prefix
      ? `${prefix}_${timestamp}_${randomStr}_${baseName}${ext}`
      : `${timestamp}_${randomStr}_${baseName}${ext}`;
  }

  /**
   * 创建带配置的multer实例
   * @param config 上传配置
   * @returns multer实例
   */
  private createConfiguredMulter(config: UploadConfig) {
    return multer({
      storage: multer.diskStorage({
        destination: (req, file, cb) => {
          const uploadDir = "./uploads/";
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
          const fileName = this.generateSafeFileName(file.originalname);
          cb(null, fileName);
        },
      }),
      limits: {
        fileSize: config.maxFileSize,
      },
      fileFilter: (req, file, cb) => {
        this.validateFile(file, config, cb);
      },
    });
  }

  /**
   * 通用文件上传处理方法
   *
   * 这是文件上传的核心方法，支持多种上传模式：
   * - single: 单文件上传
   * - array: 多文件数组上传
   * - fields: 多字段文件上传
   * - none: 仅处理表单数据，不处理文件
   * - any: 接受任意文件字段
   *
   * 错误处理：
   * - 文件大小超限
   * - 文件类型不支持
   * - 未检测到文件
   * - 配置错误
   *
   * @param req Express请求对象，包含上传的文件信息
   * @param type 上传类型，决定如何处理文件
   * @param fieldName 表单中文件字段的名称
   * @param maxCount 数组上传时的最大文件数量
   * @param fields 多字段上传时的字段配置数组
   * @param config 上传配置对象，包含大小限制和类型限制
   * @returns Promise<any> 上传成功返回文件信息，失败抛出错误
   */
  public async commonUpload(
    req: Request,
    type: string = "single",
    fieldName: any = "file",
    maxCount: number = 1,
    fields: any = [],
    config: UploadConfig = this.fileTypePresets.all
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const upload = this.createConfiguredMulter(config);
      let uploadFile = null;

      try {
        if (type === "single") {
          uploadFile = upload[type](fieldName);
        } else if (type === "array") {
          uploadFile = upload[type](fieldName, maxCount);
        } else if (type === "fields") {
          uploadFile = upload[type](fields);
        } else {
          uploadFile = upload[type]();
        }

        uploadFile(req, {}, async (err: any) => {
          if (err) {
            let errorMessage = "文件上传失败";

            if (err.code === "LIMIT_FILE_SIZE") {
              errorMessage = `文件大小超过限制，最大允许 ${(
                config.maxFileSize /
                1024 /
                1024
              ).toFixed(1)}MB`;
            } else if (err.message) {
              errorMessage = err.message;
            }

            return reject({
              code: 400,
              message: errorMessage,
              error: err.code || "UPLOAD_ERROR",
            });
          }

          if (!req.file && !req.files) {
            return reject({
              code: 400,
              message: "未检测到上传文件",
              error: "NO_FILE_UPLOADED",
            });
          }

          resolve(req.file || req.files);
        });
      } catch (error) {
        reject({
          code: 500,
          message: "上传配置错误",
          error: error,
        });
      }
    });
  }

  /**
   * 阿里云OSS文件上传方法
   *
   * 功能特性：
   * - 支持多种文件类型上传到OSS
   * - 自动生成安全的OSS对象路径
   * - 上传完成后自动清理本地临时文件
   * - 详细的错误处理和日志记录
   * - 支持单文件、多文件、多字段等上传模式
   *
   * 上传流程：
   * 1. 验证OSS管理器是否已初始化
   * 2. 使用commonUpload方法先处理文件到本地
   * 3. 生成OSS对象路径（如未指定）
   * 4. 验证本地文件存在性
   * 5. 执行文件上传到OSS
   * 6. 清理本地临时文件
   * 7. 返回包含OSS URL的上传结果
   *
   * @param req Express请求对象，包含上传的文件信息
   * @param objectPath 可选的OSS中的文件路径，如：'avatars/user123/avatar.jpg'，未指定时自动生成
   * @param type 上传类型：'single'(单文件)、'array'(多文件数组)、'fields'(多字段)等
   * @param fieldName 表单中文件字段的名称，默认为'file'
   * @param maxCount 数组上传时的最大文件数量，默认为1
   * @param fields 多字段上传时的字段配置数组
   * @param config 上传配置对象，包含文件大小限制和类型限制，默认使用通用配置
   * @returns Promise<UploadResult> 包含OSS文件URL、大小、类型等信息的上传结果
   * @throws Error 当OSS未配置、文件上传失败或本地文件不存在时抛出错误
   */
  public async ossUpload(
    req: Request,
    objectPath?: string,
    type: string = "single",
    fieldName: any = "file",
    maxCount: number = 1,
    fields: any = [],
    config: UploadConfig = this.fileTypePresets.all
  ): Promise<UploadResult> {
    if (!this.ossManager) {
      throw new Error("OSS未配置，无法使用OSS上传功能");
    }

    // 先使用本地上传获取文件
    const file = await this.commonUpload(
      req,
      type,
      fieldName,
      maxCount,
      fields,
      config
    );

    if (!file) {
      throw new Error("文件上传失败");
    }

    const localFilePath = path.join("./uploads/", file.filename);

    try {
      // 生成OSS对象路径
      const fileName = file.filename;
      const fileExtension = path.extname(fileName);
      const timestamp = Date.now();
      const finalObjectPath =
        objectPath || `uploads/${this.generateSafeFileName(file.originalname)}`;

      // 验证本地文件是否存在
      if (!fs.existsSync(localFilePath)) {
        throw new Error(`本地文件不存在: ${localFilePath}`);
      }

      // 上传到OSS
      const result = await this.ossManager.uploadFile(
        finalObjectPath,
        localFilePath
      );

      // 删除本地临时文件
      this.cleanupLocalFile(localFilePath);

      return {
        fileUrl: result.url,
        fileName: result.name,
        fileSize: file.size,
        mimeType: file.mimetype,
        originalName: file.originalname,
        uploadTime: new Date(),
      };
    } catch (error) {
      // 如果OSS上传失败，删除本地文件
      this.cleanupLocalFile(localFilePath);

      // 重新抛出更详细的错误信息
      if (error instanceof Error) {
        throw new Error(`OSS上传失败: ${error.message}`);
      }
      throw new Error("OSS上传失败: 未知错误");
    }
  }

  /**
   * 获取文件类型配置
   *
   * 根据文件类型预设和自定义配置生成最终的上传配置
   *
   * @param fileType 文件类型预设
   * @param customConfig 自定义配置（可选）
   * @returns 合并后的上传配置
   */
  private getUploadConfig(
    fileType: FileTypePreset = "all",
    customConfig?: Partial<UploadConfig>
  ): UploadConfig {
    const baseConfig =
      this.fileTypePresets[fileType] || this.fileTypePresets.all;

    if (!customConfig) {
      return baseConfig;
    }

    // 合并配置，自定义配置优先
    return {
      maxFileSize: customConfig.maxFileSize ?? baseConfig.maxFileSize,
      allowedMimeTypes:
        customConfig.allowedMimeTypes ?? baseConfig.allowedMimeTypes,
      allowedExtensions:
        customConfig.allowedExtensions ?? baseConfig.allowedExtensions,
    };
  }

  /**
   * 统一文件上传方法
   *
   * 支持多种上传目标和文件类型预设的统一接口
   *
   * 功能特性：
   * - 支持本地、OSS或同时上传到两个位置
   * - 预设的文件类型配置（图片、文档、音频等）
   * - 自定义配置覆盖
   * - 智能错误处理和回滚机制
   * - 详细的上传结果返回
   * - 兼容前端FormData传参方式
   *
   * @param req Express请求对象（已通过multer处理）
   * @param options 上传选项配置
   * @returns Promise<Jres> 统一格式的响应结果
   */
  public async unifiedUpload(
    req: Request,
    options: UnifiedUploadOptions = {}
  ): Promise<Jres> {
    const {
      fileType = "all",
      target = "local",
      folder = "files",
      maxCount = 1,
      customConfig,
    } = options;

    try {
      // 检查是否有文件上传
      if (!req.file) {
        throw {
          code: 400,
          message: "未检测到上传文件",
          error: "NO_FILE_UPLOADED",
        };
      }

      // 获取最终配置
      const config = this.getUploadConfig(fileType, customConfig);

      // 验证文件是否符合配置要求
      const file = req.file;

      // 验证文件大小
      if (file.size > config.maxFileSize) {
        throw {
          code: 400,
          message: `文件大小超过限制，最大允许 ${(
            config.maxFileSize /
            1024 /
            1024
          ).toFixed(1)}MB`,
          error: "FILE_SIZE_EXCEEDED",
        };
      }

      // 验证MIME类型
      if (!config.allowedMimeTypes.includes(file.mimetype)) {
        throw {
          code: 400,
          message: `不支持的文件类型: ${file.mimetype}`,
          error: "UNSUPPORTED_MIME_TYPE",
        };
      }

      // 验证文件扩展名
      const ext = path.extname(file.originalname).toLowerCase();
      if (!config.allowedExtensions.includes(ext)) {
        throw {
          code: 400,
          message: `不支持的文件扩展名: ${ext}`,
          error: "UNSUPPORTED_FILE_EXTENSION",
        };
      }

      // 根据目标类型执行上传
      const result: UnifiedUploadResult = {
        target,
      };

      if (target === "local" || target === "both") {
        // 本地上传（文件已经通过multer保存到本地）
        const baseUrl = process.env.BASE_URL || "http://localhost:3000";
        const fileUrl = `${baseUrl}/uploads/${file.filename}`;

        result.local = {
          fileUrl,
          fileName: file.filename,
          fileSize: file.size,
          mimeType: file.mimetype,
          originalName: file.originalname,
          uploadTime: new Date(),
        };
      }

      if (target === "oss" || target === "both") {
        // OSS上传
        if (!this.ossManager) {
          if (target === "oss") {
            throw {
              code: 500,
              message: "OSS未配置，无法使用OSS上传功能",
              error: "OSS_NOT_CONFIGURED",
            };
          }
          // 如果是both模式但OSS未配置，只返回本地上传结果
          console.warn("OSS未配置，跳过OSS上传");
        } else {
          try {
            // 生成OSS对象路径
            const ossPath = `${folder}/${this.generateSafeFileName(
              file.originalname
            )}`;

            // 获取本地文件路径
            const localFilePath = file.path;

            // 上传到OSS
            const ossUploadResult = await this.ossManager.uploadFile(
              ossPath,
              localFilePath
            );

            result.oss = {
              fileUrl: ossUploadResult.url,
              fileName: ossUploadResult.name,
              fileSize: file.size,
              mimeType: file.mimetype,
              originalName: file.originalname,
              uploadTime: new Date(),
            };

            // 如果只上传到OSS，删除本地文件
            if (target === "oss") {
              this.cleanupLocalFile(localFilePath);
            }
          } catch (error) {
            console.error("OSS上传失败:", error);
            if (target === "oss") {
              // 如果只上传到OSS但失败了，删除本地文件并抛出错误
              this.cleanupLocalFile(file.path);
              throw {
                code: 500,
                message: `OSS上传失败: ${
                  error instanceof Error ? error.message : "未知错误"
                }`,
                error: "OSS_UPLOAD_FAILED",
              };
            }
            // 如果是both模式，OSS失败不影响本地上传结果
            console.warn("OSS上传失败，但本地上传成功");
          }
        }
      }

      // 特殊处理头像上传（更新用户头像字段）
      if (fileType === "avatar" && req.user?.id) {
        const avatarUrl = result.oss?.fileUrl || result.local?.fileUrl;
        if (avatarUrl) {
          await this.prismaDB.prisma.user.update({
            where: { id: req.user.id },
            data: { avatar: avatarUrl },
          });
        }
      }

      return {
        data: result,
        code: 200,
        message: `文件上传成功 (${target})`,
      };
    } catch (err: any) {
      console.error("统一文件上传失败:", err);

      // 如果有本地文件，清理它
      if (req.file?.path) {
        this.cleanupLocalFile(req.file.path);
      }

      return {
        data: null,
        code: err.code || 500,
        message: err.message || "文件上传失败",
        errMsg: err.error || "UNIFIED_UPLOAD_ERROR",
      };
    }
  }

  /**
   * 清理本地临时文件
   *
   * 安全清理策略：
   * - 验证文件路径的有效性
   * - 检查文件是否存在
   * - 安全删除文件
   * - 错误处理但不中断主流程
   *
   * 使用场景：
   * - OSS上传完成后清理本地缓存文件
   * - 上传失败时清理残留文件
   * - 定期清理临时文件
   *
   * @param filePath 需要删除的本地文件完整路径
   * @returns Promise<void> 清理完成，不返回值
   *
   * 注意：此方法不会抛出错误，即使删除失败也只记录日志
   */
  private async cleanupLocalFile(filePath: string): Promise<void> {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`已清理临时文件: ${filePath}`);
      }
    } catch (error) {
      console.warn(`清理临时文件失败: ${filePath}`, error);
    }
  }
}
