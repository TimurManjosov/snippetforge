export declare class RegisterRequestSchema {
    email: string;
    username: string;
    password: string;
}
export declare class LoginRequestSchema {
    email: string;
    password: string;
}
export declare class TokenResponseSchema {
    accessToken: string;
    tokenType: 'Bearer';
    expiresIn: number;
}
export declare class UserResponseSchema {
    id: string;
    email: string;
    username: string;
    bio: string | null;
    avatarUrl: string | null;
    role: 'USER' | 'ADMIN' | 'MODERATOR';
    createdAt: Date;
    updatedAt: Date;
}
export declare class AuthResponseSchema {
    user: UserResponseSchema;
    tokens: TokenResponseSchema;
}
