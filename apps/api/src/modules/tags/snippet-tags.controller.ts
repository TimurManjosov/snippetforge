import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiBadRequestResponse,
  ApiBearerAuth,
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
  AttachTagsRequestSchema,
  AttachTagsResponseSchema,
  NotFoundErrorResponseSchema,
  RemoveTagResponseSchema,
  UnauthorizedErrorResponseSchema,
  ValidationErrorResponseSchema,
} from '../../shared/swagger';
import { JwtAuthGuard } from '../auth';
import { OwnershipGuard } from '../snippets';
import { AttachTagsSchema, type AttachTagsDto } from './dto';
import { TagsService } from './tags.service';

const SnippetIdParamSchema = z.string().uuid();
const TagSlugParamSchema = z.string().min(1).max(50);

@ApiTags('Snippet Tags')
@Controller('snippets')
export class SnippetTagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post(':id/tags')
  @UseGuards(JwtAuthGuard, OwnershipGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({ summary: 'Attach tags to a snippet' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Snippet UUID' })
  @ApiBody({
    type: AttachTagsRequestSchema,
    description: 'Tags to attach',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tags attached to snippet',
    type: AttachTagsResponseSchema,
  })
  @ApiBadRequestResponse({
    description: 'Validation error',
    type: ValidationErrorResponseSchema,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid authentication token',
    type: UnauthorizedErrorResponseSchema,
  })
  @ApiNotFoundResponse({
    description: 'Snippet or tags not found',
    type: NotFoundErrorResponseSchema,
  })
  attach(
    @Param('id', new ZodValidationPipe(SnippetIdParamSchema)) id: string,
    @Body(new ZodValidationPipe(AttachTagsSchema)) dto: AttachTagsDto,
  ) {
    return this.tagsService.attachToSnippet(id, dto.tags);
  }

  @Delete(':id/tags/:slug')
  @UseGuards(JwtAuthGuard, OwnershipGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({ summary: 'Remove tag from a snippet' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Snippet UUID' })
  @ApiParam({ name: 'slug', description: 'Tag slug' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tag removed from snippet',
    type: RemoveTagResponseSchema,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid authentication token',
    type: UnauthorizedErrorResponseSchema,
  })
  @ApiBadRequestResponse({
    description: 'Validation error',
    type: ValidationErrorResponseSchema,
  })
  @ApiNotFoundResponse({
    description: 'Snippet or tag relation not found',
    type: NotFoundErrorResponseSchema,
  })
  remove(
    @Param('id', new ZodValidationPipe(SnippetIdParamSchema)) id: string,
    @Param('slug', new ZodValidationPipe(TagSlugParamSchema)) slug: string,
  ) {
    return this.tagsService.removeFromSnippet(id, slug);
  }
}
