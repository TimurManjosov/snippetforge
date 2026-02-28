import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DatabaseService } from '../../shared/database';
import { users } from '../../lib/db/schema';
import { type UpdateUserSettingsDto } from './dto/user-settings.dto';

@Injectable()
export class SettingsRepository {
  constructor(private readonly db: DatabaseService) {}

  async getByUserId(userId: string) {
    return this.db.drizzle.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        defaultSnippetVisibility: true,
        defaultLanguage: true,
        uiTheme: true,
        itemsPerPage: true,
      },
    });
  }

  async update(userId: string, dto: UpdateUserSettingsDto) {
    const updateData: Partial<typeof users.$inferInsert> = {};

    if (dto.defaultSnippetVisibility !== undefined) {
      updateData.defaultSnippetVisibility = dto.defaultSnippetVisibility;
    }
    if (dto.defaultLanguage !== undefined) {
      updateData.defaultLanguage = dto.defaultLanguage; // null erlaubt (explizites Löschen)
    }
    if (dto.uiTheme !== undefined) {
      updateData.uiTheme = dto.uiTheme;
    }
    if (dto.itemsPerPage !== undefined) {
      updateData.itemsPerPage = dto.itemsPerPage;
    }

    const [row] = await this.db.drizzle
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning({
        defaultSnippetVisibility: users.defaultSnippetVisibility,
        defaultLanguage: users.defaultLanguage,
        uiTheme: users.uiTheme,
        itemsPerPage: users.itemsPerPage,
      });

    return row;
  }
}
