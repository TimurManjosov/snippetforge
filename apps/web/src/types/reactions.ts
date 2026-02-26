export type ReactionType = 'like' | 'star';

export interface ReactionCount {
  type: ReactionType;
  count: number;
}

export interface ReactionsResponse {
  counts: ReactionCount[];
  viewer?: ReactionType[];
}
