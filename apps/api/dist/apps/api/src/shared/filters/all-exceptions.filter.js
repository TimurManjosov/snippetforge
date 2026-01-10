"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AllExceptionsFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllExceptionsFilter = void 0;
const common_1 = require("@nestjs/common");
const constants_1 = require("../constants");
const types_1 = require("../types");
let AllExceptionsFilter = AllExceptionsFilter_1 = class AllExceptionsFilter {
    logger = new common_1.Logger(AllExceptionsFilter_1.name);
    isProduction = process.env.NODE_ENV === 'production';
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        if (exception instanceof common_1.HttpException) {
            this.logger.warn('HttpException caught by AllExceptionsFilter - this should not happen');
            const status = exception.getStatus();
            response.status(status).json((0, types_1.createErrorResponse)({
                code: constants_1.ErrorCodes.SERVER_ERROR,
                message: exception.message,
                statusCode: status,
                path: request.url,
                method: request.method,
            }));
            return;
        }
        const status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        const { code, message } = this.processException(exception);
        const errorResponse = (0, types_1.createErrorResponse)({
            code,
            message,
            statusCode: status,
            path: request.url,
            method: request.method,
            requestId: this.extractRequestId(request),
        });
        this.logError(exception, request);
        response.status(status).json(errorResponse);
    }
    processException(exception) {
        let code = constants_1.ErrorCodes.SERVER_ERROR;
        let message = 'An unexpected error occurred. Please try again later.';
        if (!this.isProduction && exception instanceof Error) {
            const errorInfo = this.identifyErrorType(exception);
            code = errorInfo.code;
            message = this.sanitizeErrorMessage(exception.message);
        }
        return { code, message };
    }
    identifyErrorType(error) {
        const errorName = error.name;
        const errorMessage = error.message.toLowerCase();
        if (errorName === 'JsonWebTokenError') {
            return { code: constants_1.ErrorCodes.AUTH_TOKEN_INVALID };
        }
        if (errorName === 'TokenExpiredError') {
            return { code: constants_1.ErrorCodes.AUTH_TOKEN_EXPIRED };
        }
        if (errorName === 'NotBeforeError') {
            return { code: constants_1.ErrorCodes.AUTH_TOKEN_INVALID };
        }
        if (errorMessage.includes('database') ||
            errorMessage.includes('connection') ||
            errorMessage.includes('postgres') ||
            errorMessage.includes('econnrefused')) {
            return { code: constants_1.ErrorCodes.SERVER_DATABASE_ERROR };
        }
        if (errorMessage.includes('unique constraint') ||
            errorMessage.includes('duplicate key')) {
            return { code: constants_1.ErrorCodes.RESOURCE_ALREADY_EXISTS };
        }
        if (errorName === 'SyntaxError' && errorMessage.includes('json')) {
            return { code: constants_1.ErrorCodes.VALIDATION_ERROR };
        }
        return { code: constants_1.ErrorCodes.SERVER_ERROR };
    }
    sanitizeErrorMessage(message) {
        let sanitized = message.substring(0, 500);
        const sensitivePatterns = [
            /[A-Za-z]:\\[^\s]+/g,
            /(?:\/[\w.-]+){2,}/g,
            /postgresql:\/\/[^\s]+/gi,
            /postgres:\/\/[^\s]+/gi,
            /mongodb:\/\/[^\s]+/gi,
            /at\s+[^\n]+/g,
            /node:internal[^\n]+/g,
        ];
        for (const pattern of sensitivePatterns) {
            sanitized = sanitized.replace(pattern, '[REDACTED]');
        }
        return sanitized;
    }
    extractRequestId(request) {
        return (request.headers['x-request-id'] ||
            request.headers['x-correlation-id'] ||
            undefined);
    }
    logError(exception, request) {
        const { method, url, ip } = request;
        const userAgent = request.headers['user-agent'] || 'unknown';
        const logContext = {
            method,
            url,
            ip,
            userAgent: userAgent.substring(0, 100),
            timestamp: new Date().toISOString(),
        };
        if (exception instanceof Error) {
            this.logger.error(`[UNHANDLED] [${method}] ${url} - ${exception.name}: ${exception.message}`, exception.stack, JSON.stringify(logContext));
        }
        else {
            this.logger.error(`[UNHANDLED] [${method}] ${url} - Unknown exception type`, String(exception), JSON.stringify(logContext));
        }
    }
};
exports.AllExceptionsFilter = AllExceptionsFilter;
exports.AllExceptionsFilter = AllExceptionsFilter = AllExceptionsFilter_1 = __decorate([
    (0, common_1.Catch)()
], AllExceptionsFilter);
//# sourceMappingURL=all-exceptions.filter.js.map