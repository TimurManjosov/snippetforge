import { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
export declare class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger;
    private readonly isProduction;
    catch(exception: unknown, host: ArgumentsHost): void;
    private processException;
    private identifyErrorType;
    private sanitizeErrorMessage;
    private extractRequestId;
    private logError;
}
