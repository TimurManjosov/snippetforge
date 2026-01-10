import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsersService, type SafeUser } from '../users';
import { type AuthResponse } from './auth.types';
import { type LoginDto } from './dto/login.dto';
import { type RegisterDto } from './dto/register.dto';
export declare class AuthService {
    private readonly usersService;
    private readonly jwtService;
    private readonly configService;
    private readonly logger;
    private readonly accessTokenExpiresIn;
    constructor(usersService: UsersService, jwtService: JwtService, configService: ConfigService);
    register(dto: RegisterDto): Promise<AuthResponse>;
    login(dto: LoginDto): Promise<AuthResponse>;
    validateUserById(userId: string): Promise<SafeUser>;
    getCurrentUser(userId: string): Promise<SafeUser>;
    private generateTokens;
    private parseExpiresIn;
}
