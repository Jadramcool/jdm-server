import { JWT } from "@jwt/index";
import { BlogPostStatus } from "@prisma/client";
import { inject, injectable } from "inversify";
import { PrismaDB } from "../../../db";

interface CreatePostData {
  title: string;
  slug?: string;
  summary?: string;
  content: string;
  coverImage?: string;
  status?: BlogPostStatus;
  isTop?: boolean;
  allowComment?: boolean;
  categoryId?: number;
  tagIds?: number[];
  authorId: number;
}

interface UpdatePostData {
  title?: string;
  slug?: string;
  summary?: string;
  content?: string;
  coverImage?: string;
  status?: BlogPostStatus;
  isTop?: boolean;
  allowComment?: boolean;
  categoryId?: number;
  tagIds?: number[];
}

interface PostQueryParams {
  page?: number;
  pageSize?: number;
  status?: BlogPostStatus;
  categoryId?: number;
  tagId?: number;
  keyword?: string;
  authorId?: number;
  isTop?: boolean;
}

@injectable()
export class BlogPostService {
  constructor(
    @inject(PrismaDB) private readonly PrismaDB: PrismaDB,
    @inject(JWT) private readonly JWT: JWT
  ) {}

  // 生成唯一的 slug
  private async generateUniqueSlug(
    title: string,
    excludeId?: number
  ): Promise<string> {
    let baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .substring(0, 100);

    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await this.PrismaDB.prisma.blogPost.findFirst({
        where: {
          slug,
          isDeleted: false,
          ...(excludeId && { id: { not: excludeId } }),
        },
      });

      if (!existing) break;

      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  // 创建博客文章
  async createPost(data: CreatePostData) {
    try {
      // 生成 slug
      const slug = data.slug || (await this.generateUniqueSlug(data.title));

      // 检查 slug 是否已存在
      const existingPost = await this.PrismaDB.prisma.blogPost.findFirst({
        where: { slug, isDeleted: false },
      });

      if (existingPost) {
        return {
          code: 400,
          message: "文章标识符已存在",
        };
      }

      // 验证分类是否存在
      if (data.categoryId) {
        const category = await this.PrismaDB.prisma.blogCategory.findFirst({
          where: { id: data.categoryId, isDeleted: false },
        });
        if (!category) {
          return {
            code: 400,
            message: "分类不存在",
          };
        }
      }

      // 验证标签是否存在
      if (data.tagIds && data.tagIds.length > 0) {
        const tags = await this.PrismaDB.prisma.blogTag.findMany({
          where: { id: { in: data.tagIds }, isDeleted: false },
        });
        if (tags.length !== data.tagIds.length) {
          return {
            code: 400,
            message: "部分标签不存在",
          };
        }
      }

      const publishedAt =
        data.status === BlogPostStatus.PUBLISHED ? new Date() : null;

      const post = await this.PrismaDB.prisma.blogPost.create({
        data: {
          title: data.title,
          slug,
          summary: data.summary,
          content: data.content,
          coverImage: data.coverImage,
          status: data.status || BlogPostStatus.DRAFT,
          isTop: data.isTop || false,
          allowComment: data.allowComment !== false,
          authorId: data.authorId,
          categoryId: data.categoryId,
          publishedAt,
          tags: data.tagIds
            ? {
                create: data.tagIds.map((tagId) => ({ tagId })),
              }
            : undefined,
        },
        include: {
          author: { select: { id: true, username: true, avatar: true } },
          category: { select: { id: true, name: true, slug: true } },
          tags: {
            include: {
              tag: {
                select: { id: true, name: true, slug: true, color: true },
              },
            },
          },
        },
      });

      // 更新分类文章数量
      if (data.categoryId && data.status === BlogPostStatus.PUBLISHED) {
        await this.PrismaDB.prisma.blogCategory.update({
          where: { id: data.categoryId },
          data: { postCount: { increment: 1 } },
        });
      }

      // 更新标签使用次数
      if (
        data.tagIds &&
        data.tagIds.length > 0 &&
        data.status === BlogPostStatus.PUBLISHED
      ) {
        await this.PrismaDB.prisma.blogTag.updateMany({
          where: { id: { in: data.tagIds } },
          data: { useCount: { increment: 1 } },
        });
      }

      return {
        code: 200,
        data: post,
        message: "文章创建成功",
      };
    } catch (error) {
      console.error("创建文章失败:", error);
      return {
        code: 500,
        message: "创建文章失败",
        errMsg: error instanceof Error ? error.message : "未知错误",
      };
    }
  }

  // 获取文章列表
  async getPostList(params: PostQueryParams) {
    try {
      const {
        page = 1,
        pageSize = 10,
        status,
        categoryId,
        tagId,
        keyword,
        authorId,
        isTop,
      } = params;

      const skip = (page - 1) * pageSize;
      const take = Math.min(pageSize, 100); // 限制最大页面大小

      const where: any = {
        isDeleted: false,
      };

      if (status) where.status = status;
      if (categoryId) where.categoryId = categoryId;
      if (authorId) where.authorId = authorId;
      if (isTop !== undefined) where.isTop = isTop;
      if (keyword) {
        where.OR = [
          { title: { contains: keyword } },
          { summary: { contains: keyword } },
          { content: { contains: keyword } },
        ];
      }
      if (tagId) {
        where.tags = {
          some: { tagId },
        };
      }

      const [posts, total] = await Promise.all([
        this.PrismaDB.prisma.blogPost.findMany({
          where,
          skip,
          take,
          orderBy: [
            { isTop: "desc" },
            { publishedAt: "desc" },
            { createdTime: "desc" },
          ],
          include: {
            author: { select: { id: true, username: true, avatar: true } },
            category: { select: { id: true, name: true, slug: true } },
            tags: {
              include: {
                tag: {
                  select: { id: true, name: true, slug: true, color: true },
                },
              },
            },
          },
        }),
        this.PrismaDB.prisma.blogPost.count({ where }),
      ]);

      return {
        code: 200,
        data: {
          data: posts,
          pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
          },
        },
      };
    } catch (error) {
      console.error("获取文章列表失败:", error);
      return {
        code: 500,
        message: "获取文章列表失败",
        errMsg: error instanceof Error ? error.message : "未知错误",
      };
    }
  }

