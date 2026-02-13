import { Module } from '@nestjs/common';
import { SnippetsModule } from '../snippets';
import { SnippetTagsController } from './snippet-tags.controller';
import { TagsController } from './tags.controller';
import { TagsRepository } from './tags.repository';
import { TagsService } from './tags.service';

@Module({
  imports: [SnippetsModule],
  controllers: [TagsController, SnippetTagsController],
  providers: [TagsRepository, TagsService],
  exports: [TagsService],
})
export class TagsModule {}
