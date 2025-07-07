import { inject, injectable } from "inversify";
import { PrismaDB } from "../../../db";
import { UtilService } from "../../../utils/utils";

interface CreateFriendLinkData {
  name: string;
  url: string;
  description?: string;
  avatar?: string;
  email?: string;
  status?: string;
  sortOrder?: number;
}

interface UpdateFriendLinkData {
  name?: string;
  url?: string;
  description?: string;
  avatar?: string;
  email?: string;
  status?: string;
  sortOrder?: number;
}

interface FriendLinkListQuery {
  status?: string;
  keyword?: string;
  page?: string;
  pageSize?: string;
}

@injectable()
export class BlogFriendLinkService {
  constructor(
    @inject(PrismaDB)
    private readonly prismaService: PrismaDB,
    @inject(UtilService)
    private readonly utilService: UtilService
  ) {}

  /**
   * 创建友情链接
   */
  async createFriendLink(data: CreateFriendLinkData): Promise<Jres> {
    try {
      // 检查URL是否已存在
      const existingLink =
        await this.prismaService.prisma.blogFriendLink.findFirst({
          where: {
            url: data.url,
            deletedTime: null,
          },
        });

      if (existingLink) {
        return {
          code: 400,
          message: "该URL的友情链接已存在",
          data: null,
        };
      }

      // 如果没有指定排序，设置为最大值+1
      let sortOrder = data.sortOrder;
      if (sortOrder === undefined) {
        const maxSortOrder =
          await this.prismaService.prisma.blogFriendLink.aggregate({
            where: {
              deletedTime: null,
            },
            _max: {
              sortOrder: true,
            },
          });
        sortOrder = (maxSortOrder._max.sortOrder || 0) + 1;
      }

      const friendLink = await this.prismaService.prisma.blogFriendLink.create({
        data: {
          name: data.name,
          url: data.url,
          description: data.description || "",
          avatar: data.avatar || "",
          sortOrder,
        },
      });

      return {
        code: 200,
        message: "友情链接创建成功",
        data: friendLink,
      };
    } catch (error) {
      console.error("创建友情链接失败:", error);
      return {
        code: 500,
        message: "创建友情链接失败",
        data: null,
        errMsg: error instanceof Error ? error.message : "未知错误",
      };
    }
  }

  /**
   * 获取友情链接列表
   */
  async getFriendLinkList(query: FriendLinkListQuery): Promise<Jres> {
    try {
      const { status, keyword, page, pageSize } = query;

      // 构建查询条件
      const where: any = {
        deletedTime: null,
      };

      if (status) {
        where.isVisible = status === "APPROVED";
      }

      if (keyword) {
        where.OR = [
          { name: { contains: keyword } },
          { description: { contains: keyword } },
          { url: { contains: keyword } },
        ];
      }

      // 如果提供了分页参数
      if (page && pageSize) {
        const pageNum = parseInt(page);
        const size = parseInt(pageSize);
        const skip = (pageNum - 1) * size;

        const [friendLinks, total] = await Promise.all([
          this.prismaService.prisma.blogFriendLink.findMany({
            where,
            orderBy: [{ sortOrder: "asc" }, { createdTime: "desc" }],
            skip,
            take: size,
          }),
          this.prismaService.prisma.blogFriendLink.count({ where }),
        ]);

        return {
          code: 200,
          message: "",
          data: {
            data: friendLinks,
            total,
            page: pageNum,
            pageSize: size,
            totalPages: Math.ceil(total / size),
          },
        };
      }

      // 不分页
      const friendLinks =
        await this.prismaService.prisma.blogFriendLink.findMany({
          where,
          orderBy: [{ sortOrder: "asc" }, { createdTime: "desc" }],
        });

      return {
        code: 200,
        message: "",
        data: friendLinks,
      };
    } catch (error) {
      console.error("获取友情链接列表失败:", error);
      return {
        code: 500,
        message: "获取友情链接列表失败",
        data: null,
        errMsg: error instanceof Error ? error.message : "未知错误",
      };
    }
  }

  /**
   * 获取已审核通过的友情链接
   */
  async getApprovedFriendLinks(): Promise<Jres> {
    try {
      const friendLinks =
        await this.prismaService.prisma.blogFriendLink.findMany({
          where: {
            isVisible: true,
            deletedTime: null,
          },
          orderBy: [{ sortOrder: "asc" }, { createdTime: "desc" }],
        });

      return {
        code: 200,
        message: "",
        data: friendLinks,
      };
    } catch (error) {
      console.error("获取已审核友情链接失败:", error);
      return {
        code: 500,
        message: "获取已审核友情链接失败",
        data: null,
        errMsg: error instanceof Error ? error.message : "未知错误",
      };
    }
  }

  /**
   * 根据ID获取友情链接
   */
  async getFriendLinkById(id: number): Promise<Jres> {
    try {
      const friendLink =
        await this.prismaService.prisma.blogFriendLink.findUnique({
          where: {
            id,
            deletedTime: null,
          },
        });

      if (!friendLink) {
        return {
          code: 404,
          message: "友情链接不存在",
          data: null,
        };
      }

      return {
        code: 200,
        message: "",
        data: friendLink,
      };
    } catch (error) {
      console.error("获取友情链接失败:", error);
      return {
        code: 500,
        message: "获取友情链接失败",
        data: null,
        errMsg: error instanceof Error ? error.message : "未知错误",
      };
    }
  }

