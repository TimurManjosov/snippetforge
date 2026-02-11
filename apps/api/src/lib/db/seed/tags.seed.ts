import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { tags } from '../schema';

/**
 * Development-only seed script for tags.
 * Inserts standard tags idempotently (onConflictDoNothing on slug).
 *
 * Usage:
 *   npx ts-node -r tsconfig-paths/register src/lib/db/seed/tags.seed.ts
 *
 * Requires DATABASE_URL environment variable.
 */

const DEFAULT_TAGS = [
  { name: 'TypeScript', slug: 'typescript' },
  { name: 'JavaScript', slug: 'javascript' },
  { name: 'HTML', slug: 'html' },
  { name: 'CSS', slug: 'css' },
  { name: 'Node.js', slug: 'nodejs' },
];

async function seed() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  const client = postgres(databaseUrl, { max: 1 });
  const db = drizzle(client);

  console.log('🌱 Seeding tags...');

  await db.insert(tags).values(DEFAULT_TAGS).onConflictDoNothing({
    target: tags.slug,
  });

  console.log('✅ Tags seeded successfully');
  await client.end();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
