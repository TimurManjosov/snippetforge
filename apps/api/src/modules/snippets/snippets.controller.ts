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
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ZodValidationPipe } from '../../shared/pipes';
import {
  ForbiddenErrorResponseSchema,
  NotFoundErrorResponseSchema,
  UnauthorizedErrorResponseSchema,
  ValidationErrorResponseSchema,
} from '../../shared/swagger';
import { type SafeUser } from '../users';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  type CreateSnippetDto,
  CreateSnippetSchema,
  type UpdateSnippetDto,
  UpdateSnippetSchema,
} from './dto';
import { SnippetsService } from './snippets.service';
import {
  type Snippet,
  type PaginatedSnippets,
  type PaginatedSnippetPreviews,
  type SnippetStats,
} from './snippets.types';

/**
 * SnippetsController - HTTP Endpoints for Snippet Management
 *
 * ENDPOINTS:
 * - POST   /api/snippets              - Create new snippet
 * - GET    /api/snippets              - List public snippets (paginated)
 * - GET    /api/snippets/previews     - List public snippet previews (without code)
 * - GET    /api/snippets/my           - Get current user's snippets
 * - GET    /api/snippets/stats        - Get current user's snippet statistics
 * - GET    /api/snippets/:id          - Get snippet by ID
 * - GET    /api/snippets/:id/view     - Get snippet and increment view count
 * - PATCH  /api/snippets/:id          - Update snippet
 * - PATCH  /api/snippets/:id/toggle   - Toggle public/private status
 * - DELETE /api/snippets/:id          - Delete snippet
 *
 * AUTHENTICATION:
 * - Most endpoints require authentication (JwtAuthGuard is global)
 * - Public endpoints marked with @Public() decorator
 */
@ApiTags('Snippets')
@Controller('snippets')
export class SnippetsController {
  private readonly logger = new Logger(SnippetsController.name);

  constructor(private readonly snippetsService: SnippetsService) {}

