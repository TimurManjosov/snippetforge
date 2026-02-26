export interface FavoritePreview {
  id: string;
  snippetId: string;
  snippetTitle: string;
  snippetLanguage: string;
  createdAt: string;
}

export interface FavoritesListResponse {
  data: FavoritePreview[];
  total: number;
  page: number;
  limit: number;
}
