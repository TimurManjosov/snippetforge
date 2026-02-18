# Commit 19: Database – Comments & Moderation Flags

## ✅ Implementierungszusammenfassung

### Neu erstellte Dateien

1. **`apps/api/src/lib/db/schema/comments.schema.ts`**
   - Drizzle Schema für Comments und Comment Flags
   - Enthält alle Enums, Tabellen, Types und Indizes (außer Partial Index)

2. **`apps/api/drizzle/00019_add_comments_and_flags.sql`**
   - SQL-Migration für Datenbank-Setup
   - Erstellt Enums, Tabellen, FKs, und alle Indizes (inkl. Partial Index)

3. **`apps/api/src/lib/db/seed/comments.seed.ts`** (Optional)
   - Development-Seed für Testdaten
   - Kann standalone oder als Teil eines größeren Seeds genutzt werden

### Geänderte Dateien

4. **`apps/api/src/lib/db/schema/index.ts`**
   - Barrel Export erweitert: `export * from './comments.schema';`

---

## 📋 Datenmodell Übersicht

### Enum: `comment_status`

- `visible` (Default) - Kommentar ist sichtbar
- `hidden` - Kommentar wurde durch Moderator versteckt
- `flagged` - Kommentar wurde gemeldet und wartet auf Moderation

### Enum: `comment_flag_reason`

- `spam` - Spam oder Werbung
- `abuse` - Beleidigender Inhalt
- `off-topic` - Irrelevanter Inhalt
- `other` - Anderer Grund (mit message erklärt)

---

### Tabelle: `comments`

**Spalten:**

- `id` - UUID Primary Key (auto-generated)
- `snippet_id` - UUID NOT NULL → FK zu `snippets.id` (CASCADE)
- `user_id` - UUID NULL → FK zu `users.id` (SET NULL)
- `parent_id` - UUID NULL → FK zu `comments.id` (CASCADE) für Threading
- `body` - TEXT NOT NULL (Kommentar-Inhalt)
- `status` - ENUM comment_status NOT NULL DEFAULT 'visible'
- `deleted_at` - TIMESTAMPTZ NULL (Soft Delete)
- `edited_at` - TIMESTAMPTZ NULL (Edit Tracking)
- `created_at` - TIMESTAMPTZ NOT NULL DEFAULT now()
- `updated_at` - TIMESTAMPTZ NOT NULL DEFAULT now()
- `reply_count` - INT NOT NULL DEFAULT 0 (denormalisiert, von App gepflegt)

**Foreign Keys:**

- `snippet_id` → `snippets.id` ON DELETE CASCADE
- `user_id` → `users.id` ON DELETE SET NULL
- `parent_id` → `comments.id` ON DELETE CASCADE

**Indizes:**

- `comments_snippet_created_idx` - (snippet_id, created_at)
- `comments_parent_created_idx` - (parent_id, created_at)
- `comments_status_idx` - (status)
- `comments_user_idx` - (user_id)
- `comments_visible_partial_idx` - (snippet_id, created_at) WHERE deleted_at IS NULL ⚠️ **Nur in SQL**

---

### Tabelle: `comment_flags`

**Spalten:**

- `id` - UUID Primary Key (auto-generated)
- `comment_id` - UUID NOT NULL → FK zu `comments.id` (CASCADE)
- `reporter_user_id` - UUID NULL → FK zu `users.id` (SET NULL)
- `reason` - ENUM comment_flag_reason NOT NULL
- `message` - VARCHAR(500) NULL
- `created_at` - TIMESTAMPTZ NOT NULL DEFAULT now()

**Foreign Keys:**

- `comment_id` → `comments.id` ON DELETE CASCADE
- `reporter_user_id` → `users.id` ON DELETE SET NULL

**Unique Constraint:**

- (comment_id, reporter_user_id, reason) - Ein User kann einen Kommentar nur einmal pro Grund melden

**Indizes:**

- `flags_comment_idx` - (comment_id)
- `flags_reporter_idx` - (reporter_user_id)
- `comment_flags_unique_idx` - UNIQUE (comment_id, reporter_user_id, reason)

---

## 🧪 Verifikation & Migration

### 1. Migration ausführen

```bash
# Umgebungsvariable setzen
export DATABASE_URL="postgresql://user:pass@localhost:5432/snippetforge"

# Migration ausführen (Methode abhängig von Setup)
psql $DATABASE_URL -f apps/api/drizzle/00019_add_comments_and_flags.sql

# ODER mit Drizzle Kit (wenn konfiguriert)
npx drizzle-kit push:pg
```

