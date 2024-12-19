import { ErrorInfo } from "@/utils";
import bcrypt from "bcryptjs";
import { plainToClass } from "class-transformer";
import { validate } from "class-validator";
import { inject, injectable } from "inversify";
import { PrismaDB } from "../../db";
import { JWT } from "../../jwt";
import { checkUnique } from "../../utils/checkUnique";
import { LoginDto, UpdateUserDto, UserDto } from "./user.dto";

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
      if (errors.length > 0) {
        const errorMessages = errors.map((error) => {
          return {
            property: error.property,
            value: Object.values(error.constraints),
          };
        });
        return {
          code: 400,
          message: "参数验证失败",
          errMsg: "参数验证失败",
          data: errorMessages,
        };
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
      if (errors.length > 0) {
        const errorMessages = errors.map((error) => {
          return {
            property: error.property,
            value: Object.values(error.constraints),
          };
        });
        return {
          code: 400,
          message: "参数验证失败",
          errMsg: "参数验证失败",
          data: errorMessages,
        };
      }
      // 登录
      const result = await this.PrismaDB.prisma.user.findUnique({
        where: { username: user.username, isDeleted: false },
        omit: {
          password: false, // The password field is now selected.
        },
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

      // delete result.password;

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

  /**
   * 更新个人信息
   */

  /**
   * 更新用户
   * @param user
   */
  public async update(user: UpdateUserDto, userId: number) {
    try {
      let updateUserDto = plainToClass(UpdateUserDto, user);
      const errors = await validate(updateUserDto);
      if (errors.length > 0) {
        const errorMessages = errors.map((error) => {
          return {
            property: error.property,
            value: Object.values(error.constraints),
          };
        });
        return {
          code: 400,
          message: "参数验证失败",
          errMsg: "参数验证失败",
          data: errorMessages,
        };
      } else {
        const { phone } = user;
        // 检查 phone 是否已存在
        const existingUser = await this.PrismaDB.prisma.user.findFirst({
          where: {
            phone,
          },
        });
        if (existingUser && existingUser.id !== userId) {
          return {
            code: 400,
            message: "用户名或手机号已存在",
            errMsg: "用户名或手机号已存在",
          };
        }

        const { id, ...updateData } = user;

        const result = await this.PrismaDB.prisma.user.update({
          where: { id: userId },
          data: updateData,
        });
        return {
          data: result,
          code: 200,
          message: "更新个人信息成功",
        };
      }
    } catch (err) {
      return {
        data: null,
        code: 400,
        message: "更新个人信息失败",
        errMsg: err,
      };
    }
  }
  public async checkPassword(user: any, userId: number) {
    try {
      const result = await this.PrismaDB.prisma.user.findUnique({
        omit: {
          password: false, // The password field is now selected.
        },
        where: {
          id: userId,
        },
      });

      const isMatch = await bcrypt.compare(user.password, result.password);
      if (!isMatch) {
        return {
          code: 400,
          errMsg: "密码错误", // 密码错误
        };
      }
      return {
        data: true,
        code: 200,
        message: "密码正确",
      };
    } catch (err) {
      return {
        data: null,
        code: 400,
        message: "密码重复",
        errMsg: err,
      };
    }
  }

  /**
   * 更新密码
   */

  public async updatePassword(user: any, userId: number) {
    try {
      const password = user.password;
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);

      user.password = hash;
      const result = await this.PrismaDB.prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          password: user.password,
        },
      });

      return {
        data: result,
        code: 200,
        message: "修改密码成功",
      };
    } catch (err) {
      return {
        data: null,
        code: 400,
        message: "修改密码失败",
        errMsg: err,
      };
    }
  }
}
