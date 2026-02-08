const LANGUAGE_LABELS: Record<string, string> = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  "c++": "C++",
  "c#": "C#",
  html: "HTML",
  css: "CSS",
  sql: "SQL",
  json: "JSON",
};

export const formatSnippetDate = (iso: string): string => {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "Invalid date";
  }
};

export const formatLanguageLabel = (language: string): string => {
  const normalized = language.trim().toLowerCase();
  return (
    LANGUAGE_LABELS[normalized] ??
    `${normalized.charAt(0).toUpperCase()}${normalized.slice(1)}`
  );
};
