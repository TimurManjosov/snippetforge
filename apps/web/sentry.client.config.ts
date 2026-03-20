// sentry.client.config.ts

import * as Sentry from '@sentry/nextjs';
import {
  SENTRY_DSN_PUBLIC_ENV,
  SENTRY_ENVIRONMENT_PUBLIC_ENV,
  SENTRY_RELEASE_PUBLIC_ENV,
  SENTRY_TRACES_RATE_PUBLIC_ENV,
} from './src/lib/sentry/sentry.constants';

const dsn = process.env[SENTRY_DSN_PUBLIC_ENV];

if (dsn) {
  Sentry.init({
    dsn,
    environment:
      process.env[SENTRY_ENVIRONMENT_PUBLIC_ENV] ?? 'development',
    release: process.env[SENTRY_RELEASE_PUBLIC_ENV],
    tracesSampleRate: Number(
      process.env[SENTRY_TRACES_RATE_PUBLIC_ENV] ?? 0,
    ),
    beforeSend(event) {
      // TODO: scrub PII fields if needed
      return event;
    },
  });
}
