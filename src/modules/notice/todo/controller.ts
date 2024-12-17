/*
 * @Author: Jay
 * @Date: 2024-05-11 17:56:25
 * @LastEditors: jdm
 * @LastEditTime: 2024-08-21 15:42:05
 * @FilePath: \APP\src\modules\sys\user\controller.ts
 * @Description:
 *
 */
import { JWT } from "@/jwt";
import { UtilService } from "@/utils/utils";
import type { Request, Response } from "express";
import { inject } from "inversify"; // 装饰器 用于依赖注入
import {
  httpDelete as Delete,
  httpGet as Get,
  httpPost as Post,
  httpPut as Put,
  controller,
} from "inversify-express-utils";
import { TodoService } from "./services";

@controller("/todo")
export class Todo {
  constructor(
    @inject(TodoService)
    private readonly TodoService: TodoService,
    @inject(UtilService)
    private readonly UtilService: UtilService
  ) {}

  @Get("/list", JWT.authenticateJwt())
  public async getTodoList(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.TodoService.getTodoList();
    res.sendResult(data, code, message, errMsg);
  }

  @Get("/detail/:id", JWT.authenticateJwt())
  public async getTodoDetail(req: Request, res: Response) {
    const todoId = Number(req.params.id);
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.TodoService.getTodoDetail(todoId);
    res.sendResult(data, code, message, errMsg);
  }

  @Post("/create", JWT.authenticateJwt())
  public async createTodo(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.TodoService.createTodo(req.body, req.user);
    res.sendResult(data, code, message, errMsg);
  }

  @Put("/update", JWT.authenticateJwt())
  public async updateTodo(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.TodoService.updateTodo(req.body, req.user);
    res.sendResult(data, code, message, errMsg);
  }

  @Put("/updateOrder", JWT.authenticateJwt())
  public async updateTodoOrder(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.TodoService.updateTodoOrder(req.body);
    res.sendResult(data, code, message, errMsg);
  }

  @Delete("/delete/:id", JWT.authenticateJwt())
  public async deleteTodo(req: Request, res: Response) {
    const todoId = Number(req.params.id);
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.TodoService.deleteTodo(todoId);
    res.sendResult(data, code, message, errMsg);
  }

  // 完成待办事项
  // status可传可不传，不传默认为已完成，0：未完成，1：已完成
  @Put("/done/:id/:status?", JWT.authenticateJwt())
  public async doneTodo(req: Request, res: Response) {
    const todoId = Number(req.params.id);
    const status = Number(req.params.status ? req.params.status : 1);
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.TodoService.doneTodo(todoId, status);
    res.sendResult(data, code, message, errMsg);
  }

  @Get("/timeline", JWT.authenticateJwt())
  public async getTodoTimeLine(req: Request, res: Response) {
    let {
      data = null,
      code = 200,
      message = "",
      errMsg = "",
    }: Jres = await this.TodoService.getTodoTimeLine();
    res.sendResult(data, code, message, errMsg);
  }
}
