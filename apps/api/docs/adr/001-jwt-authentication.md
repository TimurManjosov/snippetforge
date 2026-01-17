# ADR 001: JWT-based Authentication

**Status:** ✅ Accepted  
**Date:** 2026-01-10  
**Decision Makers:** Timur Manjosov  
**Tags:** #authentication #security #architecture

---

## Context

SnippetForge requires a secure authentication mechanism to:
- **Verify user identity** across API requests
- **Protect user data** and private snippets
- **Enable role-based access control** (USER, ADMIN, MODERATOR)
- **Support stateless architecture** for horizontal scaling
- **Provide seamless user experience** across sessions

The authentication system must be:
- ✅ **Secure** - Protect against common vulnerabilities
- ✅ **Scalable** - Support distributed systems without shared state
- ✅ **Simple** - Easy to implement and maintain
- ✅ **Standard** - Use well-established protocols
- ✅ **Performant** - Minimal overhead per request

We need to choose an authentication strategy for Sprint 0 that balances security, simplicity, and future extensibility.

---

## Decision

**We will use JWT (JSON Web Tokens) for authentication.**

Specifically:
- **Algorithm:** HS256 (HMAC with SHA-256)
- **Token Type:** Bearer tokens in HTTP Authorization header
- **Storage:** Client-side (localStorage or httpOnly cookies)
- **Expiration:** Short-lived tokens (15 minutes default)
- **Library:** `@nestjs/jwt` + `passport-jwt`

---

## Rationale

### Comparison of Authentication Methods

| Criteria | JWT | Session Cookies | OAuth 2.0 | API Keys |
|----------|-----|----------------|-----------|----------|
| **Stateless** | ✅ Yes | ❌ No (server state) | ✅ Yes | ✅ Yes |
| **Scalability** | ✅ Excellent | ⚠️ Requires shared store | ✅ Excellent | ✅ Good |
| **Security** | ✅ Good (with best practices) | ✅ Good | ✅ Excellent | ⚠️ Basic |
| **Complexity** | ✅ Low | ✅ Low | ❌ High | ✅ Very Low |
| **Standard** | ✅ RFC 7519 | ✅ HTTP Standard | ✅ RFC 6749 | ❌ Custom |
| **Mobile Support** | ✅ Excellent | ⚠️ Limited | ✅ Excellent | ✅ Good |

### Technical Reasons

1. **Stateless Architecture**
   - JWT tokens are self-contained (contain all user info)
   - No server-side session storage required
   - Perfect for microservices and horizontal scaling
   - Each API instance can validate tokens independently

2. **Performance**
   - No database lookup on every request (user data in token)
   - Fast cryptographic validation (HMAC-SHA256)
   - Minimal memory footprint
   - Caching-friendly

3. **Simplicity**
   - Well-supported in NestJS ecosystem (`@nestjs/jwt`, `passport-jwt`)
   - Standard Authorization header format: `Bearer <token>`
   - Easy to test and debug
   - Clear separation of concerns

4. **Security**
   - Industry-standard JWT (RFC 7519)
   - Strong HMAC-SHA256 signing prevents tampering
   - Short expiration times limit exposure
   - Can be revoked via blacklist (future enhancement)

5. **Developer Experience**
   - Simple client-side implementation
   - Works seamlessly with REST APIs
   - Compatible with all HTTP clients
   - Great tooling and debugging support

---

## Implementation Details

### Token Structure

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.    ← Header
eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6Ikpv...  ← Payload
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c   ← Signature
```

**Header:**
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

**Payload (Claims):**
```json
{
  "sub": "user-uuid",              // Subject (user ID)
  "email": "user@example.com",     // User email
  "role": "USER",                  // User role
  "iat": 1705747200,               // Issued at (Unix timestamp)
  "exp": 1705748100                // Expires at (Unix timestamp)
}
```

**Signature:**
```
HMACSHA256(
  base64UrlEncode(header) + "." +
  base64UrlEncode(payload),
  JWT_SECRET
)
```

### Security Measures

| Measure | Implementation | Purpose |
|---------|---------------|---------|
| **Short expiration** | 15 minutes default | Limit token lifetime |
| **Strong secret** | Min 32 characters | Prevent brute-force attacks |
| **HTTPS only** | Enforce in production | Prevent token interception |
| **Password hashing** | bcrypt (cost factor 10) | Secure password storage |
| **Input validation** | Zod schemas | Prevent injection attacks |
| **CORS policy** | Restricted origins | Prevent unauthorized access |

### Token Lifecycle

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       │ 1. POST /auth/register or /auth/login
       │    { email, password }
       ▼
┌─────────────────┐
│   API Server    │
│  ┌───────────┐  │
│  │ Validate  │  │ 2. Check credentials
│  │  Input    │  │
│  └─────┬─────┘  │
│        │        │
│  ┌─────▼─────┐  │
│  │  Verify   │  │ 3. Hash password & compare
│  │ Password  │  │    OR Create new user
│  └─────┬─────┘  │
│        │        │
│  ┌─────▼─────┐  │
│  │ Generate  │  │ 4. Sign JWT with secret
│  │    JWT    │  │
│  └─────┬─────┘  │
│        │        │
└────────┼────────┘
         │
         │ 5. Return { user, tokens: { accessToken } }
         ▼
    ┌─────────────┐
    │   Client    │
    │ Store token │
    └──────┬──────┘
           │
           │ 6. Future requests:
           │    Authorization: Bearer <token>
           ▼
    ┌─────────────────┐
    │   API Server    │
    │  ┌───────────┐  │
    │  │  Verify   │  │ 7. Validate signature
    │  │   JWT     │  │    Check expiration
    │  └─────┬─────┘  │    Extract user data
    │        │        │
    │  ┌─────▼─────┐  │
    │  │  Process  │  │ 8. Execute request
    │  │  Request  │  │
    │  └───────────┘  │
    └─────────────────┘
```

