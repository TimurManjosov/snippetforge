"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SWAGGER_JSON_PATH = exports.SWAGGER_PATH = exports.swaggerCustomOptions = void 0;
exports.isSwaggerEnabled = isSwaggerEnabled;
exports.createSwaggerConfig = createSwaggerConfig;
const swagger_1 = require("@nestjs/swagger");
function isSwaggerEnabled() {
    const nodeEnv = process.env.NODE_ENV || 'development';
    const enableSwagger = process.env.ENABLE_SWAGGER;
    if (nodeEnv !== 'production') {
        return enableSwagger !== 'false';
    }
    return enableSwagger === 'true';
}
function createSwaggerConfig() {
    return (new swagger_1.DocumentBuilder()
        .setTitle('SnippetForge API')
        .setDescription(createApiDescription())
        .setVersion(getApiVersion())
        .setContact('SnippetForge Team', 'https://github.com/TimurManjosov/snippetforge', 'support@snippetforge.dev')
        .setLicense('MIT', 'https://opensource.org/licenses/MIT')
        .addServer('http://localhost:3001', 'Development Server')
        .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter your JWT access token',
        in: 'header',
    }, 'JWT-Auth')
        .addTag('Health', 'Health check and status endpoints')
        .addTag('Auth', 'Authentication endpoints (register, login, profile)')
        .build());
}
function createApiDescription() {
    return `
## SnippetForge Backend API

Full-stack code snippet sharing platform built with NestJS.

### 🔐 Authentication

All endpoints except those marked as **public** require authentication.

**How to authenticate:**
1. Register a new account via \`POST /api/auth/register\`
2. Or login via \`POST /api/auth/login\`
3. Copy the \`accessToken\` from the response
4. Click the **Authorize** button (🔓) above
5. Enter your token (without "Bearer " prefix)
6. Click **Authorize**

**Token Format:**
\`\`\`
Authorization: Bearer <your-access-token>
\`\`\`

### 📋 Response Format

**Success Response:**
\`\`\`json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "johndoe",
  ...
}
\`\`\`

**Error Response:**
\`\`\`json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "statusCode": 400,
    "details": { ... }
  },
  "meta": {
    "timestamp": "2026-01-10T12:00:00.000Z",
    "path": "/api/...",
    "method": "POST"
  }
}
\`\`\`

### 🚦 Error Codes

| Code | Description |
|------|-------------|
| \`AUTH_TOKEN_MISSING\` | No authorization token provided |
| \`AUTH_TOKEN_INVALID\` | Token is malformed or has invalid signature |
| \`AUTH_TOKEN_EXPIRED\` | Token has expired |
| \`AUTH_INVALID_CREDENTIALS\` | Wrong email or password |
| \`VALIDATION_ERROR\` | Input validation failed |
| \`USER_EMAIL_EXISTS\` | Email is already registered |
| \`USER_USERNAME_EXISTS\` | Username is already taken |
| \`RESOURCE_NOT_FOUND\` | Requested resource not found |

### 🔄 Rate Limiting

Currently no rate limiting is implemented. This will be added in a future release.

### 📝 Changelog

- **v0.1.0** - Initial release with authentication
  `.trim();
}
function getApiVersion() {
    return process.env.API_VERSION || '0.1.0';
}
exports.swaggerCustomOptions = {
    customSiteTitle: 'SnippetForge API Documentation',
    customfavIcon: '/favicon.ico',
    customCss: `
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info { margin-bottom: 20px; }
    .swagger-ui .info .title { font-size: 2.5em; }
  `,
    swaggerOptions: {
        docExpansion: 'list',
        showRequestDuration: true,
        filter: true,
        tryItOutEnabled: true,
        persistAuthorization: true,
        operationsSorter: 'method',
        tagsSorter: 'alpha',
        deepLinking: true,
        syntaxHighlight: {
            activate: true,
            theme: 'monokai',
        },
    },
};
exports.SWAGGER_PATH = 'api-docs';
exports.SWAGGER_JSON_PATH = 'api-docs-json';
//# sourceMappingURL=swagger.config.js.map