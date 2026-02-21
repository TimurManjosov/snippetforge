import { Module } from '@nestjs/common';
import { SnippetsModule } from '../snippets';
import { ReactionsController } from './reactions.controller';
import { ReactionsRepository } from './reactions.repository';
import { ReactionsService } from './reactions.service';

@Module({
  imports: [SnippetsModule],
  controllers: [ReactionsController],
  providers: [ReactionsService, ReactionsRepository],
  exports: [ReactionsService, ReactionsRepository],
})
export class ReactionsModule {}
