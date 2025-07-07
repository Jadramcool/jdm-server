import type { Request, Response } from "express";
import { inject } from "inversify";
import { controller, httpGet as Get } from "inversify-express-utils";
import { UtilService } from "../../../utils/utils";
import { BlogUserService } from "./services";

/**
 * @swagger
 * tags:
 *   - name: 博客用户管理
 *     description: 博客用户相关接口
 */

@controller("/blog/user")
export class BlogUserManager {
  constructor(
    @inject(BlogUserService)
    private readonly BlogUserService: BlogUserService,
    @inject(UtilService)
    private readonly UtilService: UtilService
  ) {}

  /**
   * @swagger
   * /blog/user/detail:
   *   get:
   *     tags:
   *       - 博客用户管理
   *     summary: 获取博客用户详情
   *     description: 获取系统中标记为博客用户的用户详细信息。系统中只能有一个博客用户。
   *     security:
   *       - BearerAuth: []
   *     responses:
   *       200:
   *         description: 成功获取博客用户信息
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiResponse'
   *             examples:
   *               success:
   *                 summary: 成功响应示例
   *                 value:
   *                   data:
   *                     id: 1
   *                     username: "bloguser"
   *                     email: "blog@example.com"
   *                     avatar: "https://example.com/avatar.jpg"
   *                     isBlogUser: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-01T00:00:00.000Z"
   *                   code: 200
   *                   message: ""
   *                   errMsg: ""
   *       404:
   *         description: 博客用户不存在
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             examples:
   *               not_found:
   *                 summary: 用户不存在响应示例
   *                 value:
   *                   data: null
   *                   code: 404
   *                   message: "博客用户不存在"
   *                   errMsg: ""
   *       500:
   *         description: 服务器内部错误
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             examples:
   *               server_error:
   *                 summary: 服务器错误响应示例
   *                 value:
   *                   data: null
   *                   code: 500
   *                   message: "服务器内部错误"
   *                   errMsg: "数据库连接失败"
   */
  @Get("/detail")
  public async getBlogUser(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.BlogUserService.getBlogDetail(req.body);
    res.sendResult(data, code, message, errMsg);
  }
}
