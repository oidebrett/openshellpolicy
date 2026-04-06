"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { usePolicy, usePolicyDispatch } from "@/lib/policy/store";
import { serializePolicy, parsePolicy } from "@/lib/yaml/policy-yaml";
import { validatePolicy } from "@/lib/schema/policy-schema";

// Monaco editor with SSR disabled
const MonacoEditor = dynamic(
  () => import("@monaco-editor/react").then((m) => m.default),
  { ssr: false }
);

export default function YamlPanel() {
  const policy = usePolicy();
  const dispatch = usePolicyDispatch();

  const [yamlStr, setYamlStr] = useState(() => serializePolicy(policy));
  const [errors, setErrors] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  // Track whether the YAML change came from the visual editor or from user typing
  const isFromVisual = useRef(false);
  const isFromYaml = useRef(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // When policy store changes (from visual editor), update YAML
  useEffect(() => {
    if (isFromYaml.current) return;
    isFromVisual.current = true;
    const newYaml = serializePolicy(policy);
    setYamlStr(newYaml);
    // Validate
    const { errors: errs } = validatePolicy(newYaml);
    setErrors(errs);
    // Reset flag after render
    setTimeout(() => { isFromVisual.current = false; }, 0);
  }, [policy]);

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (isFromVisual.current) return;
      const val = value ?? "";
      setYamlStr(val);

      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        const { valid, errors: errs, policy: parsed } = validatePolicy(val);
        setErrors(errs);
        if (valid && parsed) {
          isFromYaml.current = true;
          dispatch({ type: "SET_POLICY", payload: parsed });
          setTimeout(() => { isFromYaml.current = false; }, 0);
        }
      }, 400);
    },
    [dispatch]
  );

  function handleCopy() {
    navigator.clipboard.writeText(yamlStr).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function handleDownload() {
    const blob = new Blob([yamlStr], { type: "text/yaml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "openshell-policy.yaml";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parsePolicy(text);
      if (parsed) {
        isFromYaml.current = true;
        dispatch({ type: "SET_POLICY", payload: parsed });
        setTimeout(() => { isFromYaml.current = false; }, 0);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-400">YAML</span>
          {errors.length > 0 ? (
            <span className="text-xs text-red-400 bg-red-950/40 border border-red-900/50 px-1.5 py-0.5 rounded">
              {errors.length} error{errors.length > 1 ? "s" : ""}
            </span>
          ) : (
            <span className="text-xs text-green-500 bg-green-950/40 border border-green-900/50 px-1.5 py-0.5 rounded">
              valid
            </span>
          )}
        </div>
        <div className="flex gap-1">
          <button
            onClick={handleCopy}
            className="px-2 py-1 text-xs text-gray-400 hover:text-gray-200 transition-colors"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
          <button
            onClick={handleDownload}
            className="px-2 py-1 text-xs text-gray-400 hover:text-gray-200 transition-colors"
          >
            Download
          </button>
          <label className="px-2 py-1 text-xs text-gray-400 hover:text-gray-200 transition-colors cursor-pointer">
            Upload
            <input
              type="file"
              accept=".yaml,.yml"
              className="hidden"
              onChange={handleUpload}
            />
          </label>
        </div>
      </div>

      {/* Monaco editor */}
      <div className="flex-1 min-h-0">
        <MonacoEditor
          height="100%"
          language="yaml"
          value={yamlStr}
          onChange={handleEditorChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 12,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            wordWrap: "on",
            tabSize: 2,
            renderLineHighlight: "gutter",
            folding: true,
            padding: { top: 8, bottom: 8 },
          }}
        />
      </div>

      {/* Validation errors */}
      {errors.length > 0 && (
        <div className="border-t border-red-900/30 bg-red-950/20 px-3 py-2 max-h-32 overflow-y-auto flex-shrink-0">
          {errors.map((err, i) => (
            <p key={i} className="text-xs text-red-400 font-mono mb-0.5">
              {err}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
