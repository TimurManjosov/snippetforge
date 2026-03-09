import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { ZodValidationPipe } from '../../shared/pipes';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { ListUsersQuerySchema, type ListUsersQueryDto } from './dto/list-users.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly service: UsersService,
    private readonly repository: UsersRepository,
  ) {}

  @Get()
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List users (public directory)' })
  @ApiQuery({ name: 'q', required: false, type: String, description: 'Search by username or display name' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default 20, max 100)' })
  @ApiQuery({ name: 'sort', required: false, enum: ['createdAt', 'publicSnippetCount'], description: 'Sort field' })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'], description: 'Sort direction' })
  @ApiResponse({ status: 200, description: 'Paginated user directory' })
  async listUsers(
    @Query(new ZodValidationPipe(ListUsersQuerySchema))
    query: ListUsersQueryDto,
  ) {
    return this.repository.listUsers(query);
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get my user profile (private fields included)' })
  @ApiResponse({
    status: 200,
    description: 'Private user profile (includes email)',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async me(@CurrentUser() user: { id: string }) {
    return this.service.getMe(user.id);
  }

  @Get(':id')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get public user profile' })
  @ApiResponse({
    status: 200,
    description: 'Public profile (no sensitive fields)',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async publicProfile(@Param('id') userId: string) {
    return this.service.getPublicProfile(userId);
  }

  @Get(':id/stats')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get public user stats' })
  @ApiResponse({
    status: 200,
    description: 'Counts for user activity',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async stats(@Param('id') userId: string) {
    return this.service.getStats(userId);
  }
}
