import type { Request, Response } from "express";
import { inject } from "inversify";
import {
  controller,
  httpDelete as Delete,
  httpGet as Get,
  httpPost as Post,
  httpPut as Put,
} from "inversify-express-utils";
import { UtilService } from "../../../utils/utils";
import { BlogPostService } from "./services";

/**
 * @swagger
 * tags:
 *   - name: 博客文章管理
 *     description: 博客文章相关接口
 *
 * components:
 *   schemas:
 *     BlogPost:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 文章ID
 *         title:
 *           type: string
 *           description: 文章标题
 *         slug:
 *           type: string
 *           description: URL友好的标识符
 *         summary:
 *           type: string
 *           description: 文章摘要
 *         content:
 *           type: string
 *           description: Markdown内容
 *         coverImage:
 *           type: string
 *           description: 封面图片URL
 *         status:
 *           type: string
 *           enum: [DRAFT, PUBLISHED, ARCHIVED]
 *           description: 文章状态
 *         isTop:
 *           type: boolean
 *           description: 是否置顶
 *         allowComment:
 *           type: boolean
 *           description: 是否允许评论
 *         viewCount:
 *           type: integer
 *           description: 浏览次数
 *         likeCount:
 *           type: integer
 *           description: 点赞次数
 *         commentCount:
 *           type: integer
 *           description: 评论次数
 *         authorId:
 *           type: integer
 *           description: 作者ID
 *         categoryId:
 *           type: integer
 *           description: 分类ID
 *         publishedAt:
 *           type: string
 *           format: date-time
 *           description: 发布时间
 *         createdTime:
 *           type: string
 *           format: date-time
 *           description: 创建时间
 *         updatedTime:
 *           type: string
 *           format: date-time
 *           description: 更新时间
 *         author:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             username:
 *               type: string
 *             avatar:
 *               type: string
 *         category:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             name:
 *               type: string
 *             slug:
 *               type: string
 *         tags:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               tag:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   slug:
 *                     type: string
 *                   color:
 *                     type: string
 *
 *     CreatePostRequest:
 *       type: object
 *       required:
 *         - title
 *         - content
 *         - authorId
 *       properties:
 *         title:
 *           type: string
 *           description: 文章标题
 *           example: "我的第一篇博客"
 *         slug:
 *           type: string
 *           description: URL友好的标识符（可选，不提供则自动生成）
 *           example: "my-first-blog"
 *         summary:
 *           type: string
 *           description: 文章摘要
 *           example: "这是我的第一篇博客文章的摘要"
 *         content:
 *           type: string
 *           description: Markdown内容
 *           example: "# 标题\n\n这是文章内容..."
 *         coverImage:
 *           type: string
 *           description: 封面图片URL
 *           example: "https://example.com/cover.jpg"
 *         status:
 *           type: string
 *           enum: [DRAFT, PUBLISHED, ARCHIVED]
 *           description: 文章状态
 *           example: "DRAFT"
 *         isTop:
 *           type: boolean
 *           description: 是否置顶
 *           example: false
 *         allowComment:
 *           type: boolean
 *           description: 是否允许评论
 *           example: true
 *         categoryId:
 *           type: integer
 *           description: 分类ID
 *           example: 1
 *         tagIds:
 *           type: array
 *           items:
 *             type: integer
 *           description: 标签ID数组
 *           example: [1, 2, 3]
 *         authorId:
 *           type: integer
 *           description: 作者ID
 *           example: 1
 *
 *     UpdatePostRequest:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           description: 文章标题
 *         slug:
 *           type: string
 *           description: URL友好的标识符
 *         summary:
 *           type: string
 *           description: 文章摘要
 *         content:
 *           type: string
 *           description: Markdown内容
 *         coverImage:
 *           type: string
 *           description: 封面图片URL
 *         status:
 *           type: string
 *           enum: [DRAFT, PUBLISHED, ARCHIVED]
 *           description: 文章状态
 *         isTop:
 *           type: boolean
 *           description: 是否置顶
 *         allowComment:
 *           type: boolean
 *           description: 是否允许评论
 *         categoryId:
 *           type: integer
 *           description: 分类ID
 *         tagIds:
 *           type: array
 *           items:
 *             type: integer
 *           description: 标签ID数组
 *
 *     PostListResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: object
 *           properties:
 *             list:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BlogPost'
 *             pagination:
 *               type: object
 *               properties:
 *                 page:
 *                   type: integer
 *                   description: 当前页码
 *                 pageSize:
 *                   type: integer
 *                   description: 每页数量
 *                 total:
 *                   type: integer
 *                   description: 总记录数
 *                 totalPages:
 *                   type: integer
 *                   description: 总页数
 *         code:
 *           type: integer
 *           example: 200
 *         message:
 *           type: string
 *           example: ""
 *         errMsg:
 *           type: string
 *           example: ""
 *
 *     PostStatsResponse:
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
 *             archivedPosts:
 *               type: integer
 *               description: 已归档文章数
 *             totalViews:
 *               type: integer
 *               description: 总浏览量
 *             totalLikes:
 *               type: integer
 *               description: 总点赞数
 *         code:
 *           type: integer
 *           example: 200
 *         message:
 *           type: string
 *           example: ""
 *         errMsg:
 *           type: string
 *           example: ""
 */

