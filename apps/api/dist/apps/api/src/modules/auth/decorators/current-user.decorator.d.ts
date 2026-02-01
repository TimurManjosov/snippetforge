import { ExecutionContext } from '@nestjs/common';
import { type SafeUser } from '../../users';
export declare const currentUserFactory: (data: keyof SafeUser | undefined, ctx: ExecutionContext) => string | Date | SafeUser | null | undefined;
export declare const CurrentUser: (...dataOrPipes: (keyof SafeUser | import("@nestjs/common").PipeTransform<any, any> | import("@nestjs/common").Type<import("@nestjs/common").PipeTransform<any, any>> | undefined)[]) => ParameterDecorator;
