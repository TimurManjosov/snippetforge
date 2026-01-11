import { SwaggerCustomOptions } from '@nestjs/swagger';
export declare function isSwaggerEnabled(): boolean;
export declare function createSwaggerConfig(): Omit<import("@nestjs/swagger").OpenAPIObject, "paths">;
export declare const swaggerCustomOptions: SwaggerCustomOptions;
export declare const SWAGGER_PATH = "api-docs";
export declare const SWAGGER_JSON_PATH = "api-docs-json";
