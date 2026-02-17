import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { type CreateTagDto } from './dto';
import { TagsRepository } from './tags.repository';
import {
  type AttachTagsResult,
  type RemoveTagResult,
  type TagWithSnippetCount,
} from './tags.types';
import { slugify } from './tags.utils';

@Injectable()
export class TagsService {
  private readonly logger = new Logger(TagsService.name);

  constructor(private readonly tagsRepository: TagsRepository) {}

  async create(dto: CreateTagDto) {
    const slug = slugify(dto.name);

    if (!slug) {
      throw new ConflictException('Tag slug is invalid');
    }

    try {
      return await this.tagsRepository.create({
        name: dto.name.trim(),
        slug,
      });
    } catch (error) {
      // Drizzle-orm wraps postgres errors; the unique-violation code
      // may be on the error itself or on error.cause
      const code =
        (error as { code?: string })?.code ??
        (error as { cause?: { code?: string } })?.cause?.code;
      if (code === '23505') {
        throw new ConflictException('Tag slug already exists');
      }

      throw error;
    }
  }

  async findAll(): Promise<TagWithSnippetCount[]> {
    return this.tagsRepository.findAllWithSnippetCount();
  }

  async attachToSnippet(
    snippetId: string,
    tags: string[],
  ): Promise<AttachTagsResult> {
    const normalizedSlugs = [
      ...new Set(tags.map((tag) => slugify(tag)).filter(Boolean)),
    ];

    if (normalizedSlugs.length === 0) {
      throw new NotFoundException('No valid tags found');
    }

    const existingTags = await this.tagsRepository.findBySlugs(normalizedSlugs);

    if (existingTags.length === 0) {
      throw new NotFoundException('No valid tags found');
    }

    const attached = await this.tagsRepository.attachTagsToSnippet(
      snippetId,
      existingTags.map((tag) => tag.id),
    );

    this.logger.debug(`Attached ${attached} tags to snippet ${snippetId}`);

    return {
      attached,
      totalRequested: normalizedSlugs.length,
      resolvedTags: existingTags.map((tag) => tag.slug),
    };
  }

  async removeFromSnippet(
    snippetId: string,
    tagSlug: string,
  ): Promise<RemoveTagResult> {
    const normalizedSlug = slugify(tagSlug);

    if (!normalizedSlug) {
      throw new NotFoundException('Tag not found');
    }

    const tag = await this.tagsRepository.findBySlug(normalizedSlug);

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    const removed = await this.tagsRepository.removeTagFromSnippet(
      snippetId,
      tag.id,
    );

    if (!removed) {
      throw new NotFoundException('Tag is not attached to snippet');
    }

    return { removed: true };
  }
}
