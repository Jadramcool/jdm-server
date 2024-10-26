/*
 * @Author: jdm
 * @Date: 2024-04-28 15:00:56
 * @LastEditors: jdm
 * @LastEditTime: 2024-09-05 09:55:55
 * @FilePath: \APP\src\middleware\sendResult.ts
 * @Description:
 *
 */
import type { NextFunction, Request, Response } from "express";

export const responseHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.sendResult = function (
    data: any,
    code: number,
    message: string,
    errMsg: object | string
  ) {
    res.json({
      data: data,
      code: code,
      message: message,
      errMsg: errMsg,
    });
  };
  next();
};
