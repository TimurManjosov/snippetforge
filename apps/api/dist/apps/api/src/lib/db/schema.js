"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.users = exports.roleEnum = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.roleEnum = (0, pg_core_1.pgEnum)('role', ['USER', 'ADMIN', 'MODERATOR']);
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    email: (0, pg_core_1.varchar)('email', { length: 255 }).notNull().unique(),
    username: (0, pg_core_1.varchar)('username', { length: 30 }).notNull().unique(),
    passwordHash: (0, pg_core_1.varchar)('password_hash', { length: 60 }).notNull(),
    bio: (0, pg_core_1.text)('bio'),
    avatarUrl: (0, pg_core_1.text)('avatar_url'),
    role: (0, exports.roleEnum)('role').default('USER').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true })
        .defaultNow()
        .notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true })
        .defaultNow()
        .notNull(),
}, (table) => ({
    emailIdx: (0, pg_core_1.index)('users_email_idx').on(table.email),
    usernameIdx: (0, pg_core_1.index)('users_username_idx').on(table.username),
    roleIdx: (0, pg_core_1.index)('users_role_idx').on(table.role),
}));
//# sourceMappingURL=schema.js.map