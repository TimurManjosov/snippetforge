"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var HttpExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const constants_1 = require("../constants");
const types_1 = require("../types");
let HttpExceptionFilter = HttpExceptionFilter_1 = class HttpExceptionFilter {
    logger = new common_1.Logger(HttpExceptionFilter_1.name);
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const status = exception.getStatus();
        const exceptionResponse = exception.getResponse();
        const { message, code, details } = this.extractErrorInfo(exceptionResponse, status);
        const errorResponse = (0, types_1.createErrorResponse)({
            code,
            message,
            statusCode: status,
            path: request.url,
            method: request.method,
            details,
            requestId: this.extractRequestId(request),
        });
        this.logError(exception, request, status, code);
        response.status(status).json(errorResponse);
    }
    extractErrorInfo(response, status) {
        let message = 'An error occurred';
        let code = constants_1.HttpStatusToErrorCode[status] || constants_1.ErrorCodes.SERVER_ERROR;
        let details;
        if (typeof response === 'string') {
            message = response;
            code = this.inferErrorCode(message, status, code);
            return { message, code, details };
        }
        if (typeof response === 'object' && response !== null) {
            const res = response;
            if (typeof res.message === 'string') {
                message = res.message;
            }
            else if (Array.isArray(res.message)) {
                message = res.message[0] || 'Validation failed';
                if (res.message.length > 1) {
                    details = { context: { messages: res.message } };
                }
            }
            if (typeof res.code === 'string') {
                code = res.code;
            }
            if (res.errors && typeof res.errors === 'object') {
                details = { fields: res.errors };
            }
            code = this.inferErrorCode(message, status, code);
        }
        return { message, code, details };
    }
    inferErrorCode(message, status, defaultCode) {
        const lowerMessage = message.toLowerCase();
        if (status === common_1.HttpStatus.UNAUTHORIZED) {
            if (lowerMessage.includes('expired')) {
                return constants_1.ErrorCodes.AUTH_TOKEN_EXPIRED;
            }
            if (lowerMessage.includes('missing') ||
                lowerMessage.includes('no token')) {
                return constants_1.ErrorCodes.AUTH_TOKEN_MISSING;
            }
            if (lowerMessage.includes('invalid credentials') ||
                lowerMessage.includes('email or password')) {
                return constants_1.ErrorCodes.AUTH_INVALID_CREDENTIALS;
            }
            return constants_1.ErrorCodes.AUTH_TOKEN_INVALID;
        }
        if (status === common_1.HttpStatus.FORBIDDEN) {
            if (lowerMessage.includes('role')) {
                return constants_1.ErrorCodes.AUTH_INSUFFICIENT_ROLE;
            }
            return constants_1.ErrorCodes.AUTH_ACCESS_DENIED;
        }
        if (status === common_1.HttpStatus.CONFLICT) {
            if (lowerMessage.includes('email')) {
                return constants_1.ErrorCodes.USER_EMAIL_EXISTS;
            }
            if (lowerMessage.includes('username')) {
                return constants_1.ErrorCodes.USER_USERNAME_EXISTS;
            }
        }
        if (status === common_1.HttpStatus.NOT_FOUND) {
            if (lowerMessage.includes('user')) {
                return constants_1.ErrorCodes.USER_NOT_FOUND;
            }
        }
        return defaultCode;
    }
    extractRequestId(request) {
        return (request.headers['x-request-id'] ||
            request.headers['x-correlation-id'] ||
            undefined);
    }
    logError(exception, request, status, code) {
        const { method, url, ip } = request;
        const message = exception.message;
        const userAgent = request.headers['user-agent'] || 'unknown';
        const logContext = {
            method,
            url,
            status,
            code,
            ip,
            userAgent: userAgent.substring(0, 100),
        };
        if (status >= 500) {
            this.logger.error(`[${method}] ${url} - ${status} ${code}: ${message}`, exception.stack, JSON.stringify(logContext));
        }
        else if (status === 401 || status === 403) {
            this.logger.warn(`[${method}] ${url} - ${status} ${code}: ${message}`, JSON.stringify(logContext));
        }
        else if (status >= 400) {
            this.logger.debug(`[${method}] ${url} - ${status} ${code}: ${message}`, JSON.stringify(logContext));
        }
    }
};
exports.HttpExceptionFilter = HttpExceptionFilter;
exports.HttpExceptionFilter = HttpExceptionFilter = HttpExceptionFilter_1 = __decorate([
    (0, common_1.Catch)(common_1.HttpException)
], HttpExceptionFilter);
//# sourceMappingURL=http-exception.filter.js.map