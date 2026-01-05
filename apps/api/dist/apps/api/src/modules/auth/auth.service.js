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
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const users_1 = require("../users");
let AuthService = AuthService_1 = class AuthService {
    usersService;
    jwtService;
    configService;
    logger = new common_1.Logger(AuthService_1.name);
    accessTokenExpiresIn;
    constructor(usersService, jwtService, configService) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.configService = configService;
        const expiresInString = this.configService.get('JWT_EXPIRES_IN') || '15m';
        this.accessTokenExpiresIn = this.parseExpiresIn(expiresInString);
    }
    async register(dto) {
        this.logger.debug(`Registering new user: ${dto.email}`);
        const user = await this.usersService.create({
            email: dto.email,
            username: dto.username,
            password: dto.password,
        });
        const tokens = await this.generateTokens(user);
        this.logger.log(`User registered successfully: ${user.id}`);
        return {
            user,
            tokens,
        };
    }
    async login(dto) {
        this.logger.debug(`Login attempt for: ${dto.email}`);
        const user = await this.usersService.validateCredentials(dto.email, dto.password);
        if (!user) {
            this.logger.warn(`Failed login attempt for: ${dto.email}`);
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        const tokens = await this.generateTokens(user);
        this.logger.log(`User logged in successfully: ${user.id}`);
        return {
            user,
            tokens,
        };
    }
    async validateUserById(userId) {
        return this.usersService.findById(userId);
    }
    async getCurrentUser(userId) {
        return this.usersService.findById(userId);
    }
    async generateTokens(user) {
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };
        const accessToken = await this.jwtService.signAsync(payload);
        return {
            accessToken,
            tokenType: 'Bearer',
            expiresIn: this.accessTokenExpiresIn,
        };
    }
    parseExpiresIn(value) {
        const match = value.match(/^(\d+)(s|m|h|d)?$/);
        if (!match) {
            this.logger.warn(`Invalid JWT_EXPIRES_IN format: ${value}, using default 15m`);
            return 900;
        }
        const num = parseInt(match[1], 10);
        const unit = match[2] || 's';
        switch (unit) {
            case 's':
                return num;
            case 'm':
                return num * 60;
            case 'h':
                return num * 60 * 60;
            case 'd':
                return num * 60 * 60 * 24;
            default:
                return num;
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_1.UsersService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map