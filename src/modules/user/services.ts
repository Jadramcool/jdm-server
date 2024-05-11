import { inject, injectable } from "inversify";
import { PrismaDB } from "../../db";
import { LoginDto, UserDto } from "./user.dto";
import { plainToClass } from "class-transformer";
import { validate } from "class-validator";
import { JWT } from "../../jwt";
import { checkUnique } from "../../utils/checkUnique";

const menu = [
  {
    id: 1,
    name: "默认",
    code: "Default",
    type: "MENU",
    pid: null,
    path: "/default",
    redirect: "/default/home",
    icon: "fe:layout",
    component: null,
    layout: "normal",
    keepAlive: null,
    method: null,
    description: null,
    show: true,
    enable: true,
    order: 0,
  },
  {
    id: 2,
    name: "首页",
    code: "Home",
    type: "MENU",
    pid: 1,
    path: "/default/home",
    icon: "fe:layout",
    component: "/src/views/home/index.vue",
    layout: "normal",
    keepAlive: true,
    method: null,
    description: null,
    show: true,
    enable: true,
    order: 0,
  },
  {
    id: 9,
    name: "基础功能",
    code: "Base",
    type: "MENU",
    pid: null,
    path: "/base",
    redirect: "/base/components",
    icon: "fe:layout",
    component: null,
    layout: "",
    keepAlive: null,
    method: null,
    description: null,
    show: true,
    enable: true,
    order: 0,
  },
  {
    id: 10,
    name: "基础组件",
    code: "BaseComponents",
    type: "MENU",
    pid: 9,
    path: "/base/components",
    redirect: null,
    icon: "mdi:ab-testing",
    component: "/src/views/base/index.vue",
    layout: null,
    keepAlive: false,
    method: null,
    description: null,
    show: true,
    enable: true,
    order: 2,
  },
  {
    id: 11,
    name: "Unocss组件",
    code: "Unocss",
    type: "MENU",
    pid: 9,
    path: "/base/unocss",
    redirect: null,
    icon: "mdi:abugida-thai",
    component: "/src/views/base/unocss.vue",
    layout: null,
    keepAlive: false,
    method: null,
    description: null,
    show: true,
    enable: true,
    order: 1,
  },
  {
    id: 12,
    name: "KeepAlive组件",
    code: "KeepAlive",
    type: "MENU",
    pid: 9,
    path: "/base/keep-alive",
    redirect: null,
    icon: "mdi:account-circle-outline",
    component: "/src/views/base/keep-alive.vue",
    layout: null,
    keepAlive: true,
    method: null,
    description: null,
    show: true,
    enable: true,
    order: 3,
  },
];

@injectable()
export class UserService {
  constructor(
    @inject(PrismaDB) private readonly PrismaDB: PrismaDB,
    @inject(JWT) private readonly JWT: JWT
  ) {}

  public async getList() {
    return await this.PrismaDB.prisma.user.findMany();
  }

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
            errMsg: "用户名已存在",
          };
        }
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
      const result = await this.PrismaDB.prisma.user.findUnique({
        where: { username: user.username, password: user.password },
      });
      // 删除密码
      if (!result) {
        return {
          code: 400,
          errMsg: "用户名或密码错误",
        };
      } else {
        delete result.password;
      }
      if (errors.length) {
        return errors;
      } else {
        return {
          data: {
            ...result,
            token: this.JWT.createToken(result),
          },
          code: 200,
          message: "登录成功",
        };
      }
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
        where: { id: userId },
      });
      if (!result) {
        return {
          code: 400,
          errMsg: "用户不存在",
        };
      }
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
  // 获取权限
  public async getPremissionMenu(userId: number) {
    try {
      return {
        data: menu,
        code: 200,
        message: "获取用户信息成功",
      };
      // 删除密码
    } catch (err) {
      console.log(err);
      return err;
    }
  }
}
