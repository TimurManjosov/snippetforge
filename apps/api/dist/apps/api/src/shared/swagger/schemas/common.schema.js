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
exports.MessageResponseSchema = exports.PaginationMetaSchema = exports.HealthCheckResponseSchema = void 0;
const swagger_1 = require("@nestjs/swagger");
class HealthCheckResponseSchema {
    status;
    timestamp;
    service;
    version;
}
exports.HealthCheckResponseSchema = HealthCheckResponseSchema;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Service status',
        example: 'ok',
        enum: ['ok', 'degraded', 'error'],
    }),
    __metadata("design:type", String)
], HealthCheckResponseSchema.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Current server timestamp',
        example: '2026-01-10T12:00:00.000Z',
        format: 'date-time',
    }),
    __metadata("design:type", String)
], HealthCheckResponseSchema.prototype, "timestamp", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Service name',
        example: 'snippetforge-api',
    }),
    __metadata("design:type", String)
], HealthCheckResponseSchema.prototype, "service", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'API version',
        example: '0.1.0',
    }),
    __metadata("design:type", String)
], HealthCheckResponseSchema.prototype, "version", void 0);
class PaginationMetaSchema {
    page;
    limit;
    total;
    totalPages;
    hasNextPage;
    hasPreviousPage;
}
exports.PaginationMetaSchema = PaginationMetaSchema;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Current page number',
        example: 1,
    }),
    __metadata("design:type", Number)
], PaginationMetaSchema.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Items per page',
        example: 20,
    }),
    __metadata("design:type", Number)
], PaginationMetaSchema.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Total number of items',
        example: 100,
    }),
    __metadata("design:type", Number)
], PaginationMetaSchema.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Total number of pages',
        example: 5,
    }),
    __metadata("design:type", Number)
], PaginationMetaSchema.prototype, "totalPages", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Has next page',
        example: true,
    }),
    __metadata("design:type", Boolean)
], PaginationMetaSchema.prototype, "hasNextPage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Has previous page',
        example: false,
    }),
    __metadata("design:type", Boolean)
], PaginationMetaSchema.prototype, "hasPreviousPage", void 0);
class MessageResponseSchema {
    message;
}
exports.MessageResponseSchema = MessageResponseSchema;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Status message',
        example: 'Operation completed successfully',
    }),
    __metadata("design:type", String)
], MessageResponseSchema.prototype, "message", void 0);
//# sourceMappingURL=common.schema.js.map