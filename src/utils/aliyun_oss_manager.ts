import OSS from "ali-oss";
import fs from "fs";
import path from "path";

/**
 * 阿里云OSS配置接口
 */
interface OSSConfig {
  region: string; // OSS区域，如 'oss-cn-hangzhou'
  accessKeyId: string; // 访问密钥ID
  accessKeySecret: string; // 访问密钥Secret
  bucket: string; // 存储桶名称
  endpoint?: string; // 自定义域名端点（可选）
}

/**
 * 上传选项接口
 */
type UploadOptions = Partial<OSS.PutObjectOptions>;

/**
 * 下载选项接口
 */
interface DownloadOptions extends Partial<OSS.GetObjectOptions> {
  process?: string; // 图片处理参数
  versionId?: string; // 版本ID
  responseCacheControl?: string;
  responseContentDisposition?: string;
  responseContentEncoding?: string;
  responseContentLanguage?: string;
  responseContentType?: string;
  responseExpires?: string;
}

/**
 * 阿里云OSS管理器类
 */
export class AliyunOSSManager {
  private client: OSS;
  private config: OSSConfig;

  constructor(config: OSSConfig) {
    this.config = config;
    this.client = new OSS({
      region: config.region,
      accessKeyId: config.accessKeyId,
      accessKeySecret: config.accessKeySecret,
      bucket: config.bucket,
      endpoint: config.endpoint,
    });
  }