  /**
   * 更新友情链接
   */
  async updateFriendLink(
    id: number,
    data: UpdateFriendLinkData
  ): Promise<Jres> {
    try {
      const existingLink =
        await this.prismaService.prisma.blogFriendLink.findUnique({
          where: {
            id,
            deletedTime: null,
          },
        });

      if (!existingLink) {
        return {
          code: 404,
          message: "友情链接不存在",
          data: null,
        };
      }

      // 如果更新URL，检查是否与其他链接冲突
      if (data.url && data.url !== existingLink.url) {
        const duplicateLink =
          await this.prismaService.prisma.blogFriendLink.findFirst({
            where: {
              url: data.url,
              id: { not: id },
              deletedTime: null,
            },
          });

        if (duplicateLink) {
          return {
            code: 400,
            message: "该URL的友情链接已存在",
            data: null,
          };
        }
      }

      const friendLink = await this.prismaService.prisma.blogFriendLink.update({
        where: { id },
        data: {
          ...data,
        },
      });

      return {
        code: 200,
        message: "友情链接更新成功",
        data: friendLink,
      };
    } catch (error) {
      console.error("更新友情链接失败:", error);
      return {
        code: 500,
        message: "更新友情链接失败",
        data: null,
        errMsg: error instanceof Error ? error.message : "未知错误",
      };
    }
  }

  /**
   * 删除友情链接
   */
  async deleteFriendLink(id: number): Promise<Jres> {
    try {
      const existingLink =
        await this.prismaService.prisma.blogFriendLink.findUnique({
          where: {
            id,
            deletedTime: null,
          },
        });

      if (!existingLink) {
        return {
          code: 404,
          message: "友情链接不存在",
          data: null,
        };
      }

      await this.prismaService.prisma.blogFriendLink.update({
        where: { id },
        data: {
          deletedTime: new Date(),
        },
      });

      return {
        code: 200,
        message: "友情链接删除成功",
        data: null,
      };
    } catch (error) {
      console.error("删除友情链接失败:", error);
      return {
        code: 500,
        message: "删除友情链接失败",
        data: null,
        errMsg: error instanceof Error ? error.message : "未知错误",
      };
    }
  }

  /**
   * 审核通过友情链接
   */
  async approveFriendLink(id: number): Promise<Jres> {
    try {
      const existingLink =
        await this.prismaService.prisma.blogFriendLink.findUnique({
          where: {
            id,
            deletedTime: null,
          },
        });

      if (!existingLink) {
        return {
          code: 404,
          message: "友情链接不存在",
          data: null,
        };
      }

      const friendLink = await this.prismaService.prisma.blogFriendLink.update({
        where: { id },
        data: {
          isVisible: true,
        },
      });

      return {
        code: 200,
        message: "友情链接审核通过",
        data: friendLink,
      };
    } catch (error) {
      console.error("审核友情链接失败:", error);
      return {
        code: 500,
        message: "审核友情链接失败",
        data: null,
        errMsg: error instanceof Error ? error.message : "未知错误",
      };
    }
  }

  /**
   * 拒绝友情链接
   */
  async rejectFriendLink(id: number): Promise<Jres> {
    try {
      const existingLink =
        await this.prismaService.prisma.blogFriendLink.findUnique({
          where: {
            id,
            deletedTime: null,
          },
        });

      if (!existingLink) {
        return {
          code: 404,
          message: "友情链接不存在",
          data: null,
        };
      }

      const friendLink = await this.prismaService.prisma.blogFriendLink.update({
        where: { id },
        data: {
          isVisible: false,
        },
      });

      return {
        code: 200,
        message: "友情链接已拒绝",
        data: friendLink,
      };
    } catch (error) {
      console.error("拒绝友情链接失败:", error);
      return {
        code: 500,
        message: "拒绝友情链接失败",
        data: null,
        errMsg: error instanceof Error ? error.message : "未知错误",
      };
    }
  }

  /**
   * 更新友情链接排序
   */
  async updateFriendLinkSort(
    sortData: Array<{ id: number; sortOrder: number }>
  ): Promise<Jres> {
    try {
      const updatePromises = sortData.map(({ id, sortOrder }) =>
        this.prismaService.prisma.blogFriendLink.update({
          where: {
            id,
            deletedTime: null,
          },
          data: {
            sortOrder,
          },
        })
      );

      await Promise.all(updatePromises);

      return {
        code: 200,
        message: "友情链接排序更新成功",
        data: null,
      };
    } catch (error) {
      console.error("更新友情链接排序失败:", error);
      return {
        code: 500,
        message: "更新友情链接排序失败",
        data: null,
        errMsg: error instanceof Error ? error.message : "未知错误",
      };
    }
  }

  /**
   * 获取友情链接统计信息
   */
  async getFriendLinkStats(): Promise<Jres> {
    try {
      const [totalLinks, visibleLinks, hiddenLinks] = await Promise.all([
        this.prismaService.prisma.blogFriendLink.count({
          where: {
            deletedTime: null,
          },
        }),
        this.prismaService.prisma.blogFriendLink.count({
          where: {
            isVisible: true,
            deletedTime: null,
          },
        }),
        this.prismaService.prisma.blogFriendLink.count({
          where: {
            isVisible: false,
            deletedTime: null,
          },
        }),
      ]);

      return {
        code: 200,
        message: "",
        data: {
          totalLinks,
          visibleLinks,
          hiddenLinks,
        },
      };
    } catch (error) {
      console.error("获取友情链接统计失败:", error);
      return {
        code: 500,
        message: "获取友情链接统计失败",
        data: null,
        errMsg: error instanceof Error ? error.message : "未知错误",
      };
    }
  }
}
