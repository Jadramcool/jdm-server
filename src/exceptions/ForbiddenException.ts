import { HttpException } from './HttpException';

export class ForbiddenException extends HttpException {
  constructor(message = '禁止访问，无权限', errorCode?: string) {
    super(403, message, errorCode);
    this.name = 'ForbiddenException';
  }
}
