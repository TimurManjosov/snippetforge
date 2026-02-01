// src/modules/snippets/snippets.module.ts

import { Module } from '@nestjs/common';
import { SnippetsController } from './snippets.controller';
import { SnippetsRepository } from './snippets.repository';
import { SnippetsService } from './snippets.service';

/**
 * SnippetsModule - Kapselt Snippet-bezogene Komponenten
 *
 * STRUKTUR:
 * - Controller: HTTP Endpoints
 * - Service: Business Logic
 * - Repository: Data Access
 */
@Module({
  controllers: [SnippetsController],
  providers: [SnippetsRepository, SnippetsService],
  exports: [SnippetsService],
})
export class SnippetsModule {}
