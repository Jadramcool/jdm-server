import { HttpException } from './HttpException';

export class InternalServerException extends HttpException {
  constructor(message = '服务器内部错误', errorCode?: string, details?: any) {
    super(500, message, errorCode, details);
    this.name = 'InternalServerException';
  }
}
