import { type SafeUser } from '../users';
import { AuthService } from './auth.service';
import { type AuthResponse } from './auth.types';
import * as loginDto from './dto/login.dto';
import * as registerDto from './dto/register.dto';
export declare class AuthController {
    private readonly authService;
    private readonly logger;
    constructor(authService: AuthService);
    register(dto: registerDto.RegisterDto): Promise<AuthResponse>;
    login(dto: loginDto.LoginDto): Promise<AuthResponse>;
    getMe(user: SafeUser): SafeUser;
}
