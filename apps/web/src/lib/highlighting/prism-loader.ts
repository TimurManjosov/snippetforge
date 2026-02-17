import { normalizeLanguage } from "@/utils/language-map";

interface PrismInstance {
  languages: Record<string, unknown>;
  highlight: (code: string, grammar: unknown, language: string) => string;
}
type PrismModule = keyof typeof LANGUAGE_MODULE_IMPORTERS;

const LANGUAGE_MODULES: Record<string, PrismModule[]> = {
  typescript: ["clike", "javascript", "typescript"],
  javascript: ["clike", "javascript"],
  tsx: ["markup", "clike", "javascript", "jsx", "typescript", "tsx"],
  jsx: ["markup", "clike", "javascript", "jsx"],
  markup: ["markup"],
  css: ["css"],
  json: ["json"],
  bash: ["bash"],
  python: ["python"],
  go: ["go"],
  java: ["java"],
  csharp: ["clike", "csharp"],
  rust: ["rust"],
  php: ["markup-templating", "php"],
};

const LANGUAGE_MODULE_IMPORTERS = {
  markup: () => import("prismjs/components/prism-markup"),
  clike: () => import("prismjs/components/prism-clike"),
  javascript: () => import("prismjs/components/prism-javascript"),
  typescript: () => import("prismjs/components/prism-typescript"),
  jsx: () => import("prismjs/components/prism-jsx"),
  tsx: () => import("prismjs/components/prism-tsx"),
  css: () => import("prismjs/components/prism-css"),
  json: () => import("prismjs/components/prism-json"),
  bash: () => import("prismjs/components/prism-bash"),
  python: () => import("prismjs/components/prism-python"),
  go: () => import("prismjs/components/prism-go"),
  java: () => import("prismjs/components/prism-java"),
  csharp: () => import("prismjs/components/prism-csharp"),
  rust: () => import("prismjs/components/prism-rust"),
  "markup-templating": () => import("prismjs/components/prism-markup-templating"),
  php: () => import("prismjs/components/prism-php"),
} as const;

const THEME_STYLE_ID = "snippetforge-prism-theme";
const THEME_CSS = `
.code-viewer .token.comment,.code-viewer .token.prolog,.code-viewer .token.doctype,.code-viewer .token.cdata{color:#6b7280}
.code-viewer .token.punctuation{color:#4b5563}
.code-viewer .token.property,.code-viewer .token.tag,.code-viewer .token.constant,.code-viewer .token.symbol,.code-viewer .token.deleted{color:#dc2626}
.code-viewer .token.boolean,.code-viewer .token.number{color:#7c3aed}
.code-viewer .token.selector,.code-viewer .token.attr-name,.code-viewer .token.string,.code-viewer .token.char,.code-viewer .token.builtin,.code-viewer .token.inserted{color:#059669}
.code-viewer .token.operator,.code-viewer .token.entity,.code-viewer .token.url,.code-viewer .language-css .token.string,.code-viewer .style .token.string{color:#0f766e}
.code-viewer .token.atrule,.code-viewer .token.attr-value,.code-viewer .token.keyword{color:#2563eb}
.code-viewer .token.function,.code-viewer .token.class-name{color:#b45309}
.code-viewer .token.regex,.code-viewer .token.important,.code-viewer .token.variable{color:#ea580c}
@media (prefers-color-scheme: dark){
  .code-viewer .token.comment,.code-viewer .token.prolog,.code-viewer .token.doctype,.code-viewer .token.cdata{color:#9ca3af}
  .code-viewer .token.punctuation{color:#d1d5db}
  .code-viewer .token.property,.code-viewer .token.tag,.code-viewer .token.constant,.code-viewer .token.symbol,.code-viewer .token.deleted{color:#f87171}
  .code-viewer .token.boolean,.code-viewer .token.number{color:#c084fc}
  .code-viewer .token.selector,.code-viewer .token.attr-name,.code-viewer .token.string,.code-viewer .token.char,.code-viewer .token.builtin,.code-viewer .token.inserted{color:#34d399}
  .code-viewer .token.operator,.code-viewer .token.entity,.code-viewer .token.url,.code-viewer .language-css .token.string,.code-viewer .style .token.string{color:#22d3ee}
  .code-viewer .token.atrule,.code-viewer .token.attr-value,.code-viewer .token.keyword{color:#60a5fa}
  .code-viewer .token.function,.code-viewer .token.class-name{color:#fbbf24}
  .code-viewer .token.regex,.code-viewer .token.important,.code-viewer .token.variable{color:#fb923c}
}`;

let prismPromise: Promise<PrismInstance> | null = null;
let themePromise: Promise<void> | null = null;
const loadedModules = new Set<PrismModule>();
const modulePromises = new Map<PrismModule, Promise<void>>();

const loadPrismCore = async (): Promise<PrismInstance> => {
  if (!prismPromise) {
    prismPromise = import("prismjs").then((module) => {
      const candidate = ("default" in module ? module.default : module) as unknown;

      if (
        candidate &&
        typeof candidate === "object" &&
        "languages" in candidate &&
        "highlight" in candidate &&
        typeof candidate.highlight === "function"
      ) {
        return candidate as PrismInstance;
      }

      throw new Error("Unable to load Prism core: received invalid module structure");
    });
  }

  return prismPromise;
};

const loadTheme = (): Promise<void> => {
  if (typeof document === "undefined") {
    return Promise.resolve();
  }

  if (!themePromise) {
    themePromise = Promise.resolve().then(() => {
      if (document.getElementById(THEME_STYLE_ID)) {
        return;
      }

      const style = document.createElement("style");
      style.id = THEME_STYLE_ID;
      style.textContent = THEME_CSS;
      document.head.append(style);
    });
  }

  return themePromise;
};

const loadModule = async (moduleName: PrismModule): Promise<void> => {
  if (loadedModules.has(moduleName)) {
    return;
  }

  const pending = modulePromises.get(moduleName);
  if (pending) {
    return pending;
  }

  const nextPromise = LANGUAGE_MODULE_IMPORTERS[moduleName]()
    .then(() => {
      loadedModules.add(moduleName);
    })
    .finally(() => {
      modulePromises.delete(moduleName);
    });

  modulePromises.set(moduleName, nextPromise);
  return nextPromise;
};

export interface PrismLoadResult {
  prism: PrismInstance;
  language: string;
  supported: boolean;
}

export const loadPrismLanguage = async (language?: string): Promise<PrismLoadResult> => {
  const normalizedLanguage = normalizeLanguage(language);
  const prism = await loadPrismCore();
  await loadTheme();

  const modules = LANGUAGE_MODULES[normalizedLanguage];
  if (!modules) {
    return { prism, language: normalizedLanguage, supported: false };
  }

  for (const moduleName of modules) {
    await loadModule(moduleName);
  }

  const supported = Boolean(prism.languages[normalizedLanguage]);
  return { prism, language: normalizedLanguage, supported };
};
