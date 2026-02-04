# SnippetForge

> Full-stack code snippet sharing platform built with NestJS and Next.js

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11.0-red)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-16.1.1-black)](https://nextjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Development](#development)
- [Testing](#testing)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

SnippetForge is a modern code snippet sharing platform that allows developers to:
- Share and discover code snippets
- Organize snippets with tags and categories
- Collaborate with other developers
- Learn from real-world code examples

**Current Status:** ✅ Sprint 0 Complete (Authentication & Infrastructure)

---

## ✨ Features

### ✅ Implemented (Sprint 0)
- **User Authentication**
  - JWT-based authentication
  - Secure password hashing (bcrypt)
  - Role-based access control (USER, ADMIN, MODERATOR)
- **API Infrastructure**
  - RESTful API with NestJS
  - Global error handling
  - Request validation with Zod
  - Swagger/OpenAPI documentation
- **Database**
  - PostgreSQL with Drizzle ORM
  - Type-safe database queries
  - Automated migrations
- **Testing**
  - Unit tests (90%+ coverage)
  - E2E tests for auth flow
  - Jest configuration
- **Development**
  - Monorepo setup with npm workspaces
  - Hot reload for backend and frontend
  - Docker Compose for local development

### 🚧 Planned (Future Sprints)
- Snippet CRUD operations
- Syntax highlighting
- Search and filtering
- User profiles
- Comments and reactions
- Collections/Favorites

---

## 🛠 Tech Stack

### Backend
- **Framework:** NestJS 11
- **Language:** TypeScript 5.7
- **Database:** PostgreSQL 16
- **ORM:** Drizzle ORM
- **Authentication:** Passport.js + JWT
- **Validation:** Zod
- **Testing:** Jest + Supertest
- **Documentation:** Swagger/OpenAPI

### Frontend
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript 5.7
- **Styling:** Tailwind CSS
- **State Management:** TBD
- **Testing:** TBD

### DevOps
- **Containerization:** Docker + Docker Compose
- **Package Manager:** npm (workspaces)
- **Linting:** ESLint + Prettier
- **CI/CD:** TBD

---

## 📂 Project Structure

```
snippetforge/
├── apps/
│   ├── api/                    # NestJS Backend
│   │   ├── src/
│   │   │   ├── modules/        # Feature modules
│   │   │   ├── shared/         # Shared utilities
│   │   │   └── lib/            # Database & low-level
│   │   ├── test/               # Tests (unit + e2e)
│   │   └── docs/               # API documentation
│   └── web/                    # Next.js Frontend
│       ├── src/
│       │   ├── app/            # App Router pages
│       │   └── components/     # React components
│       └── public/             # Static assets
├── packages/
│   └── shared/                 # Shared code (types, schemas)
│       └── src/
│           └── schemas/        # Zod schemas
├── docker-compose.yml          # Local development services
├── package.json                # Monorepo root
└── README.md                   # This file
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js:** 20.x or higher
- **npm:** 10.x or higher
- **Docker:** 24.x or higher (for PostgreSQL)
- **Git:** 2.x or higher

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/TimurManjosov/snippetforge.git
   cd snippetforge
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start PostgreSQL**
   ```bash
   docker compose up -d
   ```

4. **Setup environment variables**
   ```bash
   # Backend
   cp apps/api/.env.example apps/api/.env

   # Frontend
   cp apps/web/.env.example apps/web/.env
   ```

5. **Run database migrations**
   ```bash
   cd apps/api
   npx drizzle-kit push
   ```

6. **Start development servers**
   ```bash
   # From root directory
   npm run dev
   ```

   The application will be available at:
   - **Backend:** http://localhost:3001
   - **Frontend:** http://localhost:3000
   - **API Docs:** http://localhost:3001/api-docs

---

## 💻 Development

### Available Scripts

**Root (runs both apps):**
```bash
npm run dev          # Start backend + frontend
npm run build        # Build all apps
npm run test         # Run all tests
npm run clean        # Clean node_modules
```

**Backend only:**
```bash
cd apps/api
npm run start:dev    # Development mode
npm run start:debug  # Debug mode
npm run build        # Production build
npm run test         # All tests
npm run test:unit    # Unit tests only
npm run test:e2e     # E2E tests only
npm run test:cov     # Coverage report
```

**Frontend only:**
```bash
cd apps/web
npm run dev          # Development mode
npm run build        # Production build
npm run start        # Production server
```

### Database Management

**Run migrations:**
```bash
cd apps/api
npx drizzle-kit push
```

**Generate migration:**
```bash
npx drizzle-kit generate
```

**Drizzle Studio (DB GUI):**
```bash
npx drizzle-kit studio
# Opens at http://localhost:4983
```

**Reset database:**
```bash
docker compose down -v
docker compose up -d
npx drizzle-kit push
```

### Code Quality

**Type checking:**
```bash
npm run type-check
```

**Linting:**
```bash
npm run lint
```

---

## 🧪 Testing

### Run Tests

```bash
# All tests
npm test

# Unit tests
npm run test:unit

# E2E tests (requires running database)
npm run test:e2e

# Coverage report
npm run test:cov
```

### Manual Verification (Frontend Auth Layer)

If frontend tests are not set up yet, verify the auth layer manually:

1. Start backend + frontend:
   ```bash
   npm run dev
   ```
2. Ensure `NEXT_PUBLIC_API_URL` points to the API base (e.g. `http://localhost:3001/api`).
3. In the browser console, call `window.localStorage.getItem('SF_TOKEN')` after a login/register flow to confirm token persistence.
4. Trigger `AuthProvider` hydration by refreshing the page and confirm `/auth/me` is called once when a token exists.
5. If `/auth/me` returns 401, confirm the token is cleared from memory + `localStorage`.

### Coverage Requirements

All code must maintain **≥90% coverage** for:
- Statements
- Branches
- Functions
- Lines

---

## 📚 Documentation

### API Documentation

Interactive API documentation is available via Swagger UI:
- **Local:** http://localhost:3001/api-docs
- **Production:** TBD

### Architecture Decision Records

See `apps/api/docs/adr/` for architectural decisions:
- [001 - JWT Authentication](apps/api/docs/adr/001-jwt-authentication.md)

### Guides

- [Backend Setup](apps/api/README.md)
- [Frontend Setup](apps/web/README.md) (TBD)

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

### Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat:     New feature
fix:      Bug fix
docs:     Documentation changes
style:    Code style changes (formatting)
refactor: Code refactoring
test:     Test additions/changes
chore:    Maintenance tasks
```

---

## 📄 License

This project is intended to be licensed under the MIT License. Full licensing details will be added once the LICENSE file is included in the repository.

---

## 👨‍💻 Author

**Timur Manjosov**
- GitHub: [@TimurManjosov](https://github.com/TimurManjosov)

---

## 🙏 Acknowledgments

- NestJS team for the amazing framework
- Drizzle team for the excellent ORM
- Vercel team for Next.js

---

**Built with ❤️ by Timur Manjosov**
