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
