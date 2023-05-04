import { ResponseVO } from "../model/response";

export enum StatusCode {
  success = 200,
  badRequest = 400,
  forbidden = 403,
  internalServerError = 500
}

class Result {
  private statusCode: number;
  private code: number;
  private message: string;
  private data?: any;

  constructor(statusCode: number, code: number, message: string, data?: any) {
    this.statusCode = statusCode;
    this.code = code;
    this.message = message;
    this.data = data;
  }

  /**
   * Serverless: According to the API Gateway specs, the body content must be stringified
   */
  bodyToString() {
    return {
      statusCode: this.statusCode,
      body: JSON.stringify({
        code: this.code,
        message: this.message,
        data: this.data,
      }),
    };
  }
}

export class MessageUtil {
  static success(data: object, httpCode?: StatusCode): ResponseVO {
    const result = new Result(httpCode || StatusCode.success, 0, "success", data);

    return result.bodyToString();
  }

  static error(code: number = 1000, message: string, httpCode?: StatusCode) {
    const result = new Result(httpCode || StatusCode.internalServerError, code, message);
    return result.bodyToString();
  }
}
