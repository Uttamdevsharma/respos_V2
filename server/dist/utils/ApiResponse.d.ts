import { Response } from 'express';
export declare class ApiResponse {
    static success<T>(res: Response, data: T, message?: string, statusCode?: number, meta?: Record<string, unknown>): Response;
    static created<T>(res: Response, data: T, message?: string): Response;
    static noContent(res: Response): Response;
    static error(res: Response, message: string, statusCode?: number): Response;
}
//# sourceMappingURL=ApiResponse.d.ts.map