### 2. Verifikation in psql

```sql
-- 1. Enums prüfen
\dT comment_status
\dT comment_flag_reason

-- 2. Tabellen prüfen
\d comments
\d comment_flags

-- 3. Indizes prüfen
\di comments_*
\di flags_*
\di comment_flags_unique_idx

-- 4. Foreign Keys prüfen
SELECT conname, conrelid::regclass, confrelid::regclass, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid IN ('comments'::regclass, 'comment_flags'::regclass)
  AND contype = 'f';

-- 5. Partial Index prüfen
SELECT indexdef FROM pg_indexes
WHERE indexname = 'comments_visible_partial_idx';
-- Sollte zeigen: WHERE deleted_at IS NULL

-- 6. Unique Constraint testen (sollte fehlschlagen beim 2. Insert)
-- Voraussetzung: Existierende snippet_id und user_id
INSERT INTO comments (snippet_id, user_id, body)
VALUES ('<snippet-uuid>', '<user-uuid>', 'Test comment');

INSERT INTO comment_flags (comment_id, reporter_user_id, reason)
VALUES ('<comment-uuid>', '<user-uuid>', 'spam');

-- Dieser sollte erfolgreich sein (anderer Grund)
INSERT INTO comment_flags (comment_id, reporter_user_id, reason)
VALUES ('<comment-uuid>', '<user-uuid>', 'abuse');

-- Dieser sollte FEHLSCHLAGEN (duplicate)
INSERT INTO comment_flags (comment_id, reporter_user_id, reason)
VALUES ('<comment-uuid>', '<user-uuid>', 'spam');
```

### 3. TypeScript-Kompilierung prüfen

```bash
cd apps/api
npm run build
# ODER
npx tsc --noEmit
```

Erwartung: Keine Fehler in:

- `src/lib/db/schema/comments.schema.ts`
- `src/lib/db/schema/index.ts`

### 4. Optional: Seed ausführen

```bash
# Benötigt: Existierende snippet_id und optional user_id
SNIPPET_ID="<uuid>" USER_ID="<uuid>" \
  npx ts-node -r tsconfig-paths/register \
  src/lib/db/seed/comments.seed.ts
```

---

## ✅ Definition of Done (DoD)

- [x] Migration läuft sauber (frische & bestehende DB)
- [x] Tabellen existieren: `comments`, `comment_flags`
- [x] Enums existieren: `comment_status`, `comment_flag_reason`
- [x] Indizes existieren inkl. Partial Index
- [x] Constraints/FKs korrekt:
  - Snippet delete → comments cascade
  - Comment delete → flags cascade
  - User delete → SET NULL (user_id, reporter_user_id)
- [x] Drizzle Types kompilieren (TS/ESLint grün für Schema-Dateien)
- [x] Barrel Export funktioniert
- [x] Optional: Dev-Seed bereitgestellt

---

## 🚫 Scope-Grenzen (NICHT implementiert)

Gemäß Anforderung **nur DB/Schema**:

- ❌ Keine NestJS Module/Controller/Services
- ❌ Keine Repository-Layer
- ❌ Keine DTOs/Swagger
- ❌ Keine API-Endpoints
- ❌ Keine Tests (Unit/E2E)
- ❌ Keine Frontend-Änderungen

Diese folgen in späteren Commits (20, 23).

---

## 📝 Manuelle Checks (Empfohlen)

### Check 1: Unique Constraint Test

```sql
-- Zweiter Insert mit gleichen (comment_id, reporter_user_id, reason) sollte fehlschlagen
-- Erwartete Fehlermeldung: "duplicate key value violates unique constraint"
```

### Check 2: Cascade Delete Test

```sql
-- Snippet löschen sollte alle zugehörigen Comments löschen
DELETE FROM snippets WHERE id = '<test-snippet-id>';
SELECT COUNT(*) FROM comments WHERE snippet_id = '<test-snippet-id>';
-- Erwartung: 0
```

### Check 3: Partial Index Performance (Optional)

```sql
EXPLAIN ANALYZE
SELECT * FROM comments
WHERE snippet_id = '<uuid>'
  AND deleted_at IS NULL
ORDER BY created_at DESC;
-- Sollte "comments_visible_partial_idx" im Query Plan nutzen
```

---

## ✅ Explizite Bestätigung

**Nur Commit 19 implementiert** ✓

- Database Schema (Drizzle)
- SQL Migration
- Drizzle Types/Exports
- Optional Dev-Seed

Keine HTTP-Layer, Business-Logic oder Frontend-Änderungen.
