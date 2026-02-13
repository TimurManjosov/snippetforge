// src/modules/tags/tags.controller.ts

import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../shared/pipes';
import {
  ConflictErrorResponseSchema,
  ForbiddenErrorResponseSchema,
  UnauthorizedErrorResponseSchema,
  ValidationErrorResponseSchema,
} from '../../shared/swagger';
import { JwtAuthGuard, Public, Roles, RolesGuard } from '../auth';
import * as createTagDto from './dto/create-tag.dto';
import { TagsService } from './tags.service';

/**
 * TagsController - HTTP Endpoints für Tags
 *
 * ENDPOINTS:
 * - POST /api/tags - Tag erstellen (ADMIN-only)
 * - GET /api/tags - Tags listen (public)
 */
@ApiTags('Tags')
@Controller('tags')
export class TagsController {
  private readonly logger = new Logger(TagsController.name);

  constructor(private readonly tagsService: TagsService) {}

  /**
   * POST /api/tags - Tag erstellen
   *
   * GUARD: JwtAuthGuard + RolesGuard
   * ROLE: ADMIN
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({
    summary: 'Create a new tag',
    description: 'Creates a new tag with server-generated slug. ADMIN only.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          example: 'TypeScript',
          minLength: 1,
          maxLength: 50,
        },
      },
      required: ['name'],
    },
    description: 'Tag creation payload',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Tag successfully created',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string', example: 'TypeScript' },
        slug: { type: 'string', example: 'typescript' },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Validation error - Invalid input data',
    type: ValidationErrorResponseSchema,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid authentication token',
    type: UnauthorizedErrorResponseSchema,
  })
  @ApiForbiddenResponse({
    description: 'Access denied - ADMIN role required',
    type: ForbiddenErrorResponseSchema,
  })
  @ApiConflictResponse({
    description: 'Tag with generated slug already exists',
    type: ConflictErrorResponseSchema,
  })
  async create(
    @Body(new ZodValidationPipe(createTagDto.CreateTagSchema))
    dto: createTagDto.CreateTagDto,
  ) {
    this.logger.debug(`Creating tag: ${dto.name}`);
    return this.tagsService.createTag(dto.name);
  }

  /**
   * GET /api/tags - Tags listen
   *
   * PUBLIC: Keine Auth erforderlich
   */
  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List all tags',
    description: 'Returns all tags with snippet count, sorted by slug.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of tags with snippet count',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'TypeScript' },
          slug: { type: 'string', example: 'typescript' },
          createdAt: { type: 'string', format: 'date-time' },
          snippetCount: { type: 'number', example: 42 },
        },
      },
    },
  })
  async list() {
    this.logger.debug('Listing all tags');
    return this.tagsService.listTags();
  }
}
