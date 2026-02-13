// src/modules/tags/snippet-tags.controller.ts

import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../shared/pipes';
import {
  ForbiddenErrorResponseSchema,
  NotFoundErrorResponseSchema,
  UnauthorizedErrorResponseSchema,
  ValidationErrorResponseSchema,
} from '../../shared/swagger';
import { JwtAuthGuard } from '../auth';
import { OwnershipGuard } from '../snippets/guards';
import * as attachTagsDto from './dto/attach-tags.dto';
import { TagsService } from './tags.service';

const SnippetIdParamSchema = z.string().uuid();
const TagSlugParamSchema = z
  .string()
  .min(1)
  .max(50)
  .transform((val) => val.toLowerCase().trim());

/**
 * SnippetTagsController - HTTP Endpoints für Snippet-Tag-Zuordnungen
 *
 * ENDPOINTS:
 * - POST /api/snippets/:id/tags - Tags an Snippet anhängen
 * - DELETE /api/snippets/:id/tags/:slug - Tag von Snippet entfernen
 *
 * Beide Endpoints sind durch OwnershipGuard geschützt:
 * - Nur Owner oder ADMIN kann zugreifen
 * - Nicht-Owner bekommen 404 (Anti-Enumeration)
 */
@ApiTags('Snippets')
@Controller('snippets/:id/tags')
export class SnippetTagsController {
  private readonly logger = new Logger(SnippetTagsController.name);

  constructor(private readonly tagsService: TagsService) {}

  /**
   * POST /api/snippets/:id/tags - Tags an Snippet anhängen
   *
   * GUARD: JwtAuthGuard + OwnershipGuard (owner-only oder ADMIN)
   */
  @UseGuards(JwtAuthGuard, OwnershipGuard)
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({
    summary: 'Attach tags to snippet',
    description:
      'Attaches tags to a snippet. Owner or ADMIN only. Idempotent.',
  })
  @ApiParam({
    name: 'id',
    description: 'Snippet UUID',
    format: 'uuid',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        slugs: {
          type: 'array',
          items: { type: 'string' },
          example: ['typescript', 'react'],
          minItems: 1,
        },
      },
      required: ['slugs'],
    },
    description: 'Tag slugs to attach',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tags attached successfully',
    schema: {
      type: 'object',
      properties: {
        attached: { type: 'number', example: 2 },
        alreadyAttached: { type: 'number', example: 0 },
        notFound: { type: 'array', items: { type: 'string' }, example: [] },
      },
    },
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
    description: 'Access denied for snippet modification',
    type: ForbiddenErrorResponseSchema,
  })
  @ApiNotFoundResponse({
    description: 'Snippet or tags not found',
    type: NotFoundErrorResponseSchema,
  })
  async attachTags(
    @Param('id', new ZodValidationPipe(SnippetIdParamSchema)) id: string,
    @Body(new ZodValidationPipe(attachTagsDto.AttachTagsSchema))
    dto: attachTagsDto.AttachTagsDto,
  ) {
    this.logger.debug(`Attaching tags to snippet: ${id}`);
    return this.tagsService.attachTagsToSnippet(id, dto);
  }

  /**
   * DELETE /api/snippets/:id/tags/:slug - Tag von Snippet entfernen
   *
   * GUARD: JwtAuthGuard + OwnershipGuard (owner-only oder ADMIN)
   */
  @UseGuards(JwtAuthGuard, OwnershipGuard)
  @Delete(':slug')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({
    summary: 'Detach tag from snippet',
    description:
      'Removes a tag from a snippet. Owner or ADMIN only.',
  })
  @ApiParam({
    name: 'id',
    description: 'Snippet UUID',
    format: 'uuid',
  })
  @ApiParam({
    name: 'slug',
    description: 'Tag slug',
    example: 'typescript',
  })
  @ApiNoContentResponse({
    description: 'Tag detached successfully',
  })
  @ApiBadRequestResponse({
    description: 'Validation error - Invalid snippet id or tag slug',
    type: ValidationErrorResponseSchema,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid authentication token',
    type: UnauthorizedErrorResponseSchema,
  })
  @ApiForbiddenResponse({
    description: 'Access denied for snippet modification',
    type: ForbiddenErrorResponseSchema,
  })
  @ApiNotFoundResponse({
    description: 'Snippet, tag, or relation not found',
    type: NotFoundErrorResponseSchema,
  })
  async detachTag(
    @Param('id', new ZodValidationPipe(SnippetIdParamSchema)) id: string,
    @Param('slug', new ZodValidationPipe(TagSlugParamSchema)) slug: string,
  ) {
    this.logger.debug(`Detaching tag ${slug} from snippet: ${id}`);
    await this.tagsService.detachTagFromSnippet(id, slug);
  }
}
