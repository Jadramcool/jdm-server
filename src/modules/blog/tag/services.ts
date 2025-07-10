import { FilterHelper } from "@/utils";
import { BlogPostStatus } from "@prisma/client";
import { inject, injectable } from "inversify";
import { PrismaDB } from "../../../db";
import { UtilService } from "../../../utils/utils";

interface CreateTagData {
  name: string;
  slug?: string;
  description?: string;
  color?: string;
  sortOrder?: number;
  icon?: string;
}

interface UpdateTagData {
  name?: string;
  slug?: string;
  description?: string;
  color?: string;
  sortOrder?: number;
  icon?: string;
}

interface TagListQuery {
  keyword?: string;
  includePostCount?: boolean;
  sortBy?: "name" | "useCount" | "createdTime" | "sortOrder";
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

@injectable()
export class BlogTagService {
  constructor(
    @inject(PrismaDB) private readonly prismaService: PrismaDB,
    @inject(UtilService) private readonly utilService: UtilService
  ) {}

  /**
   * 生成标签 slug
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .substring(0, 50);
  }

  /**
   * 检查标签名称是否已存在
   */
  private async checkTagNameExists(
    name: string,
    excludeId?: number
  ): Promise<boolean> {
    const existingTag = await this.prismaService.prisma.blogTag.findFirst({
      where: {
        name,
        isDeleted: false,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });
    return !!existingTag;
  }

  /**
   * 检查标签 slug 是否已存在
   */
  private async checkTagSlugExists(
    slug: string,
    excludeId?: number
  ): Promise<boolean> {
    const existingTag = await this.prismaService.prisma.blogTag.findFirst({
      where: {
        slug,
        isDeleted: false,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });
    return !!existingTag;
  }

  /**
   * 创建标签
   */
  public async createTag(data: CreateTagData): Promise<Jres> {
    try {
      const { name, slug, description, color, sortOrder = 0 } = data;

      // 检查标签名称是否已存在
      const nameExists = await this.checkTagNameExists(name);
      if (nameExists) {
        return {
          code: 400,
          message: "标签名称已存在",
        };
      }

      // 生成或验证 slug
      const finalSlug = slug || this.generateSlug(name);
      const slugExists = await this.checkTagSlugExists(finalSlug);
      if (slugExists) {
        return {
          code: 400,
          message: "标签标识符已存在",
        };
      }

      // 创建标签
      const tag = await this.prismaService.prisma.blogTag.create({
        data: {
          name,
          slug: finalSlug,
          description,
          color,
        },
      });

      return {
        data: tag,
        code: 200,
        message: "标签创建成功",
      };
    } catch (error) {
      console.error("创建标签失败:", error);
      return {
        code: 500,
        message: "创建标签失败",
        errMsg: error instanceof Error ? error.message : "未知错误",
      };
    }
  }

  /**
   * 获取标签列表
   */
  public async getTagList(config: ReqListConfig): Promise<Jres> {
    try {
      let { filters, options, pagination } = config;

      filters = filters || {};
      let sqlFilters = {};

      const keys = Object.keys(filters);
      if (keys.length > 0) {
        // 添加基础过滤条件
        sqlFilters = FilterHelper.addFilterCondition(filters, [
          "id",
          "name",
          "description",
          "color",
          "sortOrder",
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
      const totalRecords = await this.prismaService.prisma.blogTag.count({
        where: sqlFilters,
      });

      let page = 1;
      let pageSize = 10;

      if (
        options &&
        options.hasOwnProperty("showPagination") &&
        !options["showPagination"]
      ) {
        result = await this.prismaService.prisma.blogTag.findMany({
          where: sqlFilters,
          include: {
            _count: {
              select: {
                postTags: {
                  where: {
                    post: {
                      status: BlogPostStatus.PUBLISHED,
                      isDeleted: false,
                    },
                  },
                },
              },
            },
          },
          orderBy: [{ createdTime: "desc" }],
        });
      } else {
        page = parseInt(pagination?.page as string) || 1;
        pageSize = parseInt(pagination?.pageSize as string) || 10;

        result = await this.prismaService.prisma.blogTag.findMany({
          skip: (page - 1) * pageSize || 0,
          take: pageSize || 10,
          where: sqlFilters,
          include: {
            _count: {
              select: {
                postTags: {
                  where: {
                    post: {
                      status: BlogPostStatus.PUBLISHED,
                      isDeleted: false,
                    },
                  },
                },
              },
            },
          },
          orderBy: [{ createdTime: "desc" }],
        });

        totalPages = Math.ceil(totalRecords / pageSize);
      }

      // 处理返回数据
      const transformedTags = result.map((tag) => {
        const { _count, ...tagData } = tag;
        return {
          ...tagData,
          useCount: _count?.postTags || 0,
        };
      });

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
        code: 200,
        data: {
          data: transformedTags,
          pagination: paginationData,
        },
        message: "获取标签列表成功",
      };
    } catch (error) {
      console.error("获取标签列表失败:", error);
      return {
        code: 500,
        message: "获取标签列表失败",
        errMsg: error instanceof Error ? error.message : "未知错误",
      };
    }
  }

  /**
   * 根据ID获取标签详情
   */
  public async getTagById(id: number): Promise<Jres> {
    try {
      const tag = await this.prismaService.prisma.blogTag.findFirst({
        where: {
          id,
          isDeleted: false,
        },
        include: {
          postTags: {
            where: {
              post: {
                status: BlogPostStatus.PUBLISHED,
                isDeleted: false,
              },
            },
            include: {
              post: {
                select: {
                  id: true,
                  title: true,
                  slug: true,
                  summary: true,
                  coverImage: true,
                  viewCount: true,
                  likeCount: true,
                  commentCount: true,
                  publishedAt: true,
                  author: {
                    select: {
                      id: true,
                      username: true,
                      avatar: true,
                    },
                  },
                },
              },
            },
            take: 10,
            orderBy: {
              post: {
                publishedAt: "desc",
              },
            },
          },
        },
      });

      if (!tag) {
        return {
          code: 404,
          message: "标签不存在",
        };
      }

      // 处理返回数据
      const { postTags, ...tagData } = tag;
      const posts = postTags.map((pt) => pt.post);

      return {
        data: {
          ...tagData,
          posts,
        },
        code: 200,
      };
    } catch (error) {
      console.error("获取标签详情失败:", error);
      return {
        code: 500,
        message: "获取标签详情失败",
        errMsg: error instanceof Error ? error.message : "未知错误",
      };
    }
  }

  /**
   * 根据slug获取标签详情
   */
  public async getTagBySlug(slug: string): Promise<Jres> {
    try {
      const tag = await this.prismaService.prisma.blogTag.findFirst({
        where: {
          slug,
          isDeleted: false,
        },
        include: {
          postTags: {
            where: {
              post: {
                status: BlogPostStatus.PUBLISHED,
                isDeleted: false,
              },
            },
            include: {
              post: {
                select: {
                  id: true,
                  title: true,
                  slug: true,
                  summary: true,
                  coverImage: true,
                  viewCount: true,
                  likeCount: true,
                  commentCount: true,
                  publishedAt: true,
                  author: {
                    select: {
                      id: true,
                      username: true,
                      avatar: true,
                    },
                  },
                },
              },
            },
            take: 10,
            orderBy: {
              post: {
                publishedAt: "desc",
              },
            },
          },
        },
      });

      if (!tag) {
        return {
          code: 404,
          message: "标签不存在",
        };
      }

      // 处理返回数据
      const { postTags, ...tagData } = tag;
      const posts = postTags.map((pt) => pt.post);

      return {
        data: {
          ...tagData,
          posts,
        },
        code: 200,
      };
    } catch (error) {
      console.error("获取标签详情失败:", error);
      return {
        code: 500,
        message: "获取标签详情失败",
        errMsg: error instanceof Error ? error.message : "未知错误",
      };
    }
  }

  /**
   * 更新标签
   */
  public async updateTag(id: number, data: UpdateTagData): Promise<Jres> {
    try {
      // 检查标签是否存在
      const existingTag = await this.prismaService.prisma.blogTag.findFirst({
        where: {
          id,
          isDeleted: false,
        },
      });

      if (!existingTag) {
        return {
          code: 404,
          message: "标签不存在",
        };
      }

      const { name, slug, description, color, sortOrder, icon } = data;
      const updateData: any = {};

      // 检查名称是否重复
      if (name && name !== existingTag.name) {
        const nameExists = await this.checkTagNameExists(name, id);
        if (nameExists) {
          return {
            code: 400,
            message: "标签名称已存在",
          };
        }
        updateData.name = name;
      }

      // 检查 slug 是否重复
      if (slug && slug !== existingTag.slug) {
        const slugExists = await this.checkTagSlugExists(slug, id);
        if (slugExists) {
          return {
            code: 400,
            message: "标签标识符已存在",
          };
        }
        updateData.slug = slug;
      }

      // 更新其他字段
      if (description !== undefined) updateData.description = description;
      if (color !== undefined) updateData.color = color;
      if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
      if (icon !== undefined) updateData.icon = icon;

      // 如果没有要更新的字段
      if (Object.keys(updateData).length === 0) {
        return {
          data: existingTag,
          code: 200,
          message: "标签信息无变化",
        };
      }

      updateData.updatedTime = new Date();

      // 更新标签
      const updatedTag = await this.prismaService.prisma.blogTag.update({
        where: { id },
        data: updateData,
      });

      return {
        data: updatedTag,
        code: 200,
        message: "标签更新成功",
      };
    } catch (error) {
      console.error("更新标签失败:", error);
      return {
        code: 500,
        message: "更新标签失败",
        errMsg: error instanceof Error ? error.message : "未知错误",
      };
    }
  }

  /**
   * 删除标签（软删除）
   */
  public async deleteTag(id: number): Promise<Jres> {
    try {
      // 检查标签是否存在
      const existingTag = await this.prismaService.prisma.blogTag.findFirst({
        where: {
          id,
          isDeleted: false,
        },
      });

      if (!existingTag) {
        return {
          code: 404,
          message: "标签不存在",
        };
      }

      // 检查是否有关联的文章
      const postCount = await this.prismaService.prisma.blogPostTag.count({
        where: {
          tagId: id,
          post: {
            isDeleted: false,
          },
        },
      });

      if (postCount > 0) {
        return {
          code: 400,
          message: "该标签下还有文章，无法删除",
        };
      }

      // 软删除标签
      await this.prismaService.prisma.blogTag.update({
        where: { id },
        data: {
          isDeleted: true,
          deletedTime: new Date(),
        },
      });

      return {
        code: 200,
        message: "标签删除成功",
      };
    } catch (error) {
      console.error("删除标签失败:", error);
      return {
        code: 500,
        message: "删除标签失败",
        errMsg: error instanceof Error ? error.message : "未知错误",
      };
    }
  }

  /**
   * 更新标签使用次数
   */
  public async updateTagPostCount(id: number): Promise<Jres> {
    try {
      // 计算实际文章数量
      const useCount = await this.prismaService.prisma.blogPostTag.count({
        where: {
          tagId: id,
          post: {
            status: BlogPostStatus.PUBLISHED,
            isDeleted: false,
          },
        },
      });

      // 更新标签的使用次数
      await this.prismaService.prisma.blogTag.update({
        where: { id },
        data: {
          useCount,
          updatedTime: new Date(),
        },
      });

      return {
        data: { useCount },
        code: 200,
        message: "标签使用次数更新成功",
      };
    } catch (error) {
      console.error("更新标签使用次数失败:", error);
      return {
        code: 500,
        message: "更新标签使用次数失败",
        errMsg: error instanceof Error ? error.message : "未知错误",
      };
    }
  }

  /**
   * 获取标签统计信息
   */
  public async getTagStats(): Promise<Jres> {
    try {
      const [totalTags, tagsWithPosts, emptyTags] = await Promise.all([
        // 总标签数
        this.prismaService.prisma.blogTag.count({
          where: { isDeleted: false },
        }),
        // 有文章的标签数
        this.prismaService.prisma.blogTag.count({
          where: {
            isDeleted: false,
            useCount: { gt: 0 },
          },
        }),
        // 空标签数
        this.prismaService.prisma.blogTag.count({
          where: {
            isDeleted: false,
            useCount: 0,
          },
        }),
      ]);

      return {
        data: {
          totalTags,
          tagsWithPosts,
          emptyTags,
        },
        code: 200,
      };
    } catch (error) {
      console.error("获取标签统计失败:", error);
      return {
        code: 500,
        message: "获取标签统计失败",
        errMsg: error instanceof Error ? error.message : "未知错误",
      };
    }
  }

  /**
   * 获取热门标签
   */
  public async getPopularTags(limit: number = 10): Promise<Jres> {
    try {
      const tags = await this.prismaService.prisma.blogTag.findMany({
        where: {
          isDeleted: false,
          useCount: { gt: 0 },
        },
        orderBy: {
          useCount: "desc",
        },
        take: limit,
      });

      return {
        data: tags,
        code: 200,
      };
    } catch (error) {
      console.error("获取热门标签失败:", error);
      return {
        code: 500,
        message: "获取热门标签失败",
        errMsg: error instanceof Error ? error.message : "未知错误",
      };
    }
  }

  /**
   * 全局更新所有标签的文章数量
   */
  public async updateAllTagsPostCount(): Promise<Jres> {
    try {
      // 获取所有未删除的标签
      const tags = await this.prismaService.prisma.blogTag.findMany({
        where: {
          isDeleted: false,
        },
        select: {
          id: true,
        },
      });
      let updatedCount = 0;
      const results = [];

      // 批量更新每个标签的文章数量
      for (const tag of tags) {
        try {
          // 计算该标签的实际文章数量
          const useCount = await this.prismaService.prisma.blogPostTag.count({
            where: {
              tagId: tag.id,
              post: {
                status: BlogPostStatus.PUBLISHED,
                isDeleted: false,
              },
            },
          });

          // 更新标签的使用次数
          await this.prismaService.prisma.blogTag.update({
            where: { id: tag.id },
            data: {
              useCount,
              updatedTime: new Date(),
            },
          });

          results.push({
            tagId: tag.id,
            useCount,
            status: "success",
          });
          updatedCount++;
        } catch (error) {
          console.error(`更新标签 ${tag.id} 文章数量失败:`, error);
          results.push({
            tagId: tag.id,
            status: "failed",
            error: error instanceof Error ? error.message : "未知错误",
          });
        }
      }

      return {
        data: {
          totalTags: tags.length,
          updatedCount,
          failedCount: tags.length - updatedCount,
          results,
        },
        code: 200,
        message: `成功更新 ${updatedCount}/${tags.length} 个标签的文章数量`,
      };
    } catch (error) {
      console.error("全局更新标签文章数量失败:", error);
      return {
        code: 500,
        message: "全局更新标签文章数量失败",
        errMsg: error instanceof Error ? error.message : "未知错误",
      };
    }
  }
}
