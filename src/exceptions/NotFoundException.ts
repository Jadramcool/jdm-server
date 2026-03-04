import { HttpException } from './HttpException';

export class NotFoundException extends HttpException {
  constructor(message = '资源不存在', errorCode?: string) {
    super(404, message, errorCode);
    this.name = 'NotFoundException';
  }
}
