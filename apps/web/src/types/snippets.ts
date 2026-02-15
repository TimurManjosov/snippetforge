export interface CreateSnippetDto {
  title: string;
  description?: string;
  code: string;
  language: string;
  isPublic?: boolean;
}

export interface UpdateSnippetDto {
  title?: string;
  description?: string;
  code?: string;
  language?: string;
  isPublic?: boolean;
}

export interface SnippetResponse {
  id: string;
  title: string;
  description: string | null;
  code: string;
  language: string;
  tags?: string[];
  userId: string;
  isPublic: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SnippetAuthor {
  id: string;
  username: string;
  avatarUrl: string | null;
}

export interface SnippetDetail extends SnippetResponse {
  user?: SnippetAuthor;
}

export interface TagWithSnippetCount {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  snippetCount: number;
}
