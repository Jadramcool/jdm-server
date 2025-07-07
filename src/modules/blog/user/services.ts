import { JWT } from "@jwt/index";
import { inject, injectable } from "inversify";
import { PrismaDB } from "../../../db";

@injectable()
export class BlogUserService {
  constructor(
    @inject(PrismaDB) private readonly PrismaDB: PrismaDB,
    @inject(JWT) private readonly JWT: JWT
  ) {}

  async getBlogDetail(req: Request) {
    const blogUser = await this.PrismaDB.prisma.user.findFirst({
      where: {
        isBlogUser: true,
      },
    });

    if (!blogUser) {
      return {
        code: 404,
        message: "博客用户不存在",
      };
    }
    return {
      code: 200,
      data: blogUser,
    };
  }
}
