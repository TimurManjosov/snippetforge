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
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
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
  AddCollectionItemSchema,
  type AddCollectionItemDto,
  CreateCollectionSchema,
  type CreateCollectionDto,
  UpdateCollectionSchema,
  type UpdateCollectionDto,
} from './dto';
import { CollectionsService } from './collections.service';

const UuidParamSchema = z.string().uuid();

@ApiTags('Collections')
@Controller('collections')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({ summary: 'Create a new collection' })
  @ApiBody({ description: 'Collection payload' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Collection created',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid authentication token',
  })
  @ApiConflictResponse({ description: 'Collection name already exists' })
  async create(
    @CurrentUser() user: SafeUser,
    @Body(new ZodValidationPipe(CreateCollectionSchema))
    dto: CreateCollectionDto,
  ) {
    return this.collectionsService.create(user, dto);
  }

  @Get('me')
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({ summary: 'List my collections' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of collections owned by the current user',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid authentication token',
  })
  async listMine(@CurrentUser() user: SafeUser) {
    return this.collectionsService.listMine(user);
  }

  @Public()
  @Get(':id')
  @ApiOperation({
    summary:
      'Get a collection by ID (public or owner/admin for private). Auth is optional.',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Collection UUID' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default 20, max 50)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Collection with paginated snippet previews',
  })
  @ApiNotFoundResponse({ description: 'Collection not found' })
  async getById(
    @Param('id', new ZodValidationPipe(UuidParamSchema)) id: string,
    @CurrentUser() user?: SafeUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedPage = page ? parseInt(page, 10) : 1;
    const parsedLimit = limit ? parseInt(limit, 10) : 20;

    return this.collectionsService.getByIdForViewer(
      id,
      user,
      isNaN(parsedPage) ? 1 : parsedPage,
      isNaN(parsedLimit) ? 20 : parsedLimit,
    );
  }

  @Put(':id')
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({ summary: 'Update a collection (owner/admin only)' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Collection UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Collection updated',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid authentication token',
  })
  @ApiNotFoundResponse({ description: 'Collection not found' })
  @ApiConflictResponse({ description: 'Collection name already exists' })
  async update(
    @Param('id', new ZodValidationPipe(UuidParamSchema)) id: string,
    @CurrentUser() user: SafeUser,
    @Body(new ZodValidationPipe(UpdateCollectionSchema))
    dto: UpdateCollectionDto,
  ) {
    return this.collectionsService.update(user, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({ summary: 'Delete a collection (owner/admin only)' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Collection UUID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Collection deleted',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid authentication token',
  })
  @ApiNotFoundResponse({ description: 'Collection not found' })
  async delete(
    @Param('id', new ZodValidationPipe(UuidParamSchema)) id: string,
    @CurrentUser() user: SafeUser,
  ) {
    await this.collectionsService.delete(user, id);
  }

  @Post(':id/items')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({
    summary: 'Add a snippet to a collection (owner/admin, idempotent)',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Collection UUID' })
  @ApiBody({ description: 'Collection item payload with snippetId' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Item added to collection',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid authentication token',
  })
  @ApiNotFoundResponse({ description: 'Collection or snippet not found' })
  async addItem(
    @Param('id', new ZodValidationPipe(UuidParamSchema)) id: string,
    @CurrentUser() user: SafeUser,
    @Body(new ZodValidationPipe(AddCollectionItemSchema))
    dto: AddCollectionItemDto,
  ) {
    return this.collectionsService.addItem(user, id, dto.snippetId);
  }

  @Delete(':id/items/:snippetId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({
    summary: 'Remove a snippet from a collection (owner/admin, idempotent)',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Collection UUID' })
  @ApiParam({ name: 'snippetId', format: 'uuid', description: 'Snippet UUID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Item removed from collection',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid authentication token',
  })
  @ApiNotFoundResponse({ description: 'Collection not found' })
  async removeItem(
    @Param('id', new ZodValidationPipe(UuidParamSchema)) id: string,
    @Param('snippetId', new ZodValidationPipe(UuidParamSchema))
    snippetId: string,
    @CurrentUser() user: SafeUser,
  ) {
    await this.collectionsService.removeItem(user, id, snippetId);
  }
}