  /**
   * POST /api/snippets
   *
   * Create a new code snippet
   *
   * REQUEST BODY:
   * {
   *   "title": "Example Snippet",
   *   "description": "Optional description",
   *   "code": "console.log('Hello World');",
   *   "language": "javascript",
   *   "isPublic": true
   * }
   *
   * RESPONSE (201 Created):
   * Full Snippet object with id, timestamps, etc.
   *
   * ERRORS:
   * - 400 Bad Request: Validation error
   * - 401 Unauthorized: Not authenticated
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({
    summary: 'Create a new snippet',
    description: `
Creates a new code snippet for the authenticated user.

**Requirements:**
- title: 1-200 characters
- code: 1-50000 characters
- language: Valid language identifier
- isPublic: Optional, defaults to true
    `,
  })
  @ApiBody({
    description: 'Snippet data',
    examples: {
      javascript: {
        summary: 'JavaScript snippet',
        value: {
          title: 'Array Map Example',
          description: 'Simple array mapping example',
          code: 'const numbers = [1, 2, 3];\nconst doubled = numbers.map(n => n * 2);',
          language: 'javascript',
          isPublic: true,
        },
      },
      typescript: {
        summary: 'TypeScript snippet',
        value: {
          title: 'Type Guard Example',
          description: 'Custom type guard implementation',
          code: 'function isString(value: unknown): value is string {\n  return typeof value === "string";\n}',
          language: 'typescript',
          isPublic: true,
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Snippet successfully created',
  })
  @ApiBadRequestResponse({
    description: 'Validation error',
    type: ValidationErrorResponseSchema,
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated',
    type: UnauthorizedErrorResponseSchema,
  })
  async create(
    @CurrentUser() user: SafeUser,
    @Body(new ZodValidationPipe(CreateSnippetSchema)) dto: CreateSnippetDto,
  ): Promise<Snippet> {
    this.logger.debug(`Creating snippet for user: ${user.id}`);
    return this.snippetsService.create(user.id, dto);
  }

  /**
   * GET /api/snippets
   *
   * List public snippets with pagination
   *
   * QUERY PARAMS:
   * - page: Page number (default: 1)
   * - limit: Items per page (default: 20, max: 100)
   *
   * RESPONSE (200 OK):
   * {
   *   "data": [...],
   *   "pagination": {
   *     "page": 1,
   *     "limit": 20,
   *     "total": 100,
   *     "totalPages": 5
   *   }
   * }
   */
  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List public snippets',
    description: `
Returns a paginated list of public snippets.
Includes full snippet data including code.

Use /snippets/previews for list views (faster, without code).
    `,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (min: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (min: 1, max: 100)',
    example: 20,
  })
  @ApiOkResponse({
    description: 'List of public snippets',
  })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<PaginatedSnippets> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.snippetsService.findPublicSnippets(pageNum, limitNum);
  }

  /**
   * GET /api/snippets/previews
   *
   * List public snippet previews (without code for performance)
   *
   * QUERY PARAMS:
   * - page: Page number (default: 1)
   * - limit: Items per page (default: 20, max: 100)
   */
  @Public()
  @Get('previews')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List public snippet previews',
    description: `
Returns paginated snippet previews WITHOUT the code field.
Much faster than /snippets endpoint - use for list views.

To get full snippet with code, use GET /snippets/:id
    `,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (max: 100)',
    example: 20,
  })
  @ApiOkResponse({
    description: 'List of snippet previews (without code)',
  })
  async findPreviews(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<PaginatedSnippetPreviews> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.snippetsService.findPublicPreviews(pageNum, limitNum);
  }

  /**
   * GET /api/snippets/my
   *
   * Get current user's snippets (both public and private)
   *
   * QUERY PARAMS:
   * - limit: Max number of snippets (default: 20)
   */
  @UseGuards(JwtAuthGuard)
  @Get('my')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({
    summary: 'Get my snippets',
    description: `
Returns all snippets created by the authenticated user.
Includes both public and private snippets.
    `,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Max number of snippets',
    example: 20,
  })
  @ApiOkResponse({
    description: 'User snippets',
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated',
    type: UnauthorizedErrorResponseSchema,
  })
  async findMy(
    @CurrentUser() user: SafeUser,
    @Query('limit') limit?: string,
  ): Promise<Snippet[]> {
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.snippetsService.findUserSnippets(user.id, limitNum);
  }

  /**
   * GET /api/snippets/stats
   *
   * Get current user's snippet statistics
   */
  @UseGuards(JwtAuthGuard)
  @Get('stats')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({
    summary: 'Get my snippet statistics',
    description: `
Returns statistics for the authenticated user's snippets:
- Total count
- Public/private count
- Total views
- Language breakdown
    `,
  })
  @ApiOkResponse({
    description: 'Snippet statistics',
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated',
    type: UnauthorizedErrorResponseSchema,
  })
  async getMyStats(@CurrentUser() user: SafeUser): Promise<SnippetStats> {
    return this.snippetsService.getUserStats(user.id);
  }

  /**
   * GET /api/snippets/:id
   *
   * Get snippet by ID
   *
   * RULES:
   * - Public snippets: Anyone can view
   * - Private snippets: Only owner can view
   *
   * ERRORS:
   * - 404 Not Found: Snippet doesn't exist
   * - 403 Forbidden: Private snippet, not owner
   */
  @Public()
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get snippet by ID',
    description: `
Returns a single snippet by its ID.

**Access Control:**
- Public snippets: Anyone can view
- Private snippets: Only the owner can view

**Note:** Use /snippets/:id/view to increment view count
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Snippet UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOkResponse({
    description: 'Snippet details',
  })
  @ApiNotFoundResponse({
    description: 'Snippet not found',
    type: NotFoundErrorResponseSchema,
  })
  @ApiForbiddenResponse({
    description: 'No access to private snippet',
    type: ForbiddenErrorResponseSchema,
  })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user?: SafeUser,
  ): Promise<Snippet> {
    return this.snippetsService.findById(id, user?.id);
  }

  /**
   * GET /api/snippets/:id/view
   *
   * Get snippet and increment view count
   *
   * Use this endpoint when displaying a snippet to users
   * (e.g., on detail page)
   */
  @Public()
  @Get(':id/view')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get snippet and increment view count',
    description: `
Returns a single snippet and increments its view count.
Use this endpoint for snippet detail pages.

