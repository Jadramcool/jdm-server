import { HttpException } from './HttpException';

export class BadRequestException extends HttpException {
  constructor(message = '请求参数错误', errorCode?: string, details?: any) {
    super(400, message, errorCode, details);
    this.name = 'BadRequestException';
  }
}
