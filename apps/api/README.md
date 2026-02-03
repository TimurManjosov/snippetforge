# SnippetForge API

> Backend API for SnippetForge built with NestJS

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11.0-red)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)](https://www.postgresql.org/)
[![Drizzle](https://img.shields.io/badge/Drizzle-ORM-green)](https://orm.drizzle.team/)
[![Jest](https://img.shields.io/badge/Jest-Testing-red)](https://jestjs.io/)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Endpoints](#api-endpoints)
- [Example Requests](#example-requests)
- [Authentication](#authentication)
- [Database](#database)
- [Testing](#testing)
- [Deployment](#deployment)
- [Error Handling](#error-handling)
- [Development Guidelines](#development-guidelines)
- [Links](#links)

---

## 🎯 Overview

The SnippetForge API is a RESTful backend service built with NestJS that provides:

- **User Authentication:** JWT-based auth with secure password hashing
- **Role-Based Access Control:** USER, ADMIN, MODERATOR roles
- **Type Safety:** End-to-end TypeScript with Zod validation
- **Database:** PostgreSQL with Drizzle ORM for type-safe queries
- **Testing:** Comprehensive unit and E2E tests with 90%+ coverage
- **Documentation:** Interactive Swagger/OpenAPI documentation

### Architecture

The API follows a modular architecture:
- **Modules:** Feature-based organization (auth, users)
- **Shared:** Common utilities (filters, pipes, constants)
- **Lib:** Low-level services (database)
- **Config:** Environment configuration

---

## 🛠 Tech Stack

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Framework** | NestJS | 11.x | Backend framework |
| **Language** | TypeScript | 5.7 | Type-safe development |
| **Database** | PostgreSQL | 16.x | Relational database |
| **ORM** | Drizzle ORM | 0.45+ | Type-safe database queries |
| **Auth** | Passport.js | 0.7+ | Authentication middleware |
| **JWT** | @nestjs/jwt | 11.x | JWT token handling |
| **Validation** | Zod | 4.3+ | Schema validation |
| **Password** | bcryptjs | 3.0+ | Password hashing |
| **Testing** | Jest | 30.x | Unit & E2E testing |
| **API Docs** | Swagger | 11.x | OpenAPI documentation |

---

## 📂 Project Structure

```
apps/api/
├── src/
│   ├── modules/                    # Feature modules
│   │   ├── auth/                   # Authentication module
│   │   │   ├── auth.controller.ts  # Auth endpoints
│   │   │   ├── auth.service.ts     # Auth business logic
│   │   │   ├── auth.module.ts      # Module definition
│   │   │   ├── decorators/         # Custom decorators
│   │   │   ├── dto/                # Data transfer objects
│   │   │   ├── guards/             # Auth guards
│   │   │   └── strategies/         # Passport strategies
│   │   └── users/                  # User management module
│   │       ├── users.service.ts    # User CRUD operations
│   │       └── users.module.ts     # Module definition
│   ├── shared/                     # Shared utilities
│   │   ├── filters/                # Exception filters
│   │   │   └── http-exception.filter.ts
│   │   ├── pipes/                  # Validation pipes
│   │   │   └── zod-validation.pipe.ts
│   │   ├── constants/              # Error codes & constants
│   │   ├── types/                  # Shared types
│   │   └── swagger/                # Swagger schemas
│   ├── lib/                        # Low-level services
│   │   └── db/                     # Database
│   │       ├── schema.ts           # Drizzle schema
│   │       └── migrations/         # DB migrations
│   ├── config/                     # Configuration
│   │   ├── database.config.ts      # Database config
│   │   └── jwt.config.ts           # JWT config
│   ├── app.module.ts               # Root module
│   ├── app.controller.ts           # Health check endpoint
│   └── main.ts                     # Application entry point
├── test/                           # Tests
│   ├── unit/                       # Unit tests
│   └── e2e/                        # End-to-end tests
├── docs/                           # Documentation
│   └── adr/                        # Architecture Decision Records
├── drizzle.config.ts               # Drizzle ORM config
├── jest.config.ts                  # Jest configuration
├── .env.example                    # Environment variables template
└── README.md                       # This file
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js:** 20.x or higher
- **npm:** 10.x or higher
- **Docker:** 24.x or higher (for PostgreSQL)
- **PostgreSQL:** 16.x (or use Docker)

### Installation

1. **Navigate to API directory**
   ```bash
   cd apps/api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start PostgreSQL (via Docker)**
   ```bash
   # From root directory
   docker compose up -d
   ```

5. **Run database migrations**
   ```bash
   npx drizzle-kit push
   ```

6. **Start the development server**
   ```bash
   npm run start:dev
   ```

7. **Verify the API is running**
   ```bash
   curl http://localhost:3001/api/health
   ```

   Expected response:
   ```json
   {
     "status": "ok",
     "timestamp": "2026-01-17T...",
     "service": "snippetforge-api",
     "version": "0.1.0"
   }
   ```

---

## 🔌 API Endpoints

### Health

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/health` | Health check endpoint | No |

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user account | No |
| POST | `/api/auth/login` | Login with email and password | No |
| GET | `/api/auth/me` | Get current user profile | Yes |

### Snippets

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/snippets` | List public snippet previews | No |
| POST | `/api/snippets` | Create a new snippet | Yes |
| GET | `/api/snippets/me` | List current user snippets | Yes |
| GET | `/api/snippets/me/stats` | Get current user snippet statistics | Yes |
| GET | `/api/snippets/language/:language` | List snippets by language | No |
| GET | `/api/snippets/:id` | Get snippet by id | Yes |
| PUT | `/api/snippets/:id` | Update a snippet | Yes |
| PATCH | `/api/snippets/:id/toggle-public` | Toggle snippet visibility | Yes |
| DELETE | `/api/snippets/:id` | Delete a snippet | Yes |

---

## 📝 Example Requests

### Register a New User

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "username": "newuser",
    "password": "SecurePass123"
  }'
```

**Response (201 Created):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "newuser@example.com",
    "username": "newuser",
    "bio": null,
    "avatarUrl": null,
    "role": "USER",
    "createdAt": "2026-01-17T10:30:00.000Z",
    "updatedAt": "2026-01-17T10:30:00.000Z"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 900
  }
}
```

### Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "SecurePass123"
  }'
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "newuser@example.com",
    "username": "newuser",
    "bio": null,
    "avatarUrl": null,
    "role": "USER",
    "createdAt": "2026-01-17T10:30:00.000Z",
    "updatedAt": "2026-01-17T10:30:00.000Z"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 900
  }
}
```

### Get Current User

```bash
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "newuser@example.com",
  "username": "newuser",
  "bio": null,
  "avatarUrl": null,
  "role": "USER",
  "createdAt": "2026-01-17T10:30:00.000Z",
  "updatedAt": "2026-01-17T10:30:00.000Z"
}
```

---

## 🔐 Authentication

### JWT Token Authentication

The API uses JWT (JSON Web Tokens) for authentication:

- **Token Type:** Bearer tokens
- **Algorithm:** HS256 (HMAC with SHA-256)
- **Default Expiration:** 15 minutes (configurable via `JWT_EXPIRES_IN`)
- **Header Format:** `Authorization: Bearer <token>`

### How to Use

1. **Obtain a token** by registering or logging in
2. **Include the token** in the Authorization header for protected endpoints
3. **Refresh the token** before expiration (future feature)

### User Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| **USER** | Default role for registered users | Basic access to own resources |
| **MODERATOR** | Content moderation role | Moderate content, manage snippets |
| **ADMIN** | System administrator | Full access to all resources |

### Protected Endpoints

Endpoints requiring authentication will return `401 Unauthorized` without a valid token:

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "errorCode": "AUTH_TOKEN_INVALID",
  "timestamp": "2026-01-17T10:30:00.000Z"
}
```

---

## 🗄 Database

### Schema

The database uses PostgreSQL 16 with the following schema:

```sql
-- Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  username VARCHAR(30) NOT NULL UNIQUE,
  password_hash VARCHAR(60) NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  role role DEFAULT 'USER' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Role Enum
CREATE TYPE role AS ENUM ('USER', 'ADMIN', 'MODERATOR');

-- Indexes
CREATE INDEX users_email_idx ON users(email);
CREATE INDEX users_username_idx ON users(username);
CREATE INDEX users_role_idx ON users(role);
```

### Drizzle ORM

The API uses Drizzle ORM for type-safe database queries:

```typescript
// Example: Find user by email
const user = await db
  .select()
  .from(users)
  .where(eq(users.email, email))
  .limit(1);
```

### Migrations

**Run migrations:**
```bash
npx drizzle-kit push
```

**Generate migration files:**
```bash
npx drizzle-kit generate
```

**Open Drizzle Studio (GUI):**
```bash
npx drizzle-kit studio
# Opens at http://localhost:4983
```

---

## 🧪 Testing

### Run Tests

```bash
# All tests
npm run test

# Unit tests only
npm run test:unit

# E2E tests only
npm run test:e2e

# Watch mode
npm run test:watch

# Coverage report
npm run test:cov

# Debug tests
npm run test:debug
```

### Coverage Requirements

All code must maintain **≥90% coverage** for:
- **Statements:** 90%+
- **Branches:** 90%+
- **Functions:** 90%+
- **Lines:** 90%+

### Test Structure

```
test/
├── unit/                           # Unit tests
│   ├── auth/
│   │   ├── auth.service.spec.ts
│   │   └── auth.controller.spec.ts
│   └── users/
│       └── users.service.spec.ts
└── e2e/                            # End-to-end tests
    └── auth.e2e-spec.ts
```

### Writing Tests

**Unit Test Example:**
```typescript
describe('AuthService', () => {
  it('should register a new user', async () => {
    const dto = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'Test1234'
    };
    const result = await authService.register(dto);
    expect(result.user.email).toBe(dto.email);
    expect(result.tokens.accessToken).toBeDefined();
  });
});
```

---

## 🚀 Deployment

### Environment Variables

Required environment variables (see `.env.example`):

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment | `production` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | `your-secret-key` |
| `JWT_EXPIRES_IN` | Token expiration | `15m` |
| `CORS_ORIGIN` | Allowed CORS origin | `https://app.example.com` |

### Build

```bash
npm run build
```

### Start Production Server

```bash
npm run start:prod
```

### Docker Deployment

**TBD** - Docker deployment guide will be added in future sprints.

---

## ⚠️ Error Handling

### Error Response Format

All errors follow a consistent format:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errorCode": "VALIDATION_ERROR",
  "timestamp": "2026-01-17T10:30:00.000Z",
  "path": "/api/auth/register",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTH_TOKEN_MISSING` | 401 | Token missing in request |
| `AUTH_TOKEN_INVALID` | 401 | Token is invalid (wrong format or signature) |
| `AUTH_TOKEN_EXPIRED` | 401 | Token has expired |
| `AUTH_INVALID_CREDENTIALS` | 401 | Invalid email or password |
| `AUTH_INSUFFICIENT_ROLE` | 403 | User does not have required role |
| `AUTH_ACCESS_DENIED` | 403 | User does not have access to resource |
| `VALIDATION_ERROR` | 400 | General validation error |
| `VALIDATION_REQUIRED_FIELD` | 400 | Required field is missing |
| `VALIDATION_INVALID_FORMAT` | 400 | Invalid format (email, UUID, etc.) |
| `USER_NOT_FOUND` | 404 | User not found |
| `USER_EMAIL_EXISTS` | 409 | Email already registered |
| `USER_USERNAME_EXISTS` | 409 | Username already taken |
| `RESOURCE_NOT_FOUND` | 404 | Resource not found |
| `RESOURCE_ALREADY_EXISTS` | 409 | Resource already exists |
| `SERVER_ERROR` | 500 | Internal server error |
| `SERVER_DATABASE_ERROR` | 500 | Database error |

### Common Error Scenarios

**Validation Error (400):**
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errorCode": "VALIDATION_ERROR",
  "errors": [
    {
      "field": "password",
      "message": "Password must be at least 8 characters"
    }
  ]
}
```

**Unauthorized (401):**
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "errorCode": "AUTH_TOKEN_INVALID"
}
```

**Conflict (409):**
```json
{
  "statusCode": 409,
  "message": "Email already exists",
  "errorCode": "USER_EMAIL_EXISTS"
}
```

---

## 📖 Development Guidelines

### Code Style

- **TypeScript:** Strict mode enabled
- **Formatting:** Prettier with 2-space indentation
- **Linting:** ESLint with NestJS recommended rules
- **Naming Conventions:**
  - Classes: PascalCase (`UserService`)
  - Files: kebab-case (`user.service.ts`)
  - Variables: camelCase (`userName`)
  - Constants: UPPER_SNAKE_CASE (`JWT_SECRET`)

### Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat:     New feature
fix:      Bug fix
docs:     Documentation changes
style:    Code style changes (formatting)
refactor: Code refactoring
test:     Test additions/changes
chore:    Maintenance tasks
```

**Examples:**
```bash
git commit -m "feat: add user profile update endpoint"
git commit -m "fix: resolve JWT token expiration issue"
git commit -m "docs: update API endpoint documentation"
```

### Pull Request Checklist

- [ ] Code follows style guidelines
- [ ] Tests added/updated and passing
- [ ] Coverage remains ≥90%
- [ ] Documentation updated
- [ ] No console.log statements
- [ ] Environment variables documented
- [ ] Commit messages follow convention

---

## 🔗 Links

- **Swagger Documentation:** http://localhost:3001/api-docs
- **Drizzle Studio:** http://localhost:4983 (run `npx drizzle-kit studio`)
- **Repository:** https://github.com/TimurManjosov/snippetforge
- **NestJS Documentation:** https://docs.nestjs.com

---

**Built with ❤️ by Timur Manjosov**
