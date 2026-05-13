import { createHash, randomBytes } from 'crypto';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RefreshTokensRepository } from './refresh-tokens.repository';

/**
 * Refresh-token issuance, rotation and revocation.
 *
 * Token format
 * - 256 bits of entropy from `crypto.randomBytes`, base64url-encoded.
 * - Opaque random string, **not** a JWT. Refresh tokens never travel through
 *   the JWT verifier — they are looked up by hash. This means a leaked
 *   secret on the JWT side cannot be used to forge refresh tokens.
 *
 * Storage
 * - Only the SHA-256 hash is persisted. A database leak does not yield
 *   usable refresh tokens.
 *
 * Rotation
 * - Every successful refresh revokes the presented token and issues a new
 *   one. Reuse of an already-revoked token is treated as theft: every
 *   active session for that user is revoked.
 */
@Injectable()
export class RefreshTokenService {
  private readonly logger = new Logger(RefreshTokenService.name);
  private readonly ttlMs: number;

  constructor(
    private readonly repository: RefreshTokensRepository,
    private readonly configService: ConfigService,
  ) {
    this.ttlMs = this.parseTtl(
      this.configService.get<string>('REFRESH_TOKEN_TTL') ?? '30d',
    );
  }

  /** Fresh refresh-token row for a brand-new session (login / register). */
  async issue(userId: string): Promise<{ rawToken: string; expiresAt: Date }> {
    const rawToken = this.generateRawToken();
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + this.ttlMs);

    await this.repository.create({ userId, tokenHash, expiresAt });
    return { rawToken, expiresAt };
  }

  /**
   * Validate the presented refresh token, rotate it, and return the new raw
   * token plus the userId of the session. Single-use: the presented token
   * is revoked atomically with issuing the replacement.
   *
   * Throws UnauthorizedException on any failure (unknown / expired /
   * revoked). On revoked-token reuse, also revokes every active session for
   * the user as a theft response.
   */
  async rotate(
    presentedRawToken: string,
  ): Promise<{ rawToken: string; expiresAt: Date; userId: string }> {
    const presentedHash = this.hashToken(presentedRawToken);
    const current = await this.repository.findByHash(presentedHash);

    if (!current) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (current.revokedAt) {
      // Reuse of a token we already retired — treat as compromise.
      this.logger.warn(
        `Refresh token reuse detected for user ${current.userId}; revoking all sessions`,
      );
      await this.repository.revokeAllForUser(current.userId);
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (current.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const newRawToken = this.generateRawToken();
    const newHash = this.hashToken(newRawToken);
    const newExpiresAt = new Date(Date.now() + this.ttlMs);

    await this.repository.rotate(current.id, {
      userId: current.userId,
      tokenHash: newHash,
      expiresAt: newExpiresAt,
    });

    return {
      rawToken: newRawToken,
      expiresAt: newExpiresAt,
      userId: current.userId,
    };
  }

  /** Revoke a single session (logout). Idempotent — unknown tokens no-op. */
  async revoke(presentedRawToken: string): Promise<void> {
    const presentedHash = this.hashToken(presentedRawToken);
    const current = await this.repository.findByHash(presentedHash);
    if (!current || current.revokedAt) return;
    await this.repository.revokeById(current.id);
  }

  /** Revoke every active session for the user (logout from all devices). */
  async revokeAllForUser(userId: string): Promise<number> {
    return this.repository.revokeAllForUser(userId);
  }

  /** Useful for tests / cookie max-age. */
  get ttlSeconds(): number {
    return Math.floor(this.ttlMs / 1000);
  }

  private generateRawToken(): string {
    return randomBytes(32).toString('base64url');
  }

  private hashToken(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }

  private parseTtl(value: string): number {
    const match = value.match(/^(\d+)(s|m|h|d)?$/);
    if (!match) {
      this.logger.warn(
        `Invalid REFRESH_TOKEN_TTL "${value}", falling back to 30d`,
      );
      return 30 * 24 * 60 * 60 * 1000;
    }
    const n = parseInt(match[1], 10);
    const unit = match[2] ?? 's';
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };
    return n * multipliers[unit];
  }
}

/**
 * Helper: type-narrow refresh-token expected-but-missing into a 401.
 * Used by controller validation paths.
 */
export function requireRefreshToken(value: string | undefined): string {
  if (!value || typeof value !== 'string' || value.length === 0) {
    throw new UnauthorizedException('Missing refresh token');
  }
  return value;
}
