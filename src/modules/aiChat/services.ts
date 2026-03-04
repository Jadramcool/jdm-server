import { JWT } from "@jwt/index";
import { inject, injectable } from "inversify";
import OpenAI from "openai";
import { Readable } from "stream";
import { ZhipuAI } from "zhipuai-sdk-nodejs-v4";
import { PrismaDB } from "../../db";
import { InternalServerException } from "../../exceptions";

const openai = new OpenAI({
  apiKey: process.env["ARK_API_KEY"],
  baseURL: "https://ark.cn-beijing.volces.com/api/v3",
});

const ai = new ZhipuAI();

@injectable()
export class AiChatService {
  constructor(
    @inject(PrismaDB) private readonly PrismaDB: PrismaDB,
    @inject(JWT) private readonly JWT: JWT
  ) { }

  /**
   * AI问答
   * @param content
   */
  public async aiChatZhiPu(content: any) {
    try {
      const data = content;
      const result = await ai.createCompletions({
        model: "glm-4",
        messages: [
          {
            role: "system",
            content:
              "你是一个医学方面全科的专家，可以通过患者所描述的病状，简单的分析可能的病症，并且推荐其去哪个科室，告诫用户一些注意事项。并且回答不超过100个字",
          },
          // { role: "user", content: data },
          ...data,
        ],
        stream: false,
      });

      return {
        data: result,
        code: 200,
        message: "回答正确",
      };
    } catch (err) {
      return {
        data: null,
        code: 400,
        message: "获取回答失败",
        errMsg: err,
      };
    }
  }

  /**
   * AI问答
   * @param content
   */
  public async aiChat(content: { content: string }) {
    if (!content || !content.content) {
      return {
        data: null,
        code: 400,
        message: "输入内容不能为空",
      };
    }

    const isDev = process.env.NODE_ENV !== "production";

    if (isDev) {
      console.log("🚀 ~ aiChat ~ content:", content);
    }

    try {
      // 请求 OpenAI API，开启流式返回
      const stream = await openai.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "你是豆包，是由字节跳动开发的 AI 人工智能助手",
          },
          { role: "user", content: content.content },
        ],
        model: "ep-20250104180643-w2kkh", // 使用指定的模型
        stream: true, // 启用流式返回
      });

      // 使用 .tee() 将流分割
      const [streamCopy1, streamCopy2] = stream.tee();

      // 创建一个 Readable 流
      const readableStream = new Readable({
        read() {
          // 循环处理 OpenAI 返回的流数据
          (async () => {
            for await (const part of streamCopy1) {
              // 将每个 chunk 推送到 readable 流中
              const chunkContent = part.choices[0]?.delta?.content || "";
              if (chunkContent) {
                this.push(chunkContent);
              }
            }
            this.push(null); // 流结束
          })().catch((err) => {
            console.error("Stream error:", err); // 记录错误日志
            this.emit("error", err); // 如果发生错误，发出错误事件
            this.push(null); // 流结束
          });
        },
      });

      // 返回 Readable 流，这样前端可以接收并处理
      return readableStream;
    } catch (err: any) {
      console.error("API request error:", err);
      throw new InternalServerException("AI 问答失败: " + err.message);
    }
  }
}
