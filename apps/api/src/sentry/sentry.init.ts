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

  Sentry.init({
    dsn,
    environment:
      process.env[SENTRY_ENVIRONMENT_ENV] ??
      process.env.NODE_ENV ??
      'development',
    release: process.env[SENTRY_RELEASE_ENV],
    tracesSampleRate: Number(
      process.env[SENTRY_TRACES_SAMPLE_RATE_ENV] ?? 0,
    ),
    beforeSend(event) {
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }
      return event;
    },
  });
}
