import { Module } from '@nestjs/common';
import { SnippetsModule } from '../snippets';
import { CommentsController } from './comments.controller';
import { CommentsRepository } from './comments.repository';
import { CommentsService } from './comments.service';
import { SnippetCommentsController } from './snippet-comments.controller';

@Module({
  imports: [SnippetsModule],
  controllers: [SnippetCommentsController, CommentsController],
  providers: [CommentsService, CommentsRepository],
  exports: [CommentsService, CommentsRepository],
})
export class CommentsModule {}