  // 根据ID获取文章详情
  async getPostById(id: number, incrementView = false) {
    try {
      const post = await this.PrismaDB.prisma.blogPost.findFirst({
        where: { id, isDeleted: false },
        include: {
          author: { select: { id: true, username: true, avatar: true } },
          category: { select: { id: true, name: true, slug: true } },
          tags: {
            include: {
              tag: {
                select: { id: true, name: true, slug: true, color: true },
              },
            },
          },
          comments: {
            where: { isDeleted: false, status: "APPROVED" },
            orderBy: { createdTime: "desc" },
            take: 5,
            include: {
              user: { select: { id: true, username: true, avatar: true } },
            },
          },
        },
      });

      if (!post) {
        return {
          code: 404,
          message: "文章不存在",
        };
      }

      // 增加浏览量
      if (incrementView) {
        await this.PrismaDB.prisma.blogPost.update({
          where: { id },
          data: { viewCount: { increment: 1 } },
        });
        post.viewCount += 1;
      }

      return {
        code: 200,
        data: post,
      };
    } catch (error) {
      console.error("获取文章详情失败:", error);
      return {
        code: 500,
        message: "获取文章详情失败",
        errMsg: error instanceof Error ? error.message : "未知错误",
      };
    }
  }

  // 根据slug获取文章详情
  async getPostBySlug(slug: string, incrementView = false) {
    try {
      const post = await this.PrismaDB.prisma.blogPost.findFirst({
        where: { slug, isDeleted: false },
        include: {
          author: { select: { id: true, username: true, avatar: true } },
          category: { select: { id: true, name: true, slug: true } },
          tags: {
            include: {
              tag: {
                select: { id: true, name: true, slug: true, color: true },
              },
            },
          },
          comments: {
            where: { isDeleted: false, status: "APPROVED" },
            orderBy: { createdTime: "desc" },
            take: 5,
            include: {
              user: { select: { id: true, username: true, avatar: true } },
            },
          },
        },
      });

      if (!post) {
        return {
          code: 404,
          message: "文章不存在",
        };
      }

      // 增加浏览量
      if (incrementView) {
        await this.PrismaDB.prisma.blogPost.update({
          where: { id: post.id },
          data: { viewCount: { increment: 1 } },
        });
        post.viewCount += 1;
      }

      return {
        code: 200,
        data: post,
      };
    } catch (error) {
      console.error("获取文章详情失败:", error);
      return {
        code: 500,
        message: "获取文章详情失败",
        errMsg: error instanceof Error ? error.message : "未知错误",
      };
    }
  }

