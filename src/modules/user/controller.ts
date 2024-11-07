/*
 * @Author: jdm
 * @Date: 2024-04-23 15:44:52
 * @LastEditors: jdm
 * @LastEditTime: 2024-09-24 14:29:05
 * @FilePath: \APP\src\modules\user\controller.ts
 * @Description:
 *
 */
// <reference path="../../global.d.ts" />
import type { Request, Response } from "express";
import { inject } from "inversify"; // 装饰器 用于依赖注入
import {
  controller,
  httpGet as Get,
  httpPost as Post,
} from "inversify-express-utils";
import { JWT } from "../../jwt";
import { UserService } from "./services";

@controller("/user")
export class User {
  // @param userService @inject(UserService): 这是一个装饰器，用于依赖注入。
  constructor(@inject(UserService) private readonly userService: UserService) {}

  /**
   * @api {post} /user/register 注册用户
   * @apiName RegisterUser
   * @apiGroup User
   * @apiVersion 1.0.0
   *
   * @apiBody {String} username 用户名
   * @apiBody {String} password 密码
   *
   * @apiSuccess {Object} data 用户数据
   * @apiSuccess {String} data.token JWT token
   * @apiSuccess {String} data.id 用户ID
   * @apiSuccess {String} data.username 用户名
   * @apiSuccess {Number} code 返回状态码
   * @apiSuccess {String} message 成功消息
   *
   * @apiSuccessExample {json} Success-Response:
   *     HTTP/1.1 200 OK
   *     {
   *       "data": {
   *         "id": 1,
   *         "username": "user123",
   *         "token": "eyJhbGciOiJIUzI1..."
   *       },
   *       "code": 200,
   *       "message": "注册成功",
   *       "errMsg": ""
   *     }
   *
   * @apiError (400) UsernameExists 用户名已存在
   * @apiErrorExample {json} Error-Response:
   *     HTTP/1.1 400 Bad Request
   *     {
   *       "code": 400,
   *       "errMsg": "用户名已存在"
   *     }
   *
   * @apiError (500) InternalError 内部服务器错误
   * @apiErrorExample {json} Error-Response:
   *     HTTP/1.1 500 Internal Server Error
   *     {
   *       "errMsg": "内部服务器错误"
   *     }
   */
  @Post("/register")
  public async registerUser(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.userService.registerUser(req.body);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @api {post} /user/login 登录
   * @apiName Login
   * @apiGroup User
   * @apiVersion 1.0.0
   * @apiPermission none
   * @apiDescription 登录接口，返回JWT token
   * @apiHeader {String} Authorization 用户登录凭证，格式为Bearer + 空格 + token
   *
   * @apiBody {String} username 用户名
   * @apiBody {String} password 密码
   *
   * @apiSuccess {Object} data 用户数据
   * @apiSuccess {String} data.token JWT token
   * @apiSuccess {String} data.id 用户ID
   * @apiSuccess {String} data.username 用户名
   * @apiSuccess {Number} code 返回状态码
   * @apiSuccess {String} message 成功消息
   *
   * @apiSuccessExample {json} Success-Response:
   *     HTTP/1.1 200 OK
   *     {
   *       "data": {
          "id": 2,
          "username": "jdm",
          "name": null,
          "phone": null,
          "email": null,
          "sex": "OTHER",
          "birthday": null,
          "createdTime": "2024-09-04T09:15:14.467Z",
          "updatedTime": "2024-09-04T09:15:14.467Z",
          "deletedTime": null,
          "deleted": false,
          "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwidXNlcm5hbWUiOiJqZG0iLCJuYW1lIjpudWxsLCJwaG9uZSI6bnVsbCwiZW1haWwiOm51bGwsInNleCI6Ik9USEVSIiwiYmlydGhkYXkiOm51bGwsImNyZWF0ZWRUaW1lIjoiMjAyNC0wOS0wNFQwOToxNToxNC40NjdaIiwidXBkYXRlZFRpbWUiOiIyMDI0LTA5LTA0VDA5OjE1OjE0LjQ2N1oiLCJkZWxldGVkVGltZSI6bnVsbCwiZGVsZXRlZCI6ZmFsc2UsImlhdCI6MTcyNTU5MjUwNywiZXhwIjoxNzI2MTk3MzA3fQ.Us3OMvwyJ_BMLded2zd-QrQXoo5wPgAnoGzeBZzvnt0"
          },
   *       "code": 200,
   *       "message": "登录成功",
   *       "errMsg": ""
   *     }
   *
   * @apiError (400) Unauthorized 用户名或密码错误
   * @apiErrorExample {json} Error-Response:
   *     HTTP/1.1 400 Unauthorized
   *     {
   *       "code": 400,
   *       "errMsg": "用户名或密码错误"
   *     }
   *
   * @apiError (500) InternalError 内部服务器错误
   * @apiErrorExample {json} Error-Response:
   *     HTTP/1.1 500 Internal Server Error
   *     {
   *       "errMsg": "内部服务器错误"
   *     }
   */
  @Post("/login")
  public async login(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.userService.login(req.body);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @api {get} /user/info 获取用户信息
   * @apiName GetUserInfo
   * @apiGroup User
   * @apiVersion 1.0.0
   * @apiPermission JWT
   * @apiDescription 获取用户信息
   * @apiHeader {String} Authorization 用户登录凭证，格式为Bearer + 空格 + token
   * @apiHeaderExample {json} Header-Example:
   *     {
   *       "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwidXNlcm5hbWUiOiJqZG0iLCJuYW1lIjpudWxsLCJwaG9uZSI6bnVsbCwiZW1haWwiOm51bGwsInNleCI6Ik9USEVSIiwiYmlydGhkYXkiOm51bGwsImNyZWF0ZWRUaW1lIjoiMjAyNC0wOS0wNFQwOToxNToxNC40NjdaIiwidXBkYXRlZFRpbWUiOiIyMDI0LTA5LTA0VDA5OjE1OjE0LjQ2N1oiLCJkZWxldGVkVGltZSI6bnVsbCwiZGVsZXR
   *     }
   * @apiSuccess {Object} data 用户数据
   * @apiSuccess {String} data.id 用户ID
   * @apiSuccess {String} data.username 用户名
   * @apiSuccess {String} data.name 姓名
   * @apiSuccess {String} data.phone 手机号
   * @apiSuccess {String} data.email 邮箱
   * @apiSuccess {String} data.sex 性别
   * @apiSuccess {String} data.birthday 生日
   * @apiSuccess {String} data.createdTime 创建时间
   * @apiSuccess {String} data.updatedTime 更新时间
   * @apiSuccess {Object} data.roles 角色
   *
   **/

  @Get("/info", JWT.authenticateJwt())
  public async getUserInfo(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.userService.getUserInfo(req.user?.id);
    res.sendResult(data, code, message, errMsg);
  }

  /**
   * @api {get} /user/info 获取用户角色信息
   * @apiName GetUserRole
   * @apiGroup User
   * @apiVersion 1.0.0
   * @apiPermission JWT
   * @apiDescription 获取用户角色信息
   * @apiHeader {String} Authorization 用户登录凭证，格式为Bearer + 空格 + token
   * @apiHeaderExample {json} Header-Example:
   *     {
   *       "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwidXNlcm5hbWUiOiJqZG0iLCJuYW1lIjpudWxsLCJwaG9uZSI6bnVsbCwiZW1haWwiOm51bGwsInNleCI6Ik9USEVSIiwiYmlydGhkYXkiOm51bGwsImNyZWF0ZWRUaW1lIjoiMjAyNC0wOS0wNFQwOToxNToxNC40NjdaIiwidXBkYXRlZFRpbWUiOiIyMDI0LTA5LTA0VDA5OjE1OjE0LjQ2N1oiLCJkZWxldGVkVGltZSI6bnVsbCwiZGVsZXR
   *     }
   * @apiSuccess {Object} data 用户数据
   * @apiSuccess {String} data.id 用户ID
   * @apiSuccess {String} data.username 用户名
   * @apiSuccess {String} data.name 姓名
   * @apiSuccess {String} data.phone 手机号
   * @apiSuccess {String} data.email 邮箱
   * @apiSuccess {String} data.sex 性别
   * @apiSuccess {String} data.birthday 生日
   * @apiSuccess {String} data.createdTime 创建时间
   * @apiSuccess {String} data.updatedTime 更新时间
   * @apiSuccess {Object} data.roles 角色
   *
   **/
  @Get("/userRole", JWT.authenticateJwt())
  public async getUserRole(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.userService.getUserRole(req.user?.id);

    res.sendResult(data, code, message, errMsg);
  }

  /**
   *  获取用户权限
   *  1. 获取用户角色
   *  2. 获取角色权限
   *  3. 合并权限
   *  4. 返回权限列表
   * @param req
   * @param res
   *   @api {get} /user/permissions 获取用户权限
   * @apiName GetUserPermissions
   * @apiGroup User
   *   @apiVersion 1.0.0
   * @apiPermission JWT
   * @apiDescription 获取用户权限
   * @apiHeader {String} Authorization 用户登录凭证，格式为Bearer + 空格 + token
   * @apiHeaderExample {json} Header-Example:
   *     {
   *       "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwidXNlcm5hbWUiOiJqZG0iLCJuYW1lIjpudWxsLCJwaG9uZSI6bnVsbCwiZW1haWwiOm51bGwsInNleCI6Ik9USEVSIiwiYmlydGhkYXkiOm51bGwsImNyZWF0ZWRUaW1lIjoiMjAyNC0wOS0wNFQwOToxNToxNC40NjdaIiwidXBkYXRlZFRpbWUiOiIyMDI0LTA5LTA0VDA5OjE1OjE0LjQ2N1oiLCJkZWxldGVkVGltZSI6bnVsbCwiZGVsZXR
   * 
   }
   * @apiSuccess {Object} data 用户权限列表
   * @apiSuccess {String} data.id 权限ID
   * @apiSuccess {String} data.name 权限名称
   * @apiSuccess {String} data.code 权限代码
   * @apiSuccess {String} data.type 权限类型
   * @apiSuccess {String} data.url 权限URL
   * @apiSuccess {String} data.method 权限请求方法
   * @apiSuccess {String} data.description 权限描述
   *     
   */
  @Get("/permission", JWT.authenticateJwt())
  public async getUserPermission(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.userService.getUserPermission(req.user?.id);

    res.sendResult(data, code, message, errMsg);
  }
}
