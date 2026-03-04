export class HttpException extends Error {
  constructor(
    public code: number,
    public message: string,
    public errorCode?: string,
    public details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      errorCode: this.errorCode,
      details: this.details,
    };
  }
}
