// sentry.server.config.ts

import * as Sentry from '@sentry/nextjs';
import {
  SENTRY_DSN_SERVER_ENV,
  SENTRY_ENVIRONMENT_PUBLIC_ENV,
  SENTRY_RELEASE_PUBLIC_ENV,
} from './src/lib/sentry/sentry.constants';

const dsn = process.env[SENTRY_DSN_SERVER_ENV];

// Server-side: no client headers reach this context
if (dsn) {
  Sentry.init({
    dsn,
    environment:
      process.env[SENTRY_ENVIRONMENT_PUBLIC_ENV] ??
      process.env.NODE_ENV ??
      'development',
    release: process.env[SENTRY_RELEASE_PUBLIC_ENV],
    tracesSampleRate: 0,
  });
}
