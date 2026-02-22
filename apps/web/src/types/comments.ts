export type FlagReason = 'spam' | 'abuse' | 'off-topic' | 'other';

export type CommentStatus = 'visible' | 'hidden' | 'flagged';

export interface Comment {
  id: string;
  snippetId: string;
  userId: string | null;
  parentId: string | null;
  body: string;
  status: CommentStatus;
  deletedAt: string | null;
  editedAt: string | null;
  createdAt: string;
  updatedAt: string;
  replyCount: number;
}

export interface PaginatedMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginatedMeta;
}
