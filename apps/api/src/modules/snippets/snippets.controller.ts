// src/modules/snippets/snippets.controller.ts

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiNoContentResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { type Request } from 'express';
import { z } from 'zod';
import { CurrentUser, JwtAuthGuard, Public } from '../auth';
import { type SafeUser } from '../users';
import {
  CreateSnippetRequestSchema,
  ForbiddenErrorResponseSchema,
  NotFoundErrorResponseSchema,
  PaginatedSnippetPreviewsResponseSchema,
  SnippetPreviewResponseSchema,
  SnippetResponseSchema,
  SnippetStatsResponseSchema,
  UnauthorizedErrorResponseSchema,
  UpdateSnippetRequestSchema,
  ValidationErrorResponseSchema,
} from '../../shared/swagger';
import { ZodValidationPipe } from '../../shared/pipes';
import * as createSnippetDto from './dto/create-snippet.dto';
import * as updateSnippetDto from './dto/update-snippet.dto';
import { OwnershipGuard } from './guards';
import { SnippetsService } from './snippets.service';
import { type Snippet, toSnippetPreview } from './snippets.types';

type OwnershipRequest = Request & { snippet?: Snippet };

const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

type PaginationQueryDto = z.infer<typeof PaginationQuerySchema>;

const LimitQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

type LimitQueryDto = z.infer<typeof LimitQuerySchema>;

const SnippetIdParamSchema = z.string().uuid();

const SnippetLanguageParamSchema = z
  .string()
  .min(1)
  .max(50)
  .transform((value) => value.toLowerCase().trim())
  .refine(
    (value) => /^[a-z0-9-]+$/.test(value),
    'Language must be lowercase alphanumeric with hyphens',
  );

@ApiTags('Snippets')
@Controller('snippets')
export class SnippetsController {
  private readonly logger = new Logger(SnippetsController.name);

