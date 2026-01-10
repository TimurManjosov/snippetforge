"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
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