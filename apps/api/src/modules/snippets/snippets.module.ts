// src/modules/snippets/snippets.module.ts

import { Module } from '@nestjs/common';
import { SnippetsController } from './snippets.controller';
import { SnippetsService } from './snippets.service';
import { SnippetsRepository } from './snippets.repository';

/**
 * SnippetsModule - Code Snippet Management Module
 *
 * RESPONSIBILITIES:
 * - CRUD operations for code snippets
 * - Access control (public/private snippets)
 * - Pagination and filtering
 * - View counting
 * - Statistics
 *
 * COMPONENTS:
 * - SnippetsController: HTTP endpoints
 * - SnippetsService: Business logic
 * - SnippetsRepository: Database operations
 *
 * EXPORTS:
 * - SnippetsService: Can be used by other modules
 */
@Module({
  controllers: [SnippetsController],
  providers: [SnippetsService, SnippetsRepository],
  exports: [SnippetsService],
})
export class SnippetsModule {}
