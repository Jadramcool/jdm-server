import { JWT } from "@/jwt";
import { UtilService } from "@/utils/utils";
import type { Request, Response } from "express";
import { inject } from "inversify"; // 装饰器 用于依赖注入
import { controller, httpPost as Post } from "inversify-express-utils";
import { AiChatService } from "./services";

/**
 * @swagger
 * tags:
 *   name: AI Chat
 *   description: AI聊天服务
 */

@controller("/aiChat")
export class AiChat {
  constructor(
    @inject(AiChatService)
    private readonly AiChatService: AiChatService,
    @inject(UtilService)
    private readonly UtilService: UtilService
  ) {}

  /**
   * @swagger
   * /aiChat/zhipu-chat:
   *   post:
   *     summary: 智谱清言AI聊天
   *     tags: [AI Chat]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - message
   *             properties:
   *               message:
   *                 type: string
   *                 description: 用户消息
   *                 example: "你好，请介绍一下自己"
   *               model:
   *                 type: string
   *                 description: 模型名称
   *                 default: "glm-4"
   *               temperature:
   *                 type: number
   *                 description: 温度参数
   *                 minimum: 0
   *                 maximum: 1
   *                 default: 0.7
   *     responses:
   *       200:
   *         description: AI聊天成功
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
   *                 data:
   *                   type: object
   *                   properties:
   *                     reply:
   *                       type: string
   *                       description: AI回复内容
   *       401:
   *         description: 未授权
   *       500:
   *         description: 服务器错误
   */
  @Post("/zhipu-chat", JWT.authenticateJwt())
  public async aiChatZhiPu(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.AiChatService.aiChatZhiPu(req.body);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @swagger
   * /aiChat/chat:
   *   post:
   *     summary: AI流式聊天
   *     description: 使用流式传输的AI聊天接口，实时返回AI回复
   *     tags: [AI Chat]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - message
   *             properties:
   *               message:
   *                 type: string
   *                 description: 用户消息
   *                 example: "请帮我写一个Python函数"
   *               messages:
   *                 type: array
   *                 items:
   *                   type: object
   *                   properties:
   *                     role:
   *                       type: string
   *                       enum: [user, assistant, system]
   *                     content:
   *                       type: string
   *                 description: 聊天历史记录
   *               model:
   *                 type: string
   *                 description: 模型名称
   *                 default: "gpt-3.5-turbo"
   *               temperature:
   *                 type: number
   *                 description: 温度参数
   *                 minimum: 0
   *                 maximum: 2
   *                 default: 0.7
   *     responses:
   *       200:
   *         description: 流式AI聊天响应
   *         content:
   *           text/plain:
   *             schema:
   *               type: string
   *               description: 流式返回的AI回复内容
   *       401:
   *         description: 未授权
   *       500:
   *         description: 服务器错误
   */
  @Post("/chat", JWT.authenticateJwt())
  public async aiChat(req: Request, res: Response) {
    console.log("[ req.body ] >", req.body);
    // let {
    //   data = null,
    //   code = 200,
    //   message = "",
    //   errMsg = "",
    // }: Jres = await this.AiChatService.aiChat(req.body);

    const aiStream: any = await this.AiChatService.aiChat(req.body);
    console.log("🚀 ~ aiChat ~ aiStream:", aiStream);

    // 设置响应头，以流式传输数据
    res.setHeader("Content-Type", "text/plain"); // 可以根据需要设置其他类型
    res.setHeader("Transfer-Encoding", "chunked"); // 设置分块传输编码（可选）

    aiStream.pipe(res); // 将 OpenAI 流数据直接通过 pipe 传输给前端
    // res.sendResult(data, code, message, errMsg);
  }
}
