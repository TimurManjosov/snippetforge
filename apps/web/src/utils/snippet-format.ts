const LANGUAGE_LABELS: Record<string, string> = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  tsx: "TSX",
  jsx: "JSX",
  "c++": "C++",
  "c#": "C#",
  csharp: "C#",
  html: "HTML",
  markup: "HTML",
  css: "CSS",
  sql: "SQL",
  json: "JSON",
  bash: "Bash",
  plaintext: "Plain text",
};

export const formatSnippetDate = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  try {
    return date.toLocaleDateString("en-US", {
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
