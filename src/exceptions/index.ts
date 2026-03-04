/**
 * HTTP 异常基类 - 所有 HTTP 异常的父类
 */
export { HttpException } from './HttpException';

/**
 * 400 - 请求参数错误异常
 * 用于校验请求参数失败时抛出
 */
export { BadRequestException } from './BadRequestException';

/**
 * 401 - 未授权异常
 * 用于需要登录但未提供有效凭证时抛出
 */
export { UnauthorizedException } from './UnauthorizedException';

/**
 * 403 - 禁止访问异常
 * 用于已登录但无权限访问资源时抛出
 */
export { ForbiddenException } from './ForbiddenException';

/**
 * 404 - 资源不存在异常
 * 用于请求的资源不存在时抛出
 */
export { NotFoundException } from './NotFoundException';

/**
 * 409 - 资源冲突异常
 * 用于资源已存在或版本冲突时抛出
 */
export { ConflictException } from './ConflictException';

/**
 * 500 - 服务器内部错误异常
 * 用于服务器处理请求时发生未预期的错误
 */
export { InternalServerException } from './InternalServerException';
