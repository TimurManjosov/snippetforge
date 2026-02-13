import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ZodValidationPipe } from '../../shared/pipes';
import {
  ConflictErrorResponseSchema,
  ForbiddenErrorResponseSchema,
  TagResponseSchema,
  UnauthorizedErrorResponseSchema,
  ValidationErrorResponseSchema,
  CreateTagRequestSchema,
} from '../../shared/swagger';
import { JwtAuthGuard, Public, Roles, RolesGuard } from '../auth';
import { CreateTagSchema, type CreateTagDto } from './dto';
import { TagsService } from './tags.service';

@ApiTags('Tags')
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({ summary: 'Create a new tag' })
  @ApiBody({
    type: CreateTagRequestSchema,
    description: 'Tag creation payload',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Tag created successfully',
    type: TagResponseSchema,
  })
  @ApiBadRequestResponse({
    description: 'Validation error',
    type: ValidationErrorResponseSchema,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid authentication token',
    type: UnauthorizedErrorResponseSchema,
  })
  @ApiForbiddenResponse({
    description: 'Insufficient permissions',
    type: ForbiddenErrorResponseSchema,
  })
  @ApiConflictResponse({
    description: 'Tag slug already exists',
    type: ConflictErrorResponseSchema,
  })
  create(
    @Body(new ZodValidationPipe(CreateTagSchema))
    dto: CreateTagDto,
  ) {
    return this.tagsService.create(dto);
  }

  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List tags with snippet counts' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tag list',
    type: TagResponseSchema,
    isArray: true,
  })
  findAll() {
    return this.tagsService.findAll();
  }
}
