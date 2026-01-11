import { PipeTransform } from '@nestjs/common';
import { type ZodSchema } from 'zod';
export declare class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
    private schema;
    constructor(schema: ZodSchema<T>);
    transform(value: unknown): T;
    private formatZodErrors;
}