@controller("/blog/post")
export class BlogPostController {
  constructor(
    @inject(BlogPostService)
    private readonly BlogPostService: BlogPostService,
    @inject(UtilService)
    private readonly UtilService: UtilService
  ) {}

  /**
   * @swagger
   * /blog/post:
   *   post:
   *     tags:
   *       - 博客文章管理
   *     summary: 创建博客文章
   *     description: 创建一篇新的博客文章
   *     security:
   *       - BearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreatePostRequest'
   *           examples:
   *             draft:
   *               summary: 创建草稿文章
   *               value:
   *                 title: "我的第一篇博客"
   *                 summary: "这是我的第一篇博客文章的摘要"
   *                 content: "# 欢迎\n\n这是我的第一篇博客文章内容..."
   *                 status: "DRAFT"
   *                 categoryId: 1
   *                 tagIds: [1, 2]
   *                 authorId: 1
   *             published:
   *               summary: 创建并发布文章
   *               value:
   *                 title: "技术分享：Node.js 最佳实践"
   *                 slug: "nodejs-best-practices"
   *                 summary: "分享一些 Node.js 开发中的最佳实践"
   *                 content: "# Node.js 最佳实践\n\n## 1. 错误处理\n\n..."
   *                 coverImage: "https://example.com/nodejs-cover.jpg"
   *                 status: "PUBLISHED"
   *                 isTop: false
   *                 allowComment: true
   *                 categoryId: 1
   *                 tagIds: [1, 3, 5]
   *                 authorId: 1
   *     responses:
   *       200:
   *         description: 文章创建成功
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/BlogPost'
   *             examples:
   *               success:
   *                 summary: 创建成功响应
   *                 value:
   *                   data:
   *                     id: 1
   *                     title: "我的第一篇博客"
   *                     slug: "my-first-blog"
   *                     summary: "这是我的第一篇博客文章的摘要"
   *                     status: "DRAFT"
   *                     authorId: 1
   *                     createdTime: "2024-01-01T00:00:00.000Z"
   *                   code: 200
   *                   message: "文章创建成功"
   *                   errMsg: ""
   *       400:
   *         description: 请求参数错误
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             examples:
   *               slug_exists:
   *                 summary: 标识符已存在
   *                 value:
   *                   data: null
   *                   code: 400
   *                   message: "文章标识符已存在"
   *                   errMsg: ""
   *               category_not_found:
   *                 summary: 分类不存在
   *                 value:
   *                   data: null
   *                   code: 400
   *                   message: "分类不存在"
   *                   errMsg: ""
   *       401:
   *         description: 未授权
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: 服务器内部错误
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  @Post("/")
  public async createPost(req: Request, res: Response) {
    const {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.BlogPostService.createPost(req.body);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /blog/post:
   *   get:
   *     tags:
   *       - 博客文章管理
   *     summary: 获取博客文章列表
   *     description: 分页获取博客文章列表，支持多种筛选条件
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: 页码
   *       - in: query
   *         name: pageSize
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 10
   *         description: 每页数量
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [DRAFT, PUBLISHED, ARCHIVED]
   *         description: 文章状态筛选
   *       - in: query
   *         name: categoryId
   *         schema:
   *           type: integer
   *         description: 分类ID筛选
   *       - in: query
   *         name: tagId
   *         schema:
   *           type: integer
   *         description: 标签ID筛选
   *       - in: query
   *         name: keyword
   *         schema:
   *           type: string
   *         description: 关键词搜索（标题、摘要、内容）
   *       - in: query
   *         name: authorId
   *         schema:
   *           type: integer
   *         description: 作者ID筛选
   *       - in: query
   *         name: isTop
   *         schema:
   *           type: boolean
   *         description: 是否置顶筛选
   *     responses:
   *       200:
   *         description: 获取文章列表成功
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/PostListResponse'
   *             examples:
   *               success:
   *                 summary: 成功响应示例
   *                 value:
   *                   data:
   *                     list:
   *                       - id: 1
   *                         title: "我的第一篇博客"
   *                         slug: "my-first-blog"
   *                         summary: "这是摘要"
   *                         status: "PUBLISHED"
   *                         isTop: false
   *                         viewCount: 100
   *                         likeCount: 5
   *                         commentCount: 3
   *                         publishedAt: "2024-01-01T00:00:00.000Z"
   *                         author:
   *                           id: 1
   *                           username: "admin"
   *                           avatar: "https://example.com/avatar.jpg"
   *                         category:
   *                           id: 1
   *                           name: "技术分享"
   *                           slug: "tech"
   *                         tags:
   *                           - tag:
   *                               id: 1
   *                               name: "JavaScript"
   *                               slug: "javascript"
   *                               color: "#f7df1e"
   *                     pagination:
   *                       page: 1
   *                       pageSize: 10
   *                       total: 1
   *                       totalPages: 1
   *                   code: 200
   *                   message: ""
   *                   errMsg: ""
   *       500:
   *         description: 服务器内部错误
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  @Get("/")
  public async getPostList(req: Request, res: Response) {
    const config = this.UtilService.parseQueryParams(req);
    const {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.BlogPostService.getPostList(config);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /blog/post/stats:
   *   get:
   *     tags:
   *       - 博客文章管理
   *     summary: 获取博客文章统计信息
   *     description: 获取博客文章的各种统计数据
   *     security:
   *       - BearerAuth: []
   *     responses:
   *       200:
   *         description: 获取统计信息成功
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/PostStatsResponse'
   *             examples:
   *               success:
   *                 summary: 成功响应示例
   *                 value:
   *                   data:
   *                     totalPosts: 50
   *                     publishedPosts: 35
   *                     draftPosts: 10
   *                     archivedPosts: 5
   *                     totalViews: 10000
   *                     totalLikes: 500
   *                   code: 200
   *                   message: ""
   *                   errMsg: ""
   *       401:
   *         description: 未授权
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: 服务器内部错误
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  @Get("/stats")
  public async getPostStats(req: Request, res: Response) {
    const {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.BlogPostService.getPostStats();
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /blog/post/{id}:
   *   get:
   *     tags:
   *       - 博客文章管理
   *     summary: 根据ID获取博客文章详情
   *     description: 根据文章ID获取详细信息，可选择是否增加浏览量
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: 文章ID
   *       - in: query
   *         name: incrementView
   *         schema:
   *           type: boolean
   *           default: false
   *         description: 是否增加浏览量
   *     responses:
   *       200:
   *         description: 获取文章详情成功
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/BlogPost'
   *             examples:
   *               success:
   *                 summary: 成功响应示例
   *                 value:
   *                   data:
   *                     id: 1
   *                     title: "我的第一篇博客"
   *                     slug: "my-first-blog"
   *                     summary: "这是摘要"
   *                     content: "# 标题\n\n这是内容..."
   *                     status: "PUBLISHED"
   *                     viewCount: 101
   *                     author:
   *                       id: 1
   *                       username: "admin"
   *                     category:
   *                       id: 1
   *                       name: "技术分享"
   *                     tags: []
   *                     comments: []
   *                   code: 200
   *                   message: ""
   *                   errMsg: ""
   *       404:
   *         description: 文章不存在
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             examples:
   *               not_found:
   *                 summary: 文章不存在
   *                 value:
   *                   data: null
   *                   code: 404
   *                   message: "文章不存在"
   *                   errMsg: ""
   *       500:
   *         description: 服务器内部错误
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  @Get("/:id")
  public async getPostById(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    const incrementView = req.query.incrementView === "true";

    const {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.BlogPostService.getPostById(id, incrementView);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /blog/post/slug/{slug}:
   *   get:
   *     tags:
   *       - 博客文章管理
   *     summary: 根据slug获取博客文章详情
   *     description: 根据文章slug获取详细信息，可选择是否增加浏览量
   *     parameters:
   *       - in: path
   *         name: slug
   *         required: true
   *         schema:
   *           type: string
   *         description: 文章slug
   *         example: "my-first-blog"
   *       - in: query
   *         name: incrementView
   *         schema:
   *           type: boolean
   *           default: false
   *         description: 是否增加浏览量
   *     responses:
   *       200:
   *         description: 获取文章详情成功
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/BlogPost'
   *       404:
   *         description: 文章不存在
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: 服务器内部错误
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  @Get("/slug/:slug")
  public async getPostBySlug(req: Request, res: Response) {
    const slug = req.params.slug;
    const incrementView = req.query.incrementView === "true";

    const {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.BlogPostService.getPostBySlug(slug, incrementView);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /blog/post/{id}:
   *   put:
   *     tags:
   *       - 博客文章管理
   *     summary: 更新博客文章
   *     description: 更新指定ID的博客文章信息
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: 文章ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdatePostRequest'
   *           examples:
   *             update_title:
   *               summary: 更新标题和内容
   *               value:
   *                 title: "更新后的标题"
   *                 content: "# 更新后的内容\n\n这是更新后的文章内容..."
   *             publish_draft:
   *               summary: 发布草稿
   *               value:
   *                 status: "PUBLISHED"
   *             update_category:
   *               summary: 更新分类和标签
   *               value:
   *                 categoryId: 2
   *                 tagIds: [2, 3, 4]
   *     responses:
   *       200:
   *         description: 文章更新成功
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/BlogPost'
   *             examples:
   *               success:
   *                 summary: 更新成功响应
   *                 value:
   *                   data:
   *                     id: 1
   *                     title: "更新后的标题"
   *                     slug: "updated-title"
   *                     status: "PUBLISHED"
   *                     updatedTime: "2024-01-02T00:00:00.000Z"
   *                   code: 200
   *                   message: "文章更新成功"
   *                   errMsg: ""
   *       400:
   *         description: 请求参数错误
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: 无权限修改
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             examples:
   *               forbidden:
   *                 summary: 权限不足
   *                 value:
   *                   data: null
   *                   code: 403
   *                   message: "无权限修改此文章"
   *                   errMsg: ""
   *       404:
   *         description: 文章不存在
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: 服务器内部错误
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  @Put("/:id")
  public async updatePost(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    const authorId = req.body.authorId; // 可以从JWT token中获取

    const {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.BlogPostService.updatePost(id, req.body, authorId);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /blog/post/{id}:
   *   delete:
   *     tags:
   *       - 博客文章管理
   *     summary: 删除博客文章
   *     description: 软删除指定ID的博客文章
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: 文章ID
   *     responses:
   *       200:
   *         description: 文章删除成功
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiResponse'
   *             examples:
   *               success:
   *                 summary: 删除成功响应
   *                 value:
   *                   data: null
   *                   code: 200
   *                   message: "文章删除成功"
   *                   errMsg: ""
   *       403:
   *         description: 无权限删除
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             examples:
   *               forbidden:
   *                 summary: 权限不足
   *                 value:
   *                   data: null
   *                   code: 403
   *                   message: "无权限删除此文章"
   *                   errMsg: ""
   *       404:
   *         description: 文章不存在
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: 服务器内部错误
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  @Delete("/:id")
  public async deletePost(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    const authorId = req.body.authorId; // 可以从JWT token中获取

    const {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.BlogPostService.deletePost(id, authorId);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /blog/post/{id}/toggle-publish:
   *   put:
   *     tags:
   *       - 博客文章管理
   *     summary: 切换文章发布状态
   *     description: 切换文章的发布状态（草稿<->已发布）
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: 文章ID
   *     requestBody:
   *       required: false
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               authorId:
   *                 type: integer
   *                 description: 作者ID（用于权限检查）
   *           examples:
   *             with_author_check:
   *               summary: 带权限检查的切换
   *               value:
   *                 authorId: 1
   *             without_author_check:
   *               summary: 不检查权限的切换
   *               value: {}
   *     responses:
   *       200:
   *         description: 文章状态切换成功
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/BlogPost'
   *             examples:
   *               success:
   *                 summary: 状态切换成功响应
   *                 value:
   *                   data:
   *                     id: 1
   *                     title: "我的第一篇博客"
   *                     slug: "my-first-blog"
   *                     status: "PUBLISHED"
   *                     publishedAt: "2024-01-01T12:00:00.000Z"
   *                     author:
   *                       id: 1
   *                       username: "admin"
   *                     category:
   *                       id: 1
   *                       name: "技术分享"
   *                       slug: "tech"
   *                     tags: []
   *                   code: 200
   *                   message: "文章状态切换成功"
   *                   errMsg: ""
   *       403:
   *         description: 无权限修改此文章
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: 文章不存在
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: 服务器内部错误
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  @Put("/:id/toggle-publish")
  public async togglePublishStatus(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    const authorId = req.body.authorId; // 可选的权限检查

    const {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.BlogPostService.togglePublishStatus(id, authorId);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /blog/post/{id}/toggle-top:
   *   put:
   *     tags:
   *       - 博客文章管理
   *     summary: 切换文章置顶状态
   *     description: 切换指定文章的置顶状态
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: 文章ID
   *     responses:
   *       200:
   *         description: 置顶状态切换成功
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       type: object
   *                       properties:
   *                         isTop:
   *                           type: boolean
   *                           description: 当前置顶状态
   *             examples:
   *               success_top:
   *                 summary: 置顶成功
   *                 value:
   *                   data:
   *                     isTop: true
   *                   code: 200
   *                   message: "文章置顶成功"
   *                   errMsg: ""
   *               success_untop:
   *                 summary: 取消置顶成功
   *                 value:
   *                   data:
   *                     isTop: false
   *                   code: 200
   *                   message: "文章取消置顶成功"
   *                   errMsg: ""
   *       403:
   *         description: 无权限修改
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: 文章不存在
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: 服务器内部错误
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  @Put("/:id/toggle-top")
  public async toggleTop(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    const authorId = req.body.authorId; // 可以从JWT token中获取

    const {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.BlogPostService.toggleTop(id, authorId);
    res.sendResult(data, code, message, errMsg);
  }
}
