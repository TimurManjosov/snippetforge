export interface Collection {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  userId: string;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionItem {
  id: string;
  snippetId: string;
  snippetTitle: string;
  snippetLanguage: string;
  addedAt: string;
}

export interface CollectionWithItems extends Collection {
  items: CollectionItem[];
}

export interface CreateCollectionDto {
  name: string;
  description?: string;
  isPublic: boolean;
}

export interface UpdateCollectionDto {
  name?: string;
  description?: string;
  isPublic?: boolean;
}