  /**
   * 上传文件到OSS
   * @param objectName OSS中的对象名称（文件路径）
   * @param localFilePath 本地文件路径
   * @param options 上传选项
   * @returns 上传结果
   */
  async uploadFile(
    objectName: string,
    localFilePath: string,
    options?: UploadOptions
  ): Promise<OSS.PutObjectResult> {
    try {
      // 检查本地文件是否存在
      if (!fs.existsSync(localFilePath)) {
        throw new Error(`本地文件不存在: ${localFilePath}`);
      }

      const result = await this.client.put(objectName, localFilePath, options);

      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 上传Buffer到OSS
   * @param objectName OSS中的对象名称
   * @param buffer 要上传的Buffer
   * @param options 上传选项
   * @returns 上传结果
   */
  async uploadBuffer(
    objectName: string,
    buffer: Buffer,
    options?: UploadOptions
  ): Promise<OSS.PutObjectResult> {
    try {
      const result = await this.client.put(objectName, buffer, options);

      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 上传字符串内容到OSS
   * @param objectName OSS中的对象名称
   * @param content 要上传的字符串内容
   * @param options 上传选项
   * @returns 上传结果
   */
  async uploadString(
    objectName: string,
    content: string,
    options?: UploadOptions
  ): Promise<OSS.PutObjectResult> {
    try {
      const result = await this.client.put(
        objectName,
        Buffer.from(content, "utf8"),
        options
      );

      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 从OSS下载文件到本地
   * @param objectName OSS中的对象名称
   * @param localFilePath 本地保存路径
   * @param options 下载选项
   * @returns 下载结果
   */
  async downloadFile(
    objectName: string,
    localFilePath: string,
    options?: DownloadOptions
  ): Promise<OSS.GetObjectResult> {
    try {
      // 确保本地目录存在
      const dir = path.dirname(localFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const result = await this.client.get(objectName, localFilePath, options);

      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 从OSS获取文件内容（返回Buffer）
   * @param objectName OSS中的对象名称
   * @param options 下载选项
   * @returns 文件内容Buffer
   */
  async getFileBuffer(
    objectName: string,
    options?: DownloadOptions
  ): Promise<Buffer> {
    try {
      const result = await this.client.get(objectName, options);

      return result.content as Buffer;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 从OSS获取文件内容（返回字符串）
   * @param objectName OSS中的对象名称
   * @param encoding 字符编码，默认utf8
   * @param options 下载选项
   * @returns 文件内容字符串
   */
  async getFileString(
    objectName: string,
    encoding: BufferEncoding = "utf8",
    options?: DownloadOptions
  ): Promise<string> {
    try {
      const buffer = await this.getFileBuffer(objectName, options);
      return buffer.toString(encoding);
    } catch (error) {
      throw error;
    }
  }

  /**
   * 检查文件是否存在
   * @param objectName OSS中的对象名称
   * @returns 是否存在
   */
  async exists(objectName: string): Promise<boolean> {
    try {
      await this.client.head(objectName);
      return true;
    } catch (error: any) {
      if (error.code === "NoSuchKey") {
        return false;
      }
      throw error;
    }
  }

  /**
   * 删除文件
   * @param objectName OSS中的对象名称
   * @returns 删除结果
   */
  async deleteFile(objectName: string): Promise<OSS.DeleteResult> {
    try {
      const result = await this.client.delete(objectName);

      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 批量删除文件
   * @param objectNames OSS中的对象名称数组
   * @returns 删除结果
   */
  async deleteMultipleFiles(
    objectNames: string[]
  ): Promise<OSS.DeleteMultiResult> {
    try {
      const result = await this.client.deleteMulti(objectNames);

      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 列出指定前缀的文件
   * @param prefix 文件前缀
   * @param maxKeys 最大返回数量，默认100
   * @returns 文件列表
   */
  async listFiles(
    prefix?: string,
    maxKeys: number = 100
  ): Promise<OSS.ListObjectResult> {
    try {
      const result = await this.client.list(
        {
          prefix,
          "max-keys": maxKeys,
        },
        {}
      );

      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 获取文件的签名URL（用于临时访问）
   * @param objectName OSS中的对象名称
   * @param expires 过期时间（秒），默认3600秒（1小时）
   * @returns 签名URL
   */
  async getSignedUrl(
    objectName: string,
    expires: number = 3600
  ): Promise<string> {
    try {
      const url = this.client.signatureUrl(objectName, {
        expires,
      });

      return url;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 获取文件信息
   * @param objectName OSS中的对象名称
   * @returns 文件信息
   */
  async getFileInfo(objectName: string): Promise<OSS.HeadObjectResult> {
    try {
      const result = await this.client.head(objectName);

      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 复制文件
   * @param sourceObjectName 源文件名称
   * @param targetObjectName 目标文件名称
   * @param sourceBucket 源存储桶（可选，默认为当前桶）
   * @returns 复制结果
   */
  async copyFile(
    sourceObjectName: string,
    targetObjectName: string,
    sourceBucket?: string
  ): Promise<any> {
    try {
      const source = sourceBucket
        ? `/${sourceBucket}/${sourceObjectName}`
        : sourceObjectName;

      const result = await this.client.copy(targetObjectName, source);

      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 设置文件的访问权限
   * @param objectName OSS中的对象名称
   * @param acl 访问权限：'private' | 'public-read' | 'public-read-write'
   * @returns 设置结果
   */
  async setFileACL(
    objectName: string,
    acl: "private" | "public-read" | "public-read-write"
  ): Promise<any> {
    try {
      const result = await this.client.putACL(objectName, acl);

      return result;
    } catch (error) {
      throw error;
    }
  }
}

/**
 * 验证OSS配置
 * @param config OSS配置
 * @returns 是否有效
 */
export function validateOSSConfig(
  config: Partial<OSSConfig>
): config is OSSConfig {
  return Boolean(
    config.region &&
      config.accessKeyId &&
      config.accessKeySecret &&
      config.bucket
  );
}

/**
 * 创建OSS管理器实例的工厂函数
 * @param config OSS配置
 * @returns OSS管理器实例
 */
export function createOSSManager(config: OSSConfig): AliyunOSSManager {
  return new AliyunOSSManager(config);
}

// 导出类型
export type { DownloadOptions, OSSConfig, UploadOptions };

