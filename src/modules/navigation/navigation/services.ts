import { FilterHelper } from "@/utils";
import { JWT } from "@jwt/index";
import { User } from "@prisma/client";
import axios from "axios";
import * as cheerio from "cheerio";
import { plainToClass } from "class-transformer";
import { validate } from "class-validator";
import * as iconv from "iconv-lite";
import { inject, injectable } from "inversify";
import { PrismaDB } from "../../../db";
import {
  GetWebsiteInfoDto,
  NavigationDto,
  UpdateNavigationDto,
} from "./navigation.dto";

@injectable()
export class NavigationService {
  constructor(
    @inject(PrismaDB) private readonly PrismaDB: PrismaDB,
    @inject(JWT) private readonly JWT: JWT
  ) {}

  /**
   * 获取导航列表
   * @param config 查询配置参数
   * @returns 导航列表数据
   */
  public async getNavigationList(config: ReqListConfig) {
    try {
      let { filters, options, pagination } = config;

      // 初始化过滤条件
      filters = filters || {};
      let sqlFilters: any = {};

      const keys = Object.keys(filters);
      if (keys.length > 0) {
        // 添加基础过滤条件
        sqlFilters = FilterHelper.addFilterCondition(filters, [
          "id",
          "name", // 使用数据库实际字段名
          "path",
          "description",
          "status",
          "groupId",
        ]);

        // 遍历时间字段并添加范围过滤条件
        ["createdTime", "updatedTime"].forEach((timeField) => {
          if (keys.includes(timeField) && Array.isArray(filters[timeField])) {
            sqlFilters[timeField] = {
              gte: new Date(filters[timeField][0]),
              lte: new Date(filters[timeField][1]),
            };
          }
        });
      }

      // 查询中间关联表roleId
      if (sqlFilters["groupId"]) {
        sqlFilters = {
          ...sqlFilters,
          groups: {
            some: {
              groupId: sqlFilters["groupId"],
            },
          },
        };
        delete sqlFilters["groupId"];
      }

      // 硬删除模式下，不需要过滤isDeleted字段

      let result = [];
      let totalPages = 1;
      // 查询总记录数
      const totalRecords = await this.PrismaDB.prisma.navigation.count({
        where: sqlFilters,
      });

      let page = 1;
      let pageSize = 10;

      // 判断是否需要分页
      if (
        options &&
        options.hasOwnProperty("showPagination") &&
        !options["showPagination"]
      ) {
        // 不分页，查询所有数据
        result = await this.PrismaDB.prisma.navigation.findMany({
          where: sqlFilters,
          orderBy: [
            { sortOrder: "asc" }, // 按排序字段升序
            { createdTime: "desc" }, // 再按创建时间降序
          ],
        });
      } else {
        // 分页查询
        page = Math.max(1, parseInt(pagination?.page as string) || 1);
        pageSize = Math.max(
          1,
          Math.min(100, parseInt(pagination?.pageSize as string) || 10)
        ); // 限制最大页面大小

        result = await this.PrismaDB.prisma.navigation.findMany({
          skip: (page - 1) * pageSize,
          take: pageSize,
          where: sqlFilters,
          orderBy: [
            { sortOrder: "asc" }, // 按排序字段升序
            { createdTime: "desc" }, // 再按创建时间降序
          ],
        });

        totalPages = Math.ceil(totalRecords / pageSize);
      }

      // 构建分页信息
      const paginationData =
        options?.showPagination !== false
          ? {
              page,
              pageSize,
              totalRecords,
              totalPages,
            }
          : null;

      return {
        data: {
          data: result,
          pagination: paginationData,
        },
        code: 200,
        message: "获取导航列表成功",
      };
    } catch (err) {
      console.error("获取导航列表失败:", err);
      return {
        data: null,
        code: 500,
        message: "获取导航列表失败",
        errMsg: err instanceof Error ? err.message : String(err),
      };
    }
  }

