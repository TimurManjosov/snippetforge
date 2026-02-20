import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
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
  UpdateCommentSchema,
  type UpdateCommentDto,
  FlagCommentSchema,
  type FlagCommentDto,
} from './dto';
import { CommentsService } from './comments.service';

const CommentIdParamSchema = z.string().uuid();
const FlagReasonParamSchema = z.enum(['spam', 'abuse', 'off-topic', 'other']);

@ApiTags('Comments')
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Public()
  @Get(':commentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a comment by ID' })
  @ApiParam({ name: 'commentId', format: 'uuid', description: 'Comment UUID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Comment details' })
  @ApiNotFoundResponse({ description: 'Comment not found' })
  async get(
    @Param('commentId', new ZodValidationPipe(CommentIdParamSchema))
    commentId: string,
    @CurrentUser() user?: SafeUser,
  ) {
    return this.commentsService.get(commentId, user);
  }

  @Put(':commentId')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({ summary: 'Update a comment' })
  @ApiParam({ name: 'commentId', format: 'uuid', description: 'Comment UUID' })
  @ApiBody({ description: 'Comment update payload' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Comment updated successfully' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid authentication token' })
  @ApiNotFoundResponse({ description: 'Comment not found' })
  async update(
    @Param('commentId', new ZodValidationPipe(CommentIdParamSchema))
    commentId: string,
    @CurrentUser() user: SafeUser,
    @Body(new ZodValidationPipe(UpdateCommentSchema)) dto: UpdateCommentDto,
  ) {
    return this.commentsService.update(commentId, user, dto.body);
  }

  @Delete(':commentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({ summary: 'Soft-delete a comment' })
  @ApiParam({ name: 'commentId', format: 'uuid', description: 'Comment UUID' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Comment deleted' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid authentication token' })
  @ApiNotFoundResponse({ description: 'Comment not found' })
  async delete(
    @Param('commentId', new ZodValidationPipe(CommentIdParamSchema))
    commentId: string,
    @CurrentUser() user: SafeUser,
  ) {
    await this.commentsService.softDelete(commentId, user);
  }

  @Post(':commentId/flags')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({ summary: 'Flag a comment for moderation' })
  @ApiParam({ name: 'commentId', format: 'uuid', description: 'Comment UUID' })
  @ApiBody({ description: 'Flag reason and optional message' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Comment flagged' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid authentication token' })
  @ApiNotFoundResponse({ description: 'Comment not found' })
  async flag(
    @Param('commentId', new ZodValidationPipe(CommentIdParamSchema))
    commentId: string,
    @CurrentUser() user: SafeUser,
    @Body(new ZodValidationPipe(FlagCommentSchema)) dto: FlagCommentDto,
  ) {
    return this.commentsService.flag(commentId, user, dto.reason, dto.message);
  }

  @Delete(':commentId/flags/:reason')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({ summary: 'Remove a flag from a comment' })
  @ApiParam({ name: 'commentId', format: 'uuid', description: 'Comment UUID' })
  @ApiParam({ name: 'reason', enum: ['spam', 'abuse', 'off-topic', 'other'], description: 'Flag reason' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Flag removed' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid authentication token' })
  async unflag(
    @Param('commentId', new ZodValidationPipe(CommentIdParamSchema))
    commentId: string,
    @Param('reason', new ZodValidationPipe(FlagReasonParamSchema))
    reason: string,
    @CurrentUser() user: SafeUser,
  ) {
    await this.commentsService.unflag(commentId, user, reason);
  }
}
