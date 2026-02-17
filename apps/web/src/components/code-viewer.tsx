'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { loadPrismLanguage } from '@/lib/highlighting/prism-loader';
import { formatLanguageLabel } from '@/utils/snippet-format';
import { normalizeLanguage } from '@/utils/language-map';

interface CodeViewerProps {
  code: string;
  language?: string;
  wrap?: boolean;
  showCopy?: boolean;
}

type CopyState = 'idle' | 'success' | 'error' | 'unsupported';

export default function CodeViewer({
  code,
  language,
  wrap = false,
  showCopy = true,
}: CodeViewerProps) {
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const [highlightedCode, setHighlightedCode] = useState<string | null>(null);
  const [isNearViewport, setIsNearViewport] = useState(false);
  const resetTimerRef = useRef<number | null>(null);
  const codeRef = useRef<HTMLElement | null>(null);
  const normalizedLanguage = normalizeLanguage(language);

  const scheduleReset = useCallback(() => {
    if (resetTimerRef.current) {
      window.clearTimeout(resetTimerRef.current);
    }
    resetTimerRef.current = window.setTimeout(() => {
      setCopyState('idle');
    }, 2000);
  }, []);

  const handleCopy = useCallback(async () => {
    if (!navigator.clipboard) {
      setCopyState('unsupported');
      scheduleReset();
      return;
    }

    try {
      await navigator.clipboard.writeText(code);
      setCopyState('success');
    } catch {
      setCopyState('error');
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

  useEffect(() => {
    setHighlightedCode(null);
    setIsNearViewport(false);
  }, [code, normalizedLanguage]);

  useEffect(() => {
    const target = codeRef.current;
    if (!target) {
      return;
    }

    if (typeof window === 'undefined' || !window.IntersectionObserver) {
      setIsNearViewport(true);
      return;
    }

    const observer = new window.IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: '220px 0px' },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [normalizedLanguage]);

  useEffect(() => {
    if (!isNearViewport || normalizedLanguage === 'plaintext') {
      return;
    }

    let isActive = true;

    loadPrismLanguage(normalizedLanguage)
      .then(({ prism, language: loadedLanguage, supported }) => {
        if (!isActive || !supported) {
          return;
        }

        const grammar = prism.languages[loadedLanguage];
        if (!grammar) {
          return;
        }

        const highlighted = prism.highlight(code, grammar, loadedLanguage);
        setHighlightedCode(highlighted);
      })
      .catch(() => {
        if (isActive) {
          setHighlightedCode(null);
        }
      });

    return () => {
      isActive = false;
    };
  }, [code, isNearViewport, normalizedLanguage]);

  const statusText =
    copyState === 'success'
      ? 'Copied'
      : copyState === 'unsupported'
        ? 'Copy unavailable'
        : copyState === 'error'
          ? 'Copy failed'
          : 'Copy';
  const languageLabel = language ? formatLanguageLabel(language) : 'Code';
  const feedbackPriority =
    copyState === 'error' || copyState === 'unsupported' ? 'assertive' : 'polite';

  return (
    <section className="code-viewer" aria-label="Snippet code">
      <div className="code-viewer-toolbar">
        <div className="code-viewer-info">
          <span className="code-viewer-language">{languageLabel}</span>
        </div>
        <div className="code-viewer-actions">
          {showCopy ? (
            <button
              type="button"
              onClick={handleCopy}
              className="code-viewer-copy"
              aria-label="Copy snippet code"
            >
              {statusText}
            </button>
          ) : null}
          <span className="code-viewer-feedback" role="status" aria-live={feedbackPriority}>
            {copyState === 'success'
              ? 'Copied to clipboard'
              : copyState === 'unsupported'
                ? 'Clipboard access unavailable'
                : copyState === 'error'
                  ? 'Unable to copy snippet'
                  : ''}
          </span>
        </div>
      </div>
      <pre className={`code-viewer-pre${wrap ? ' code-viewer-pre-wrap' : ''}`}>
        <code
          ref={codeRef}
          className={`language-${normalizedLanguage}`}
          {...(highlightedCode
            ? {
                dangerouslySetInnerHTML: { __html: highlightedCode },
              }
            : { children: code })}
        />
      </pre>
    </section>
  );
}
