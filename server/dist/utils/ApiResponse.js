export class ApiResponse {
    static success(res, data, message = 'Success', statusCode = 200, meta) {
        const response = {
            success: true,
            message,
            data,
        };
        if (meta)
            response.meta = meta;
        return res.status(statusCode).json(response);
    }
    static created(res, data, message = 'Created successfully') {
        return ApiResponse.success(res, data, message, 201);
    }
    static noContent(res) {
        return res.status(204).send();
    }
    static error(res, message, statusCode = 500) {
        return res.status(statusCode).json({
            success: false,
            message,
        });
    }
}
//# sourceMappingURL=ApiResponse.js.map