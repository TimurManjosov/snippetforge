"use client";

import { type ChangeEvent, useCallback, useState } from "react";

interface CodeEditorProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  disabled?: boolean;
  describedBy?: string;
  hasError?: boolean;
}

export default function CodeEditor({
  id,
  value,
  onChange,
  maxLength,
  disabled,
  describedBy,
  hasError,
}: CodeEditorProps) {
  const [wrap, setWrap] = useState(true);
  const count = value.length;

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      onChange(event.target.value);
    },
    [onChange],
  );

  const toggleWrap = useCallback(() => {
    setWrap((prev) => !prev);
  }, []);

  return (
    <div className="code-editor">
      <div className="code-editor-toolbar">
        <span className="code-editor-count">
          {maxLength ? `${count}/${maxLength}` : `${count} chars`}
        </span>
        <button type="button" onClick={toggleWrap} className="code-editor-toggle">
          Wrap: {wrap ? "On" : "Off"}
        </button>
      </div>
      <textarea
        id={id}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        maxLength={maxLength}
        wrap={wrap ? "soft" : "off"}
        aria-invalid={hasError}
        aria-describedby={describedBy}
        className="code-editor-textarea"
        spellCheck={false}
        placeholder="Paste or type your snippet here…"
      />
    </div>
  );
}
