import { HttpException } from './HttpException';

export class UnauthorizedException extends HttpException {
  constructor(message = '未授权，请先登录', errorCode?: string) {
    super(401, message, errorCode);
    this.name = 'UnauthorizedException';
  }
}
