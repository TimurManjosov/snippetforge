// src/modules/tags/tags.types.ts

import { type Tag } from '../../lib/db/schema';

/**
 * Tag mit snippetCount - für GET /api/tags Response
 */
export interface TagWithCount extends Tag {
  snippetCount: number;
}

/**
 * Attach Result - Response für POST /api/snippets/:id/tags
 */
export interface AttachTagsResult {
  attached: number;
  alreadyAttached: number;
  notFound: string[];
}
