import { z } from 'zod';
export declare const TokenResponseSchema: z.ZodObject<{
    accessToken: z.ZodString;
    tokenType: z.ZodLiteral<"Bearer">;
    expiresIn: z.ZodNumber;
}, z.core.$strip>;
export declare const UserResponseSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    username: z.ZodString;
    bio: z.ZodNullable<z.ZodString>;
    avatarUrl: z.ZodNullable<z.ZodString>;
    role: z.ZodEnum<{
        USER: "USER";
        ADMIN: "ADMIN";
        MODERATOR: "MODERATOR";
    }>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, z.core.$strip>;
export declare const AuthResponseSchema: z.ZodObject<{
    user: z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
        username: z.ZodString;
        bio: z.ZodNullable<z.ZodString>;
        avatarUrl: z.ZodNullable<z.ZodString>;
        role: z.ZodEnum<{
            USER: "USER";
            ADMIN: "ADMIN";
            MODERATOR: "MODERATOR";
        }>;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
    }, z.core.$strip>;
    tokens: z.ZodObject<{
        accessToken: z.ZodString;
        tokenType: z.ZodLiteral<"Bearer">;
        expiresIn: z.ZodNumber;
    }, z.core.$strip>;
}, z.core.$strip>;
export type TokenResponseDto = z.infer<typeof TokenResponseSchema>;
export type UserResponseDto = z.infer<typeof UserResponseSchema>;
export type AuthResponseDto = z.infer<typeof AuthResponseSchema>;
