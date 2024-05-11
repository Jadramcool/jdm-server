import type { Request, Response, NextFunction } from "express";

export const responseHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.sendResult = function (
    data: any,
    code: number,
    message: string,
    errMsg: string
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
