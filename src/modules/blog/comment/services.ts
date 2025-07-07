import { BlogCommentStatus, BlogPostStatus } from "@prisma/client";
import { inject, injectable } from "inversify";
import { PrismaDB } from "../../../db";
import { UtilService } from "../../../utils/utils";

interface CreateCommentData {
  postId: number;
  content: string;
  parentId?: number;
  userId?: number;
  authorName?: string;
  authorEmail?: string;
  authorUrl?: string;
  authorIp?: string;
  userAgent?: string;
}

interface UpdateCommentData {
  content?: string;
  status?: BlogCommentStatus;
}

interface CommentListQuery {
  postId?: number;
  userId?: number;
  status?: BlogCommentStatus;
  keyword?: string;
  parentId?: number;
  includeReplies?: boolean;
  sortBy?: "createdTime" | "likeCount";
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

@injectable()
export class BlogCommentService {
  constructor(
    @inject(PrismaDB)
    private readonly prismaService: PrismaDB,
    @inject(UtilService)
    private readonly utilService: UtilService
  ) {}

  /**
   * 创建评论
   */
  public async createComment(data: CreateCommentData): Promise<Jres> {
    try {
      const {
        postId,
        content,
        parentId,
        userId,
        authorName,
        authorEmail,
        authorUrl,
        authorIp,
        userAgent,
      } = data;

      // 检查文章是否存在且已发布
      const post = await this.prismaService.prisma.blogPost.findFirst({
        where: {
          id: postId,
          status: BlogPostStatus.PUBLISHED,
          deletedTime: null,
        },
      });

      if (!post) {
        return {
          code: 404,
          message: "文章不存在或未发布",
        };
      }

      // 如果是回复评论，检查父评论是否存在
      if (parentId) {
        const parentComment =
          await this.prismaService.prisma.blogComment.findFirst({
            where: {
              id: parentId,
              postId,
              status: BlogCommentStatus.APPROVED,
              deletedTime: null,
            },
          });

        if (!parentComment) {
          return {
            code: 404,
            message: "父评论不存在",
          };
        }
      }

      // 创建评论
      const comment = await this.prismaService.prisma.blogComment.create({
        data: {
          postId,
          content,
          parentId,
          userId,
          authorName,
          authorEmail,
          authorUrl,
          authorIp,
          userAgent,
          status: BlogCommentStatus.PENDING, // 默认待审核
          likeCount: 0,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
          parent: {
            select: {
              id: true,
              content: true,
              authorName: true,
              user: {
                select: {
                  username: true,
                },
              },
            },
          },
        },
      });

      // 更新文章评论数量
      await this.updatePostCommentCount(postId);

      return {
        data: comment,
        code: 200,
        message: "评论创建成功，等待审核",
      };
    } catch (error) {
      console.error("创建评论失败:", error);
      return {
        code: 500,
        message: "创建评论失败",
        errMsg: error instanceof Error ? error.message : "未知错误",
      };
    }
  }

