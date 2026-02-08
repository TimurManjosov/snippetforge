"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { formatLanguageLabel } from "@/utils/snippet-format";

interface CodeViewerProps {
  code: string;
  language?: string;
}

type CopyState = "idle" | "success" | "error" | "unsupported";

export default function CodeViewer({ code, language }: CodeViewerProps) {
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const resetTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(
    null,
  );

  const scheduleReset = useCallback(() => {
    if (resetTimerRef.current) {
      window.clearTimeout(resetTimerRef.current);
    }
    resetTimerRef.current = window.setTimeout(() => {
      setCopyState("idle");
    }, 2000);
  }, []);

  const handleCopy = useCallback(async () => {
    if (!navigator.clipboard) {
      setCopyState("unsupported");
      scheduleReset();
      return;
    }

    try {
      await navigator.clipboard.writeText(code);
      setCopyState("success");
    } catch {
      setCopyState("error");
    } finally {
      scheduleReset();
    }
  }, [code, scheduleReset]);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  const statusText =
    copyState === "success"
      ? "Copied!"
      : copyState === "unsupported"
        ? "Copy unavailable"
        : copyState === "error"
        ? "Copy failed"
        : "Copy";
  const languageLabel = language ? formatLanguageLabel(language) : "Code";

  return (
    <section className="code-viewer" aria-label="Snippet code">
      <div className="code-viewer-toolbar">
        <div className="code-viewer-info">
          <span className="code-viewer-language">{languageLabel}</span>
        </div>
        <div className="code-viewer-actions">
          <button
            type="button"
            onClick={handleCopy}
            className="code-viewer-copy"
          >
            {statusText}
          </button>
          <span className="code-viewer-feedback" role="status" aria-live="polite">
            {copyState === "success"
              ? "Copied to clipboard"
              : copyState === "unsupported"
                ? "Clipboard access unavailable"
                : copyState === "error"
                  ? "Unable to copy snippet"
                : ""}
          </span>
        </div>
      </div>
      <pre className="code-viewer-pre">
        <code>{code}</code>
      </pre>
    </section>
  );
}
