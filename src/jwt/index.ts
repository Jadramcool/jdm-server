/*
 * @Author: jdm
 * @Date: 2024-04-23 15:44:52
 * @LastEditors: jdm
 * @LastEditTime: 2024-10-21 11:17:53
 * @FilePath: \APP\src\jwt\index.ts
 * @Description:
 *
 */
import { injectable } from "inversify";
import jsonwebtoken from "jsonwebtoken";
import passport from "passport";
import { ExtractJwt, Strategy } from "passport-jwt";

@injectable()
export class JWT {
  private secret: string;
  private accessTokenExpire: string;
  private refreshTokenExpire: string;
  private jwtOptions: {
    jwtFromRequest: any;
    secretOrKey: string;
  };

  constructor() {
    this.secret = process.env.JWT_SECRET || "";
    if (!this.secret) {
      throw new Error("❌ 错误: JWT_SECRET 环境变量未设置！请在 .env 文件中设置 JWT_SECRET=your-secret-key");
    }
    this.accessTokenExpire = process.env.JWT_ACCESS_EXPIRE || "30m";
    this.refreshTokenExpire = process.env.JWT_REFRESH_EXPIRE || "7d";
    this.jwtOptions = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: this.secret,
    };
    this.strategy();
  }

  /**
   * 初始化jwt
   */
  public strategy() {
    try {
      let str = new Strategy(this.jwtOptions, (payload, done) => {
        // payload是jwt解码后的数据，done是回调函数
        // 验证token
        return done(null, payload);
      });
      passport.use("jwt", str);
    } catch (err) {
      console.log(err);
      return err;
    }
  }

  /**
   * @returns 中间件
   */
  static authenticateJwt() {
    // 需要经过这个中间件去验证token
    return passport.authenticate("jwt", { session: false });
  }

  /**
   * 创建Access Token (短期，默认30分钟)
   * @param data Object
   */
  public createAccessToken(data: object) {
    return jsonwebtoken.sign(data, this.secret, {
      expiresIn: this.accessTokenExpire
    });
  }

  /**
   * 创建Refresh Token (长期，默认7天)
   * @param data Object
   */
  public createRefreshToken(data: object) {
    return jsonwebtoken.sign(data, this.secret, {
      expiresIn: this.refreshTokenExpire
    });
  }

  /**
   * 兼容旧接口，创建Token (默认生成双Token)
   * @param data Object
   */
  public createToken(data: object) {
    return jsonwebtoken.sign(data, this.secret, {
      expiresIn: this.accessTokenExpire
    });
  }

  /**
   * 验证Refresh Token
   */
  public verifyRefreshToken(token: string) {
    return jsonwebtoken.verify(token, this.secret);
  }

  public verifyToken(token: string) {
    return jsonwebtoken.verify(token, this.secret);
  }

  /**
   * @returns 集成到express
   */
  public init() {
    return passport.initialize();
  }
}
