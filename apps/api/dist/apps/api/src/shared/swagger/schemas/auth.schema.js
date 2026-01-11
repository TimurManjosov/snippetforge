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
exports.AuthResponseSchema = exports.UserResponseSchema = exports.TokenResponseSchema = exports.LoginRequestSchema = exports.RegisterRequestSchema = void 0;
const swagger_1 = require("@nestjs/swagger");
class RegisterRequestSchema {
    email;
    username;
    password;
}
exports.RegisterRequestSchema = RegisterRequestSchema;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'User email address',
        example: 'user@example.com',
        format: 'email',
        maxLength: 255,
    }),
    __metadata("design:type", String)
], RegisterRequestSchema.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Unique username',
        example: 'johndoe',
        minLength: 3,
        maxLength: 30,
        pattern: '^[a-zA-Z0-9_]+$',
    }),
    __metadata("design:type", String)
], RegisterRequestSchema.prototype, "username", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'User password (min 8 chars, must contain uppercase, lowercase, and number)',
        example: 'SecurePass123',
        minLength: 8,
        maxLength: 100,
        format: 'password',
    }),
    __metadata("design:type", String)
], RegisterRequestSchema.prototype, "password", void 0);
class LoginRequestSchema {
    email;
    password;
}
exports.LoginRequestSchema = LoginRequestSchema;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'User email address',
        example: 'user@example.com',
        format: 'email',
    }),
    __metadata("design:type", String)
], LoginRequestSchema.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'User password',
        example: 'SecurePass123',
        format: 'password',
    }),
    __metadata("design:type", String)
], LoginRequestSchema.prototype, "password", void 0);
class TokenResponseSchema {
    accessToken;
    tokenType;
    expiresIn;
}
exports.TokenResponseSchema = TokenResponseSchema;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'JWT access token',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    }),
    __metadata("design:type", String)
], TokenResponseSchema.prototype, "accessToken", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Token type',
        example: 'Bearer',
        enum: ['Bearer'],
    }),
    __metadata("design:type", String)
], TokenResponseSchema.prototype, "tokenType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Token expiration time in seconds',
        example: 900,
    }),
    __metadata("design:type", Number)
], TokenResponseSchema.prototype, "expiresIn", void 0);
class UserResponseSchema {
    id;
    email;
    username;
    bio;
    avatarUrl;
    role;
    createdAt;
    updatedAt;
}
exports.UserResponseSchema = UserResponseSchema;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'User unique identifier',
        example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        format: 'uuid',
    }),
    __metadata("design:type", String)
], UserResponseSchema.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'User email address',
        example: 'user@example.com',
        format: 'email',
    }),
    __metadata("design:type", String)
], UserResponseSchema.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'User display name',
        example: 'johndoe',
    }),
    __metadata("design:type", String)
], UserResponseSchema.prototype, "username", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'User biography',
        example: 'Full-stack developer passionate about clean code',
        nullable: true,
    }),
    __metadata("design:type", Object)
], UserResponseSchema.prototype, "bio", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'User avatar URL',
        example: 'https://example.com/avatar.jpg',
        nullable: true,
    }),
    __metadata("design:type", Object)
], UserResponseSchema.prototype, "avatarUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'User role',
        example: 'USER',
        enum: ['USER', 'ADMIN', 'MODERATOR'],
    }),
    __metadata("design:type", String)
], UserResponseSchema.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Account creation timestamp',
        example: '2026-01-10T12:00:00.000Z',
        format: 'date-time',
    }),
    __metadata("design:type", Date)
], UserResponseSchema.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Last update timestamp',
        example: '2026-01-10T12:00:00.000Z',
        format: 'date-time',
    }),
    __metadata("design:type", Date)
], UserResponseSchema.prototype, "updatedAt", void 0);
class AuthResponseSchema {
    user;
    tokens;
}
exports.AuthResponseSchema = AuthResponseSchema;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'User profile',
        type: UserResponseSchema,
    }),
    __metadata("design:type", UserResponseSchema)
], AuthResponseSchema.prototype, "user", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Authentication tokens',
        type: TokenResponseSchema,
    }),
    __metadata("design:type", TokenResponseSchema)
], AuthResponseSchema.prototype, "tokens", void 0);
//# sourceMappingURL=auth.schema.js.map