  constructor(private readonly snippetsService: SnippetsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({
    summary: 'Create a new snippet',
    description: 'Creates a new code snippet for the authenticated user.',
  })
  @ApiBody({
    type: CreateSnippetRequestSchema,
    description: 'Snippet creation payload',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Snippet successfully created',
    type: SnippetResponseSchema,
  })
  @ApiBadRequestResponse({
    description: 'Validation error - Invalid input data or snippet id',
    type: ValidationErrorResponseSchema,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid authentication token',
    type: UnauthorizedErrorResponseSchema,
  })
  async create(
    @CurrentUser() user: SafeUser,
    @Body(new ZodValidationPipe(createSnippetDto.CreateSnippetSchema))
    dto: createSnippetDto.CreateSnippetDto,
  ) {
    this.logger.debug(`Creating snippet for user: ${user.id}`);
    return this.snippetsService.create(user.id, dto);
  }

  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List public snippets',
    description: 'Returns paginated public snippet previews.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: 'Page number (1-indexed)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 20,
    description: 'Items per page (max 100)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Paginated public snippet previews',
    type: PaginatedSnippetPreviewsResponseSchema,
  })
  @ApiBadRequestResponse({
    description: 'Validation error - Invalid query parameters',
    type: ValidationErrorResponseSchema,
  })
  async findPublic(
    @Query(new ZodValidationPipe(PaginationQuerySchema))
    query: PaginationQueryDto,
  ) {
    const { page = 1, limit = 20 } = query;
    return this.snippetsService.findPublicPreviews(page, limit);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/stats')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({
    summary: 'Get snippet statistics for current user',
    description: 'Returns aggregated snippet statistics for the user.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Snippet statistics for current user',
    type: SnippetStatsResponseSchema,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid authentication token',
    type: UnauthorizedErrorResponseSchema,
  })
  async getMyStats(@CurrentUser() user: SafeUser) {
    return this.snippetsService.getUserStats(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({
    summary: 'List snippets for current user',
    description: 'Returns snippets owned by the authenticated user.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 20,
    description: 'Maximum number of snippets to return (max 100)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of snippets owned by the user',
    type: SnippetResponseSchema,
    isArray: true,
  })
  @ApiBadRequestResponse({
    description: 'Validation error - Invalid query parameters',
    type: ValidationErrorResponseSchema,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid authentication token',
    type: UnauthorizedErrorResponseSchema,
  })
  async findMine(
    @CurrentUser() user: SafeUser,
    @Query(new ZodValidationPipe(LimitQuerySchema)) query: LimitQueryDto,
  ) {
    const { limit = 20 } = query;
    return this.snippetsService.findUserSnippets(user.id, limit);
  }

  @Public()
  @Get('language/:language')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List snippets by language',
    description: 'Returns public snippet previews for a language.',
  })
  @ApiParam({
    name: 'language',
    description: 'Programming language (lowercase, hyphenated)',
    example: 'typescript',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 20,
    description: 'Maximum number of snippets to return (max 100)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of snippets for the specified language',
    type: SnippetPreviewResponseSchema,
    isArray: true,
  })
  @ApiBadRequestResponse({
    description: 'Validation error - Invalid parameters',
    type: ValidationErrorResponseSchema,
  })
  async findByLanguage(
    @Param('language', new ZodValidationPipe(SnippetLanguageParamSchema))
    language: string,
    @Query(new ZodValidationPipe(LimitQuerySchema)) query: LimitQueryDto,
  ) {
    const { limit = 20 } = query;
    const snippets = await this.snippetsService.findByLanguage(language, limit);
    return snippets.map(toSnippetPreview);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({
    summary: 'Get snippet by id',
    description: 'Returns a snippet by its identifier.',
  })
  @ApiParam({
    name: 'id',
    description: 'Snippet UUID',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Snippet details',
    type: SnippetResponseSchema,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid authentication token',
    type: UnauthorizedErrorResponseSchema,
  })
  @ApiNotFoundResponse({
    description: 'Snippet not found',
    type: NotFoundErrorResponseSchema,
  })
  @ApiForbiddenResponse({
    description: 'Access denied for private snippet',
    type: ForbiddenErrorResponseSchema,
  })
  @ApiBadRequestResponse({
    description: 'Validation error - Invalid snippet id',
    type: ValidationErrorResponseSchema,
  })
  async findById(
    @Param('id', new ZodValidationPipe(SnippetIdParamSchema)) id: string,
    @CurrentUser() user: SafeUser,
  ) {
    return this.snippetsService.findByIdAndIncrementViews(id, user.id);
  }

  @UseGuards(JwtAuthGuard, OwnershipGuard)
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({
    summary: 'Update a snippet',
    description: 'Updates fields on a snippet owned by the user.',
  })
  @ApiParam({
    name: 'id',
    description: 'Snippet UUID',
    format: 'uuid',
  })
  @ApiBody({
    type: UpdateSnippetRequestSchema,
    description: 'Snippet update payload',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Snippet updated successfully',
    type: SnippetResponseSchema,
  })
  @ApiBadRequestResponse({
    description: 'Validation error - Invalid input data or snippet id',
    type: ValidationErrorResponseSchema,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid authentication token',
    type: UnauthorizedErrorResponseSchema,
  })
  @ApiForbiddenResponse({
    description: 'Access denied for snippet update',
    type: ForbiddenErrorResponseSchema,
  })
  @ApiNotFoundResponse({
    description: 'Snippet not found',
    type: NotFoundErrorResponseSchema,
  })
  async update(
    @Param('id', new ZodValidationPipe(SnippetIdParamSchema)) id: string,
    @CurrentUser() user: SafeUser,
    @Body(new ZodValidationPipe(updateSnippetDto.UpdateSnippetSchema))
    dto: updateSnippetDto.UpdateSnippetDto,
    @Req() request: OwnershipRequest,
  ) {
    return this.snippetsService.update(
      id,
      user.id,
      user.role,
      dto,
      request.snippet,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/toggle-public')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({
    summary: 'Toggle snippet visibility',
    description: 'Switches a snippet between public and private.',
  })
  @ApiParam({
    name: 'id',
    description: 'Snippet UUID',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Snippet visibility updated',
    type: SnippetResponseSchema,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid authentication token',
    type: UnauthorizedErrorResponseSchema,
  })
  @ApiForbiddenResponse({
    description: 'Access denied for snippet update',
    type: ForbiddenErrorResponseSchema,
  })
  @ApiNotFoundResponse({
    description: 'Snippet not found',
    type: NotFoundErrorResponseSchema,
  })
  @ApiBadRequestResponse({
    description: 'Validation error - Invalid snippet id',
    type: ValidationErrorResponseSchema,
  })
  async togglePublic(
    @Param('id', new ZodValidationPipe(SnippetIdParamSchema)) id: string,
    @CurrentUser() user: SafeUser,
  ) {
    return this.snippetsService.togglePublic(id, user.id, user.role);
  }

  @UseGuards(JwtAuthGuard, OwnershipGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({
    summary: 'Delete a snippet',
    description: 'Deletes a snippet owned by the user.',
  })
  @ApiParam({
    name: 'id',
    description: 'Snippet UUID',
    format: 'uuid',
  })
  @ApiNoContentResponse({
    description: 'Snippet deleted successfully',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid authentication token',
    type: UnauthorizedErrorResponseSchema,
  })
  @ApiForbiddenResponse({
    description: 'Access denied for snippet deletion',
    type: ForbiddenErrorResponseSchema,
  })
  @ApiNotFoundResponse({
    description: 'Snippet not found',
    type: NotFoundErrorResponseSchema,
  })
  @ApiBadRequestResponse({
    description: 'Validation error - Invalid snippet id',
    type: ValidationErrorResponseSchema,
  })
  async delete(
    @Param('id', new ZodValidationPipe(SnippetIdParamSchema)) id: string,
    @CurrentUser() user: SafeUser,
    @Req() request: OwnershipRequest,
  ) {
    await this.snippetsService.delete(id, user.id, user.role, request.snippet);
  }
}
