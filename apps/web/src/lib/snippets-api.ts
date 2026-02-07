import { ApiClientError, createApiClient } from "@/lib/api-client";
import type { CreateSnippetDto, SnippetResponse } from "@/types/snippets";

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