  // 更新文章
  async updatePost(id: number, data: UpdatePostData, authorId?: number) {
    try {
      // 检查文章是否存在
      const existingPost = await this.PrismaDB.prisma.blogPost.findFirst({
        where: { id, isDeleted: false },
      });

      if (!existingPost) {
        return {
          code: 404,
          message: "文章不存在",
        };
      }

      // 权限检查（如果提供了authorId）
      if (authorId && existingPost.authorId !== authorId) {
        return {
          code: 403,
          message: "无权限修改此文章",
        };
      }

      // 生成新的 slug（如果标题改变了）
      let slug = data.slug;
      if (data.title && data.title !== existingPost.title && !data.slug) {
        slug = await this.generateUniqueSlug(data.title, id);
      }

      // 检查 slug 是否已存在
      if (slug && slug !== existingPost.slug) {
        const existingSlug = await this.PrismaDB.prisma.blogPost.findFirst({
          where: { slug, isDeleted: false, id: { not: id } },
        });
        if (existingSlug) {
          return {
            code: 400,
            message: "文章标识符已存在",
          };
        }
      }

      // 验证分类是否存在
      if (data.categoryId) {
        const category = await this.PrismaDB.prisma.blogCategory.findFirst({
          where: { id: data.categoryId, isDeleted: false },
        });
        if (!category) {
          return {
            code: 400,
            message: "分类不存在",
          };
        }
      }

      // 验证标签是否存在
      if (data.tagIds && data.tagIds.length > 0) {
        const tags = await this.PrismaDB.prisma.blogTag.findMany({
          where: { id: { in: data.tagIds }, isDeleted: false },
        });
        if (tags.length !== data.tagIds.length) {
          return {
            code: 400,
            message: "部分标签不存在",
          };
        }
      }

      // 处理发布时间
      let publishedAt = existingPost.publishedAt;
      if (
        data.status === BlogPostStatus.PUBLISHED &&
        !existingPost.publishedAt
      ) {
        publishedAt = new Date();
      } else if (data.status && data.status !== BlogPostStatus.PUBLISHED) {
        publishedAt = null;
      }

      const updateData: any = {
        ...data,
        slug,
        publishedAt,
      };

      // 处理标签更新
      if (data.tagIds !== undefined) {
        // 删除现有标签关联
        await this.PrismaDB.prisma.blogPostTag.deleteMany({
          where: { postId: id },
        });

        // 创建新的标签关联
        if (data.tagIds.length > 0) {
          updateData.tags = {
            create: data.tagIds.map((tagId) => ({ tagId })),
          };
        }
      }

      const post = await this.PrismaDB.prisma.blogPost.update({
        where: { id },
        data: updateData,
        include: {
          author: { select: { id: true, username: true, avatar: true } },
          category: { select: { id: true, name: true, slug: true } },
          tags: {
            include: {
              tag: {
                select: { id: true, name: true, slug: true, color: true },
              },
            },
          },
        },
      });

      return {
        code: 200,
        data: post,
        message: "文章更新成功",
      };
    } catch (error) {
      console.error("更新文章失败:", error);
      return {
        code: 500,
        message: "更新文章失败",
        errMsg: error instanceof Error ? error.message : "未知错误",
      };
    }
  }

