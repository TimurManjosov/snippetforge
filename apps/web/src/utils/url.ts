export const parsePage = (value: string | null | undefined): number => {
  const num = Number(value);
  return Number.isFinite(num) && num >= 1 ? Math.floor(num) : 1;
};

export const parseLimit = (value: string | null | undefined): number => {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 1) return 20;
  if (num > 100) return 100;
  return Math.floor(num);
};

export const buildQuery = (page: number, limit: number): string => {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (limit !== 20) params.set("limit", String(limit));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
};
