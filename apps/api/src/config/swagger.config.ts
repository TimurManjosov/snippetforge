// src/config/swagger.config.ts

import { DocumentBuilder, SwaggerCustomOptions } from '@nestjs/swagger';

/**
 * Swagger/OpenAPI Konfiguration
 *
 * WARUM SEPARATE CONFIG?
 * - Single Responsibility: Swagger-Logik isoliert von main.ts
 * - Testbarkeit: Config kann unabhängig getestet werden
 * - Wiederverwendbarkeit: Kann in verschiedenen Umgebungen angepasst werden
 * - Übersichtlichkeit: main.ts bleibt schlank
 *
 * OPENAPI 3.0 STANDARD:
 * - Industrie-Standard für API-Dokumentation
 * - Unterstützt von allen großen API-Tools
 * - Ermöglicht Code-Generierung für Clients
 */

/**
 * Prüft ob Swagger aktiviert werden soll
 *
 * SECURITY:
 * - In Production standardmäßig DEAKTIVIERT
 * - Kann explizit mit ENABLE_SWAGGER=true aktiviert werden
 * - Verhindert versehentliches Exposing der API-Struktur
 *
 * PERFORMANCE:
 * - Swagger verbraucht Memory für Schema-Generierung
 * - In Production nicht nötig → Memory sparen
 */
export function isSwaggerEnabled(): boolean {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const enableSwagger = process.env.ENABLE_SWAGGER;

  // In Development/Test: Immer aktiviert (außer explizit deaktiviert)
  if (nodeEnv !== 'production') {
    return enableSwagger !== 'false';
  }

  // In Production:  Nur wenn explizit aktiviert
  return enableSwagger === 'true';
}

/**
 * Erstellt die Swagger Document Configuration
 *
 * DocumentBuilder Pattern:
 * - Fluent API für saubere Konfiguration
 * - Type-safe durch TypeScript
 * - Alle OpenAPI 3.0 Felder unterstützt
 */
export function createSwaggerConfig() {
  return (
    new DocumentBuilder()
      // ========================================
      // BASIC INFO
      // ========================================
      .setTitle('SnippetForge API')
      .setDescription(createApiDescription())
      .setVersion(getApiVersion())

      // ========================================
      // CONTACT & LICENSE
      // ========================================
      .setContact(
        'SnippetForge Team',
        'https://github.com/TimurManjosov/snippetforge',
        'support@snippetforge.dev',
      )
      .setLicense('MIT', 'https://opensource.org/licenses/MIT')

      // ========================================
      // SERVERS
      // ========================================
      .addServer('http://localhost:3001', 'Development Server')
      // Production Server (später hinzufügen)
      // .addServer('https://api.snippetforge.dev', 'Production Server')

      // ========================================
      // AUTHENTICATION
      // ========================================
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'Authorization',
          description: 'Enter your JWT access token',
          in: 'header',
        },
        'JWT-Auth', // Security scheme name (referenziert in @ApiBearerAuth())
      )

      // ========================================
      // TAGS (Gruppierung der Endpoints)
      // ========================================
      .addTag('Health', 'Health check and status endpoints')
      .addTag('Auth', 'Authentication endpoints (register, login, profile)')
      // Zukünftige Tags:
      // .addTag('Users', 'User management endpoints')
      // .addTag('Snippets', 'Code snippet CRUD operations')

      .build()
  );
}

/**
 * Erstellt die API-Beschreibung (Markdown unterstützt)
 *
 * WARUM ausführliche Beschreibung?
 * - Onboarding:  Neue Entwickler verstehen API schnell
 * - Self-Documentation: API erklärt sich selbst
 * - Konsistenz: Alle Infos an einem Ort
 */
function createApiDescription(): string {
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

/**
 * Holt API Version aus package.json oder Environment
 */
function getApiVersion(): string {
  return process.env.API_VERSION || '0.1.0';
}

/**
 * Swagger UI Custom Options
 *
 * Konfiguriert das Aussehen und Verhalten der Swagger UI
 */
export const swaggerCustomOptions: SwaggerCustomOptions = {
  // ========================================
  // UI CUSTOMIZATION
  // ========================================
  customSiteTitle: 'SnippetForge API Documentation',
  customfavIcon: '/favicon.ico',

  // Custom CSS (optional)
  customCss: `
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info { margin-bottom: 20px; }
    .swagger-ui .info .title { font-size: 2.5em; }
  `,

  // ========================================
  // SWAGGER UI OPTIONS
  // ========================================
  swaggerOptions: {
    // Endpoints aufgeklappt anzeigen
    docExpansion: 'list',

    // Request-Dauer anzeigen
    showRequestDuration: true,

    // Filter/Suchfeld anzeigen
    filter: true,

    // "Try it out" standardmäßig aktiviert
    tryItOutEnabled: true,

    // Authorization Token persistent speichern
    persistAuthorization: true,

    // Sortierung der Endpoints
    operationsSorter: 'method',

    // Sortierung der Tags
    tagsSorter: 'alpha',

    // Deep Linking für URLs
    deepLinking: true,

    // Syntax Highlighting
    syntaxHighlight: {
      activate: true,
      theme: 'monokai',
    },
  },
};

/**
 * Swagger Endpoint Pfad
 */
export const SWAGGER_PATH = 'api-docs';

/**
 * OpenAPI JSON Endpoint Pfad
 */
export const SWAGGER_JSON_PATH = 'api-docs-json';
