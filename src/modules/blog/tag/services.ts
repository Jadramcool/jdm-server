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
}

interface UpdateTagData {
  name?: string;
  slug?: string;
  description?: string;
  color?: string;
  sortOrder?: number;
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
        deletedTime: null,
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
        deletedTime: null,
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
  public async getTagList(query: TagListQuery = {}): Promise<Jres> {
    try {
      const {
        keyword,
        includePostCount = true,
        sortBy = "sortOrder",
        sortOrder = "asc",
        page,
        pageSize,
      } = query;

      // 构建查询条件
      const where: any = {
        deletedTime: null,
      };

      if (keyword) {
        where.OR = [
          { name: { contains: keyword } },
          { description: { contains: keyword } },
        ];
      }

      // 构建排序条件
      const orderBy: any = {};
      orderBy[sortBy] = sortOrder;

      // 分页参数
      const skip = page && pageSize ? (page - 1) * pageSize : undefined;
      const take = pageSize || undefined;

      // 查询标签
      const tags = await this.prismaService.prisma.blogTag.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          _count: includePostCount
            ? {
                select: {
                  postTags: {
                    where: {
                      post: {
                        status: BlogPostStatus.PUBLISHED,
                        deletedTime: null,
                      },
                    },
                  },
                },
              }
            : false,
        },
      });

      // 处理返回数据
      const result = tags.map((tag) => {
        const { _count, ...tagData } = tag;
        return {
          ...tagData,
          ...(includePostCount && { useCount: _count?.postTags || 0 }),
        };
      });

      // 如果有分页，返回总数
      let total;
      if (page && pageSize) {
        total = await this.prismaService.prisma.blogTag.count({ where });
      }

      return {
        data:
          page && pageSize
            ? {
                data: result,
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total! / pageSize),
              }
            : result,
        code: 200,
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
          deletedTime: null,
        },
        include: {
          postTags: {
            where: {
              post: {
                status: BlogPostStatus.PUBLISHED,
                deletedTime: null,
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
          deletedTime: null,
        },
        include: {
          postTags: {
            where: {
              post: {
                status: BlogPostStatus.PUBLISHED,
                deletedTime: null,
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
          deletedTime: null,
        },
      });

      if (!existingTag) {
        return {
          code: 404,
          message: "标签不存在",
        };
      }

      const { name, slug, description, color, sortOrder } = data;
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
          deletedTime: null,
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
            deletedTime: null,
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
            deletedTime: null,
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
          where: { deletedTime: null },
        }),
        // 有文章的标签数
        this.prismaService.prisma.blogTag.count({
          where: {
            deletedTime: null,
            useCount: { gt: 0 },
          },
        }),
        // 空标签数
        this.prismaService.prisma.blogTag.count({
          where: {
            deletedTime: null,
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
          deletedTime: null,
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
}
