"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { usePolicy, usePolicyDispatch } from "@/lib/policy/store";
import { serializePolicy, parsePolicy } from "@/lib/yaml/policy-yaml";

export default function Header() {
  const policy = usePolicy();
  const dispatch = usePolicyDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleDownload() {
    const yamlStr = serializePolicy(policy);
    const blob = new Blob([yamlStr], { type: "text/yaml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "openshell-policy.yaml";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parsePolicy(text);
      if (parsed) {
        dispatch({ type: "SET_POLICY", payload: parsed });
      } else {
        alert("Invalid policy YAML — could not parse.");
      }
    };
    reader.readAsText(file);
    // Reset so same file can be re-uploaded
    e.target.value = "";
  }

  return (
    <header className="h-12 flex-shrink-0 border-b border-gray-800 flex items-center justify-between px-4 bg-gray-950">
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div
            className="w-6 h-6 rounded-sm flex items-center justify-center font-bold text-gray-950 text-xs"
            style={{ backgroundColor: "#76b900" }}
          >
            OS
          </div>
          <span className="font-semibold text-sm text-gray-100 tracking-tight">
            OpenShell Policy Editor
          </span>
        </Link>
        <span className="text-gray-700 text-xs hidden sm:block">
          — NVIDIA OpenShell v1
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".yaml,.yml"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-1 text-xs font-medium text-gray-300 border border-gray-700 rounded hover:border-gray-500 hover:text-white transition-colors"
        >
          Import YAML
        </button>

        {/* Export */}
        <button
          onClick={handleDownload}
          className="px-3 py-1 text-xs font-medium text-gray-950 rounded transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#76b900" }}
        >
          Download
        </button>

        {/* Docs link */}
        <a
          href="https://docs.nvidia.com/openshell/latest/reference/policy-schema.html"
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1 text-xs text-gray-500 hover:text-gray-300 transition-colors hidden sm:block"
        >
          Schema Docs
        </a>
      </div>
    </header>
  );
}
