import type { Request, Response } from "express";
import { inject } from "inversify";
import { controller, httpGet as Get, httpPost as Post, httpPut as Put, httpDelete as Delete } from "inversify-express-utils";
import { UtilService } from "../../../utils/utils";
import { BlogCommentService } from "./services";

/**
 * @swagger
 * tags:
 *   - name: 博客评论管理
 *     description: 博客评论相关接口
 * 
 * components:
 *   schemas:
 *     BlogComment:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 评论ID
 *         postId:
 *           type: integer
 *           description: 文章ID
 *         content:
 *           type: string
 *           description: 评论内容
 *         parentId:
 *           type: integer
 *           description: 父评论ID
 *         userId:
           type: integer
           description: 作者用户ID
 *         authorName:
 *           type: string
 *           description: 作者姓名
 *         authorEmail:
 *           type: string
 *           description: 作者邮箱
 *         authorUrl:
           type: string
           description: 作者网站
 *         authorIp:
 *           type: string
 *           description: 作者IP地址
 *         userAgent:
 *           type: string
 *           description: 用户代理
 *         status:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *           description: 评论状态
 *         likeCount:
 *           type: integer
 *           description: 点赞数
 *         createdTime:
 *           type: string
 *           format: date-time
 *           description: 创建时间
 *         updatedTime:
 *           type: string
 *           format: date-time
 *           description: 更新时间
 *         user:
           type: object
           properties:
             id:
               type: integer
             username:
               type: string
             avatar:
               type: string
 *         parent:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             content:
 *               type: string
 *             authorName:
 *               type: string
 *         post:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             title:
 *               type: string
 *             slug:
 *               type: string
 *         replies:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/BlogComment'
 * 
 *     CreateCommentRequest:
 *       type: object
 *       required:
 *         - postId
 *         - content
 *         - userId
 *       properties:
 *         postId:
 *           type: integer
 *           description: 文章ID
 *           example: 1
 *         content:
 *           type: string
 *           description: 评论内容
 *           example: "这篇文章写得很好！"
 *         parentId:
 *           type: integer
 *           description: 父评论ID（回复评论时使用）
 *           example: 1
 *         userId:
           type: integer
           description: 作者用户ID
           example: 1
 *         authorName:
 *           type: string
 *           description: 作者姓名（游客评论时使用）
 *           example: "张三"
 *         authorEmail:
 *           type: string
 *           description: 作者邮箱（游客评论时使用）
 *           example: "zhangsan@example.com"
 *         authorUrl:
           type: string
           description: 作者网站（可选）
           example: "https://zhangsan.com"
 * 
 *     UpdateCommentRequest:
 *       type: object
 *       properties:
 *         content:
 *           type: string
 *           description: 评论内容
 *         status:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *           description: 评论状态
 * 
 *     CommentStatsResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: object
 *           properties:
 *             totalComments:
 *               type: integer
 *               description: 总评论数
 *             pendingComments:
 *               type: integer
 *               description: 待审核评论数
 *             approvedComments:
 *               type: integer
 *               description: 已通过评论数
 *             rejectedComments:
 *               type: integer
 *               description: 已拒绝评论数
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
 *     CommentListResponse:
 *       type: object
 *       properties:
 *         data:
 *           oneOf:
 *             - type: array
 *               items:
 *                 $ref: '#/components/schemas/BlogComment'
 *             - type: object
 *               properties:
 *                 list:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BlogComment'
 *                 total:
 *                   type: integer
 *                   description: 总记录数
 *                 page:
 *                   type: integer
 *                   description: 当前页码
 *                 pageSize:
 *                   type: integer
 *                   description: 每页大小
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
 */

@controller("/blog/comment")
export class BlogCommentController {
  constructor(
    @inject(BlogCommentService)
    private readonly BlogCommentService: BlogCommentService,
    @inject(UtilService)
    private readonly UtilService: UtilService
  ) {}

