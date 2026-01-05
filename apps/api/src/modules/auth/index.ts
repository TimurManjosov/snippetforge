// src/modules/auth/index.ts

// Module
export { AuthModule } from './auth.module';

// Service
export { AuthService } from './auth.service';

// Guards
export { JwtAuthGuard, RolesGuard } from './guards';

// Decorators
export { CurrentUser, Public, Roles, type Role } from './decorators';

// DTOs
export { LoginSchema, RegisterSchema } from './dto';
export type { LoginDto, RegisterDto } from './dto';

// Types
export * from './auth.types';
