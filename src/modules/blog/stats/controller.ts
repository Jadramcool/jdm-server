import type { Request, Response } from "express";
import { inject } from "inversify";
import { controller, httpGet as Get } from "inversify-express-utils";
import { UtilService } from "../../../utils/utils";
import { BlogStatsService } from "./services";

/**
 * @swagger
 * tags:
 *   - name: 博客统计管理
 *     description: 博客统计数据相关接口
 * 
 * components:
 *   schemas:
 *     BlogStatsResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: object
 *           properties:
 *             posts:
 *               type: object
 *               description: 文章统计数据
 *             categories:
 *               type: object
 *               description: 分类统计数据
 *             tags:
 *               type: object
 *               description: 标签统计数据
 *             comments:
 *               type: object
 *               description: 评论统计数据
 *             configs:
 *               type: object
 *               description: 配置统计数据
 *             friendLinks:
 *               type: object
 *               description: 友情链接统计数据
 *             overview:
 *               type: object
 *               description: 概览统计数据
 *         code:
 *           type: integer
 *           example: 200
 *         message:
 *           type: string
 *           example: "获取统计数据成功"
 *         errMsg:
 *           type: string
 *           example: ""
 * 
 *     BlogOverviewStatsResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: object
 *           properties:
 *             totalPosts:
 *               type: integer
 *               description: 总文章数
 *             publishedPosts:
 *               type: integer
 *               description: 已发布文章数
 *             draftPosts:
 *               type: integer
 *               description: 草稿文章数
 *             totalCategories:
 *               type: integer
 *               description: 总分类数
 *             totalTags:
 *               type: integer
 *               description: 总标签数
 *             totalComments:
 *               type: integer
 *               description: 总评论数
 *             pendingComments:
 *               type: integer
 *               description: 待审核评论数
 *             approvedComments:
 *               type: integer
 *               description: 已审核评论数
 *             totalConfigs:
 *               type: integer
 *               description: 总配置数
 *             totalFriendLinks:
 *               type: integer
 *               description: 总友情链接数
 *         code:
 *           type: integer
 *           example: 200
 *         message:
 *           type: string
 *           example: "获取概览统计成功"
 *         errMsg:
 *           type: string
 *           example: ""
 */

@controller("/blog/stats")
export class BlogStatsController {
  constructor(
    @inject(BlogStatsService)
    private readonly BlogStatsService: BlogStatsService,
    @inject(UtilService)
    private readonly UtilService: UtilService
  ) {}

  /**
   * @swagger
   * /blog/stats:
   *   get:
   *     tags:
   *       - 博客统计管理
   *     summary: 获取博客系统所有统计数据
   *     description: 获取博客系统中所有模块的统计数据，包括文章、分类、标签、评论、配置、友情链接等
   *     security:
   *       - BearerAuth: []
   *     responses:
   *       200:
   *         description: 获取统计数据成功
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/BlogStatsResponse'
   *             examples:
   *               success:
   *                 summary: 成功获取统计数据
   *                 value:
   *                   code: 200
   *                   message: "获取统计数据成功"
   *                   data:
   *                     posts:
   *                       totalPosts: 50
   *                       publishedPosts: 45
   *                       draftPosts: 5
   *                     categories:
   *                       totalCategories: 10
   *                       rootCategories: 5
   *                     tags:
   *                       totalTags: 25
   *                       tagsWithPosts: 20
   *                     comments:
   *                       totalComments: 100
   *                       pendingComments: 5
   *                     overview:
   *                       totalPosts: 50
   *                       totalCategories: 10
   *                       totalTags: 25
   *                       totalComments: 100
   *       500:
   *         description: 服务器内部错误
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 code:
   *                   type: integer
   *                   example: 500
   *                 message:
   *                   type: string
   *                   example: "获取统计数据失败"
   *                 errMsg:
   *                   type: string
   *                   example: "数据库连接失败"
   */
  @Get("/")
  public async getAllStats(req: Request, res: Response) {
    const {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.BlogStatsService.getAllStats();
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /blog/stats/overview:
   *   get:
   *     tags:
   *       - 博客统计管理
   *     summary: 获取博客概览统计数据
   *     description: 获取博客系统的概览统计数据，包括各模块的基本数量统计
   *     security:
   *       - BearerAuth: []
   *     responses:
   *       200:
   *         description: 获取概览统计成功
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/BlogOverviewStatsResponse'
   *             examples:
   *               success:
   *                 summary: 成功获取概览统计
   *                 value:
   *                   code: 200
   *                   message: "获取概览统计成功"
   *                   data:
   *                     totalPosts: 50
   *                     publishedPosts: 45
   *                     draftPosts: 5
   *                     totalCategories: 10
   *                     totalTags: 25
   *                     totalComments: 100
   *                     pendingComments: 5
   *                     approvedComments: 95
   *                     totalConfigs: 15
   *                     totalFriendLinks: 8
   *       500:
   *         description: 服务器内部错误
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 code:
   *                   type: integer
   *                   example: 500
   *                 message:
   *                   type: string
   *                   example: "获取概览统计失败"
   *                 errMsg:
   *                   type: string
   *                   example: "数据库连接失败"
   */
  @Get("/overview")
  public async getOverviewStats(req: Request, res: Response) {
    const {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.BlogStatsService.getOverviewStats();
    res.sendResult(data, code, message, errMsg);
  }
}