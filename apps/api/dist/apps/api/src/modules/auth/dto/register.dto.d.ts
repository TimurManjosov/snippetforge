import { z } from 'zod';
export declare const RegisterSchema: z.ZodObject<{
    email: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
    username: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
    password: z.ZodString;
}, z.core.$strip>;
export type RegisterDto = z.infer<typeof RegisterSchema>;
export declare function validateRegisterDto(data: unknown): RegisterDto;
export declare function safeValidateRegisterDto(data: unknown): z.ZodSafeParseResult<{
    email: string;
    username: string;
    password: string;
}>;