  /**
   * 获取评论列表
   */
  public async getCommentList(query: CommentListQuery = {}): Promise<Jres> {
    try {
      const {
        postId,
        userId,
        status,
        keyword,
        parentId,
        includeReplies = true,
        sortBy = "createdTime",
        sortOrder = "desc",
        page,
        pageSize,
      } = query;

      // 构建查询条件
      const where: any = {
        deletedTime: null,
      };

      if (postId) where.postId = postId;
      if (userId) where.userId = userId;
      if (status) where.status = status;
      if (parentId !== undefined) where.parentId = parentId;

      if (keyword) {
        where.OR = [
          { content: { contains: keyword } },
          { authorName: { contains: keyword } },
        ];
      }

      // 构建排序条件
      const orderBy: any = {};
      orderBy[sortBy] = sortOrder;

      // 分页参数
      const skip = page && pageSize ? (page - 1) * pageSize : undefined;
      const take = pageSize || undefined;

      // 查询评论
      const comments = await this.prismaService.prisma.blogComment.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
          parent: {
            select: {
              id: true,
              content: true,
              authorName: true,
              user: {
                select: {
                  username: true,
                },
              },
            },
          },
          post: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
          ...(includeReplies && {
            replies: {
              where: {
                deletedTime: null,
                status: BlogCommentStatus.APPROVED,
              },
              orderBy: {
                createdTime: "asc",
              },
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    avatar: true,
                  },
                },
              },
            },
          }),
        },
      });

      // 如果有分页，返回总数
      let total;
      if (page && pageSize) {
        total = await this.prismaService.prisma.blogComment.count({ where });
      }

      return {
        data:
          page && pageSize
            ? {
                data: comments,
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total! / pageSize),
              }
            : comments,
        code: 200,
      };
    } catch (error) {
      console.error("获取评论列表失败:", error);
      return {
        code: 500,
        message: "获取评论列表失败",
        errMsg: error instanceof Error ? error.message : "未知错误",
      };
    }
  }

  /**
   * 根据ID获取评论详情
   */
  public async getCommentById(id: number): Promise<Jres> {
    try {
      const comment = await this.prismaService.prisma.blogComment.findFirst({
        where: {
          id,
          deletedTime: null,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
          parent: {
            select: {
              id: true,
              content: true,
              authorName: true,
              user: {
                select: {
                  username: true,
                },
              },
            },
          },
          post: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
          children: {
            where: {
              deletedTime: null,
              status: BlogCommentStatus.APPROVED,
            },
            orderBy: {
              createdTime: "asc",
            },
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  avatar: true,
                },
              },
            },
          },
        },
      });

      if (!comment) {
        return {
          code: 404,
          message: "评论不存在",
        };
      }

      return {
        data: comment,
        code: 200,
      };
    } catch (error) {
      console.error("获取评论详情失败:", error);
      return {
        code: 500,
        message: "获取评论详情失败",
        errMsg: error instanceof Error ? error.message : "未知错误",
      };
    }
  }

  /**
   * 更新评论
   */
  public async updateComment(
    id: number,
    data: UpdateCommentData
  ): Promise<Jres> {
    try {
      // 检查评论是否存在
      const existingComment =
        await this.prismaService.prisma.blogComment.findFirst({
          where: {
            id,
            deletedTime: null,
          },
        });

      if (!existingComment) {
        return {
          code: 404,
          message: "评论不存在",
        };
      }

      const { content, status } = data;
      const updateData: any = {};

      if (content !== undefined) updateData.content = content;
      if (status !== undefined) updateData.status = status;

      // 如果没有要更新的字段
      if (Object.keys(updateData).length === 0) {
        return {
          data: existingComment,
          code: 200,
          message: "评论信息无变化",
        };
      }

      updateData.updatedTime = new Date();

      // 更新评论
      const updatedComment = await this.prismaService.prisma.blogComment.update(
        {
          where: { id },
          data: updateData,
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
            parent: {
              select: {
                id: true,
                content: true,
                authorName: true,
              },
            },
            post: {
              select: {
                id: true,
                title: true,
                slug: true,
              },
            },
          },
        }
      );

      // 如果状态发生变化，更新文章评论数量
      if (status !== undefined) {
        await this.updatePostCommentCount(existingComment.postId);
      }

      return {
        data: updatedComment,
        code: 200,
        message: "评论更新成功",
      };
    } catch (error) {
      console.error("更新评论失败:", error);
      return {
        code: 500,
        message: "更新评论失败",
        errMsg: error instanceof Error ? error.message : "未知错误",
      };
    }
  }

  /**
   * 删除评论（软删除）
   */
  public async deleteComment(id: number): Promise<Jres> {
    try {
      // 检查评论是否存在
      const existingComment =
        await this.prismaService.prisma.blogComment.findFirst({
          where: {
            id,
            deletedTime: null,
          },
        });

      if (!existingComment) {
        return {
          code: 404,
          message: "评论不存在",
        };
      }

      // 软删除评论及其所有回复
      await this.prismaService.prisma.$transaction(async (tx) => {
        // 删除所有回复
        await tx.blogComment.updateMany({
          where: {
            parentId: id,
            deletedTime: null,
          },
          data: {
            deletedTime: new Date(),
          },
        });

        // 删除主评论
        await tx.blogComment.update({
          where: { id },
          data: {
            deletedTime: new Date(),
          },
        });
      });

      // 更新文章评论数量
      await this.updatePostCommentCount(existingComment.postId);

      return {
        code: 200,
        message: "评论删除成功",
      };
    } catch (error) {
      console.error("删除评论失败:", error);
      return {
        code: 500,
        message: "删除评论失败",
        errMsg: error instanceof Error ? error.message : "未知错误",
      };
    }
  }

  /**
   * 审核评论
   */
  public async approveComment(id: number): Promise<Jres> {
    try {
      const result = await this.updateComment(id, {
        status: BlogCommentStatus.APPROVED,
      });
      if (result.code === 200) {
        result.message = "评论审核通过";
      }
      return result;
    } catch (error) {
      console.error("审核评论失败:", error);
      return {
        code: 500,
        message: "审核评论失败",
        errMsg: error instanceof Error ? error.message : "未知错误",
      };
    }
  }

  /**
   * 拒绝评论
   */
  public async rejectComment(id: number): Promise<Jres> {
    try {
      const result = await this.updateComment(id, {
        status: BlogCommentStatus.REJECTED,
      });
      if (result.code === 200) {
        result.message = "评论已拒绝";
      }
      return result;
    } catch (error) {
      console.error("拒绝评论失败:", error);
      return {
        code: 500,
        message: "拒绝评论失败",
        errMsg: error instanceof Error ? error.message : "未知错误",
      };
    }
  }

  /**
   * 点赞/取消点赞评论
   */
  public async toggleCommentLike(
    commentId: number,
    userId: number
  ): Promise<Jres> {
    try {
      // 检查评论是否存在
      const comment = await this.prismaService.prisma.blogComment.findFirst({
        where: {
          id: commentId,
          deletedTime: null,
          status: BlogCommentStatus.APPROVED,
        },
      });

      if (!comment) {
        return {
          code: 404,
          message: "评论不存在",
        };
      }

      // 检查是否已点赞
      const existingLike =
        await this.prismaService.prisma.blogCommentLike.findFirst({
          where: {
            commentId,
            userId,
          },
        });

      let isLiked: boolean;
      let likeCount: number;

      if (existingLike) {
        // 取消点赞
        await this.prismaService.prisma.blogCommentLike.delete({
          where: { id: existingLike.id },
        });
        isLiked = false;
        likeCount = Math.max(0, comment.likeCount - 1);
      } else {
        // 添加点赞
        await this.prismaService.prisma.blogCommentLike.create({
          data: {
            commentId,
            userId,
          },
        });
        isLiked = true;
        likeCount = comment.likeCount + 1;
      }

      // 更新评论点赞数
      await this.prismaService.prisma.blogComment.update({
        where: { id: commentId },
        data: { likeCount },
      });

      return {
        data: {
          isLiked,
          likeCount,
        },
        code: 200,
        message: isLiked ? "点赞成功" : "取消点赞成功",
      };
    } catch (error) {
      console.error("切换评论点赞状态失败:", error);
      return {
        code: 500,
        message: "操作失败",
        errMsg: error instanceof Error ? error.message : "未知错误",
      };
    }
  }

  /**
   * 更新文章评论数量
   */
  private async updatePostCommentCount(postId: number): Promise<void> {
    try {
      const commentCount = await this.prismaService.prisma.blogComment.count({
        where: {
          postId,
          status: BlogCommentStatus.APPROVED,
          deletedTime: null,
        },
      });

      await this.prismaService.prisma.blogPost.update({
        where: { id: postId },
        data: { commentCount },
      });
    } catch (error) {
      console.error("更新文章评论数量失败:", error);
    }
  }

  /**
   * 获取评论统计信息
   */
  public async getCommentStats(): Promise<Jres> {
    try {
      const [
        totalComments,
        pendingComments,
        approvedComments,
        rejectedComments,
      ] = await Promise.all([
        // 总评论数
        this.prismaService.prisma.blogComment.count({
          where: { deletedTime: null },
        }),
        // 待审核评论数
        this.prismaService.prisma.blogComment.count({
          where: {
            deletedTime: null,
            status: BlogCommentStatus.PENDING,
          },
        }),
        // 已通过评论数
        this.prismaService.prisma.blogComment.count({
          where: {
            deletedTime: null,
            status: BlogCommentStatus.APPROVED,
          },
        }),
        // 已拒绝评论数
        this.prismaService.prisma.blogComment.count({
          where: {
            deletedTime: null,
            status: BlogCommentStatus.REJECTED,
          },
        }),
      ]);

      return {
        data: {
          totalComments,
          pendingComments,
          approvedComments,
          rejectedComments,
        },
        code: 200,
      };
    } catch (error) {
      console.error("获取评论统计失败:", error);
      return {
        code: 500,
        message: "获取评论统计失败",
        errMsg: error instanceof Error ? error.message : "未知错误",
      };
    }
  }

  /**
   * 获取最新评论
   */
  public async getLatestComments(limit: number = 10): Promise<Jres> {
    try {
      const comments = await this.prismaService.prisma.blogComment.findMany({
        where: {
          deletedTime: null,
          status: BlogCommentStatus.APPROVED,
        },
        orderBy: {
          createdTime: "desc",
        },
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
          post: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
      });

      return {
        data: comments,
        code: 200,
      };
    } catch (error) {
      console.error("获取最新评论失败:", error);
      return {
        code: 500,
        message: "获取最新评论失败",
        errMsg: error instanceof Error ? error.message : "未知错误",
      };
    }
  }
}
