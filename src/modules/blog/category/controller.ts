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
import { BlogCategoryService } from "./services";

/**
 * @swagger
 * tags:
 *   - name: 博客分类管理
 *     description: 博客分类相关接口
 *
 * components:
 *   schemas:
 *     BlogCategory:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 分类ID
 *         name:
 *           type: string
 *           description: 分类名称
 *         slug:
 *           type: string
 *           description: URL友好的标识符
 *         description:
 *           type: string
 *           description: 分类描述
 *         icon:
 *           type: string
 *           description: 分类图标
 *         color:
 *           type: string
 *           description: 分类颜色
 *         parentId:
 *           type: integer
 *           description: 父分类ID
 *         sortOrder:
 *           type: integer
 *           description: 排序
 *         postCount:
 *           type: integer
 *           description: 文章数量
 *         createdTime:
 *           type: string
 *           format: date-time
 *           description: 创建时间
 *         updatedTime:
 *           type: string
 *           format: date-time
 *           description: 更新时间
 *         parent:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             name:
 *               type: string
 *             slug:
 *               type: string
 *         children:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *               name:
 *                 type: string
 *               slug:
 *                 type: string
 *               description:
 *                 type: string
 *               icon:
 *                 type: string
 *               color:
 *                 type: string
 *               sortOrder:
 *                 type: integer
 *               postCount:
 *                 type: integer
 *
 *     CreateCategoryRequest:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           description: 分类名称
 *           example: "技术分享"
 *         slug:
 *           type: string
 *           description: URL友好的标识符（可选，不提供则自动生成）
 *           example: "tech-sharing"
 *         description:
 *           type: string
 *           description: 分类描述
 *           example: "技术相关的文章分类"
 *         icon:
 *           type: string
 *           description: 分类图标
 *           example: "icon-tech"
 *         color:
 *           type: string
 *           description: 分类颜色
 *           example: "#3498db"
 *         parentId:
 *           type: integer
 *           description: 父分类ID
 *           example: 1
 *         sortOrder:
 *           type: integer
 *           description: 排序
 *           example: 0
 *
 *     UpdateCategoryRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: 分类名称
 *         slug:
 *           type: string
 *           description: URL友好的标识符
 *         description:
 *           type: string
 *           description: 分类描述
 *         icon:
 *           type: string
 *           description: 分类图标
 *         color:
 *           type: string
 *           description: 分类颜色
 *         parentId:
 *           type: integer
 *           description: 父分类ID
 *         sortOrder:
 *           type: integer
 *           description: 排序
 *
 *     CategoryStatsResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: object
 *           properties:
 *             totalCategories:
 *               type: integer
 *               description: 总分类数
 *             rootCategories:
 *               type: integer
 *               description: 根分类数
 *             categoriesWithPosts:
 *               type: integer
 *               description: 有文章的分类数
 *             emptyCategories:
 *               type: integer
 *               description: 空分类数
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

@controller("/blog/category")
export class BlogCategoryController {
  constructor(
    @inject(BlogCategoryService)
    private readonly BlogCategoryService: BlogCategoryService,
    @inject(UtilService)
    private readonly UtilService: UtilService
  ) {}

  /**
   * @swagger
   * /blog/category:
   *   post:
   *     tags:
   *       - 博客分类管理
   *     summary: 创建博客分类
   *     description: 创建一个新的博客分类
   *     security:
   *       - BearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateCategoryRequest'
   *           examples:
   *             root_category:
   *               summary: 创建根分类
   *               value:
   *                 name: "技术分享"
   *                 description: "技术相关的文章分类"
   *                 icon: "icon-tech"
   *                 color: "#3498db"
   *                 sortOrder: 0
   *             sub_category:
   *               summary: 创建子分类
   *               value:
   *                 name: "前端开发"
   *                 slug: "frontend-dev"
   *                 description: "前端开发相关技术"
   *                 icon: "icon-frontend"
   *                 color: "#e74c3c"
   *                 parentId: 1
   *                 sortOrder: 1
   *     responses:
   *       200:
   *         description: 分类创建成功
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/BlogCategory'
   *             examples:
   *               success:
   *                 summary: 创建成功响应
   *                 value:
   *                   data:
   *                     id: 1
   *                     name: "技术分享"
   *                     slug: "tech-sharing"
   *                     description: "技术相关的文章分类"
   *                     icon: "icon-tech"
   *                     color: "#3498db"
   *                     parentId: null
   *                     sortOrder: 0
   *                     postCount: 0
   *                     createdTime: "2024-01-01T00:00:00.000Z"
   *                   code: 200
   *                   message: "分类创建成功"
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
   *                   message: "分类标识符已存在"
   *                   errMsg: ""
   *               name_exists:
   *                 summary: 名称已存在
   *                 value:
   *                   data: null
   *                   code: 400
   *                   message: "分类名称已存在"
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
  public async createCategory(req: Request, res: Response) {
    const {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.BlogCategoryService.createCategory(req.body);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /blog/category:
   *   get:
   *     tags:
   *       - 博客分类管理
   *     summary: 获取博客分类列表
   *     description: 获取博客分类列表，支持筛选条件
   *     parameters:
   *       - in: query
   *         name: parentId
   *         schema:
   *           type: integer
   *         description: 父分类ID筛选（不传则获取所有分类）
   *       - in: query
   *         name: includeChildren
   *         schema:
   *           type: boolean
   *           default: true
   *         description: 是否包含子分类
   *       - in: query
   *         name: includePostCount
   *         schema:
   *           type: boolean
   *           default: true
   *         description: 是否包含文章数量
   *     responses:
   *       200:
   *         description: 获取分类列表成功
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
   *                         $ref: '#/components/schemas/BlogCategory'
   *             examples:
   *               success:
   *                 summary: 成功响应示例
   *                 value:
   *                   data:
   *                     - id: 1
   *                       name: "技术分享"
   *                       slug: "tech-sharing"
   *                       description: "技术相关的文章分类"
   *                       icon: "icon-tech"
   *                       color: "#3498db"
   *                       parentId: null
   *                       sortOrder: 0
   *                       postCount: 5
   *                       children:
   *                         - id: 2
   *                           name: "前端开发"
   *                           slug: "frontend-dev"
   *                           postCount: 3
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
  public async getCategoryList(req: Request, res: Response) {
    const config = this.UtilService.parseQueryParams(req);
    const {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.BlogCategoryService.getCategoryList(config);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /blog/category/tree:
   *   get:
   *     tags:
   *       - 博客分类管理
   *     summary: 获取博客分类树形结构
   *     description: 获取完整的分类树形结构
   *     responses:
   *       200:
   *         description: 获取分类树成功
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
   *                         $ref: '#/components/schemas/BlogCategory'
   *             examples:
   *               success:
   *                 summary: 成功响应示例
   *                 value:
   *                   data:
   *                     - id: 1
   *                       name: "技术分享"
   *                       slug: "tech-sharing"
   *                       postCount: 5
   *                       children:
   *                         - id: 2
   *                           name: "前端开发"
   *                           slug: "frontend-dev"
   *                           postCount: 3
   *                           children: []
   *                         - id: 3
   *                           name: "后端开发"
   *                           slug: "backend-dev"
   *                           postCount: 2
   *                           children: []
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
  @Get("/tree")
  public async getCategoryTree(req: Request, res: Response) {
    const {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.BlogCategoryService.getCategoryTree();
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /blog/category/stats:
   *   get:
   *     tags:
   *       - 博客分类管理
   *     summary: 获取博客分类统计信息
   *     description: 获取博客分类的各种统计数据
   *     security:
   *       - BearerAuth: []
   *     responses:
   *       200:
   *         description: 获取统计信息成功
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/CategoryStatsResponse'
   *             examples:
   *               success:
   *                 summary: 成功响应示例
   *                 value:
   *                   data:
   *                     totalCategories: 10
   *                     rootCategories: 4
   *                     categoriesWithPosts: 8
   *                     emptyCategories: 2
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
  public async getCategoryStats(req: Request, res: Response) {
    const {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.BlogCategoryService.getCategoryStats();
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /blog/category/{id}:
   *   get:
   *     tags:
   *       - 博客分类管理
   *     summary: 根据ID获取博客分类详情
   *     description: 根据分类ID获取详细信息，包含子分类和最新文章
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: 分类ID
   *     responses:
   *       200:
   *         description: 获取分类详情成功
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       allOf:
   *                         - $ref: '#/components/schemas/BlogCategory'
   *                         - type: object
   *                           properties:
   *                             posts:
   *                               type: array
   *                               items:
   *                                 type: object
   *                                 properties:
   *                                   id:
   *                                     type: integer
   *                                   title:
   *                                     type: string
   *                                   slug:
   *                                     type: string
   *                                   summary:
   *                                     type: string
   *                                   coverImage:
   *                                     type: string
   *                                   viewCount:
   *                                     type: integer
   *                                   likeCount:
   *                                     type: integer
   *                                   commentCount:
   *                                     type: integer
   *                                   publishedAt:
   *                                     type: string
   *                                     format: date-time
   *                                   author:
   *                                     type: object
   *                                     properties:
   *                                       id:
   *                                         type: integer
   *                                       username:
   *                                         type: string
   *                                       avatar:
   *                                         type: string
   *             examples:
   *               success:
   *                 summary: 成功响应示例
   *                 value:
   *                   data:
   *                     id: 1
   *                     name: "技术分享"
   *                     slug: "tech-sharing"
   *                     description: "技术相关的文章分类"
   *                     postCount: 5
   *                     children: []
   *                     posts:
   *                       - id: 1
   *                         title: "Vue 3 新特性详解"
   *                         slug: "vue3-new-features"
   *                         summary: "介绍 Vue 3 的新特性"
   *                         viewCount: 100
   *                         author:
   *                           username: "admin"
   *                   code: 200
   *                   message: ""
   *                   errMsg: ""
   *       404:
   *         description: 分类不存在
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             examples:
   *               not_found:
   *                 summary: 分类不存在
   *                 value:
   *                   data: null
   *                   code: 404
   *                   message: "分类不存在"
   *                   errMsg: ""
   *       500:
   *         description: 服务器内部错误
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  @Get("/:id")
  public async getCategoryById(req: Request, res: Response) {
    const id = parseInt(req.params.id);

    const {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.BlogCategoryService.getCategoryById(id);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /blog/category/slug/{slug}:
   *   get:
   *     tags:
   *       - 博客分类管理
   *     summary: 根据slug获取博客分类详情
   *     description: 根据分类slug获取详细信息，包含子分类和最新文章
   *     parameters:
   *       - in: path
   *         name: slug
   *         required: true
   *         schema:
   *           type: string
   *         description: 分类slug
   *         example: "tech-sharing"
   *     responses:
   *       200:
   *         description: 获取分类详情成功
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/BlogCategory'
   *       404:
   *         description: 分类不存在
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
  public async getCategoryBySlug(req: Request, res: Response) {
    const slug = req.params.slug;

    const {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.BlogCategoryService.getCategoryBySlug(slug);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /blog/category/update-all-post-count:
   *   put:
   *     tags:
   *       - 博客分类管理
   *     summary: 全局更新所有分类文章数量
   *     description: 重新计算并更新所有分类的文章数量，用于数据修复或定期维护
   *     security:
   *       - BearerAuth: []
   *     responses:
   *       200:
   *         description: 全局更新成功
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
   *                         totalCategories:
   *                           type: integer
   *                           description: 总分类数量
   *                         updatedCount:
   *                           type: integer
   *                           description: 成功更新的分类数量
   *                         failedCount:
   *                           type: integer
   *                           description: 更新失败的分类数量
   *                         results:
   *                           type: array
   *                           description: 详细更新结果
   *                           items:
   *                             type: object
   *                             properties:
   *                               categoryId:
   *                                 type: integer
   *                                 description: 分类ID
   *                               postCount:
   *                                 type: integer
   *                                 description: 更新后的文章数量
   *                               status:
   *                                 type: string
   *                                 enum: [success, failed]
   *                                 description: 更新状态
   *                               error:
   *                                 type: string
   *                                 description: 错误信息（仅失败时）
   *             examples:
   *               success:
   *                 summary: 全局更新成功
   *                 value:
   *                   data:
   *                     totalCategories: 8
   *                     updatedCount: 7
   *                     failedCount: 1
   *                     results:
   *                       - categoryId: 1
   *                         postCount: 12
   *                         status: "success"
   *                       - categoryId: 2
   *                         postCount: 5
   *                         status: "success"
   *                       - categoryId: 3
   *                         status: "failed"
   *                         error: "数据库连接错误"
   *                   code: 200
   *                   message: "成功更新 7/8 个分类的文章数量"
   *                   errMsg: ""
   *       500:
   *         description: 服务器内部错误
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  @Put("/update-all-post-count")
  public async updateAllCategoriesPostCount(req: Request, res: Response) {
    const {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.BlogCategoryService.updateAllCategoriesPostCount();
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /blog/category/{id}:
   *   put:
   *     tags:
   *       - 博客分类管理
   *     summary: 更新博客分类
   *     description: 更新指定ID的博客分类信息
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: 分类ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateCategoryRequest'
   *           examples:
   *             update_name:
   *               summary: 更新名称和描述
   *               value:
   *                 name: "前端技术"
   *                 description: "前端开发相关技术分享"
   *             update_parent:
   *               summary: 更新父分类
   *               value:
   *                 parentId: 2
   *             update_style:
   *               summary: 更新样式
   *               value:
   *                 icon: "icon-new"
   *                 color: "#2ecc71"
   *                 sortOrder: 5
   *     responses:
   *       200:
   *         description: 分类更新成功
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/BlogCategory'
   *             examples:
   *               success:
   *                 summary: 更新成功响应
   *                 value:
   *                   data:
   *                     id: 1
   *                     name: "前端技术"
   *                     slug: "frontend-tech"
   *                     description: "前端开发相关技术分享"
   *                     updatedTime: "2024-01-02T00:00:00.000Z"
   *                   code: 200
   *                   message: "分类更新成功"
   *                   errMsg: ""
   *       400:
   *         description: 请求参数错误
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             examples:
   *               circular_reference:
   *                 summary: 循环引用错误
   *                 value:
   *                   data: null
   *                   code: 400
   *                   message: "不能将子分类设为父分类"
   *                   errMsg: ""
   *       404:
   *         description: 分类不存在
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
  public async updateCategory(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    const {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.BlogCategoryService.updateCategory(id, req.body);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /blog/category/{id}:
   *   delete:
   *     tags:
   *       - 博客分类管理
   *     summary: 删除博客分类
   *     description: 软删除指定ID的博客分类（需要先删除子分类和文章）
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: 分类ID
   *     responses:
   *       200:
   *         description: 分类删除成功
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
   *                   message: "分类删除成功"
   *                   errMsg: ""
   *       400:
   *         description: 删除条件不满足
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             examples:
   *               has_children:
   *                 summary: 有子分类
   *                 value:
   *                   data: null
   *                   code: 400
   *                   message: "该分类下还有子分类，无法删除"
   *                   errMsg: ""
   *               has_posts:
   *                 summary: 有文章
   *                 value:
   *                   data: null
   *                   code: 400
   *                   message: "该分类下还有文章，无法删除"
   *                   errMsg: ""
   *       404:
   *         description: 分类不存在
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
  public async deleteCategory(req: Request, res: Response) {
    const id = parseInt(req.params.id);

    const {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.BlogCategoryService.deleteCategory(id);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /blog/category/{id}/update-post-count:
   *   put:
   *     tags:
   *       - 博客分类管理
   *     summary: 更新分类文章数量
   *     description: 重新计算并更新指定分类的文章数量
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: 分类ID
   *     responses:
   *       200:
   *         description: 文章数量更新成功
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
   *                         postCount:
   *                           type: integer
   *                           description: 更新后的文章数量
   *             examples:
   *               success:
   *                 summary: 更新成功
   *                 value:
   *                   data:
   *                     postCount: 5
   *                   code: 200
   *                   message: "分类文章数量更新成功"
   *                   errMsg: ""
   *       500:
   *         description: 服务器内部错误
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  @Put("/:id/update-post-count")
  public async updateCategoryPostCount(req: Request, res: Response) {
    const id = parseInt(req.params.id);

    const {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.BlogCategoryService.updateCategoryPostCount(id);
    res.sendResult(data, code, message, errMsg);
  }
}
