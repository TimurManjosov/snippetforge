"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createErrorResponse = createErrorResponse;
function createErrorResponse(params) {
    return {
        success: false,
        error: {
            code: params.code,
            message: params.message,
            statusCode: params.statusCode,
            ...(params.details && { details: params.details }),
        },
        meta: {
            timestamp: new Date().toISOString(),
            path: params.path,
            method: params.method,
            ...(params.requestId && { requestId: params.requestId }),
        },
    };
}
//# sourceMappingURL=error-response.type.js.map