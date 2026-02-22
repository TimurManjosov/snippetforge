import {
  Body,
  Controller,
  Delete,
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
import { CurrentUser } from '../auth';
import { type SafeUser } from '../users';
import { AddFavoriteSchema, type AddFavoriteDto } from './dto';
import { FavoritesService } from './favorites.service';

const SnippetIdParamSchema = z.string().uuid();

@ApiTags('Favorites')
@ApiBearerAuth('JWT-Auth')
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add a snippet to favorites (idempotent)' })
  @ApiBody({ description: 'Favorite payload with snippetId' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Favorite added successfully',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid authentication token' })
  @ApiNotFoundResponse({ description: 'Snippet not found' })
  async add(
    @CurrentUser() user: SafeUser,
    @Body(new ZodValidationPipe(AddFavoriteSchema)) dto: AddFavoriteDto,
  ) {
    return this.favoritesService.addFavorite(user, dto.snippetId);
  }

  @Delete(':snippetId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a snippet from favorites (idempotent)' })
  @ApiParam({ name: 'snippetId', format: 'uuid', description: 'Snippet UUID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Favorite removed',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid authentication token' })
  async remove(
    @Param('snippetId', new ZodValidationPipe(SnippetIdParamSchema))
    snippetId: string,
    @CurrentUser() user: SafeUser,
  ) {
    await this.favoritesService.removeFavorite(user, snippetId);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List favorites with snippet previews (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default 20, max 50)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Paginated list of favorite snippet previews',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid authentication token' })
  async list(
    @CurrentUser() user: SafeUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedPage = page ? parseInt(page, 10) : 1;
    const parsedLimit = limit ? parseInt(limit, 10) : 20;

    return this.favoritesService.listFavorites(
      user,
      isNaN(parsedPage) ? 1 : parsedPage,
      isNaN(parsedLimit) ? 20 : parsedLimit,
    );
  }
}
