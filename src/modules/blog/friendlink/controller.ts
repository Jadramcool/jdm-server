import type { Request, Response } from "express";
import { inject } from "inversify";
import { controller, httpGet as Get, httpPost as Post, httpPut as Put, httpDelete as Delete } from "inversify-express-utils";
import { UtilService } from "../../../utils/utils";
import { BlogFriendLinkService } from "./services";

/**
 * @swagger
 * tags:
 *   - name: 博客友情链接管理
 *     description: 博客友情链接相关接口
 * 
 * components:
 *   schemas:
 *     BlogFriendLink:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 友情链接ID
 *         name:
 *           type: string
 *           description: 网站名称
 *         url:
 *           type: string
 *           description: 网站URL
 *         description:
 *           type: string
 *           description: 网站描述
 *         avatar:
 *           type: string
 *           description: 网站头像/图标
 *         email:
 *           type: string
 *           description: 联系邮箱
 *         status:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *           description: 审核状态
 *         sortOrder:
 *           type: integer
 *           description: 排序顺序
 *         createdTime:
 *           type: string
 *           format: date-time
 *           description: 创建时间
 *         updatedTime:
 *           type: string
 *           format: date-time
 *           description: 更新时间
 * 
 *     CreateFriendLinkRequest:
 *       type: object
 *       required:
 *         - name
 *         - url
 *       properties:
 *         name:
 *           type: string
 *           description: 网站名称
 *           example: "技术博客"
 *         url:
 *           type: string
 *           description: 网站URL
 *           example: "https://example.com"
 *         description:
 *           type: string
 *           description: 网站描述
 *           example: "一个专注于技术分享的博客"
 *         avatar:
 *           type: string
 *           description: 网站头像/图标URL
 *           example: "https://example.com/avatar.png"
 *         email:
 *           type: string
 *           description: 联系邮箱
 *           example: "admin@example.com"
 *         status:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *           default: PENDING
 *           description: 审核状态
 *         sortOrder:
 *           type: integer
 *           description: 排序顺序（可选，默认为最大值+1）
 *           example: 1
 * 
 *     UpdateFriendLinkRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: 网站名称
 *         url:
 *           type: string
 *           description: 网站URL
 *         description:
 *           type: string
 *           description: 网站描述
 *         avatar:
 *           type: string
 *           description: 网站头像/图标URL
 *         email:
 *           type: string
 *           description: 联系邮箱
 *         status:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *           description: 审核状态
 *         sortOrder:
 *           type: integer
 *           description: 排序顺序
 * 
 *     UpdateSortRequest:
 *       type: object
 *       required:
 *         - sortData
 *       properties:
 *         sortData:
 *           type: array
 *           items:
 *             type: object
 *             required:
 *               - id
 *               - sortOrder
 *             properties:
 *               id:
 *                 type: integer
 *                 description: 友情链接ID
 *               sortOrder:
 *                 type: integer
 *                 description: 新的排序顺序
 *           example:
 *             - id: 1
 *               sortOrder: 1
 *             - id: 2
 *               sortOrder: 2
 *             - id: 3
 *               sortOrder: 3
 * 
 *     FriendLinkStatsResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: object
 *           properties:
 *             totalLinks:
 *               type: integer
 *               description: 总友情链接数
 *             pendingLinks:
 *               type: integer
 *               description: 待审核链接数
 *             approvedLinks:
 *               type: integer
 *               description: 已通过链接数
 *             rejectedLinks:
 *               type: integer
 *               description: 已拒绝链接数
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
 *     FriendLinkListResponse:
 *       type: object
 *       properties:
 *         data:
 *           oneOf:
 *             - type: array
 *               items:
 *                 $ref: '#/components/schemas/BlogFriendLink'
 *             - type: object
 *               properties:
 *                 list:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BlogFriendLink'
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

@controller("/blog/friendlink")
export class BlogFriendLinkController {
  constructor(
    @inject(BlogFriendLinkService)
    private readonly BlogFriendLinkService: BlogFriendLinkService,
    @inject(UtilService)
    private readonly UtilService: UtilService
  ) {}

  /**
   * @swagger
   * /blog/friendlink:
   *   post:
   *     tags:
   *       - 博客友情链接管理
   *     summary: 创建友情链接
   *     description: 创建一个新的友情链接申请
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateFriendLinkRequest'
   *           examples:
   *             basic_link:
   *               summary: 基本友情链接
   *               value:
   *                 name: "技术博客"
   *                 url: "https://techblog.example.com"
   *                 description: "专注于前端技术分享的博客"
   *                 email: "admin@techblog.example.com"
   *             with_avatar:
   *               summary: 带头像的友情链接
   *               value:
   *                 name: "设计师博客"
   *                 url: "https://design.example.com"
   *                 description: "UI/UX设计经验分享"
   *                 avatar: "https://design.example.com/logo.png"
   *                 email: "hello@design.example.com"
   *                 sortOrder: 1
   *     responses:
   *       200:
   *         description: 友情链接创建成功
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/BlogFriendLink'
   *             examples:
   *               success:
   *                 summary: 创建成功响应
   *                 value:
   *                   data:
   *                     id: 1
   *                     name: "技术博客"
   *                     url: "https://techblog.example.com"
   *                     description: "专注于前端技术分享的博客"
   *                     status: "PENDING"
   *                     sortOrder: 1
   *                     createdTime: "2024-01-01T00:00:00.000Z"
   *                   code: 200
   *                   message: "友情链接创建成功"
   *                   errMsg: ""
   *       400:
   *         description: URL已存在
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             examples:
   *               url_exists:
   *                 summary: URL已存在
   *                 value:
   *                   data: null
   *                   code: 400
   *                   message: "该URL的友情链接已存在"
   *                   errMsg: ""
   *       500:
   *         description: 服务器内部错误
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  @Post("/")
  public async createFriendLink(req: Request, res: Response) {
    const {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.BlogFriendLinkService.createFriendLink(req.body);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /blog/friendlink:
   *   get:
   *     tags:
   *       - 博客友情链接管理
   *     summary: 获取友情链接列表
   *     description: 获取友情链接列表，支持多种筛选条件
   *     parameters:
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [PENDING, APPROVED, REJECTED]
   *         description: 审核状态筛选
   *       - in: query
   *         name: keyword
   *         schema:
   *           type: string
   *         description: 搜索关键词（网站名称、描述或URL）
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
   *         description: 获取友情链接列表成功
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/FriendLinkListResponse'
   *             examples:
   *               without_pagination:
   *                 summary: 不分页响应
   *                 value:
   *                   data:
   *                     - id: 1
   *                       name: "技术博客"
   *                       url: "https://techblog.example.com"
   *                       description: "专注于前端技术分享"
   *                       status: "APPROVED"
   *                       sortOrder: 1
   *                     - id: 2
   *                       name: "设计博客"
   *                       url: "https://design.example.com"
   *                       description: "UI/UX设计经验分享"
   *                       status: "PENDING"
   *                       sortOrder: 2
   *                   code: 200
   *                   message: ""
   *                   errMsg: ""
   *               with_pagination:
   *                 summary: 分页响应
   *                 value:
   *                   data:
   *                     list:
   *                       - id: 1
   *                         name: "技术博客"
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
  public async getFriendLinkList(req: Request, res: Response) {
    const {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.BlogFriendLinkService.getFriendLinkList(req.query);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /blog/friendlink/approved:
   *   get:
   *     tags:
   *       - 博客友情链接管理
   *     summary: 获取已审核通过的友情链接
   *     description: 获取所有已审核通过的友情链接，用于前台展示
   *     responses:
   *       200:
   *         description: 获取已审核友情链接成功
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
   *                         $ref: '#/components/schemas/BlogFriendLink'
   *             examples:
   *               success:
   *                 summary: 成功响应示例
   *                 value:
   *                   data:
   *                     - id: 1
   *                       name: "技术博客"
   *                       url: "https://techblog.example.com"
   *                       description: "专注于前端技术分享"
   *                       avatar: "https://techblog.example.com/logo.png"
   *                       status: "APPROVED"
   *                       sortOrder: 1
   *                     - id: 3
   *                       name: "设计博客"
   *                       url: "https://design.example.com"
   *                       description: "UI/UX设计经验分享"
   *                       status: "APPROVED"
   *                       sortOrder: 2
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
  @Get("/approved")
  public async getApprovedFriendLinks(req: Request, res: Response) {
    const {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.BlogFriendLinkService.getApprovedFriendLinks();
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /blog/friendlink/stats:
   *   get:
   *     tags:
   *       - 博客友情链接管理
   *     summary: 获取友情链接统计信息
   *     description: 获取友情链接的各种统计数据
   *     security:
   *       - BearerAuth: []
   *     responses:
   *       200:
   *         description: 获取统计信息成功
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/FriendLinkStatsResponse'
   *             examples:
   *               success:
   *                 summary: 成功响应示例
   *                 value:
   *                   data:
   *                     totalLinks: 25
   *                     pendingLinks: 3
   *                     approvedLinks: 20
   *                     rejectedLinks: 2
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
  public async getFriendLinkStats(req: Request, res: Response) {
    const {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.BlogFriendLinkService.getFriendLinkStats();
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /blog/friendlink/{id}:
   *   get:
   *     tags:
   *       - 博客友情链接管理
   *     summary: 根据ID获取友情链接详情
   *     description: 根据友情链接ID获取详细信息
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: 友情链接ID
   *     responses:
   *       200:
   *         description: 获取友情链接详情成功
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/BlogFriendLink'
   *             examples:
   *               success:
   *                 summary: 成功响应示例
   *                 value:
   *                   data:
   *                     id: 1
   *                     name: "技术博客"
   *                     url: "https://techblog.example.com"
   *                     description: "专注于前端技术分享的博客"
   *                     avatar: "https://techblog.example.com/logo.png"
   *                     email: "admin@techblog.example.com"
   *                     status: "APPROVED"
   *                     sortOrder: 1
   *                     createdTime: "2024-01-01T00:00:00.000Z"
   *                   code: 200
   *                   message: ""
   *                   errMsg: ""
   *       404:
   *         description: 友情链接不存在
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             examples:
   *               not_found:
   *                 summary: 友情链接不存在
   *                 value:
   *                   data: null
   *                   code: 404
   *                   message: "友情链接不存在"
   *                   errMsg: ""
   *       500:
   *         description: 服务器内部错误
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  @Get("/:id")
  public async getFriendLinkById(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    
    const {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.BlogFriendLinkService.getFriendLinkById(id);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /blog/friendlink/{id}:
   *   put:
   *     tags:
   *       - 博客友情链接管理
   *     summary: 更新友情链接
   *     description: 更新指定ID的友情链接信息
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: 友情链接ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateFriendLinkRequest'
   *           examples:
   *             update_info:
   *               summary: 更新基本信息
   *               value:
   *                 name: "新技术博客"
   *                 description: "更新后的描述"
   *             update_status:
   *               summary: 更新状态
   *               value:
   *                 status: "APPROVED"
   *             update_all:
   *               summary: 更新所有信息
   *               value:
   *                 name: "新技术博客"
   *                 url: "https://newtechblog.example.com"
   *                 description: "更新后的技术博客"
   *                 avatar: "https://newtechblog.example.com/logo.png"
   *                 status: "APPROVED"
   *                 sortOrder: 1
   *     responses:
   *       200:
   *         description: 友情链接更新成功
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/BlogFriendLink'
   *             examples:
   *               success:
   *                 summary: 更新成功响应
   *                 value:
   *                   data:
   *                     id: 1
   *                     name: "新技术博客"
   *                     url: "https://newtechblog.example.com"
   *                     description: "更新后的技术博客"
   *                     status: "APPROVED"
   *                     updatedTime: "2024-01-02T00:00:00.000Z"
   *                   code: 200
   *                   message: "友情链接更新成功"
   *                   errMsg: ""
   *       400:
   *         description: URL已存在
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: 友情链接不存在
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
  public async updateFriendLink(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    
    const {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.BlogFriendLinkService.updateFriendLink(id, req.body);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /blog/friendlink/{id}:
   *   delete:
   *     tags:
   *       - 博客友情链接管理
   *     summary: 删除友情链接
   *     description: 软删除指定ID的友情链接
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: 友情链接ID
   *     responses:
   *       200:
   *         description: 友情链接删除成功
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
   *                   message: "友情链接删除成功"
   *                   errMsg: ""
   *       404:
   *         description: 友情链接不存在
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
  public async deleteFriendLink(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    
    const {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.BlogFriendLinkService.deleteFriendLink(id);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /blog/friendlink/{id}/approve:
   *   put:
   *     tags:
   *       - 博客友情链接管理
   *     summary: 审核通过友情链接
   *     description: 将指定友情链接状态设置为已审核通过
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: 友情链接ID
   *     responses:
   *       200:
   *         description: 友情链接审核通过
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/BlogFriendLink'
   *             examples:
   *               success:
   *                 summary: 审核通过成功
   *                 value:
   *                   data:
   *                     id: 1
   *                     name: "技术博客"
   *                     status: "APPROVED"
   *                     updatedTime: "2024-01-02T00:00:00.000Z"
   *                   code: 200
   *                   message: "友情链接审核通过"
   *                   errMsg: ""
   *       404:
   *         description: 友情链接不存在
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
  public async approveFriendLink(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    
    const {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.BlogFriendLinkService.approveFriendLink(id);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /blog/friendlink/{id}/reject:
   *   put:
   *     tags:
   *       - 博客友情链接管理
   *     summary: 拒绝友情链接
   *     description: 将指定友情链接状态设置为已拒绝
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: 友情链接ID
   *     responses:
   *       200:
   *         description: 友情链接已拒绝
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/BlogFriendLink'
   *             examples:
   *               success:
   *                 summary: 拒绝成功
   *                 value:
   *                   data:
   *                     id: 1
   *                     name: "技术博客"
   *                     status: "REJECTED"
   *                     updatedTime: "2024-01-02T00:00:00.000Z"
   *                   code: 200
   *                   message: "友情链接已拒绝"
   *                   errMsg: ""
   *       404:
   *         description: 友情链接不存在
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
  public async rejectFriendLink(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    
    const {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.BlogFriendLinkService.rejectFriendLink(id);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /blog/friendlink/sort:
   *   put:
   *     tags:
   *       - 博客友情链接管理
   *     summary: 更新友情链接排序
   *     description: 批量更新友情链接的排序顺序
   *     security:
   *       - BearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateSortRequest'
   *           examples:
   *             sort_update:
   *               summary: 排序更新示例
   *               value:
   *                 sortData:
   *                   - id: 3
   *                     sortOrder: 1
   *                   - id: 1
   *                     sortOrder: 2
   *                   - id: 2
   *                     sortOrder: 3
   *     responses:
   *       200:
   *         description: 排序更新成功
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiResponse'
   *             examples:
   *               success:
   *                 summary: 排序更新成功响应
   *                 value:
   *                   data: null
   *                   code: 200
   *                   message: "友情链接排序更新成功"
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
  @Put("/sort")
  public async updateFriendLinkSort(req: Request, res: Response) {
    const {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.BlogFriendLinkService.updateFriendLinkSort(req.body.sortData);
    res.sendResult(data, code, message, errMsg);
  }
}