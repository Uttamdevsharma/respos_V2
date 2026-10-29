import { Response } from 'express';

interface ApiResponseData<T> {
  success: boolean;
  message: string;
  data?: T;
  meta?: Record<string, unknown>;
}

export class ApiResponse {
  static success<T>(res: Response, data: T, message = 'Success', statusCode = 200, meta?: Record<string, unknown>): Response {
    const response: ApiResponseData<T> = {
      success: true,
      message,
      data,
    };
    if (meta) response.meta = meta;
    return res.status(statusCode).json(response);
  }

  static created<T>(res: Response, data: T, message = 'Created successfully'): Response {
    return ApiResponse.success(res, data, message, 201);
  }

  static noContent(res: Response): Response {
    return res.status(204).send();
  }

  static error(res: Response, message: string, statusCode = 500): Response {
    return res.status(statusCode).json({
      success: false,
      message,
    });
  }
}
