import { ArgumentMetadata, PipeTransform } from '@nestjs/common';
import * as zod from 'zod';
export declare class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
    private schema;
    constructor(schema: zod.ZodSchema<T>);
    transform(value: unknown, _metadata: ArgumentMetadata): T;
    private formatZodErrors;
}