  /**
   * @swagger
   * /blog/comment:
   *   post:
   *     tags:
   *       - 博客评论管理
   *     summary: 创建博客评论
   *     description: 创建一个新的博客评论或回复
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateCommentRequest'
   *           examples:
   *             new_comment:
   *               summary: 新评论
   *               value:
   *                 postId: 1
   *                 content: "这篇文章写得很好，学到了很多！"
   *                 userId: 1
   *             reply_comment:
   *               summary: 回复评论
   *               value:
   *                 postId: 1
   *                 content: "感谢分享，我也有同样的想法。"
   *                 parentId: 1
   *                 userId: 2
   *             guest_comment:
   *               summary: 游客评论
   *               value:
   *                 postId: 1
   *                 content: "作为游客，我觉得这篇文章很有价值。"
   *                 userId: 0
   *                 authorName: "游客"
   *                 authorEmail: "guest@example.com"
   *     responses:
   *       200:
   *         description: 评论创建成功
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/BlogComment'
   *             examples:
   *               success:
   *                 summary: 创建成功响应
   *                 value:
   *                   data:
   *                     id: 1
   *                     postId: 1
   *                     content: "这篇文章写得很好！"
   *                     userId: 1
   *                     status: "PENDING"
   *                     likeCount: 0
   *                     createdTime: "2024-01-01T00:00:00.000Z"
   *                     user:
   *                       username: "user1"
   *                   code: 200
   *                   message: "评论创建成功，等待审核"
   *                   errMsg: ""
   *       404:
   *         description: 文章不存在或父评论不存在
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             examples:
   *               post_not_found:
   *                 summary: 文章不存在
   *                 value:
   *                   data: null
   *                   code: 404
   *                   message: "文章不存在或未发布"
   *                   errMsg: ""
   *               parent_not_found:
   *                 summary: 父评论不存在
   *                 value:
   *                   data: null
   *                   code: 404
   *                   message: "父评论不存在"
   *                   errMsg: ""
   *       500:
   *         description: 服务器内部错误
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  @Post("/")
  public async createComment(req: Request, res: Response) {
    // 获取客户端IP和User-Agent
    const authorIp = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    
    const commentData = {
      ...req.body,
      authorIp,
      userAgent
    };
    
    const {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.BlogCommentService.createComment(commentData);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /blog/comment:
   *   get:
   *     tags:
   *       - 博客评论管理
   *     summary: 获取博客评论列表
   *     description: 获取博客评论列表，支持多种筛选条件
   *     parameters:
   *       - in: query
   *         name: postId
   *         schema:
   *           type: integer
   *         description: 文章ID筛选
   *       - in: query
   *         name: userId
   *         schema:
   *           type: integer
   *         description: 作者ID筛选
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [PENDING, APPROVED, REJECTED]
   *         description: 评论状态筛选
   *       - in: query
   *         name: keyword
   *         schema:
   *           type: string
   *         description: 搜索关键词（评论内容或作者姓名）
   *       - in: query
   *         name: parentId
   *         schema:
   *           type: integer
   *         description: 父评论ID筛选（null表示顶级评论）
   *       - in: query
   *         name: includeReplies
   *         schema:
   *           type: boolean
   *           default: true
   *         description: 是否包含回复
   *       - in: query
   *         name: sortBy
   *         schema:
   *           type: string
   *           enum: [createdTime, likeCount]
   *           default: createdTime
   *         description: 排序字段
   *       - in: query
   *         name: sortOrder
   *         schema:
   *           type: string
   *           enum: [asc, desc]
   *           default: desc
   *         description: 排序方向
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: 页码（提供则启用分页）
   *       - in: query
   *         name: pageSize
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 20
   *         description: 每页大小
   *     responses:
   *       200:
   *         description: 获取评论列表成功
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/CommentListResponse'
   *             examples:
   *               without_pagination:
   *                 summary: 不分页响应
   *                 value:
   *                   data:
   *                     - id: 1
   *                       postId: 1
   *                       content: "很好的文章！"
   *                       status: "APPROVED"
   *                       likeCount: 5
   *                       user:
                         username: "user1"
   *                       replies:
   *                         - id: 2
   *                           content: "我也这么认为"
   *                           author:
   *                             username: "user2"
   *                   code: 200
   *                   message: ""
   *                   errMsg: ""
   *               with_pagination:
   *                 summary: 分页响应
   *                 value:
   *                   data:
   *                     list:
   *                       - id: 1
   *                         content: "很好的文章！"
   *                         status: "APPROVED"
   *                     total: 50
   *                     page: 1
   *                     pageSize: 20
   *                     totalPages: 3
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
  public async getCommentList(req: Request, res: Response) {
    const {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.BlogCommentService.getCommentList(req.query);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /blog/comment/latest:
   *   get:
   *     tags:
   *       - 博客评论管理
   *     summary: 获取最新评论
   *     description: 获取最新的已审核通过的评论列表
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 50
   *           default: 10
   *         description: 返回数量限制
   *     responses:
   *       200:
   *         description: 获取最新评论成功
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/BlogComment'
   *             examples:
   *               success:
   *                 summary: 成功响应示例
   *                 value:
   *                   data:
   *                     - id: 10
   *                       content: "最新的评论内容"
   *                       createdTime: "2024-01-10T10:00:00.000Z"
   *                       author:
   *                         username: "user1"
   *                       post:
   *                         title: "文章标题"
   *                         slug: "article-slug"
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
  @Get("/latest")
  public async getLatestComments(req: Request, res: Response) {
    const limit = parseInt(req.query.limit as string) || 10;
    
    const {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.BlogCommentService.getLatestComments(limit);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /blog/comment/stats:
   *   get:
   *     tags:
   *       - 博客评论管理
   *     summary: 获取博客评论统计信息
   *     description: 获取博客评论的各种统计数据
   *     security:
   *       - BearerAuth: []
   *     responses:
   *       200:
   *         description: 获取统计信息成功
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/CommentStatsResponse'
   *             examples:
   *               success:
   *                 summary: 成功响应示例
   *                 value:
   *                   data:
   *                     totalComments: 150
   *                     pendingComments: 5
   *                     approvedComments: 140
   *                     rejectedComments: 5
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
  public async getCommentStats(req: Request, res: Response) {
    const {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.BlogCommentService.getCommentStats();
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /blog/comment/{id}:
   *   get:
   *     tags:
   *       - 博客评论管理
   *     summary: 根据ID获取博客评论详情
   *     description: 根据评论ID获取详细信息，包含回复列表
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: 评论ID
   *     responses:
   *       200:
   *         description: 获取评论详情成功
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/BlogComment'
   *             examples:
   *               success:
   *                 summary: 成功响应示例
   *                 value:
   *                   data:
   *                     id: 1
   *                     postId: 1
   *                     content: "这是一条评论"
   *                     status: "APPROVED"
   *                     likeCount: 3
   *                     user:
                         username: "user1"
   *                     post:
   *                       title: "文章标题"
   *                     replies:
   *                       - id: 2
   *                         content: "这是回复"
   *                         user:
                             username: "user2"
   *                   code: 200
   *                   message: ""
   *                   errMsg: ""
   *       404:
   *         description: 评论不存在
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             examples:
   *               not_found:
   *                 summary: 评论不存在
   *                 value:
   *                   data: null
   *                   code: 404
   *                   message: "评论不存在"
   *                   errMsg: ""
   *       500:
   *         description: 服务器内部错误
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  @Get("/:id")
  public async getCommentById(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    
    const {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.BlogCommentService.getCommentById(id);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /blog/comment/{id}:
   *   put:
   *     tags:
   *       - 博客评论管理
   *     summary: 更新博客评论
   *     description: 更新指定ID的博客评论信息
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: 评论ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateCommentRequest'
   *           examples:
   *             update_content:
   *               summary: 更新内容
   *               value:
   *                 content: "修改后的评论内容"
   *             update_status:
   *               summary: 更新状态
   *               value:
   *                 status: "APPROVED"
   *             update_both:
   *               summary: 同时更新内容和状态
   *               value:
   *                 content: "修改后的评论内容"
   *                 status: "APPROVED"
   *     responses:
   *       200:
   *         description: 评论更新成功
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/BlogComment'
   *             examples:
   *               success:
   *                 summary: 更新成功响应
   *                 value:
   *                   data:
   *                     id: 1
   *                     content: "修改后的评论内容"
   *                     status: "APPROVED"
   *                     updatedTime: "2024-01-02T00:00:00.000Z"
   *                   code: 200
   *                   message: "评论更新成功"
   *                   errMsg: ""
   *       404:
   *         description: 评论不存在
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
  public async updateComment(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    
    const {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.BlogCommentService.updateComment(id, req.body);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /blog/comment/{id}:
   *   delete:
   *     tags:
   *       - 博客评论管理
   *     summary: 删除博客评论
   *     description: 软删除指定ID的博客评论及其所有回复
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: 评论ID
   *     responses:
   *       200:
   *         description: 评论删除成功
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
   *                   message: "评论删除成功"
   *                   errMsg: ""
   *       404:
   *         description: 评论不存在
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
  public async deleteComment(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    
    const {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.BlogCommentService.deleteComment(id);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /blog/comment/{id}/approve:
   *   put:
   *     tags:
   *       - 博客评论管理
   *     summary: 审核通过评论
   *     description: 将指定评论状态设置为已审核通过
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: 评论ID
   *     responses:
   *       200:
   *         description: 评论审核通过
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/BlogComment'
   *             examples:
   *               success:
   *                 summary: 审核通过成功
   *                 value:
   *                   data:
   *                     id: 1
   *                     status: "APPROVED"
   *                     updatedTime: "2024-01-02T00:00:00.000Z"
   *                   code: 200
   *                   message: "评论审核通过"
   *                   errMsg: ""
   *       404:
   *         description: 评论不存在
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
  @Put("/:id/approve")
  public async approveComment(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    
    const {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.BlogCommentService.approveComment(id);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /blog/comment/{id}/reject:
   *   put:
   *     tags:
   *       - 博客评论管理
   *     summary: 拒绝评论
   *     description: 将指定评论状态设置为已拒绝
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: 评论ID
   *     responses:
   *       200:
   *         description: 评论已拒绝
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/BlogComment'
   *             examples:
   *               success:
   *                 summary: 拒绝成功
   *                 value:
   *                   data:
   *                     id: 1
   *                     status: "REJECTED"
   *                     updatedTime: "2024-01-02T00:00:00.000Z"
   *                   code: 200
   *                   message: "评论已拒绝"
   *                   errMsg: ""
   *       404:
   *         description: 评论不存在
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
  @Put("/:id/reject")
  public async rejectComment(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    
    const {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.BlogCommentService.rejectComment(id);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /blog/comment/{id}/like:
   *   put:
   *     tags:
   *       - 博客评论管理
   *     summary: 点赞/取消点赞评论
   *     description: 切换指定评论的点赞状态
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: 评论ID
   *     responses:
   *       200:
   *         description: 点赞状态切换成功
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
   *                         isLiked:
   *                           type: boolean
   *                           description: 是否已点赞
   *                         likeCount:
   *                           type: integer
   *                           description: 点赞数量
   *             examples:
   *               liked:
   *                 summary: 点赞成功
   *                 value:
   *                   data:
   *                     isLiked: true
   *                     likeCount: 6
   *                   code: 200
   *                   message: "点赞成功"
   *                   errMsg: ""
   *               unliked:
   *                 summary: 取消点赞成功
   *                 value:
   *                   data:
   *                     isLiked: false
   *                     likeCount: 5
   *                   code: 200
   *                   message: "取消点赞成功"
   *                   errMsg: ""
   *       404:
   *         description: 评论不存在
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
  @Put("/:id/like")
  public async toggleCommentLike(req: Request, res: Response) {
    const commentId = parseInt(req.params.id);
    // 这里应该从认证中间件获取用户ID，暂时使用请求体中的userId
    const userId = req.body.userId || 1; // 临时处理
    
    const {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.BlogCommentService.toggleCommentLike(commentId, userId);
    res.sendResult(data, code, message, errMsg);
  }
}