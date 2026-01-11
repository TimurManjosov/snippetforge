import { type ErrorCode } from '../constants';
export interface ErrorDetails {
    fields?: Record<string, string[]>;
    context?: Record<string, unknown>;
}
export interface ErrorObject {
    code: ErrorCode;
    message: string;
    statusCode: number;
    details?: ErrorDetails;
}
export interface ResponseMeta {
    timestamp: string;
    path: string;
    method: string;
    requestId?: string;
}
export interface ErrorResponse {
    success: false;
    error: ErrorObject;
    meta: ResponseMeta;
}
export declare function createErrorResponse(params: {
    code: ErrorCode;
    message: string;
    statusCode: number;
    path: string;
    method: string;
    details?: ErrorDetails;
    requestId?: string;
}): ErrorResponse;
