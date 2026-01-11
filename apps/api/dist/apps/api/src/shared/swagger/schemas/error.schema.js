"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalServerErrorResponseSchema = exports.ConflictErrorResponseSchema = exports.NotFoundErrorResponseSchema = exports.ForbiddenErrorResponseSchema = exports.UnauthorizedErrorResponseSchema = exports.ValidationErrorResponseSchema = exports.ErrorResponseSchema = exports.ResponseMetaSchema = exports.ErrorObjectSchema = exports.ErrorDetailsSchema = void 0;
const swagger_1 = require("@nestjs/swagger");
class ErrorDetailsSchema {
    fields;
    context;
}
exports.ErrorDetailsSchema = ErrorDetailsSchema;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Field-specific validation errors',
        example: {
            email: ['Invalid email format'],
            password: ['Password must be at least 8 characters'],
        },
        type: 'object',
        additionalProperties: {
            type: 'array',
            items: { type: 'string' },
        },
    }),
    __metadata("design:type", Object)
], ErrorDetailsSchema.prototype, "fields", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Additional context information',
        type: 'object',
        additionalProperties: true,
    }),
    __metadata("design:type", Object)
], ErrorDetailsSchema.prototype, "context", void 0);
class ErrorObjectSchema {
    code;
    message;
    statusCode;
    details;
}
exports.ErrorObjectSchema = ErrorObjectSchema;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Machine-readable error code',
        example: 'VALIDATION_ERROR',
        enum: [
            'AUTH_TOKEN_MISSING',
            'AUTH_TOKEN_INVALID',
            'AUTH_TOKEN_EXPIRED',
            'AUTH_INVALID_CREDENTIALS',
            'AUTH_INSUFFICIENT_ROLE',
            'AUTH_ACCESS_DENIED',
            'VALIDATION_ERROR',
            'USER_NOT_FOUND',
            'USER_EMAIL_EXISTS',
            'USER_USERNAME_EXISTS',
            'RESOURCE_NOT_FOUND',
            'SERVER_ERROR',
        ],
    }),
    __metadata("design:type", String)
], ErrorObjectSchema.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Human-readable error message',
        example: 'Validation failed',
    }),
    __metadata("design:type", String)
], ErrorObjectSchema.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'HTTP status code',
        example: 400,
    }),
    __metadata("design:type", Number)
], ErrorObjectSchema.prototype, "statusCode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Additional error details',
        type: ErrorDetailsSchema,
    }),
    __metadata("design:type", ErrorDetailsSchema)
], ErrorObjectSchema.prototype, "details", void 0);
class ResponseMetaSchema {
    timestamp;
    path;
    method;
    requestId;
}
exports.ResponseMetaSchema = ResponseMetaSchema;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ISO 8601 timestamp',
        example: '2026-01-10T12:00:00.000Z',
    }),
    __metadata("design:type", String)
], ResponseMetaSchema.prototype, "timestamp", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Request path',
        example: '/api/auth/register',
    }),
    __metadata("design:type", String)
], ResponseMetaSchema.prototype, "path", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'HTTP method',
        example: 'POST',
    }),
    __metadata("design:type", String)
], ResponseMetaSchema.prototype, "method", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Request ID for tracing',
        example: 'req-123-456-789',
    }),
    __metadata("design:type", String)
], ResponseMetaSchema.prototype, "requestId", void 0);
class ErrorResponseSchema {
    success;
    error;
    meta;
}
exports.ErrorResponseSchema = ErrorResponseSchema;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Always false for errors',
        example: false,
    }),
    __metadata("design:type", Boolean)
], ErrorResponseSchema.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Error details',
        type: ErrorObjectSchema,
    }),
    __metadata("design:type", ErrorObjectSchema)
], ErrorResponseSchema.prototype, "error", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Response metadata',
        type: ResponseMetaSchema,
    }),
    __metadata("design:type", ResponseMetaSchema)
], ErrorResponseSchema.prototype, "meta", void 0);
class ValidationErrorResponseSchema extends ErrorResponseSchema {
}
exports.ValidationErrorResponseSchema = ValidationErrorResponseSchema;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Error details with validation fields',
        type: ErrorObjectSchema,
        example: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            statusCode: 400,
            details: {
                fields: {
                    email: ['Invalid email format'],
                    password: ['Password must be at least 8 characters'],
                },
            },
        },
    }),
    __metadata("design:type", ErrorObjectSchema)
], ValidationErrorResponseSchema.prototype, "error", void 0);
class UnauthorizedErrorResponseSchema extends ErrorResponseSchema {
}
exports.UnauthorizedErrorResponseSchema = UnauthorizedErrorResponseSchema;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Error details for authentication failure',
        type: ErrorObjectSchema,
        example: {
            code: 'AUTH_TOKEN_MISSING',
            message: 'Invalid or missing authentication token',
            statusCode: 401,
        },
    }),
    __metadata("design:type", ErrorObjectSchema)
], UnauthorizedErrorResponseSchema.prototype, "error", void 0);
class ForbiddenErrorResponseSchema extends ErrorResponseSchema {
}
exports.ForbiddenErrorResponseSchema = ForbiddenErrorResponseSchema;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Error details for authorization failure',
        type: ErrorObjectSchema,
        example: {
            code: 'AUTH_INSUFFICIENT_ROLE',
            message: 'Access denied. Required role: ADMIN',
            statusCode: 403,
        },
    }),
    __metadata("design:type", ErrorObjectSchema)
], ForbiddenErrorResponseSchema.prototype, "error", void 0);
class NotFoundErrorResponseSchema extends ErrorResponseSchema {
}
exports.NotFoundErrorResponseSchema = NotFoundErrorResponseSchema;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Error details for not found',
        type: ErrorObjectSchema,
        example: {
            code: 'RESOURCE_NOT_FOUND',
            message: 'Resource not found',
            statusCode: 404,
        },
    }),
    __metadata("design:type", ErrorObjectSchema)
], NotFoundErrorResponseSchema.prototype, "error", void 0);
class ConflictErrorResponseSchema extends ErrorResponseSchema {
}
exports.ConflictErrorResponseSchema = ConflictErrorResponseSchema;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Error details for conflict',
        type: ErrorObjectSchema,
        example: {
            code: 'USER_EMAIL_EXISTS',
            message: 'Email is already registered',
            statusCode: 409,
        },
    }),
    __metadata("design:type", ErrorObjectSchema)
], ConflictErrorResponseSchema.prototype, "error", void 0);
class InternalServerErrorResponseSchema extends ErrorResponseSchema {
}
exports.InternalServerErrorResponseSchema = InternalServerErrorResponseSchema;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Error details for server error',
        type: ErrorObjectSchema,
        example: {
            code: 'SERVER_ERROR',
            message: 'An unexpected error occurred. Please try again later.',
            statusCode: 500,
        },
    }),
    __metadata("design:type", ErrorObjectSchema)
], InternalServerErrorResponseSchema.prototype, "error", void 0);
//# sourceMappingURL=error.schema.js.map