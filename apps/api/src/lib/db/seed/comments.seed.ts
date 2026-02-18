import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../schema';
import { commentFlags, comments } from '../schema';

/**
 * Development-only seed function for comments and comment flags.
 *
 * This is a helper function meant to be called from a main seed script
 * after snippets and users have been seeded.
 *
 * @param db - Drizzle database instance
 * @param snippetId - UUID of an existing snippet to add comments to
 * @param userId - Optional UUID of an existing user (if null, creates anonymous comments)
 * @returns Array of created comment IDs
 *
 * Example usage in main seed:
 * ```typescript
 * const snippetIds = await seedSnippets(db);
 * const userIds = await seedUsers(db);
 * await seedComments(db, snippetIds[0], userIds[0]);
 * ```
 *
 * IMPORTANT:
 * - This should NOT run in production
 * - Requires existing snippet_id and optionally user_id
 * - Creates sample threaded comments with various statuses
 * - Creates sample flags for moderation testing
 */
export async function seedComments(
  db: PostgresJsDatabase<typeof schema>,
  snippetId: string,
  userId?: string,
): Promise<string[]> {
  console.log('🌱 Seeding comments for snippet:', snippetId);

  // Insert top-level comments
  const [comment1] = await db
    .insert(comments)
    .values({
      snippetId,
      userId: userId || null,
      parentId: null,
      body: 'Great snippet! This helped me solve a similar problem.',
      status: 'visible',
    })
    .returning();

  const [comment2] = await db
    .insert(comments)
    .values({
      snippetId,
      userId: userId || null,
      parentId: null,
      body: 'Could you explain line 15 a bit more?',
      status: 'visible',
    })
    .returning();

  const [comment3] = await db
    .insert(comments)
    .values({
      snippetId,
      userId: null, // Anonymous comment
      parentId: null,
      body: 'This is a test comment that will be flagged.',
      status: 'flagged',
    })
    .returning();

  // Insert threaded replies (child comments)
  const [reply1] = await db
    .insert(comments)
    .values({
      snippetId,
      userId: userId || null,
      parentId: comment2.id,
      body: 'Sure! Line 15 does XYZ. Hope that helps!',
      status: 'visible',
    })
    .returning();

  const [reply2] = await db
    .insert(comments)
    .values({
      snippetId,
      userId: null,
      parentId: comment2.id,
      body: 'I had the same question, thanks for asking!',
      status: 'visible',
    })
    .returning();

  // Insert a soft-deleted comment (preserves thread structure)
  await db.insert(comments).values({
    snippetId,
    userId: userId || null,
    parentId: null,
    body: '[This comment was deleted]',
    status: 'visible',
    deletedAt: new Date(),
  });

  // Insert an edited comment
  const editedAt = new Date();
  editedAt.setMinutes(editedAt.getMinutes() - 30); // Edited 30 minutes ago

  await db.insert(comments).values({
    snippetId,
    userId: userId || null,
    parentId: null,
    body: 'This is an edited comment with updated content.',
    status: 'visible',
    editedAt,
  });

  console.log(
    '✅ Comments seeded (7 total: 4 top-level, 2 replies, 1 deleted)',
  );

  // Insert sample flags for moderation testing
  if (userId) {
    console.log('🌱 Seeding comment flags...');

    await db.insert(commentFlags).values({
      commentId: comment3.id,
      reporterUserId: userId,
      reason: 'spam',
      message: 'This looks like spam advertising.',
    });

    await db.insert(commentFlags).values({
      commentId: comment3.id,
      reporterUserId: null, // Anonymous reporter
      reason: 'off-topic',
      message: 'Not relevant to the snippet.',
    });

    console.log('✅ Comment flags seeded (2 flags on comment 3)');
  }

  return [comment1.id, comment2.id, comment3.id, reply1.id, reply2.id];
}

/**
 * Standalone seed script for testing.
 * Run with: npx ts-node -r tsconfig-paths/register src/lib/db/seed/comments.seed.ts
 *
 * Requires:
 * - DATABASE_URL environment variable
 * - SNIPPET_ID environment variable (existing snippet UUID)
 * - USER_ID environment variable (optional, for non-anonymous comments)
 */
async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  const snippetId = process.env.SNIPPET_ID;
  const userId = process.env.USER_ID;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL is not set');
    process.exit(1);
  }

  if (!snippetId) {
    console.error('❌ SNIPPET_ID is not set');
    console.log(
      'Usage: SNIPPET_ID=<uuid> USER_ID=<uuid> npx ts-node -r tsconfig-paths/register src/lib/db/seed/comments.seed.ts',
    );
    process.exit(1);
  }

  const client = postgres(databaseUrl, { max: 1 });
  const db = drizzle(client, { schema });

  try {
    await seedComments(db, snippetId, userId);
    console.log('🎉 All done!');
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run standalone if executed directly
if (require.main === module) {
  void main();
}
