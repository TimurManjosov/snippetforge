import { ApiClientError, createApiClient } from "@/lib/api-client";
import type {
  CreateSnippetDto,
  SnippetDetail,
  SnippetResponse,
  TagWithSnippetCount,
  UpdateSnippetDto,
} from "@/types/snippets";

export async function createSnippet(
  token: string,
  dto: CreateSnippetDto,
): Promise<SnippetResponse> {
  const apiClient = createApiClient(
    process.env.NEXT_PUBLIC_API_URL ?? "",
    () => token,
  );
  const result = await apiClient.post<SnippetResponse>("/snippets", dto);
  if (!result) {
    throw new ApiClientError(502, "Snippet response missing from API");
  }
  return result;
}

export async function getSnippetById(
  token: string,
  id: string,
  signal?: AbortSignal,
): Promise<SnippetDetail> {
  const apiClient = createApiClient(
    process.env.NEXT_PUBLIC_API_URL ?? "",
    () => token,
  );
  const result = await apiClient.get<SnippetDetail>(`/api/snippets/${id}`, { signal });
  if (!result) {
    throw new ApiClientError(502, "Snippet response missing from API");
  }
  return result;
}

export async function updateSnippet(
  token: string,
  id: string,
  dto: UpdateSnippetDto,
): Promise<SnippetResponse> {
  const apiClient = createApiClient(
    process.env.NEXT_PUBLIC_API_URL ?? "",
    () => token,
  );
  const result = await apiClient.put<SnippetResponse>(`/api/snippets/${id}`, dto);
  if (!result) {
    throw new ApiClientError(502, "Snippet response missing from API");
  }
  return result;
}

export async function deleteSnippet(
  token: string,
  id: string,
): Promise<void> {
  const apiClient = createApiClient(
    process.env.NEXT_PUBLIC_API_URL ?? "",
    () => token,
  );
  await apiClient.delete(`/api/snippets/${id}`);
}

export async function attachTagsToSnippet(
  token: string,
  id: string,
  tags: string[],
): Promise<void> {
  const apiClient = createApiClient(
    process.env.NEXT_PUBLIC_API_URL ?? "",
    () => token,
  );
  await apiClient.post(`/api/snippets/${id}/tags`, { tags });
}

export async function removeTagFromSnippet(
  token: string,
  id: string,
  tagSlug: string,
): Promise<void> {
  const apiClient = createApiClient(
    process.env.NEXT_PUBLIC_API_URL ?? "",
    () => token,
  );
  await apiClient.delete(`/api/snippets/${id}/tags/${encodeURIComponent(tagSlug)}`);
}

export async function getAllTags(signal?: AbortSignal): Promise<TagWithSnippetCount[]> {
  const apiClient = createApiClient(
    process.env.NEXT_PUBLIC_API_URL ?? "",
    () => null,
  );
  const result = await apiClient.get<TagWithSnippetCount[]>("/api/tags", { signal });
  return result ?? [];
}
