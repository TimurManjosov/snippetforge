const LANGUAGE_ALIASES: Record<string, string> = {
  ts: "typescript",
  js: "javascript",
  html: "markup",
  shell: "bash",
  sh: "bash",
  "c#": "csharp",
  cs: "csharp",
  unknown: "plaintext",
};

export const normalizeLanguage = (input?: string): string => {
  const normalized = input?.trim().toLowerCase();

  if (!normalized) {
    return "plaintext";
  }

  return LANGUAGE_ALIASES[normalized] ?? normalized;
};
