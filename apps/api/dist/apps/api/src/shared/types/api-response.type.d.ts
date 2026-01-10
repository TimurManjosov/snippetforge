export interface ApiResponse<T = unknown> {
    success: true;
    data: T;
    meta?: ApiResponseMeta;
}
export interface ApiErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        details?: unknown;
    };
    meta?: ApiResponseMeta;
}
export interface ApiResponseMeta {
    timestamp?: string;
    requestId?: string;
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export type ApiResult<T = unknown> = ApiResponse<T> | ApiErrorResponse;
export declare function isSuccessResponse<T>(response: ApiResult<T>): response is ApiResponse<T>;
export declare function isErrorResponse(response: ApiResult<unknown>): response is ApiErrorResponse;
