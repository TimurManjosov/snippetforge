// src/sentry/sentry.init.ts

import * as Sentry from '@sentry/node';
import {
  SENTRY_DSN_API_ENV,
  SENTRY_ENVIRONMENT_ENV,
  SENTRY_RELEASE_ENV,
  SENTRY_TRACES_SAMPLE_RATE_ENV,
} from './sentry.constants';

export function initSentry(): void {
  const dsn = process.env[SENTRY_DSN_API_ENV];

  if (!dsn) {
    return;
  }

  const rawRate = process.env[SENTRY_TRACES_SAMPLE_RATE_ENV];
  const parsedRate = rawRate !== undefined ? Number(rawRate) : undefined;
  const tracesSampleRate =
    typeof parsedRate === 'number' && !Number.isNaN(parsedRate)
      ? Math.min(1, Math.max(0, parsedRate))
      : 0;

  Sentry.init({
    dsn,
    environment:
      process.env[SENTRY_ENVIRONMENT_ENV] ??
      process.env.NODE_ENV ??
      'development',
    release: process.env[SENTRY_RELEASE_ENV],
    tracesSampleRate,
    beforeSend(event) {
      if (event.request?.headers) {
        const headers = event.request.headers;
        for (const key of Object.keys(headers)) {
          const lowerKey = key.toLowerCase();
          if (lowerKey === 'authorization' || lowerKey === 'cookie') {
            delete headers[key];
          }
        }
      }
      return event;
    },
  });
}
