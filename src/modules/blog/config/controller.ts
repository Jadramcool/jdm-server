import type { Request, Response } from "express";
import { inject } from "inversify";
import { controller, httpGet as Get, httpPost as Post, httpPut as Put, httpDelete as Delete } from "inversify-express-utils";
import { UtilService } from "../../../utils/utils";
import { BlogConfigService } from "./services";

/**
 * @swagger
 * tags:
 *   - name: 博客配置管理
 *     description: 博客系统配置相关接口
 * 
 * components:
 *   schemas:
 *     BlogConfig:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 配置ID
 *         key:
 *           type: string
 *           description: 配置键
 *         value:
 *           type: string
 *           description: 配置值
 *         description:
 *           type: string
 *           description: 配置描述
 *         type:
 *           type: string
 *           enum: [string, number, boolean, json]
 *           description: 配置类型
 *         category:
 *           type: string
 *           description: 配置分类
 *         createdTime:
 *           type: string
 *           format: date-time
 *           description: 创建时间
 *         updatedTime:
 *           type: string
 *           format: date-time
 *           description: 更新时间
 *         parsedValue:
 *           description: 解析后的值（根据type转换）
 * 
 *     CreateConfigRequest:
 *       type: object
 *       required:
 *         - key
 *         - value
 *       properties:
 *         key:
 *           type: string
 *           description: 配置键（唯一）
 *           example: "site_title"
 *         value:
 *           type: string
 *           description: 配置值
 *           example: "我的博客"
 *         description:
 *           type: string
 *           description: 配置描述
 *           example: "网站标题"
 *         type:
 *           type: string
 *           enum: [string, number, boolean, json]
 *           default: string
 *           description: 配置类型
 *         category:
 *           type: string
 *           default: general
 *           description: 配置分类
 *           example: "site"
 * 
 *     UpdateConfigRequest:
 *       type: object
 *       properties:
 *         value:
 *           type: string
 *           description: 配置值
 *         description:
 *           type: string
 *           description: 配置描述
 *         type:
 *           type: string
 *           enum: [string, number, boolean, json]
 *           description: 配置类型
 *         category:
 *           type: string
 *           description: 配置分类
 * 
 *     BatchUpdateConfigRequest:
 *       type: object
 *       required:
 *         - configs
 *       properties:
 *         configs:
 *           type: array
 *           items:
 *             type: object
 *             required:
 *               - key
 *               - value
 *             properties:
 *               key:
 *                 type: string
 *                 description: 配置键
 *               value:
 *                 type: string
 *                 description: 配置值
 *           example:
 *             - key: "site_title"
 *               value: "新的博客标题"
 *             - key: "site_description"
 *               value: "这是一个很棒的博客"
 * 
 *     ConfigStatsResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: object
 *           properties:
 *             totalConfigs:
 *               type: integer
 *               description: 总配置数
 *             categoryCount:
 *               type: object
 *               additionalProperties:
 *                 type: integer
 *               description: 各分类配置数量
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
 *     ConfigListResponse:
 *       type: object
 *       properties:
 *         data:
 *           oneOf:
 *             - type: array
 *               items:
 *                 $ref: '#/components/schemas/BlogConfig'
 *             - type: object
 *               properties:
 *                 list:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BlogConfig'
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

@controller("/blog/config")
export class BlogConfigController {
  constructor(
    @inject(BlogConfigService)
    private readonly BlogConfigService: BlogConfigService,
    @inject(UtilService)
    private readonly UtilService: UtilService
  ) {}

  /**
   * @swagger
   * /blog/config:
   *   post:
   *     tags:
   *       - 博客配置管理
   *     summary: 创建博客配置
   *     description: 创建一个新的博客系统配置项
   *     security:
   *       - BearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateConfigRequest'
   *           examples:
   *             site_config:
   *               summary: 网站配置
   *               value:
   *                 key: "site_title"
   *                 value: "我的博客"
   *                 description: "网站标题"
   *                 type: "string"
   *                 category: "site"
   *             number_config:
   *               summary: 数字配置
   *               value:
   *                 key: "posts_per_page"
   *                 value: "10"
   *                 description: "每页文章数量"
   *                 type: "number"
   *                 category: "display"
   *             boolean_config:
   *               summary: 布尔配置
   *               value:
   *                 key: "enable_comments"
   *                 value: "true"
   *                 description: "是否启用评论"
   *                 type: "boolean"
   *                 category: "feature"
   *     responses:
   *       200:
   *         description: 配置创建成功
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/BlogConfig'
   *             examples:
   *               success:
   *                 summary: 创建成功响应
   *                 value:
   *                   data:
   *                     id: 1
   *                     key: "site_title"
   *                     value: "我的博客"
   *                     description: "网站标题"
   *                     type: "string"
   *                     category: "site"
   *                     createdTime: "2024-01-01T00:00:00.000Z"
   *                   code: 200
   *                   message: "配置创建成功"
   *                   errMsg: ""
   *       400:
   *         description: 配置键已存在
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             examples:
   *               key_exists:
   *                 summary: 配置键已存在
   *                 value:
   *                   data: null
   *                   code: 400
   *                   message: "配置键已存在"
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
  public async createConfig(req: Request, res: Response) {
    const {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.BlogConfigService.createConfig(req.body);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /blog/config:
   *   get:
   *     tags:
   *       - 博客配置管理
   *     summary: 获取博客配置列表
   *     description: 获取博客配置列表，支持多种筛选条件
   *     parameters:
   *       - in: query
   *         name: category
   *         schema:
   *           type: string
   *         description: 配置分类筛选
   *         example: "site"
   *       - in: query
   *         name: type
   *         schema:
   *           type: string
   *           enum: [string, number, boolean, json]
   *         description: 配置类型筛选
   *       - in: query
   *         name: keyword
   *         schema:
   *           type: string
   *         description: 搜索关键词（配置键、描述或值）
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
   *         description: 获取配置列表成功
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ConfigListResponse'
   *             examples:
   *               without_pagination:
   *                 summary: 不分页响应
   *                 value:
   *                   data:
   *                     - id: 1
   *                       key: "site_title"
   *                       value: "我的博客"
   *                       description: "网站标题"
   *                       type: "string"
   *                       category: "site"
   *                     - id: 2
   *                       key: "posts_per_page"
   *                       value: "10"
   *                       description: "每页文章数量"
   *                       type: "number"
   *                       category: "display"
   *                   code: 200
   *                   message: ""
   *                   errMsg: ""
   *               with_pagination:
   *                 summary: 分页响应
   *                 value:
   *                   data:
   *                     list:
   *                       - id: 1
   *                         key: "site_title"
   *                         value: "我的博客"
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
  public async getConfigList(req: Request, res: Response) {
    const {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.BlogConfigService.getConfigList(req.query);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /blog/config/category/{category}:
   *   get:
   *     tags:
   *       - 博客配置管理
   *     summary: 根据分类获取配置
   *     description: 获取指定分类的所有配置，返回键值对格式
   *     parameters:
   *       - in: path
   *         name: category
   *         required: true
   *         schema:
   *           type: string
   *         description: 配置分类
   *         example: "site"
   *     responses:
   *       200:
   *         description: 获取分类配置成功
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       type: object
   *                       additionalProperties: true
   *                       description: 配置键值对
   *             examples:
   *               success:
   *                 summary: 成功响应示例
   *                 value:
   *                   data:
   *                     site_title: "我的博客"
   *                     site_description: "这是一个很棒的博客"
   *                     site_keywords: "博客,技术,分享"
   *                     posts_per_page: 10
   *                     enable_comments: true
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
  @Get("/category/:category")
  public async getConfigsByCategory(req: Request, res: Response) {
    const category = req.params.category;
    
    const {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.BlogConfigService.getConfigsByCategory(category);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /blog/config/key/{key}:
   *   get:
   *     tags:
   *       - 博客配置管理
   *     summary: 根据键获取配置
   *     description: 根据配置键获取单个配置项，包含解析后的值
   *     parameters:
   *       - in: path
   *         name: key
   *         required: true
   *         schema:
   *           type: string
   *         description: 配置键
   *         example: "site_title"
   *     responses:
   *       200:
   *         description: 获取配置成功
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/BlogConfig'
   *             examples:
   *               success:
   *                 summary: 成功响应示例
   *                 value:
   *                   data:
   *                     id: 1
   *                     key: "site_title"
   *                     value: "我的博客"
   *                     description: "网站标题"
   *                     type: "string"
   *                     category: "site"
   *                     parsedValue: "我的博客"
   *                     createdTime: "2024-01-01T00:00:00.000Z"
   *                   code: 200
   *                   message: ""
   *                   errMsg: ""
   *       404:
   *         description: 配置不存在
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             examples:
   *               not_found:
   *                 summary: 配置不存在
   *                 value:
   *                   data: null
   *                   code: 404
   *                   message: "配置不存在"
   *                   errMsg: ""
   *       500:
   *         description: 服务器内部错误
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  @Get("/key/:key")
  public async getConfigByKey(req: Request, res: Response) {
    const key = req.params.key;
    
    const {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.BlogConfigService.getConfigByKey(key);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /blog/config/categories:
   *   get:
   *     tags:
   *       - 博客配置管理
   *     summary: 获取配置分类列表
   *     description: 获取所有配置分类的列表
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
   *                         type: string
   *                       description: 分类列表
   *             examples:
   *               success:
   *                 summary: 成功响应示例
   *                 value:
   *                   data: ["site", "display", "feature", "seo", "social"]
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
  @Get("/categories")
  public async getConfigCategories(req: Request, res: Response) {
    const {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.BlogConfigService.getConfigCategories();
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /blog/config/stats:
   *   get:
   *     tags:
   *       - 博客配置管理
   *     summary: 获取博客配置统计信息
   *     description: 获取博客配置的各种统计数据
   *     security:
   *       - BearerAuth: []
   *     responses:
   *       200:
   *         description: 获取统计信息成功
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ConfigStatsResponse'
   *             examples:
   *               success:
   *                 summary: 成功响应示例
   *                 value:
   *                   data:
   *                     totalConfigs: 25
   *                     categoryCount:
   *                       site: 8
   *                       display: 5
   *                       feature: 7
   *                       seo: 3
   *                       social: 2
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
  public async getConfigStats(req: Request, res: Response) {
    const {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.BlogConfigService.getConfigStats();
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /blog/config/{id}:
   *   get:
   *     tags:
   *       - 博客配置管理
   *     summary: 根据ID获取博客配置详情
   *     description: 根据配置ID获取详细信息
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: 配置ID
   *     responses:
   *       200:
   *         description: 获取配置详情成功
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/BlogConfig'
   *             examples:
   *               success:
   *                 summary: 成功响应示例
   *                 value:
   *                   data:
   *                     id: 1
   *                     key: "site_title"
   *                     value: "我的博客"
   *                     description: "网站标题"
   *                     type: "string"
   *                     category: "site"
   *                     createdTime: "2024-01-01T00:00:00.000Z"
   *                   code: 200
   *                   message: ""
   *                   errMsg: ""
   *       404:
   *         description: 配置不存在
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
  @Get("/:id")
  public async getConfigById(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    
    const {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.BlogConfigService.getConfigById(id);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /blog/config/{id}:
   *   put:
   *     tags:
   *       - 博客配置管理
   *     summary: 更新博客配置
   *     description: 更新指定ID的博客配置信息
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: 配置ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateConfigRequest'
   *           examples:
   *             update_value:
   *               summary: 更新配置值
   *               value:
   *                 value: "新的博客标题"
   *             update_all:
   *               summary: 更新所有字段
   *               value:
   *                 value: "新的博客标题"
   *                 description: "更新后的网站标题"
   *                 type: "string"
   *                 category: "site"
   *     responses:
   *       200:
   *         description: 配置更新成功
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/BlogConfig'
   *             examples:
   *               success:
   *                 summary: 更新成功响应
   *                 value:
   *                   data:
   *                     id: 1
   *                     key: "site_title"
   *                     value: "新的博客标题"
   *                     description: "更新后的网站标题"
   *                     updatedTime: "2024-01-02T00:00:00.000Z"
   *                   code: 200
   *                   message: "配置更新成功"
   *                   errMsg: ""
   *       404:
   *         description: 配置不存在
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
  public async updateConfig(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    
    const {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.BlogConfigService.updateConfig(id, req.body);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /blog/config/batch:
   *   put:
   *     tags:
   *       - 博客配置管理
   *     summary: 批量更新博客配置
   *     description: 批量更新多个博客配置项的值
   *     security:
   *       - BearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/BatchUpdateConfigRequest'
   *           examples:
   *             batch_update:
   *               summary: 批量更新示例
   *               value:
   *                 configs:
   *                   - key: "site_title"
   *                     value: "新的博客标题"
   *                   - key: "site_description"
   *                     value: "这是一个很棒的博客"
   *                   - key: "posts_per_page"
   *                     value: "15"
   *     responses:
   *       200:
   *         description: 批量更新成功
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiResponse'
   *             examples:
   *               success:
   *                 summary: 批量更新成功响应
   *                 value:
   *                   data: null
   *                   code: 200
   *                   message: "配置批量更新成功"
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
  @Put("/batch")
  public async updateConfigs(req: Request, res: Response) {
    const {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.BlogConfigService.updateConfigs(req.body.configs);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /blog/config/{id}:
   *   delete:
   *     tags:
   *       - 博客配置管理
   *     summary: 删除博客配置
   *     description: 软删除指定ID的博客配置
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: 配置ID
   *     responses:
   *       200:
   *         description: 配置删除成功
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
   *                   message: "配置删除成功"
   *                   errMsg: ""
   *       404:
   *         description: 配置不存在
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
  public async deleteConfig(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    
    const {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.BlogConfigService.deleteConfig(id);
    res.sendResult(data, code, message, errMsg);
  }
}