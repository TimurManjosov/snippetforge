"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface CodeViewerProps {
  code: string;
  language?: string;
}

type CopyState = "idle" | "success" | "error";

export default function CodeViewer({ code, language }: CodeViewerProps) {
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const resetTimerRef = useRef<number | null>(null);

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
      setCopyState("error");
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
      : copyState === "error"
        ? "Copy failed"
        : "Copy";

  return (
    <section className="code-viewer" aria-label="Snippet code">
      <div className="code-viewer-toolbar">
        <div className="code-viewer-info">
          <span className="code-viewer-language">{language ?? "Code"}</span>
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
              : copyState === "error"
                ? "Unable to copy"
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
