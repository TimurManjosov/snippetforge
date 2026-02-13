// src/modules/tags/tags.service.ts

import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SnippetsRepository } from '../snippets/snippets.repository';
import { type AttachTagsDto } from './dto';
import { TagsRepository } from './tags.repository';
import { type AttachTagsResult, type TagWithCount } from './tags.types';
import { slugify } from './tags.utils';

/**
 * TagsService - Business Logic Layer für Tags
 *
 * VERANTWORTLICHKEITEN:
 * - Business Logic (Tag-Erstellung, Slug-Generierung, Tagging-Logik)
 * - Orchestrierung mehrerer Repository Calls
 * - Error Handling (ConflictException, NotFoundException)
 */
@Injectable()
export class TagsService {
  private readonly logger = new Logger(TagsService.name);

  constructor(
    private readonly tagsRepository: TagsRepository,
    private readonly snippetsRepository: SnippetsRepository,
  ) {}

  // ============================================================
  // TAG OPERATIONS
  // ============================================================

  /**
   * Erstellt neuen Tag
   *
   * BUSINESS RULES:
   * - Slug wird serverseitig aus name generiert (slugify)
   * - Duplicate slug → 409 ConflictException
   * - Nur ADMIN kann Tags erstellen (Guard im Controller)
   *
   * @param name - Tag-Name
   * @returns Erstellter Tag
   * @throws ConflictException bei Duplicate slug
   */
  async createTag(name: string) {
    this.logger.debug(`Creating tag: ${name}`);

    // Slug generieren
    const slug = slugify(name);

    // Prüfen ob Slug bereits existiert
    const existing = await this.tagsRepository.findTagBySlug(slug);
    if (existing) {
      throw new ConflictException(
        `Tag with slug "${slug}" already exists (name: "${existing.name}")`,
      );
    }

    // Tag erstellen
    const tag = await this.tagsRepository.createTag({ name, slug });

    this.logger.log(`Tag created: ${tag.id} (${tag.slug})`);
    return tag;
  }

  /**
   * Listet alle Tags mit Snippet-Count
   *
   * PUBLIC: Keine Auth erforderlich
   *
   * @returns Array von Tags mit snippetCount, sortiert nach slug
   */
  async listTags(): Promise<TagWithCount[]> {
    this.logger.debug('Listing all tags');
    return this.tagsRepository.findAllTagsWithCount();
  }

  /**
   * Findet Tag anhand des Slugs
   *
   * @param slug - Tag slug
   * @returns Tag
   * @throws NotFoundException wenn nicht gefunden
   */
  async findTagBySlug(slug: string) {
    const tag = await this.tagsRepository.findTagBySlug(slug);
    if (!tag) {
      throw new NotFoundException(`Tag with slug "${slug}" not found`);
    }
    return tag;
  }

  // ============================================================
  // SNIPPET-TAG OPERATIONS
  // ============================================================

  /**
   * Attached Tags an Snippet
   *
   * BUSINESS RULES:
   * - Nur Owner oder ADMIN (Guard im Controller)
   * - Slug-Normalisierung (lowercase, trim)
   * - Idempotent: doppelte Zuordnung = no-op
   * - Unbekannte Tags → 404 (alle oder keiner)
   * - Snippet muss existieren → 404
   *
   * @param snippetId - Snippet UUID
   * @param dto - AttachTagsDto (slugs)
   * @returns AttachTagsResult (attached, alreadyAttached, notFound)
   * @throws NotFoundException wenn Snippet oder Tags nicht gefunden
   */
  async attachTagsToSnippet(
    snippetId: string,
    dto: AttachTagsDto,
  ): Promise<AttachTagsResult> {
    this.logger.debug(
      `Attaching tags to snippet ${snippetId}: ${dto.slugs.join(', ')}`,
    );

    // 1. Snippet muss existieren
    const snippet = await this.snippetsRepository.findById(snippetId);
    if (!snippet) {
      throw new NotFoundException(`Snippet with ID ${snippetId} not found`);
    }

    // 2. Tags anhand der Slugs finden
    const normalizedSlugs = dto.slugs.map((s) => slugify(s));
    const foundTags = await this.tagsRepository.findTagsBySlugs(normalizedSlugs);

    // 3. Unbekannte Tags identifizieren
    const foundSlugs = new Set(foundTags.map((t) => t.slug));
    const notFoundSlugs = normalizedSlugs.filter((s) => !foundSlugs.has(s));

    // Wenn Tags nicht gefunden → 404
    if (notFoundSlugs.length > 0) {
      throw new NotFoundException(
        `Tags not found: ${notFoundSlugs.join(', ')}`,
      );
    }

    // 4. Bereits vorhandene Relationen ermitteln
    const tagIds = foundTags.map((t) => t.id);
    const existingTagIds = await this.tagsRepository.findExistingTagRelations(
      snippetId,
      tagIds,
    );
    const existingSet = new Set(existingTagIds);

    // 5. Neue Relationen (nur noch nicht vorhandene)
    const newTagIds = tagIds.filter((id) => !existingSet.has(id));

    // 6. Attach (Batch Insert mit onConflictDoNothing)
    const attached = await this.tagsRepository.attachTagsToSnippet(
      snippetId,
      newTagIds,
    );

    const result: AttachTagsResult = {
      attached,
      alreadyAttached: existingTagIds.length,
      notFound: notFoundSlugs,
    };

    this.logger.log(
      `Tags attached to snippet ${snippetId}: ` +
        `${attached} new, ${result.alreadyAttached} already attached`,
    );

    return result;
  }

  /**
   * Entfernt Tag von Snippet
   *
   * BUSINESS RULES:
   * - Nur Owner oder ADMIN (Guard im Controller)
   * - Snippet muss existieren → 404 (anti-enumeration)
   * - Tag muss existieren → 404
   * - Relation muss existieren → 404
   *
   * @param snippetId - Snippet UUID
   * @param tagSlug - Tag slug
   * @throws NotFoundException wenn nicht gefunden oder nicht zugeordnet
   */
  async detachTagFromSnippet(
    snippetId: string,
    tagSlug: string,
  ): Promise<void> {
    this.logger.debug(
      `Detaching tag ${tagSlug} from snippet ${snippetId}`,
    );

    // 1. Snippet muss existieren
    const snippet = await this.snippetsRepository.findById(snippetId);
    if (!snippet) {
      throw new NotFoundException(`Snippet with ID ${snippetId} not found`);
    }

    // 2. Tag muss existieren
    const normalizedSlug = slugify(tagSlug);
    const tag = await this.tagsRepository.findTagBySlug(normalizedSlug);
    if (!tag) {
      throw new NotFoundException(`Tag with slug "${normalizedSlug}" not found`);
    }

    // 3. Detach
    const detached = await this.tagsRepository.detachTagFromSnippet(
      snippetId,
      tag.id,
    );

    // Wenn Relation nicht existierte → 404
    if (!detached) {
      throw new NotFoundException(
        `Tag "${normalizedSlug}" is not attached to snippet ${snippetId}`,
      );
    }

    this.logger.log(`Tag ${normalizedSlug} detached from snippet ${snippetId}`);
  }

  /**
   * Findet alle Tags eines Snippets
   *
   * @param snippetId - Snippet UUID
   * @returns Array von Tags
   */
  async findTagsBySnippetId(snippetId: string) {
    return this.tagsRepository.findTagsBySnippetId(snippetId);
  }
}
