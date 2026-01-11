"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
const swagger_config_1 = require("./config/swagger.config");
const filters_1 = require("./shared/filters");
async function bootstrap() {
    const logger = new common_1.Logger('Bootstrap');
    const isProduction = process.env.NODE_ENV === 'production';
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: isProduction
            ? ['error', 'warn', 'log']
            : ['error', 'warn', 'log', 'debug', 'verbose'],
        abortOnError: true,
    });
    app.useGlobalFilters(new filters_1.AllExceptionsFilter(), new filters_1.HttpExceptionFilter());
    app.enableShutdownHooks();
    app.enableCors({
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    });
    app.setGlobalPrefix('api');
    if ((0, swagger_config_1.isSwaggerEnabled)()) {
        const config = (0, swagger_config_1.createSwaggerConfig)();
        const document = swagger_1.SwaggerModule.createDocument(app, config);
        swagger_1.SwaggerModule.setup(swagger_config_1.SWAGGER_PATH, app, document, swagger_config_1.swaggerCustomOptions);
        logger.log(`📖 Swagger documentation available at: http://localhost:${process.env.PORT || 3001}/${swagger_config_1.SWAGGER_PATH}`);
    }
    else {
        logger.log('📖 Swagger documentation is disabled');
    }
    const port = process.env.PORT || 3001;
    await app.listen(port);
    logger.log(`🚀 Application is running on: http://localhost:${port}`);
    logger.log(`📚 API available at: http://localhost:${port}/api`);
    logger.log(`🔒 Environment: ${isProduction ? 'production' : 'development'}`);
    if (!isProduction) {
        logger.debug('Debug logging is enabled');
    }
}
bootstrap().catch((error) => {
    const logger = new common_1.Logger('Bootstrap');
    logger.error('Failed to start application', error);
    process.exit(1);
});
//# sourceMappingURL=main.js.map