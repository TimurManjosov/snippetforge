// src/modules/tags/tags.module.ts

import { Module } from '@nestjs/common';
import { SnippetsModule } from '../snippets/snippets.module';
import { SnippetTagsController } from './snippet-tags.controller';
import { TagsController } from './tags.controller';
import { TagsRepository } from './tags.repository';
import { TagsService } from './tags.service';

/**
 * TagsModule - Kapselt Tag-bezogene Komponenten
 *
 * STRUKTUR:
 * - Controllers: HTTP Endpoints (TagsController, SnippetTagsController)
 * - Service: Business Logic
 * - Repository: Data Access
 *
 * IMPORTS:
 * - SnippetsModule: Für SnippetsRepository (Snippet-Existenz-Checks)
 */
@Module({
  imports: [SnippetsModule],
  controllers: [TagsController, SnippetTagsController],
  providers: [TagsRepository, TagsService],
  exports: [TagsService],
})
export class TagsModule {}
