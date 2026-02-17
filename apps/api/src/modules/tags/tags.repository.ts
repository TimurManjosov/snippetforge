import { Injectable, Logger } from '@nestjs/common';
import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import { snippetTags, tags, type NewTag, type Tag } from '../../lib/db/schema';
import { DatabaseService } from '../../shared/database';
import { type TagWithSnippetCount } from './tags.types';

@Injectable()
export class TagsRepository {
  private readonly logger = new Logger(TagsRepository.name);

  constructor(private readonly db: DatabaseService) {}

  async create(data: NewTag): Promise<Tag> {
    const [tag] = await this.db.drizzle.insert(tags).values(data).returning();
    return tag;
  }

  async findBySlug(slug: string): Promise<Tag | null> {
    const tag = await this.db.drizzle.query.tags.findFirst({
      where: eq(tags.slug, slug),
    });

    return tag ?? null;
  }

  async findBySlugs(slugs: string[]): Promise<Tag[]> {
    if (slugs.length === 0) {
      return [];
    }

    return this.db.drizzle.query.tags.findMany({
      where: inArray(tags.slug, slugs),
      orderBy: [asc(tags.slug)],
    });
  }

  async findAllWithSnippetCount(): Promise<TagWithSnippetCount[]> {
    this.logger.debug('Listing tags with snippet counts');

    return this.db.drizzle
      .select({
        id: tags.id,
        name: tags.name,
        slug: tags.slug,
        createdAt: tags.createdAt,
        snippetCount: sql<number>`count(${snippetTags.tagId})::int`,
      })
      .from(tags)
      .leftJoin(snippetTags, eq(snippetTags.tagId, tags.id))
      .groupBy(tags.id, tags.name, tags.slug, tags.createdAt)
      .orderBy(asc(tags.slug));
  }

  async attachTagsToSnippet(
    snippetId: string,
    tagIds: string[],
  ): Promise<number> {
    if (tagIds.length === 0) {
      return 0;
    }

    const inserted = await this.db.drizzle
      .insert(snippetTags)
      .values(tagIds.map((tagId) => ({ snippetId, tagId })))
      .onConflictDoNothing()
      .returning({ tagId: snippetTags.tagId });

    return inserted.length;
  }

  async removeTagFromSnippet(
    snippetId: string,
    tagId: string,
  ): Promise<boolean> {
    const removed = await this.db.drizzle
      .delete(snippetTags)
      .where(
        and(eq(snippetTags.snippetId, snippetId), eq(snippetTags.tagId, tagId)),
      )
      .returning({ tagId: snippetTags.tagId });

    return removed.length > 0;
  }
}