  // 删除文章（软删除）
  async deletePost(id: number, authorId?: number) {
    try {
      const existingPost = await this.PrismaDB.prisma.blogPost.findFirst({
        where: { id, isDeleted: false },
      });

      if (!existingPost) {
        return {
          code: 404,
          message: "文章不存在",
        };
      }

      // 权限检查
      if (authorId && existingPost.authorId !== authorId) {
        return {
          code: 403,
          message: "无权限删除此文章",
        };
      }

      await this.PrismaDB.prisma.blogPost.update({
        where: { id },
        data: {
          isDeleted: true,
          deletedTime: new Date(),
        },
      });

      // 更新分类文章数量
      if (
        existingPost.categoryId &&
        existingPost.status === BlogPostStatus.PUBLISHED
      ) {
        await this.PrismaDB.prisma.blogCategory.update({
          where: { id: existingPost.categoryId },
          data: { postCount: { decrement: 1 } },
        });
      }

      return {
        code: 200,
        message: "文章删除成功",
      };
    } catch (error) {
      console.error("删除文章失败:", error);
      return {
        code: 500,
        message: "删除文章失败",
        errMsg: error instanceof Error ? error.message : "未知错误",
      };
    }
  }

  // 切换文章置顶状态
  async toggleTop(id: number, authorId?: number) {
    try {
      const existingPost = await this.PrismaDB.prisma.blogPost.findFirst({
        where: { id, isDeleted: false },
      });

      if (!existingPost) {
        return {
          code: 404,
          message: "文章不存在",
        };
      }

      // 权限检查
      if (authorId && existingPost.authorId !== authorId) {
        return {
          code: 403,
          message: "无权限修改此文章",
        };
      }

      const post = await this.PrismaDB.prisma.blogPost.update({
        where: { id },
        data: { isTop: !existingPost.isTop },
      });

      return {
        code: 200,
        data: { isTop: post.isTop },
        message: `文章${post.isTop ? "置顶" : "取消置顶"}成功`,
      };
    } catch (error) {
      console.error("切换置顶状态失败:", error);
      return {
        code: 500,
        message: "操作失败",
        errMsg: error instanceof Error ? error.message : "未知错误",
      };
    }
  }

  // 获取文章统计信息
  async getPostStats() {
    try {
      const [
        totalPosts,
        publishedPosts,
        draftPosts,
        archivedPosts,
        totalViews,
        totalLikes,
      ] = await Promise.all([
        this.PrismaDB.prisma.blogPost.count({ where: { isDeleted: false } }),
        this.PrismaDB.prisma.blogPost.count({
          where: { isDeleted: false, status: BlogPostStatus.PUBLISHED },
        }),
        this.PrismaDB.prisma.blogPost.count({
          where: { isDeleted: false, status: BlogPostStatus.DRAFT },
        }),
        this.PrismaDB.prisma.blogPost.count({
          where: { isDeleted: false, status: BlogPostStatus.ARCHIVED },
        }),
        this.PrismaDB.prisma.blogPost.aggregate({
          where: { isDeleted: false },
          _sum: { viewCount: true },
        }),
        this.PrismaDB.prisma.blogPost.aggregate({
          where: { isDeleted: false },
          _sum: { likeCount: true },
        }),
      ]);

      return {
        code: 200,
        data: {
          totalPosts,
          publishedPosts,
          draftPosts,
          archivedPosts,
          totalViews: totalViews._sum.viewCount || 0,
          totalLikes: totalLikes._sum.likeCount || 0,
        },
      };
    } catch (error) {
      console.error("获取统计信息失败:", error);
      return {
        code: 500,
        message: "获取统计信息失败",
        errMsg: error instanceof Error ? error.message : "未知错误",
      };
    }
  }
}
