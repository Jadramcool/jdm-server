import { ErrorInfo } from "@/utils";
import bcrypt from "bcryptjs";
import { plainToClass } from "class-transformer";
import { validate } from "class-validator";
import { inject, injectable } from "inversify";
import { PrismaDB } from "../../db";
import { JWT } from "../../jwt";
import { checkUnique } from "../../utils/checkUnique";
import { LoginDto, UserDto } from "./user.dto";

@injectable()
export class UserService {
  constructor(
    @inject(PrismaDB) private readonly PrismaDB: PrismaDB,
    @inject(JWT) private readonly JWT: JWT
  ) {}

  /**
   * 创建用户
   * @param user
   */
  public async createUser(user: UserDto) {
    // 把前端传的值合并到了类里面
    let userDto = plainToClass(UserDto, user);
    const errors = await validate(userDto);
    if (errors.length) {
      return errors;
    } else {
      const result = await this.PrismaDB.prisma.user.create({
        data: user,
      });
      return {
        ...result,
        token: this.JWT.createToken(result),
      };
    }
  }
  /**
   * 注册用户
   * @param user
   */
  public async registerUser(user: LoginDto) {
    try {
      let registerDto = plainToClass(LoginDto, user);
      const errors = await validate(registerDto);
      if (errors.length) {
        return errors;
      } else {
        const isUnique: boolean = await checkUnique(
          this.PrismaDB,
          "user",
          "username",
          user.username
        );
        if (isUnique) {
          return {
            code: 400,
            errMsg: ErrorInfo.userError.register_username_exist, // 用户名已存在
          };
        }
        const password = user.password;
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        user.password = hash;

        const result = await this.PrismaDB.prisma.user.create({
          data: user,
        });
        return {
          data: {
            ...result,
            token: this.JWT.createToken(result),
          },
          message: "注册成功",
        };
      }
    } catch (err) {
      return err;
    }
  }
  /**
   * 登录
   * @param user
   */
  public async login(user: LoginDto) {
    try {
      let loginDto = plainToClass(LoginDto, user);
      const errors = await validate(loginDto);
      if (errors.length) {
        return errors;
      }
      // 登录
      const result = await this.PrismaDB.prisma.user.findUnique({
        where: { username: user.username },
      });

      if (!result) {
        return {
          code: 400,
          errMsg: ErrorInfo.userError.login_username_not_exist, // 用户不存在
        };
      }
      const isMatch = await bcrypt.compare(user.password, result.password);
      if (!isMatch) {
        return {
          code: 400,
          errMsg: ErrorInfo.userError.login_password_error, // 密码错误
        };
      }

      delete result.password;

      return {
        data: {
          ...result,
          token: this.JWT.createToken(result),
        },
        code: 200,
        message: "登录成功",
      };
    } catch (err) {
      return err;
    }
  }

  /**
   * 获取用户信息
   * @param user
   */
  public async getUserInfo(userId: number) {
    try {
      const result = await this.PrismaDB.prisma.user.findUnique({
        where: {
          id: userId,
        },
        include: {
          roles: {
            select: {
              role: {
                include: {
                  menus: {
                    select: {
                      menu: true, // 直接选择 permission
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!result) {
        return {
          code: 400,
          errMsg: ErrorInfo.userError.login_username_not_exist, // 用户不存在
        };
      }

      // 获取数据后，平展权限结构,去除多对多中间的部分
      const flattenedResult = result?.roles.map((role: any) => ({
        ...role.role,
        menus: role.role.menus.map((rp) => ({
          ...rp.menu,
        })),
      }));

      result.roles = flattenedResult;

      delete result.password;
      return {
        data: {
          ...result,
          token: this.JWT.createToken(result),
        },
        code: 200,
        message: "获取用户信息成功",
      };
      // 删除密码
    } catch (err) {
      console.log(err);
      return err;
    }
  }

  /**
   * 获取用户角色
   * @param user
   */
  public getUserRole = async (userId: number) => {
    try {
      const result = await this.PrismaDB.prisma.user.findUnique({
        where: {
          id: userId,
        },
        include: {
          roles: {
            select: {
              role: true,
            },
          },
        },
      });
      if (!result) {
        return {
          code: 400,
          errMsg: ErrorInfo.userError.login_username_not_exist, // 用户不存在
        };
      }

      const roles = result.roles.map((role) => role.role.name);

      return {
        data: {
          data: roles,
        },
        code: 200,
        message: "获取用户角色成功",
      };
    } catch (err) {
      console.log(err);
      return err;
    }
  };

  /**
   * 获取用户菜单
   * @param user
   */
  public getUserMenu = async (userId: number) => {
    try {
      const result = await this.PrismaDB.prisma.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          roles: {
            select: {
              role: {
                select: {
                  menus: {
                    select: {
                      menu: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
      const menus = result.roles.flatMap((role) =>
        role.role.menus.map((menu) => menu.menu)
      );
      return {
        data: {
          data: menus,
        },
        code: 200,
        message: "获取用户菜单成功",
      };
    } catch (err) {
      console.log(err);
      return err;
    }
  };
}
