import { JWT } from "@jwt/index";
import { Todo, User } from "@prisma/client";
import { plainToClass } from "class-transformer";
import { validate } from "class-validator";
import { inject, injectable } from "inversify";
import { PrismaDB } from "../../../db";
import { TodoDto } from "./todo.dto";

interface TodoWithChildren extends Todo {
  children?: Todo[];
}

type SortObj = { id: number; sortOrder: number };

@injectable()
export class TodoService {
  constructor(
    @inject(PrismaDB) private readonly PrismaDB: PrismaDB,
    @inject(JWT) private readonly JWT: JWT
  ) {}

  // 获取待办事项列表-树形结构
  public async getTodoList() {
    try {
      const result = await this.PrismaDB.prisma.todo.findMany({
        orderBy: {
          sortOrder: "asc",
        },
      });

      const parentResult: any[] = [];
      const childrenResult: any[] = [];

      result.forEach((item) => {
        if (item.pid === null || item.pid === undefined) {
          parentResult.push({ ...item, children: [] }); // 初始化父任务的 children
        } else if (item.pid !== null && item.pid !== undefined) {
          childrenResult.push(item);
        }
      });

      childrenResult.forEach((child) => {
        const parent = parentResult.find((parent) => parent.id === child.pid);
        if (parent) {
          parent.children.push(child);
        }
      });
      return {
        data: parentResult,
        code: 200,
        message: "获取待办事项成功",
      };
    } catch (err) {
      return {
        data: null,
        code: 400,
        message: "获取待办事项失败",
        errMsg: err,
      };
    }
  }

  /**
   * 获取待办事项详细信息
   * @param todoId
   */
  public async getTodoDetail(todoId: number) {
    try {
      const result = await this.PrismaDB.prisma.todo.findUnique({
        where: { id: todoId },
      });
      if (!result) {
        throw "待办事项不存在";
      }
      return {
        data: result,
        code: 200,
        message: "获取待办事项成功",
      };
    } catch (err) {
      console.log(err);
      return err;
    }
  }

  /**
   * 创建待办事项
   * @param todo
   */
  public async createTodo(todo: TodoDto, user: User) {
    console.log("🚀 ~ todo:", todo);

    try {
      let todoDto = plainToClass(TodoDto, todo);
      const errors = await validate(todoDto);
      if (errors.length > 0) {
        const errorMessages = errors.map((error) => {
          return {
            property: error.property,
            value: Object.values(error.constraints),
          };
        });
        throw errorMessages;
      }
      const userId = user.id;

      if (!todo.pid) {
        const result = await this.PrismaDB.prisma.todo.create({
          data: {
            ...todo,
            userId: userId,
          },
        });
      } else {
        const hasParent = await this.PrismaDB.prisma.todo.findUnique({
          where: {
            id: todo.pid,
          },
        });
        if (hasParent) {
          const result = await this.PrismaDB.prisma.todo.create({
            data: {
              ...todo,
              userId: userId,
            },
          });
        } else {
          throw "父级待办事项不存在";
        }
      }

      return {
        data: null,
        code: 200,
        message: "创建待办事项成功",
      };
    } catch (err) {
      return {
        data: null,
        code: 400,
        message: "创建待办事项失败",
        errMsg: err,
      };
    }
  }

  /**
   * 更新待办事项
   * @param todo
   */
  public async updateTodo(todo: Todo, user: User) {
    try {
      const result = await this.PrismaDB.prisma.todo.update({
        where: { id: todo.id },
        data: todo,
      });
      return {
        data: result,
        code: 200,
        message: "更新待办事项成功",
      };
    } catch (err) {
      console.log(err);
      return {
        data: null,
        code: 400,
        message: "更新待办事项失败",
        errMsg: err,
      };
    }
  }

  /**
   * 删除待办事项
   * @param todoId
   */
  public async deleteTodo(todoId: number) {
    try {
      await this.PrismaDB.prisma.$transaction(async (prisma) => {
        // 判断是否有子待办事项
        const hasChildren = await prisma.todo.findMany({
          where: {
            pid: todoId,
          },
        });
        if (hasChildren.length > 0) {
          throw "有子待办事项，不能删除";
        }
        // 删除待办事项 -- 硬删除
        await this.PrismaDB.prisma.todo.delete({
          where: {
            id: todoId,
          },
        });
      });

      return {
        data: null,
        code: 200,
        message: "删除待办事项成功",
      };
    } catch (err) {
      return {
        data: null,
        code: 400,
        message: "删除待办事项失败",
        errMsg: err,
      };
    }
  }

  /**
   * 更改完成状态
   * @param todoId
   * @param status
   */
  public async doneTodo(todoId: number, status: number) {
    try {
      const result = await this.PrismaDB.prisma.todo.update({
        where: { id: todoId },
        data: {
          isDone: status === 1,
          doneTime: status === 1 ? new Date() : null,
        },
      });
      const parentId = result.pid;
      // 如果子级全部完成，则父级也变成已完成
      if (parentId && status) {
        const children = await this.PrismaDB.prisma.todo.findMany({
          where: { pid: parentId },
        });
        const isAllDone = children.every((item) => item.isDone);
        if (isAllDone) {
          await this.PrismaDB.prisma.todo.update({
            where: { id: parentId },
            data: { isDone: true },
          });
        }
      } else if (parentId && !status) {
        // 如果父级取消完成，则子级也取消完成
        await this.PrismaDB.prisma.todo.update({
          where: { id: parentId },
          data: { isDone: false },
        });
      }

      return {
        data: result,
        code: 200,
        message: "更新完成状态成功",
      };
    } catch (err) {
      return {
        data: null,
        code: 400,
        message: "更新完成状态失败",
        errMsg: err,
      };
    }
  }

  /**
   * 更新待办事项顺序
   * @param todo
   */
  // TODO 写的太抽象了，以后要改的
  public async updateTodoOrder(data: any) {
    try {
      const { sort, pid = 0 } = data;
      console.log("🚀 ~ updateTodoOrder ~ sort:", sort);

      console.log("🚀 ~ updateTodoOrder ~ pid:", pid);
      let parentOrder = 0;

      if (pid) {
        const parent = await this.PrismaDB.prisma.todo.findUnique({
          where: { id: pid },
          select: { sortOrder: true },
        });
        parentOrder = parent?.sortOrder || 0;
      }

      await this.PrismaDB.prisma.$transaction(
        sort.map((item: SortObj) =>
          this.PrismaDB.prisma.todo.update({
            where: { id: item.id },
            data: {
              sortOrder: parentOrder * 100 + item.sortOrder + 1,
              ...(pid ? { pid } : {}),
            },
          })
        )
      );
      return {
        data: null,
        code: 200,
        message: "更新排序成功",
      };
    } catch (err) {
      console.log(err);
      return {
        data: null,
        code: 400,
        message: "更新排序失败",
        errMsg: err,
      };
    }
  }

  public async getTodoTimeLine() {
    try {
      const result = await this.PrismaDB.prisma.todo.findMany({
        where: { isDone: true, pid: { not: null } },
        orderBy: { doneTime: "desc" },
        select: {
          id: true,
          title: true,
          doneTime: true,
          pid: true,
          parent: {
            select: {
              title: true,
            },
          },
        },
      });
      return {
        data: result,
        code: 200,
        message: "获取时间轴成功",
      };
    } catch (err) {
      return {
        data: null,
        code: 400,
        message: "获取时间轴失败",
        errMsg: err,
      };
    }
  }
}
