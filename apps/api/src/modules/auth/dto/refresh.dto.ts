import { z } from 'zod';

/**
 * Refresh / logout payload.
 *
 * The raw refresh token is delivered in the JSON body rather than as a
 * cookie because the NestJS API has no cookie context — the BFF owns the
 * cookie. Keeping the API stateless to cookies also lets it be exercised
 * directly from tools like `curl` and the test suite without faking a
 * browser session.
 */
export const RefreshTokenSchema = z.object({
  refreshToken: z
    .string()
    .min(20, 'refreshToken is required')
    .max(512, 'refreshToken is implausibly long'),
});

export type RefreshTokenDto = z.infer<typeof RefreshTokenSchema>;
