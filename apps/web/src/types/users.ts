export type PublicUser = {
  id: string;
  username: string;
  displayName?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  websiteUrl?: string | null;
  createdAt?: string;
};

export type UserStats = {
  userId: string;
  publicSnippetCount: number;
  commentCount: number;
  reactionGivenCount?: number;
};
