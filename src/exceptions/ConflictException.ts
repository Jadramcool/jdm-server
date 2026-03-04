import { HttpException } from './HttpException';

export class ConflictException extends HttpException {
    constructor(message = '资源冲突', errorCode?: string, details?: any) {
        super(409, message, errorCode, details);
        this.name = 'ConflictException';
    }
}
