import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

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
