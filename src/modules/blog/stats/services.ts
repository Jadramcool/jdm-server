import { inject, injectable } from "inversify";
import { PrismaDB } from "../../../db";
import { BlogCategoryService } from "../category/services";
import { BlogCommentService } from "../comment/services";
import { BlogConfigService } from "../config/services";
import { BlogFriendLinkService } from "../friendlink/services";
import { BlogPostService } from "../post/services";
import { BlogTagService } from "../tag/services";

@injectable()
export class BlogStatsService {
  constructor(
    @inject(PrismaDB) private readonly PrismaDB: PrismaDB,
    @inject(BlogPostService) private readonly blogPostService: BlogPostService,
    @inject(BlogCategoryService)
    private readonly blogCategoryService: BlogCategoryService,
    @inject(BlogTagService) private readonly blogTagService: BlogTagService,
    @inject(BlogCommentService)
    private readonly blogCommentService: BlogCommentService,
    @inject(BlogConfigService)
    private readonly blogConfigService: BlogConfigService,
    @inject(BlogFriendLinkService)
    private readonly blogFriendLinkService: BlogFriendLinkService
  ) {}

  /**
   * 获取博客系统所有统计数据
   */
  async getAllStats(): Promise<Jres> {
    try {
      const [
        postStats,
        categoryStats,
        tagStats,
        commentStats,
        configStats,
        friendLinkStats,
      ] = await Promise.all([
        this.blogPostService.getPostStats(),
        this.blogCategoryService.getCategoryStats(),
        this.blogTagService.getTagStats(),
        this.blogCommentService.getCommentStats(),
        this.blogConfigService.getConfigStats(),
        this.blogFriendLinkService.getFriendLinkStats(),
      ]);

      // 检查是否有任何服务返回错误
      const errors = [
        postStats,
        categoryStats,
        tagStats,
        commentStats,
        configStats,
        friendLinkStats,
      ].filter((result) => result.code !== 200);

      if (errors.length > 0) {
        return {
          code: 500,
          message: "部分统计数据获取失败",
          data: null,
          errMsg: errors.map((err) => err.message || err.errMsg).join("; "),
        };
      }

      return {
        code: 200,
        message: "获取统计数据成功",
        data: {
          posts: postStats.data,
          categories: categoryStats.data,
          tags: tagStats.data,
          comments: commentStats.data,
          configs: configStats.data,
          friendLinks: friendLinkStats.data,
          overview: {
            totalPosts: postStats.data?.totalPosts || 0,
            totalCategories: categoryStats.data?.totalCategories || 0,
            totalTags: tagStats.data?.totalTags || 0,
            totalComments: commentStats.data?.totalComments || 0,
            totalConfigs: configStats.data?.totalConfigs || 0,
            totalFriendLinks: friendLinkStats.data?.totalLinks || 0,
          },
        },
      };
    } catch (error) {
      console.error("获取博客统计数据失败:", error);
      return {
        code: 500,
        message: "获取统计数据失败",
        data: null,
        errMsg: error instanceof Error ? error.message : "未知错误",
      };
    }
  }

  /**
   * 获取博客概览统计
   */
  async getOverviewStats(): Promise<Jres> {
    try {
      const [
        totalPosts,
        publishedPosts,
        totalCategories,
        totalTags,
        totalComments,
        pendingComments,
        totalConfigs,
        totalFriendLinks,
      ] = await Promise.all([
        this.PrismaDB.prisma.blogPost.count({ where: { isDeleted: false } }),
        this.PrismaDB.prisma.blogPost.count({
          where: { isDeleted: false, status: "PUBLISHED" },
        }),
        this.PrismaDB.prisma.blogCategory.count({
          where: { isDeleted: false },
        }),
        this.PrismaDB.prisma.blogTag.count({ where: { deletedTime: null } }),
        this.PrismaDB.prisma.blogComment.count({
          where: { deletedTime: null },
        }),
        this.PrismaDB.prisma.blogComment.count({
          where: { deletedTime: null, status: "PENDING" },
        }),
        this.PrismaDB.prisma.blogConfig.count(),
        this.PrismaDB.prisma.blogFriendLink.count({
          where: { deletedTime: null },
        }),
      ]);

      return {
        code: 200,
        message: "获取概览统计成功",
        data: {
          totalPosts,
          publishedPosts,
          draftPosts: totalPosts - publishedPosts,
          totalCategories,
          totalTags,
          totalComments,
          pendingComments,
          approvedComments: totalComments - pendingComments,
          totalConfigs,
          totalFriendLinks,
        },
      };
    } catch (error) {
      console.error("获取博客概览统计失败:", error);
      return {
        code: 500,
        message: "获取概览统计失败",
        data: null,
        errMsg: error instanceof Error ? error.message : "未知错误",
      };
    }
  }
}
