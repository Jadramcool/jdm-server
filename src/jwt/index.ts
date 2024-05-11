import { injectable, inject } from "inversify";
import passport from "passport";
import jsonwebtoken from "jsonwebtoken";
import { Strategy, ExtractJwt } from "passport-jwt"; // 他是passport的插件

@injectable()
export class JWT {
  private secret: string = "jdmshidashuaibi";
  private jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: this.secret,
  };
  constructor() {
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
  static middleware() {
    // 需要经过这个中间件去验证token
    return passport.authenticate("jwt", { session: false });
  }

  /**
   * 创建token
   * @param data Object
   */
  public createToken(data: object) {
    // 生成token
    return jsonwebtoken.sign(data, this.secret, { expiresIn: "7d" });
  }

  public verifyToken(token: string) {
    // token = token ? token.split("Bearer ")[1] : null;
    // 验证token
    return jsonwebtoken.verify(token, this.secret);
    // return jsonwebtoken.verify(token, this.secret);
  }

  /**
   * @returns 集成到express
   */
  public init() {
    return passport.initialize();
  }
}
