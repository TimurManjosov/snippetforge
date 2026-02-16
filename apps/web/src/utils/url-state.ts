export type SnippetSort = 'createdAt' | 'views';
export type SnippetOrder = 'asc' | 'desc';

export interface SnippetsUrlState {
  q?: string;
  tags: string[];
  language?: string;
  sort: SnippetSort;
  order: SnippetOrder;
  page: number;
  limit: number;
}

export interface SnippetsUrlUpdate {
  q?: string | null;
  tags?: string[] | string | null;
  language?: string | null;
  sort?: string | null;
  order?: string | null;
  page?: number | string | null;
  limit?: number | string | null;
}

export const DEFAULT_SNIPPETS_STATE: SnippetsUrlState = {
  tags: [],
  sort: 'createdAt',
  order: 'desc',
  page: 1,
  limit: 20,
};

const normalizeNumber = (value: unknown): number | null => {
  const raw =
    typeof value === 'number' || typeof value === 'string' ? Number(value) : Number.NaN;
  if (!Number.isFinite(raw)) return null;
  return Math.floor(raw);
};

export const normalizeSearchQuery = (value: string | null | undefined): string | undefined => {
  const normalized = value?.trim().toLowerCase() ?? '';
  return normalized || undefined;
};

export const slugifyTag = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

const normalizeTags = (value: string[] | string | null | undefined): string[] => {
  const rawTags = Array.isArray(value) ? value : (value ?? '').split(',');
  return Array.from(
    new Set(
      rawTags
        .map((tag) => slugifyTag(tag))
        .filter(Boolean),
    ),
  );
};

const normalizeLanguage = (value: string | null | undefined): string | undefined => {
  const normalized = value?.trim().toLowerCase() ?? '';
  if (!normalized) return undefined;
  if (normalized.length > 50) return undefined;
  return normalized;
};

const normalizeSort = (value: string | null | undefined): SnippetSort =>
  value === 'views' ? 'views' : 'createdAt';

const normalizeOrder = (value: string | null | undefined): SnippetOrder =>
  value === 'asc' ? 'asc' : 'desc';

const normalizePage = (value: unknown): number => {
  const parsed = normalizeNumber(value);
  return parsed && parsed >= 1 ? parsed : 1;
};

const normalizeLimit = (value: unknown): number => {
  const parsed = normalizeNumber(value);
  if (!parsed || parsed < 1) return 20;
  if (parsed > 100) return 100;
  return parsed;
};

export const normalizeSnippetsState = (input: SnippetsUrlUpdate = {}): SnippetsUrlState => ({
  q: normalizeSearchQuery(input.q),
  tags: normalizeTags(input.tags),
  language: normalizeLanguage(input.language),
  sort: normalizeSort(input.sort),
  order: normalizeOrder(input.order),
  page: normalizePage(input.page),
  limit: normalizeLimit(input.limit),
});

const readValue = (
  source: URLSearchParams | { get(key: string): string | null },
  key: string,
): string | null => source.get(key);

export const parseSnippetsState = (
  params: URLSearchParams | { get(key: string): string | null },
): SnippetsUrlState =>
  normalizeSnippetsState({
    q: readValue(params, 'q'),
    tags: readValue(params, 'tags'),
    language: readValue(params, 'language'),
    sort: readValue(params, 'sort'),
    order: readValue(params, 'order'),
    page: readValue(params, 'page'),
    limit: readValue(params, 'limit'),
  });

export const stringifySnippetsState = (state: SnippetsUrlState): string => {
  const params = new URLSearchParams();
  if (state.q) params.set('q', state.q);
  if (state.tags.length) params.set('tags', state.tags.join(','));
  if (state.language) params.set('language', state.language);
  params.set('sort', state.sort);
  params.set('order', state.order);
  params.set('page', String(state.page));
  params.set('limit', String(state.limit));
  return params.toString();
};

export const updateSnippetsStateFromSearchParams = (
  searchParams: URLSearchParams | { get(key: string): string | null },
  updates: SnippetsUrlUpdate,
  options?: { resetPage?: boolean },
): SnippetsUrlState => {
  const current = parseSnippetsState(searchParams);
  const nextInput: SnippetsUrlUpdate = { ...current, ...updates };
  if (options?.resetPage) {
    nextInput.page = 1;
  }
  return normalizeSnippetsState(nextInput);
};
