/*
 * @Author: jdm
 * @Date: 2024-11-01
 * @Description: 全局错误处理中间件
 */
import { Request, Response, NextFunction } from 'express';
import { HttpException } from '../exceptions';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof HttpException) {
    console.error(`[${err.name}] ${err.message}`, {
      code: err.code,
      errorCode: err.errorCode,
      details: err.details,
      path: req.path,
      method: req.method,
    });
    return res.sendResult(null, err.code, err.message, err.details || err.errorCode);
  }

  if (err.name === 'ValidationError') {
    console.error('[ValidationError]', err.message);
    return res.sendResult(null, 400, '数据验证失败', err.message);
  }

  if (err.name === 'PrismaClientKnownRequestError') {
    console.error('[PrismaError]', err.message);
    return res.sendResult(null, 400, '数据库操作失败', err.message);
  }

  console.error('[UnknownError]', err);
  console.error(err.stack);

  res.sendResult(null, 500, '服务器内部错误', err.message);
};
