export declare class AppService {
    getHello(): string;
    testValidation(): "Valid!" | import("zod").ZodError<{
        password: string;
        email: string;
        username: string;
    }>;
}