  /**
   * 获取导航详细信息
   * @param navigationId 导航ID
   * @returns 导航详细信息
   */
  public async getNavigationDetail(navigationId: number) {
    try {
      // 验证参数
      if (!navigationId || isNaN(navigationId)) {
        return {
          data: null,
          code: 400,
          message: "导航ID无效",
          errMsg: "导航ID必须是有效的数字",
        };
      }

      const result = await this.PrismaDB.prisma.navigation.findUnique({
        where: { id: navigationId },
      });

      if (!result) {
        return {
          data: null,
          code: 404,
          message: "导航不存在",
          errMsg: "导航不存在",
        };
      }

      return {
        data: result,
        code: 200,
        message: "获取导航信息成功",
      };
    } catch (err) {
      console.error("获取导航详情失败:", err);
      return {
        data: null,
        code: 500,
        message: "获取导航详情失败",
        errMsg: err instanceof Error ? err.message : String(err),
      };
    }
  }

  /**
   * 创建导航
   * @param navigation 导航数据
   * @param user 当前用户
   * @returns 创建结果
   */
  public async createNavigation(navigation: NavigationDto, user: User) {
    try {
      // 验证输入参数
      const navigationDto = plainToClass(NavigationDto, navigation);
      const errors = await validate(navigationDto);
      if (errors.length > 0) {
        const errorMessages = errors.map((error) => {
          return {
            property: error.property,
            value: Object.values(error.constraints || {}),
          };
        });
        return {
          code: 400,
          message: "参数验证失败",
          errMsg: "参数验证失败",
          data: errorMessages,
        };
      }

      // 如果提供了分组ID，验证分组是否存在
      if (navigation.groupIds && navigation.groupIds.length > 0) {
        const existingGroups =
          await this.PrismaDB.prisma.navigationGroup.findMany({
            where: {
              id: { in: navigation.groupIds },
            },
          });

        if (existingGroups.length !== navigation.groupIds.length) {
          return {
            code: 400,
            message: "部分分组不存在",
            errMsg: "部分分组不存在",
            data: null,
          };
        }
      }

      // 构建创建数据，映射DTO字段到数据库字段
      const createData = {
        name: navigation.name, // DTO的name映射到数据库的name字段
        path: navigation.path || "", // 使用提供的路径或默认空字符串
        icon: navigation.icon || null, // 使用提供的图标或默认null
        description: navigation.description || null, // 使用提供的描述或默认null
        sortOrder: navigation.sortOrder || 0, // 使用提供的排序或默认0
        status: navigation.status !== undefined ? navigation.status : 1, // 使用提供的状态或默认启用
      };

      // 使用事务创建导航和分组关联
      const result = await this.PrismaDB.prisma.$transaction(async (prisma) => {
        // 创建导航
        const newNavigation = await prisma.navigation.create({
          data: createData,
        });

        // 如果提供了分组ID，创建分组关联
        if (navigation.groupIds && navigation.groupIds.length > 0) {
          const groupNavigationData = navigation.groupIds.map(
            (groupId, index) => ({
              navigationId: newNavigation.id,
              groupId: groupId,
              sortOrder: index, // 使用数组索引作为排序
            })
          );

          await prisma.navigationGroupNavigation.createMany({
            data: groupNavigationData,
          });
        }

        // 返回包含分组信息的导航数据
        return await prisma.navigation.findUnique({
          where: { id: newNavigation.id },
          include: {
            groups: {
              include: {
                group: true,
              },
            },
          },
        });
      });

      return {
        data: result,
        code: 200,
        message: "创建导航成功",
      };
    } catch (err) {
      console.error("创建导航失败:", err);
      return {
        data: null,
        code: 400,
        message: "创建导航失败",
        errMsg: err instanceof Error ? err.message : String(err),
      };
    }
  }

