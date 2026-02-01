"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AuthController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const pipes_1 = require("../../shared/pipes");
const swagger_2 = require("../../shared/swagger");
const auth_service_1 = require("./auth.service");
const current_user_decorator_1 = require("./decorators/current-user.decorator");
const public_decorator_1 = require("./decorators/public.decorator");
const loginDto = __importStar(require("./dto/login.dto"));
const registerDto = __importStar(require("./dto/register.dto"));
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
let AuthController = AuthController_1 = class AuthController {
    authService;
    logger = new common_1.Logger(AuthController_1.name);
    constructor(authService) {
        this.authService = authService;
    }
    async register(dto) {
        this.logger.debug(`Register request for: ${dto.email}`);
        return this.authService.register(dto);
    }
    async login(dto) {
        this.logger.debug(`Login request for: ${dto.email}`);
        return this.authService.login(dto);
    }
    getMe(user) {
        this.logger.debug(`Get profile for user: ${user.id}`);
        return user;
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('register'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({
        summary: 'Register a new user account',
        description: `
Creates a new user account and returns authentication tokens.
The user is immediately logged in after registration.

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

**Username Requirements:**
- 3-30 characters
- Only letters, numbers, and underscores
    `,
    }),
    (0, swagger_1.ApiBody)({
        type: swagger_2.RegisterRequestSchema,
        description: 'User registration data',
        examples: {
            valid: {
                summary: 'Valid registration',
                value: {
                    email: 'newuser@example.com',
                    username: 'newuser',
                    password: 'SecurePass123',
                },
            },
            minimal: {
                summary: 'Minimal valid data',
                value: {
                    email: 'min@test.com',
                    username: 'usr',
                    password: 'Test1234',
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CREATED,
        description: 'User successfully registered',
        type: swagger_2.AuthResponseSchema,
    }),
    (0, swagger_1.ApiBadRequestResponse)({
        description: 'Validation error - Invalid input data',
        type: swagger_2.ValidationErrorResponseSchema,
    }),
    (0, swagger_1.ApiConflictResponse)({
        description: 'Email or username already exists',
        type: swagger_2.ConflictErrorResponseSchema,
    }),
    __param(0, (0, common_1.Body)(new pipes_1.ZodValidationPipe(registerDto.RegisterSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Login with email and password',
        description: `
Authenticates a user with email and password.
Returns JWT tokens on successful authentication.

**Token Usage:**
Include the access token in the Authorization header:
\`\`\`
Authorization: Bearer <accessToken>
\`\`\`
    `,
    }),
    (0, swagger_1.ApiBody)({
        type: swagger_2.LoginRequestSchema,
        description: 'User credentials',
        examples: {
            valid: {
                summary: 'Valid credentials',
                value: {
                    email: 'user@example.com',
                    password: 'SecurePass123',
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Login successful',
        type: swagger_2.AuthResponseSchema,
    }),
    (0, swagger_1.ApiBadRequestResponse)({
        description: 'Validation error - Invalid input format',
        type: swagger_2.ValidationErrorResponseSchema,
    }),
    (0, swagger_1.ApiUnauthorizedResponse)({
        description: 'Invalid email or password',
        type: swagger_2.UnauthorizedErrorResponseSchema,
    }),
    __param(0, (0, common_1.Body)(new pipes_1.ZodValidationPipe(loginDto.LoginSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('me'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiBearerAuth)('JWT-Auth'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get current user profile',
        description: `
Returns the profile of the currently authenticated user.
Requires a valid JWT token in the Authorization header.

**Note:** This endpoint validates the token and returns fresh user data from the database.
    `,
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Current user profile',
        type: swagger_2.UserResponseSchema,
    }),
    (0, swagger_1.ApiUnauthorizedResponse)({
        description: 'Missing or invalid authentication token',
        type: swagger_2.UnauthorizedErrorResponseSchema,
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Object)
], AuthController.prototype, "getMe", null);
exports.AuthController = AuthController = AuthController_1 = __decorate([
    (0, swagger_1.ApiTags)('Auth'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map