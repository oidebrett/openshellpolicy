"use client";

import React, { useState } from "react";
import { usePolicy, usePolicyDispatch } from "@/lib/policy/store";
import type { FilesystemPolicy } from "@/types/policy";

function PathList({
  label,
  paths,
  onChange,
}: {
  label: string;
  paths: string[];
  onChange: (paths: string[]) => void;
}) {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  function add() {
    const trimmed = input.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith("/")) {
      setError("Path must be absolute (start with /)");
      return;
    }
    if (trimmed.includes("..")) {
      setError("Path cannot contain '..'");
      return;
    }
    if (paths.includes(trimmed)) {
      setError("Path already in list");
      return;
    }
    setError("");
    onChange([...paths, trimmed]);
    setInput("");
  }

  function remove(idx: number) {
    onChange(paths.filter((_, i) => i !== idx));
  }

  return (
    <div className="mb-4">
      <label className="block text-xs font-medium text-gray-400 mb-1">{label}</label>
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setError("");
          }}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="/path/to/dir"
          className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-100 focus:outline-none focus:border-green-600 font-mono"
        />
        <button
          onClick={add}
          className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 rounded transition-colors"
        >
          Add
        </button>
      </div>
      {error && <p className="text-red-400 text-xs mb-1">{error}</p>}
      <div className="flex flex-wrap gap-1 min-h-[28px]">
        {paths.map((p, i) => (
          <span
            key={i}
            className="flex items-center gap-1 bg-gray-800 border border-gray-700 rounded px-2 py-0.5 text-xs font-mono text-gray-300"
          >
            {p}
            <button
              onClick={() => remove(i)}
              className="text-gray-600 hover:text-red-400 transition-colors ml-1"
            >
              ×
            </button>
          </span>
        ))}
        {paths.length === 0 && (
          <span className="text-xs text-gray-600 italic">No paths added</span>
        )}
      </div>
    </div>
  );
}

export default function FilesystemForm() {
  const policy = usePolicy();
  const dispatch = usePolicyDispatch();

  const fs: FilesystemPolicy = policy.filesystem_policy ?? {};

  function update(patch: Partial<FilesystemPolicy>) {
    dispatch({ type: "UPDATE_FILESYSTEM", payload: { ...fs, ...patch } });
  }

  return (
    <div className="p-3">
      {/* Static warning */}
      <div className="mb-4 bg-amber-950/40 border border-amber-800/50 rounded px-3 py-2 text-xs text-amber-400">
        <strong>Static section</strong> — filesystem, landlock and process settings
        are locked at sandbox creation. Changes require recreating the sandbox.
      </div>

      {/* include_workdir */}
      <label className="flex items-center gap-2 mb-4 cursor-pointer group">
        <input
          type="checkbox"
          checked={fs.include_workdir ?? false}
          onChange={(e) => update({ include_workdir: e.target.checked })}
          className="w-4 h-4 rounded accent-green-500"
        />
        <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
          include_workdir
        </span>
        <span className="text-xs text-gray-600">
          (auto-add working directory to read_write)
        </span>
      </label>

      <PathList
        label="read_only paths"
        paths={fs.read_only ?? []}
        onChange={(paths) => update({ read_only: paths })}
      />

      <PathList
        label="read_write paths"
        paths={fs.read_write ?? []}
        onChange={(paths) => update({ read_write: paths })}
      />
    </div>
  );
}