  /**
   * 更新导航
   * @param navigation 导航更新数据
   * @param user 当前用户
   * @returns 更新结果
   */
  public async updateNavigation(navigation: UpdateNavigationDto, user: User) {
    try {
      // 验证输入参数
      const navigationDto = plainToClass(UpdateNavigationDto, navigation);
      const errors = await validate(navigationDto);
      if (errors.length > 0) {
        const errorMessages = errors.map((error) => {
          return {
            property: error.property,
            value: Object.values(error.constraints || {}),
          };
        });
        return {
          code: 400,
          message: "参数验证失败",
          errMsg: "参数验证失败",
          data: errorMessages,
        };
      }

      // 验证导航是否存在
      const existingNavigation =
        await this.PrismaDB.prisma.navigation.findUnique({
          where: { id: navigation.id },
        });

      if (!existingNavigation) {
        return {
          data: null,
          code: 404,
          message: "导航不存在",
          errMsg: "导航不存在",
        };
      }

      // 如果提供了分组ID，验证分组是否存在
      if (navigation.groupIds && navigation.groupIds.length > 0) {
        const existingGroups =
          await this.PrismaDB.prisma.navigationGroup.findMany({
            where: {
              id: { in: navigation.groupIds },
            },
          });

        if (existingGroups.length !== navigation.groupIds.length) {
          return {
            code: 400,
            message: "部分分组不存在",
            errMsg: "部分分组不存在",
            data: null,
          };
        }
      }

      // 使用事务更新导航和分组关联
      const result = await this.PrismaDB.prisma.$transaction(async (prisma) => {
        // 构建更新数据，过滤掉不允许更新的字段
        const { id, groupIds, ...updateData } = navigation;

        // 过滤掉undefined值
        const filteredUpdateData = Object.fromEntries(
          Object.entries(updateData).filter(([_, value]) => value !== undefined)
        );

        // 更新导航基本信息
        const updatedNavigation = await prisma.navigation.update({
          where: { id: navigation.id },
          data: filteredUpdateData,
        });

        // 如果提供了分组ID，更新分组关联
        if (navigation.groupIds !== undefined) {
          // 删除现有的分组关联
          await prisma.navigationGroupNavigation.deleteMany({
            where: { navigationId: navigation.id },
          });

          // 如果有新的分组ID，创建新的关联
          if (navigation.groupIds.length > 0) {
            const groupNavigationData = navigation.groupIds.map(
              (groupId, index) => ({
                navigationId: navigation.id,
                groupId: groupId,
                sortOrder: index, // 使用数组索引作为排序
              })
            );

            await prisma.navigationGroupNavigation.createMany({
              data: groupNavigationData,
            });
          }
        }

        // 返回包含分组信息的导航数据
        return await prisma.navigation.findUnique({
          where: { id: navigation.id },
          include: {
            groups: {
              include: {
                group: true,
              },
            },
          },
        });
      });

      return {
        data: result,
        code: 200,
        message: "更新导航成功",
      };
    } catch (err) {
      console.error("更新导航失败:", err);
      return {
        data: null,
        code: 400,
        message: "更新导航失败",
        errMsg: err instanceof Error ? err.message : String(err),
      };
    }
  }

  /**
   * 删除导航（硬删除）
   * @param navigationId 导航ID
   * @param user 当前用户
   * @returns 删除结果
   */
  public async deleteNavigation(navigationId: number, user?: User) {
    try {
      // 验证导航是否存在
      const existingNavigation =
        await this.PrismaDB.prisma.navigation.findUnique({
          where: { id: navigationId },
        });

      if (!existingNavigation) {
        return {
          data: null,
          code: 404,
          message: "导航不存在",
          errMsg: "导航不存在",
        };
      }

      // 执行硬删除（包括关联的中间表数据）
      await this.PrismaDB.prisma.$transaction(async (prisma) => {
        // 先删除导航与导航组的关联关系
        await prisma.navigationGroupNavigation.deleteMany({
          where: {
            navigationId: navigationId,
          },
        });

        // 再删除导航本身
        await prisma.navigation.delete({
          where: {
            id: navigationId,
          },
        });
      });

      return {
        data: null,
        code: 200,
        message: "删除导航成功",
      };
    } catch (err) {
      console.error("删除导航失败:", err);
      return {
        data: null,
        code: 400,
        message: "删除导航失败",
        errMsg: err instanceof Error ? err.message : String(err),
      };
    }
  }

  /**
   * 获取导航组列表
   * @returns 导航组列表
   */
  public async getNavigationGroupList() {
    try {
      const navigationGroups =
        await this.PrismaDB.prisma.navigationGroup.findMany();
      return {
        data: navigationGroups,
        code: 200,
        message: "获取导航组列表成功",
      };
    } catch (err) {
      console.error("获取导航组列表失败:", err);
      return {
        data: null,
        code: 400,
        message: "获取导航组列表失败",
        errMsg: err instanceof Error ? err.message : String(err),
      };
    }
  }

