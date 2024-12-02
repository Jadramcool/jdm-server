import { FilterHelper } from "@/utils";
import { JWT } from "@jwt/index";
import { User } from "@prisma/client";
import { plainToClass } from "class-transformer";
import { validate } from "class-validator";
import { inject, injectable } from "inversify";
import { PrismaDB } from "../../../db";
import { NoticeDto } from "./notice.dto";

@injectable()
export class NoticeService {
  constructor(
    @inject(PrismaDB) private readonly PrismaDB: PrismaDB,
    @inject(JWT) private readonly JWT: JWT
  ) {}

  // 获取公告列表
  public async getNoticeList(config: ReqListConfig) {
    try {
      let { filters, options, pagination } = config;

      filters = filters || {};
      let sqlFilters = {};

      const keys = Object.keys(filters);
      if (keys.length > 0) {
        // 添加基础过滤条件
        sqlFilters = FilterHelper.addFilterCondition(filters, [
          "id",
          "title",
          "content",
          "type",
        ]);

        // 遍历时间字段并添加范围过滤条件
        ["createdTime", "updatedTime"].forEach((timeField) => {
          if (keys.includes(timeField)) {
            sqlFilters[timeField] = {
              gte: new Date(filters[timeField][0]),
              lte: new Date(filters[timeField][1]),
            };
          }
        });
      }

      sqlFilters["isDeleted"] = false;

      let result = [];
      // 总页数
      let totalPages = 1;

      // 查询总数
      const totalRecords = await this.PrismaDB.prisma.notice.count({
        where: sqlFilters,
      });

      let page = 1;
      let pageSize = 10;

      if (
        options &&
        options.hasOwnProperty("showPagination") &&
        !options["showPagination"]
      ) {
        result = await this.PrismaDB.prisma.notice.findMany({
          where: sqlFilters,
          include: {
            author: true,
          },
        });
      } else {
        page = parseInt(pagination?.page as string) || 1;
        pageSize = parseInt(pagination?.pageSize as string) || 10;

        result = await this.PrismaDB.prisma.notice.findMany({
          skip: (page - 1) * pageSize || 0,
          take: pageSize || 10,
          where: sqlFilters,
          include: {
            author: true,
          },
          orderBy: {
            createdTime: "desc",
          },
        });

        totalPages = Math.ceil(totalRecords / pageSize);
      }

      // 分页信息
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
        message: "获取公告列表成功",
      };
    } catch (err) {
      return {
        data: null,
        code: 400,
        message: "获取公告列表失败",
        errMsg: err,
      };
    }
  }

  /**
   * 创建公告
   * @param notice
   */
  public async createNotice(notice: NoticeDto, user: User) {
    try {
      let noticeDto = plainToClass(NoticeDto, notice);
      const errors = await validate(noticeDto);
      if (errors.length > 0) {
        const errorMessages = errors.map((error) => {
          return {
            property: error.property,
            value: Object.values(error.constraints),
          };
        });
        return {
          code: 400,
          message: "参数验证失败",
          errMsg: "参数验证失败",
          data: errorMessages,
        };
      }

      const authorId = user.id;

      const result = await this.PrismaDB.prisma.notice.create({
        data: {
          ...notice,
          authorId: authorId,
        },
      });

      return {
        data: {
          ...result,
        },
        code: 200,
        message: "创建公告成功",
      };
    } catch (err) {
      return {
        data: null,
        code: 400,
        message: "创建公告失败",
        errMsg: err,
      };
    }
  }

  /**
   * 更新公告
   * @param notice
   */
  public async updateNotice(notice: any, user: User) {
    try {
      const result = await this.PrismaDB.prisma.notice.update({
        where: { id: notice.id },
        data: notice,
      });
      return {
        data: result,
        code: 200,
        message: "更新公告成功",
      };
    } catch (err) {
      console.log(err);
      return {
        data: null,
        code: 400,
        message: "更新公告失败",
        errMsg: err,
      };
    }
  }

  /**
   * 删除公告
   * @param noticeId
   */
  public async deleteNotice(noticeId: number) {
    try {
      await this.PrismaDB.prisma.$transaction(async (prisma) => {
        // 删除公告 --软删除
        await this.PrismaDB.prisma.notice.update({
          where: {
            id: noticeId,
          },
          data: {
            isDeleted: true,
            deletedTime: new Date(),
          },
        });
      });
      return {
        data: null,
        code: 200,
        message: "删除公告成功",
      };
    } catch (err) {
      return {
        data: null,
        code: 400,
        message: "删除公告失败",
        errMsg: err,
      };
    }
  }
}
