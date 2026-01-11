export declare class ErrorDetailsSchema {
    fields?: Record<string, string[]>;
    context?: Record<string, unknown>;
}
export declare class ErrorObjectSchema {
    code: string;
    message: string;
    statusCode: number;
    details?: ErrorDetailsSchema;
}
export declare class ResponseMetaSchema {
    timestamp: string;
    path: string;
    method: string;
    requestId?: string;
}
export declare class ErrorResponseSchema {
    success: false;
    error: ErrorObjectSchema;
    meta: ResponseMetaSchema;
}
export declare class ValidationErrorResponseSchema extends ErrorResponseSchema {
    error: ErrorObjectSchema;
}
export declare class UnauthorizedErrorResponseSchema extends ErrorResponseSchema {
    error: ErrorObjectSchema;
}
export declare class ForbiddenErrorResponseSchema extends ErrorResponseSchema {
    error: ErrorObjectSchema;
}
export declare class NotFoundErrorResponseSchema extends ErrorResponseSchema {
    error: ErrorObjectSchema;
}
export declare class ConflictErrorResponseSchema extends ErrorResponseSchema {
    error: ErrorObjectSchema;
}
export declare class InternalServerErrorResponseSchema extends ErrorResponseSchema {
    error: ErrorObjectSchema;
}
