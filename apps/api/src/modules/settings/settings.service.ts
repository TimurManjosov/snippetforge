import { Injectable, NotFoundException } from '@nestjs/common';
import { SettingsRepository } from './settings.repository';
import { type UpdateUserSettingsDto } from './dto/user-settings.dto';

@Injectable()
export class SettingsService {
  constructor(private readonly repo: SettingsRepository) {}

  async getMe(userId: string) {
    const settings = await this.repo.getByUserId(userId);
    if (!settings) {
      throw new NotFoundException('User not found');
    }
    return settings;
  }

  async updateMe(userId: string, dto: UpdateUserSettingsDto) {
    const updated = await this.repo.update(userId, dto);
    if (!updated) {
      throw new NotFoundException('User not found');
    }
    return updated;
  }
}