---

## Alternatives Considered

### 1. Session-Based Authentication

**Pros:**
- Familiar pattern for traditional web apps
- Server-controlled revocation
- Smaller token size

**Cons:**
- ❌ Requires server-side session store (Redis, database)
- ❌ Harder to scale horizontally
- ❌ State synchronization issues in distributed systems
- ❌ Not ideal for mobile apps

**Verdict:** Rejected due to scalability concerns and added infrastructure complexity.

### 2. OAuth 2.0 / OpenID Connect

**Pros:**
- Industry standard for third-party auth
- Excellent for social login (Google, GitHub)
- Delegation and scoping built-in

**Cons:**
- ❌ Overkill for Sprint 0 (internal auth only)
- ❌ Complex implementation (multiple flows)
- ❌ Requires external identity provider or complex setup
- ❌ Slower development time

**Verdict:** Rejected for Sprint 0, but may be added in Sprint 2+ for social login.

### 3. Refresh Tokens (Long-Lived Tokens)

**Pros:**
- Better UX (no frequent re-login)
- Can revoke refresh tokens

**Cons:**
- ❌ More complex implementation
- ❌ Requires token storage/blacklist
- ❌ Overkill for Sprint 0

**Verdict:** Deferred to Sprint 1-2. Short-lived access tokens are sufficient for MVP.

---

## Consequences

### ✅ Positive

1. **Fast Development:** JWT support in NestJS is mature and well-documented
2. **Scalability:** Stateless architecture enables easy horizontal scaling
3. **Performance:** No database lookups for authentication on every request
4. **Flexibility:** Easy to add additional claims (roles, permissions) later
5. **Standard:** Well-understood by developers, great tooling

### ⚠️ Negative

1. **Token Size:** JWT tokens are larger than session IDs (~200-500 bytes)
2. **Revocation Difficulty:** Can't revoke tokens before expiration without blacklist
3. **Secret Management:** JWT secret must be kept secure and rotated periodically

### 🛡️ Mitigations

| Risk | Mitigation |
|------|-----------|
| **Token theft** | Short expiration (15m), HTTPS only, httpOnly cookies (future) |
| **Secret compromise** | Use env variables, rotate secret periodically, min 32 chars |
| **Token revocation** | Add blacklist in Sprint 1 if needed (Redis-based) |
| **Large token size** | Use minimal payload, compress if needed |

---

## Future Improvements

### Sprint 1-2
- [ ] **Refresh Tokens** - Long-lived tokens for better UX
- [ ] **Token Revocation** - Redis-based blacklist for logout
- [ ] **httpOnly Cookies** - Store tokens in secure cookies (XSS protection)
- [ ] **Rate Limiting** - Prevent brute-force attacks
- [ ] **Email Verification** - Confirm email addresses

### Sprint 3+
- [ ] **OAuth 2.0 Integration** - Social login (Google, GitHub)
- [ ] **2FA/MFA** - Two-factor authentication
- [ ] **JWT Key Rotation** - Automatic secret rotation
- [ ] **Device Management** - Track and revoke specific devices
- [ ] **Audit Logging** - Log all authentication events

---

## Monitoring & Metrics

### Success Criteria
- ✅ Zero authentication bypasses
- ✅ <50ms token validation time
- ✅ <1% authentication failure rate (excluding invalid credentials)
- ✅ 99.9% availability for auth endpoints

### Metrics to Track
- `auth_login_success_total` - Successful logins
- `auth_login_failure_total` - Failed login attempts
- `auth_register_total` - New user registrations
- `auth_token_validation_duration_ms` - Token validation time
- `auth_invalid_token_total` - Invalid/expired token attempts

---

## References

- [RFC 7519: JSON Web Token (JWT)](https://datatracker.ietf.org/doc/html/rfc7519)
- [OWASP JWT Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [NestJS Authentication Documentation](https://docs.nestjs.com/security/authentication)
- [Passport.js JWT Strategy](http://www.passportjs.org/packages/passport-jwt/)

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-01-10 | Initial decision: JWT authentication | Timur Manjosov |
| 2026-01-10 | Implemented HS256 with 15m expiration | Timur Manjosov |

---

**Decision Status:** ✅ **ACCEPTED**

This ADR will be reviewed after Sprint 1 to evaluate the need for refresh tokens and revocation mechanisms.
