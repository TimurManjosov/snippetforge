import { type Tag } from '../../lib/db/schema';

export type TagWithSnippetCount = Tag & { snippetCount: number };

export interface AttachTagsResult {
  attached: number;
  totalRequested: number;
  resolvedTags: string[];
}

export interface RemoveTagResult {
  removed: true;
}
