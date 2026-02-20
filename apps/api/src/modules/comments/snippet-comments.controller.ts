import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../shared/pipes';
import { CurrentUser, Public } from '../auth';
import { type SafeUser } from '../users';
import {
  CreateCommentSchema,
  type CreateCommentDto,
  ListCommentsQuerySchema,
  type ListCommentsQueryDto,
} from './dto';
import { CommentsService } from './comments.service';

const SnippetIdParamSchema = z.string().uuid();

@ApiTags('Comments')
@Controller('snippets')
export class SnippetCommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post(':id/comments')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({ summary: 'Create a comment on a snippet' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Snippet UUID' })
  @ApiBody({ description: 'Comment creation payload' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Comment created successfully',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid authentication token' })
  @ApiNotFoundResponse({ description: 'Snippet not found' })
  async create(
    @Param('id', new ZodValidationPipe(SnippetIdParamSchema)) id: string,
    @CurrentUser() user: SafeUser,
    @Body(new ZodValidationPipe(CreateCommentSchema)) dto: CreateCommentDto,
  ) {
    return this.commentsService.create(id, user, dto.body, dto.parentId);
  }

  @Public()
  @Get(':id/comments')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List comments for a snippet' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Snippet UUID' })
  @ApiQuery({ name: 'parentId', required: false, type: String, description: 'Filter replies to a specific parent comment UUID' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (1-100, default: 20)' })
  @ApiQuery({ name: 'sort', required: false, enum: ['createdAt'], description: 'Sort field (default: createdAt)' })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'], description: 'Sort direction (default: asc)' })
  @ApiQuery({ name: 'depth', required: false, type: Number, description: 'Threading depth (0-2, default: 1)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Paginated list of comments',
  })
  @ApiNotFoundResponse({ description: 'Snippet not found' })
  async list(
    @Param('id', new ZodValidationPipe(SnippetIdParamSchema)) id: string,
    @Query(new ZodValidationPipe(ListCommentsQuerySchema)) query: ListCommentsQueryDto,
    @CurrentUser() user?: SafeUser,
  ) {
    return this.commentsService.list(id, user, {
      parentId: query.parentId,
      page: query.page,
      limit: query.limit,
      order: query.order,
    });
  }
}
