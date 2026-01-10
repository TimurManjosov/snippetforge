import { z } from 'zod';
export declare const LoginSchema: z.ZodObject<{
    email: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
    password: z.ZodString;
}, z.core.$strip>;
export type LoginDto = z.infer<typeof LoginSchema>;
export declare function validateLoginDto(data: unknown): LoginDto;
export declare function safeValidateLoginDto(data: unknown): z.ZodSafeParseResult<{
    email: string;
    password: string;
}>;
