import { Injectable, Logger } from '@nestjs/common';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { refreshTokens, type RefreshToken } from '../../lib/db/schema';
import { DatabaseService } from '../../shared/database';

/**
 * Persistence layer for refresh tokens.
 *
 * Token *hashes* are the unit of storage here — the service layer is
 * responsible for hashing raw values before calling in, and for never
 * persisting raw token material anywhere.
 */
@Injectable()
export class RefreshTokensRepository {
  private readonly logger = new Logger(RefreshTokensRepository.name);

  constructor(private readonly db: DatabaseService) {}

  async create(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<RefreshToken> {
    const [row] = await this.db.drizzle
      .insert(refreshTokens)
      .values(data)
      .returning();
    return row;
  }

  async findByHash(tokenHash: string): Promise<RefreshToken | null> {
    const [row] = await this.db.drizzle
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.tokenHash, tokenHash))
      .limit(1);
    return row ?? null;
  }

  /**
   * Atomically rotate a refresh token: mark the current row revoked, insert
   * the replacement, and back-link `replaced_by_id`. Returns the new row.
   *
   * Both writes share one transaction so a failure mid-rotation cannot
   * leave the user with two simultaneously-valid refresh tokens.
   */
  async rotate(
    currentId: string,
    next: { userId: string; tokenHash: string; expiresAt: Date },
  ): Promise<RefreshToken> {
    return this.db.drizzle.transaction(async (tx) => {
      const [created] = await tx.insert(refreshTokens).values(next).returning();

      await tx
        .update(refreshTokens)
        .set({ revokedAt: new Date(), replacedById: created.id })
        .where(eq(refreshTokens.id, currentId));

      return created;
    });
  }

  async revokeById(id: string): Promise<void> {
    await this.db.drizzle
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(and(eq(refreshTokens.id, id), isNull(refreshTokens.revokedAt)));
  }

  /**
   * Revoke every active session for a user. Called on logout-everywhere and
   * on detected refresh-token reuse (theft response).
   */
  async revokeAllForUser(userId: string): Promise<number> {
    const result = await this.db.drizzle
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(
        and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)),
      )
      .returning({ id: refreshTokens.id });
    return result.length;
  }

  /**
   * Best-effort cleanup of expired or long-revoked rows. Safe to run on a
   * cron from outside the request path.
   */
  async deleteExpired(now: Date): Promise<number> {
    const result = await this.db.drizzle
      .delete(refreshTokens)
      .where(sql`${refreshTokens.expiresAt} < ${now}`)
      .returning({ id: refreshTokens.id });
    return result.length;
  }
}
