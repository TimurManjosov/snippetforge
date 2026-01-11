export declare const ROLES_KEY = "roles";
export type Role = 'USER' | 'ADMIN' | 'MODERATOR';
export declare const Roles: (...roles: Role[]) => import("@nestjs/common").CustomDecorator<string>;