  /**
   * 根据网址获取图标和标题
   * @param requestBody 请求体对象，包含url字段
   * @returns 包含图标和标题的对象
   */
  public async getWebsiteInfo(requestBody: any) {
    try {
      // 验证请求参数
      const websiteInfoDto = plainToClass(GetWebsiteInfoDto, requestBody);
      const errors = await validate(websiteInfoDto);

      if (errors.length > 0) {
        const errorMessages = errors
          .map((error) => Object.values(error.constraints || {}).join(", "))
          .join(", ");

        return {
          data: null,
          code: 400,
          message: "参数验证失败",
          errMsg: errorMessages,
        };
      }

      const url = websiteInfoDto.url;

      // 确保URL包含协议
      let normalizedUrl = url.trim();
      if (
        !normalizedUrl.startsWith("http://") &&
        !normalizedUrl.startsWith("https://")
      ) {
        normalizedUrl = "https://" + normalizedUrl;
      }

      // 验证URL格式
      try {
        new URL(normalizedUrl);
      } catch (error) {
        return {
          data: null,
          code: 400,
          message: "无效的URL格式",
          errMsg: "请提供有效的URL地址",
        };
      }

      // 设置请求配置
      const config = {
        timeout: 10000, // 10秒超时
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
          "Accept-Encoding": "gzip, deflate, br",
          Connection: "keep-alive",
          "Upgrade-Insecure-Requests": "1",
        },
        maxRedirects: 5, // 最多5次重定向
        responseType: "arraybuffer" as const, // 获取原始字节数据
      };

      // 发送HTTP请求获取网页内容
      const response = await axios.get(normalizedUrl, config);

      if (response.status !== 200) {
        return {
          data: null,
          code: 400,
          message: "无法访问该网址",
          errMsg: `HTTP状态码: ${response.status}`,
        };
      }

      // 检测字符编码并转换为UTF-8
      let htmlContent = "";
      const buffer = Buffer.from(response.data);

      // 从HTTP响应头获取编码信息
      const contentType = response.headers["content-type"] || "";
      let charset = "";

      const charsetMatch = contentType.match(/charset=([^;]+)/i);
      if (charsetMatch) {
        charset = charsetMatch[1].toLowerCase().trim();
      }

      // 如果没有从响应头获取到编码，尝试从HTML内容中检测
      if (!charset) {
        const htmlPreview = buffer.toString(
          "ascii",
          0,
          Math.min(1024, buffer.length)
        );
        const metaCharsetMatch = htmlPreview.match(
          /<meta[^>]+charset\s*=\s*["\']?([^"\'>\s]+)/i
        );
        if (metaCharsetMatch) {
          charset = metaCharsetMatch[1].toLowerCase().trim();
        }
      }

      // 常见编码映射
      const encodingMap: { [key: string]: string } = {
        gb2312: "gbk",
        gb18030: "gbk",
        gbk: "gbk",
        "utf-8": "utf8",
        utf8: "utf8",
        "iso-8859-1": "latin1",
        "windows-1252": "latin1",
      };

      const encoding = encodingMap[charset] || "utf8";

      try {
        if (encoding === "utf8") {
          htmlContent = buffer.toString("utf8");
        } else if (iconv.encodingExists(encoding)) {
          htmlContent = iconv.decode(buffer, encoding);
        } else {
          // 如果编码不支持，尝试常见的中文编码
          try {
            htmlContent = iconv.decode(buffer, "gbk");
          } catch {
            htmlContent = buffer.toString("utf8");
          }
        }
      } catch (error) {
        console.warn("编码转换失败，使用UTF-8:", error);
        htmlContent = buffer.toString("utf8");
      }

      // 使用cheerio解析HTML
      const $ = cheerio.load(htmlContent);
      // 获取网站标题
      let title = $("title").text().trim();

      // 如果没有title标签，尝试获取其他可能的标题
      if (!title) {
        title =
          $('meta[property="og:title"]').attr("content") ||
          $('meta[name="twitter:title"]').attr("content") ||
          $("h1").first().text().trim() ||
          "未知标题";
      }

      // 获取网站图标
      let icon = "";

      /**
       * 从URL中提取域名
       * @param url 完整URL
       * @returns 域名字符串
       */
      const extractHost = (url: string): string => {
        try {
          return new URL(url).host;
        } catch {
          return "";
        }
      };

      const host = extractHost(normalizedUrl);

      if (host) {
        // 第三方图标API服务列表（按速度和可靠性排序）
        const iconServices = [
          `https://www.google.com/s2/favicons?domain=${host}&sz=64`,
          `https://icons.duckduckgo.com/ip3/${host}.ico`,
          `https://favicon.yandex.net/favicon/${host}`,
          `https://api.lcll.cc/favicon?host=${host}`,
          `https://favicon.im/${host}`,
        ];

        /**
         * 快速验证图标服务是否可用（并发版本）
         * @param iconUrl 图标URL
         * @param timeout 超时时间（毫秒）
         * @returns Promise<{url: string, available: boolean}>
         */
        const checkIconAvailability = async (
          iconUrl: string,
          timeout: number = 1000
        ): Promise<{ url: string; available: boolean }> => {
          try {
            const response = await axios.head(iconUrl, {
              timeout,
              headers: {
                "User-Agent":
                  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
              },
              validateStatus: (status) => status === 200,
            });
            return { url: iconUrl, available: true };
          } catch {
            return { url: iconUrl, available: false };
          }
        };

        /**
         * 并发检查所有图标服务，返回第一个可用的
         * @param services 图标服务URL列表
         * @returns 第一个可用的图标URL
         */
        const findFirstAvailableIcon = async (
          services: string[]
        ): Promise<string> => {
          return new Promise((resolve) => {
            let resolved = false;
            let completedCount = 0;

            // 并发检查所有服务
            services.forEach(async (serviceUrl, index) => {
              try {
                const result = await checkIconAvailability(serviceUrl, 800); // 800ms超时
                completedCount++;

                // 如果找到可用的图标且还没有解决，立即返回
                if (result.available && !resolved) {
                  resolved = true;
                  resolve(result.url);
                }

                // 如果所有请求都完成了但没有找到可用的，返回第一个（Google）
                if (completedCount === services.length && !resolved) {
                  resolved = true;
                  resolve(services[0]);
                }
              } catch {
                completedCount++;
                if (completedCount === services.length && !resolved) {
                  resolved = true;
                  resolve(services[0]);
                }
              }
            });

            // 设置总体超时，防止无限等待
            setTimeout(() => {
              if (!resolved) {
                resolved = true;
                resolve(services[0]); // 超时后返回Google服务
              }
            }, 2000); // 2秒总超时
          });
        };

        // 使用并发方式快速获取可用图标
        icon = await findFirstAvailableIcon(iconServices);
      }

      // 清理标题，移除多余的空白字符
      title = title.replace(/\s+/g, " ").trim();

      // 限制标题长度
      if (title.length > 100) {
        title = title.substring(0, 100) + "...";
      }

      return {
        data: {
          title,
          icon,
          url: normalizedUrl,
          originalUrl: url,
        },
        code: 200,
        message: "获取网站信息成功",
      };
    } catch (error) {
      console.error("获取网站信息失败:", error);

      // 处理不同类型的错误
      let errorMessage = "获取网站信息失败";
      let errorDetail = "";

      if (axios.isAxiosError(error)) {
        if (error.code === "ENOTFOUND") {
          errorMessage = "无法找到该网址";
          errorDetail = "请检查网址是否正确";
        } else if (error.code === "ECONNREFUSED") {
          errorMessage = "连接被拒绝";
          errorDetail = "目标服务器拒绝连接";
        } else if (error.code === "ETIMEDOUT") {
          errorMessage = "请求超时";
          errorDetail = "网站响应时间过长";
        } else if (error.response) {
          errorMessage = "网站访问失败";
          errorDetail = `HTTP状态码: ${error.response.status}`;
        } else {
          errorMessage = "网络请求失败";
          errorDetail = error.message;
        }
      } else {
        errorDetail = error instanceof Error ? error.message : String(error);
      }

      return {
        data: null,
        code: 400,
        message: errorMessage,
        errMsg: errorDetail,
      };
    }
  }
}
