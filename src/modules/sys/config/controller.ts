import { JWT } from "@/jwt";
import type { Request, Response } from "express";
import { inject } from "inversify";
import {
  controller,
  httpDelete as Delete,
  httpGet as Get,
  interfaces,
  httpPost as Post,
  httpPut as Put,
} from "inversify-express-utils";
import { UtilService } from "../../../utils/utils";
import { ConfigService } from "./services";

/**
 * @swagger
 * tags:
 *   name: System Config
 *   description: 系统配置管理
 */

@controller("/system/config")
export class ConfigController implements interfaces.Controller {
  constructor(
    @inject(ConfigService)
    private readonly configService: ConfigService,
    @inject(UtilService)
    private readonly utilService: UtilService
  ) {}

  /**
   * @swagger
   * /system/config/list:
   *   get:
   *     summary: 获取配置列表
   *     tags: [System Config]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: category
   *         schema:
   *           type: string
   *         description: 配置分类
   *       - in: query
   *         name: type
   *         schema:
   *           type: string
   *           enum: [STRING, NUMBER, BOOLEAN, JSON, ARRAY, FILE, EMAIL, URL, PASSWORD]
   *         description: 配置类型
   *       - in: query
   *         name: keyword
   *         schema:
   *           type: string
   *         description: 搜索关键词
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
   *           default: 10
   *         description: 每页数量
   *     responses:
   *       200:
   *         description: 获取配置列表成功
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 code:
   *                   type: number
   *                   example: 200
   *                 message:
   *                   type: string
   *                   example: "获取配置列表成功"
   *                 data:
   *                   type: object
   *                   properties:
   *                     data:
   *                       type: object
   *                       properties:
   *                         data:
   *                           type: array
   *                           items:
   *                             $ref: '#/components/schemas/Config'
   *                         pagination:
   *                           type: object
   *                           properties:
   *                             page:
   *                               type: number
   *                               example: 1
   *                             pageSize:
   *                               type: number
   *                               example: 10
   *                             totalRecords:
   *                               type: number
   *                               example: 100
   *                             totalPages:
   *                               type: number
   *                               example: 10
   *       401:
   *         description: 未授权
   *       500:
   *         description: 服务器错误
   */
  @Get("/list", JWT.authenticateJwt())
  public async getConfigList(req: Request, res: Response) {
    const query = this.utilService.parseQueryParams(req);
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.configService.getConfigList(query);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /system/config/public:
   *   get:
   *     summary: 获取公开配置
   *     description: 获取所有公开的系统配置，无需认证
   *     tags: [System Config]
   *     responses:
   *       200:
   *         description: 获取公开配置成功
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 code:
   *                   type: number
   *                   example: 200
   *                 message:
   *                   type: string
   *                   example: "获取公开配置成功"
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Config'
   *       500:
   *         description: 服务器错误
   */
  @Get("/public")
  public async getPublicConfigs(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.configService.getPublicConfigs();
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /system/config/detail/{id}:
   *   get:
   *     summary: 根据ID获取配置
   *     tags: [System Config]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: 配置ID
   *     responses:
   *       200:
   *         description: 获取配置成功
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 code:
   *                   type: number
   *                   example: 200
   *                 message:
   *                   type: string
   *                   example: "获取配置成功"
   *                 data:
   *                   $ref: '#/components/schemas/Config'
   *       401:
   *         description: 未授权
   *       404:
   *         description: 配置不存在
   *       500:
   *         description: 服务器错误
   */
  @Get("/detail/:id", JWT.authenticateJwt())
  public async getConfigById(req: Request, res: Response) {
    const id = Number(req.params.id);
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.configService.getConfigById(id);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /system/config/key/{key}:
   *   get:
   *     summary: 根据键名获取配置值
   *     tags: [System Config]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: key
   *         required: true
   *         schema:
   *           type: string
   *         description: 配置键名
   *         example: "system.siteName"
   *     responses:
   *       200:
   *         description: 获取配置值成功
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 code:
   *                   type: number
   *                   example: 200
   *                 message:
   *                   type: string
   *                   example: "获取配置值成功"
   *                 data:
   *                   oneOf:
   *                     - type: string
   *                     - type: number
   *                     - type: boolean
   *                     - type: object
   *                     - type: array
   *       401:
   *         description: 未授权
   *       404:
   *         description: 配置不存在
   *       500:
   *         description: 服务器错误
   */
  @Get("/key/:key", JWT.authenticateJwt())
  public async getConfigByKey(req: Request, res: Response) {
    const key = req.params.key;
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.configService.getConfigByKey(key);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /system/config/create:
   *   post:
   *     summary: 创建新配置
   *     tags: [System Config]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/ConfigDto'
   *     responses:
   *       200:
   *         description: 创建配置成功
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 code:
   *                   type: number
   *                   example: 200
   *                 message:
   *                   type: string
   *                   example: "创建配置成功"
   *                 data:
   *                   $ref: '#/components/schemas/Config'
   *       400:
   *         description: 参数错误
   *       401:
   *         description: 未授权
   *       409:
   *         description: 配置键名已存在
   *       500:
   *         description: 服务器错误
   */
  @Post("/create", JWT.authenticateJwt())
  public async createConfig(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.configService.createConfig(req.body);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /system/config/update:
   *   put:
   *     summary: 更新配置
   *     tags: [System Config]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             allOf:
   *               - $ref: '#/components/schemas/ConfigDto'
   *               - type: object
   *                 properties:
   *                   id:
   *                     type: integer
   *                     description: 配置ID
   *                     example: 1
   *                 required:
   *                   - id
   *     responses:
   *       200:
   *         description: 更新配置成功
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 code:
   *                   type: number
   *                   example: 200
   *                 message:
   *                   type: string
   *                   example: "更新配置成功"
   *                 data:
   *                   $ref: '#/components/schemas/Config'
   *       400:
   *         description: 参数错误
   *       401:
   *         description: 未授权
   *       404:
   *         description: 配置不存在
   *       500:
   *         description: 服务器错误
   */
  @Put("/update", JWT.authenticateJwt())
  public async updateConfig(req: Request, res: Response) {
    const { id, ...configDto } = req.body;
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.configService.updateConfig(id, configDto);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /system/config/batch-update:
   *   put:
   *     summary: 批量更新配置
   *     tags: [System Config]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               configs:
   *                 type: array
   *                 items:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: integer
   *                       description: 配置ID
   *                     value:
   *                       type: string
   *                       description: 配置值
   *     responses:
   *       200:
   *         description: 批量更新配置成功
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 code:
   *                   type: number
   *                   example: 200
   *                 message:
   *                   type: string
   *                   example: "批量更新配置成功"
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Config'
   *       400:
   *         description: 参数错误
   *       401:
   *         description: 未授权
   *       500:
   *         description: 服务器错误
   */
  @Put("/batch-update", JWT.authenticateJwt())
  public async batchUpdateConfigs(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.configService.batchUpdateConfigs(req.body);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /system/config/delete/{id}:
   *   delete:
   *     summary: 删除配置
   *     tags: [System Config]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: 配置ID
   *     responses:
   *       200:
   *         description: 删除配置成功
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 code:
   *                   type: number
   *                   example: 200
   *                 message:
   *                   type: string
   *                   example: "删除配置成功"
   *                 data:
   *                   type: null
   *       401:
   *         description: 未授权
   *       404:
   *         description: 配置不存在
   *       500:
   *         description: 服务器错误
   */
  @Delete("/delete/:id", JWT.authenticateJwt())
  public async deleteConfig(req: Request, res: Response) {
    const id = Number(req.params.id);
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.configService.deleteConfig(id);
    res.sendResult(data, code, message, errMsg);
  }



  /**
   * @swagger
   * /system/config/validate-password:
   *   post:
   *     summary: 验证密码配置
   *     tags: [System Config]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - key
   *               - password
   *             properties:
   *               key:
   *                 type: string
   *                 description: 配置键名
   *                 example: "admin.password"
   *               password:
   *                 type: string
   *                 description: 要验证的密码
   *     responses:
   *       200:
   *         description: 验证完成
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 code:
   *                   type: number
   *                   example: 200
   *                 message:
   *                   type: string
   *                   example: "验证完成"
   *                 data:
   *                   type: object
   *                   properties:
   *                     isValid:
   *                       type: boolean
   *                       description: 密码是否正确
   *       400:
   *         description: 参数错误
   *       401:
   *         description: 未授权
   *       404:
   *         description: 配置不存在
   *       500:
   *         description: 服务器错误
   */
  @Post("/validate-password", JWT.authenticateJwt())
  public async validatePassword(req: Request, res: Response) {
    const { key, password } = req.body;
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.configService.validatePassword(key, password);
    res.sendResult(data, code, message, errMsg);
  }
}