**Access Control:**
- Public snippets: Anyone can view
- Private snippets: Only the owner can view
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Snippet UUID',
  })
  @ApiOkResponse({
    description: 'Snippet details',
  })
  @ApiNotFoundResponse({
    description: 'Snippet not found',
    type: NotFoundErrorResponseSchema,
  })
  @ApiForbiddenResponse({
    description: 'No access to private snippet',
    type: ForbiddenErrorResponseSchema,
  })
  async findOneAndView(
    @Param('id') id: string,
    @CurrentUser() user?: SafeUser,
  ): Promise<Snippet> {
    return this.snippetsService.findByIdAndIncrementViews(id, user?.id);
  }

  /**
   * PATCH /api/snippets/:id
   *
   * Update snippet
   *
   * RULES:
   * - Only owner can update (or ADMIN)
   *
   * ERRORS:
   * - 404 Not Found: Snippet doesn't exist
   * - 403 Forbidden: Not owner
   * - 401 Unauthorized: Not authenticated
   */
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({
    summary: 'Update snippet',
    description: `
Updates a snippet. Only the owner (or ADMIN) can update.

**Partial Updates:**
Only provide the fields you want to update.
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Snippet UUID',
  })
  @ApiBody({
    description: 'Fields to update',
    examples: {
      title: {
        summary: 'Update title only',
        value: {
          title: 'New Title',
        },
      },
      visibility: {
        summary: 'Change visibility',
        value: {
          isPublic: false,
        },
      },
      full: {
        summary: 'Update multiple fields',
        value: {
          title: 'Updated Title',
          description: 'Updated description',
          code: 'console.log("updated");',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Snippet updated successfully',
  })
  @ApiBadRequestResponse({
    description: 'Validation error',
    type: ValidationErrorResponseSchema,
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated',
    type: UnauthorizedErrorResponseSchema,
  })
  @ApiNotFoundResponse({
    description: 'Snippet not found',
    type: NotFoundErrorResponseSchema,
  })
  @ApiForbiddenResponse({
    description: 'Not owner of snippet',
    type: ForbiddenErrorResponseSchema,
  })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: SafeUser,
    @Body(new ZodValidationPipe(UpdateSnippetSchema)) dto: UpdateSnippetDto,
  ): Promise<Snippet> {
    // Convert null description to undefined for service compatibility
    const updateDto = {
      ...dto,
      description: dto.description === null ? undefined : dto.description,
    };
    return this.snippetsService.update(id, user.id, user.role, updateDto);
  }

  /**
   * PATCH /api/snippets/:id/toggle
   *
   * Toggle snippet public/private status
   *
   * Convenience endpoint for "Make Public"/"Make Private" button
   */
  @UseGuards(JwtAuthGuard)
  @Patch(':id/toggle')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({
    summary: 'Toggle public/private status',
    description: `
Toggles the snippet between public and private.
Convenience endpoint for "Make Public"/"Make Private" button.
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Snippet UUID',
  })
  @ApiOkResponse({
    description: 'Snippet visibility toggled',
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated',
    type: UnauthorizedErrorResponseSchema,
  })
  @ApiNotFoundResponse({
    description: 'Snippet not found',
    type: NotFoundErrorResponseSchema,
  })
  @ApiForbiddenResponse({
    description: 'Not owner of snippet',
    type: ForbiddenErrorResponseSchema,
  })
  async togglePublic(
    @Param('id') id: string,
    @CurrentUser() user: SafeUser,
  ): Promise<Snippet> {
    return this.snippetsService.togglePublic(id, user.id, user.role);
  }

  /**
   * DELETE /api/snippets/:id
   *
   * Delete snippet
   *
   * RULES:
   * - Only owner can delete (or ADMIN)
   *
   * ERRORS:
   * - 404 Not Found: Snippet doesn't exist
   * - 403 Forbidden: Not owner
   * - 401 Unauthorized: Not authenticated
   */
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({
    summary: 'Delete snippet',
    description: `
Permanently deletes a snippet.
Only the owner (or ADMIN) can delete.

**Warning:** This action cannot be undone.
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Snippet UUID',
  })
  @ApiOkResponse({
    description: 'Snippet deleted successfully',
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated',
    type: UnauthorizedErrorResponseSchema,
  })
  @ApiNotFoundResponse({
    description: 'Snippet not found',
    type: NotFoundErrorResponseSchema,
  })
  @ApiForbiddenResponse({
    description: 'Not owner of snippet',
    type: ForbiddenErrorResponseSchema,
  })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: SafeUser,
  ): Promise<void> {
    await this.snippetsService.delete(id, user.id, user.role);
  }
}
