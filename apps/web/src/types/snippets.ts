export interface CreateSnippetDto {
  title: string;
  description?: string;
  code: string;
  language: string;
  isPublic?: boolean;
}

export interface SnippetResponse {
  id: string;
  title: string;
  description: string | null;
  code: string;
  language: string;
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
