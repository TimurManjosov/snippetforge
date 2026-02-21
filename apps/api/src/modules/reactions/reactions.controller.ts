import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../shared/pipes';
import { CurrentUser, Public } from '../auth';
import { type SafeUser } from '../users';
import {
  SetReactionSchema,
  type SetReactionDto,
  ReactionTypeSchema,
} from './dto';
import { ReactionsService } from './reactions.service';

const SnippetIdParamSchema = z.string().uuid();

@ApiTags('Reactions')
@Controller('snippets')
export class ReactionsController {
  constructor(private readonly reactionsService: ReactionsService) {}

  @Post(':id/reactions')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({ summary: 'Set a reaction on a snippet (idempotent)' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Snippet UUID' })
  @ApiBody({ description: 'Reaction type payload' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reaction set successfully',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid authentication token' })
  @ApiNotFoundResponse({ description: 'Snippet not found' })
  async set(
    @Param('id', new ZodValidationPipe(SnippetIdParamSchema)) id: string,
    @CurrentUser() user: SafeUser,
    @Body(new ZodValidationPipe(SetReactionSchema)) dto: SetReactionDto,
  ) {
    return this.reactionsService.set(id, user, dto.type);
  }

  @Delete(':id/reactions/:type')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({ summary: 'Remove a reaction from a snippet (idempotent)' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Snippet UUID' })
  @ApiParam({
    name: 'type',
    enum: ['like', 'love', 'star', 'laugh', 'wow', 'sad', 'angry'],
    description: 'Reaction type',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Reaction removed',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid authentication token' })
  @ApiNotFoundResponse({ description: 'Snippet not found' })
  async remove(
    @Param('id', new ZodValidationPipe(SnippetIdParamSchema)) id: string,
    @Param('type', new ZodValidationPipe(ReactionTypeSchema)) type: string,
    @CurrentUser() user: SafeUser,
  ) {
    await this.reactionsService.remove(id, user, type as any);
  }

  @Public()
  @Get(':id/reactions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get aggregated reaction counts for a snippet' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Snippet UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Aggregated reaction counts and optional viewer info',
  })
  @ApiNotFoundResponse({ description: 'Snippet not found' })
  async getReactions(
    @Param('id', new ZodValidationPipe(SnippetIdParamSchema)) id: string,
    @CurrentUser() user?: SafeUser,
  ) {
    return this.reactionsService.getReactions(id, user);
  }
}
