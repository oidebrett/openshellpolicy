"use client";

import React, { useState, useEffect } from "react";
import { usePolicyDispatch } from "@/lib/policy/store";
import type { NetworkPolicyEntry, Endpoint, Binary, Rule } from "@/types/policy";
import { Protocol, Enforcement, Access } from "@/types/policy";

const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS", "*"];

function RuleEditor({
  rule,
  onChange,
  onRemove,
}: {
  rule: Rule;
  onChange: (r: Rule) => void;
  onRemove: () => void;
}) {
  return (
    <div className="bg-gray-900 border border-gray-700 rounded p-2 mb-2">
      <div className="flex gap-2 mb-2">
        <select
          value={rule.allow.method}
          onChange={(e) =>
            onChange({ allow: { ...rule.allow, method: e.target.value } })
          }
          className="w-24 bg-gray-800 border border-gray-700 rounded px-1 py-1 text-xs text-gray-100 focus:outline-none focus:border-green-600"
        >
          {HTTP_METHODS.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
        <input
          type="text"
          value={rule.allow.path}
          onChange={(e) =>
            onChange({ allow: { ...rule.allow, path: e.target.value } })
          }
          placeholder="/path/** (glob)"
          className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-100 focus:outline-none focus:border-green-600 font-mono"
        />
        <button onClick={onRemove} className="text-gray-600 hover:text-red-400 text-sm px-1">
          ×
        </button>
      </div>
    </div>
  );
}

function EndpointEditor({
  ep,
  onChange,
  onRemove,
}: {
  ep: Endpoint;
  onChange: (ep: Endpoint) => void;
  onRemove: () => void;
}) {
  const useRules = !!(ep.rules && ep.rules.length > 0) || (ep.access === undefined && ep.rules !== undefined);
  const [rulesMode, setRulesMode] = useState(useRules);

  function switchToRules() {
    setRulesMode(true);
    const { access: _a, ...rest } = ep;
    onChange({ ...rest, rules: [{ allow: { method: "GET", path: "/**" } }] });
  }

  function switchToAccess() {
    setRulesMode(false);
    const { rules: _r, ...rest } = ep;
    onChange({ ...rest, access: Access.READ_ONLY });
  }

  function addRule() {
    onChange({
      ...ep,
      rules: [...(ep.rules ?? []), { allow: { method: "GET", path: "/**" } }],
    });
  }

  function updateRule(idx: number, rule: Rule) {
    const rules = [...(ep.rules ?? [])];
    rules[idx] = rule;
    onChange({ ...ep, rules });
  }

  function removeRule(idx: number) {
    onChange({ ...ep, rules: (ep.rules ?? []).filter((_, i) => i !== idx) });
  }

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded p-3 mb-3">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-medium text-gray-400">Endpoint</span>
        <button onClick={onRemove} className="text-gray-600 hover:text-red-400 text-sm">
          Remove
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-2">
        <div>
          <label className="block text-xs text-gray-500 mb-1">host</label>
          <input
            type="text"
            value={ep.host}
            onChange={(e) => onChange({ ...ep, host: e.target.value })}
            placeholder="api.example.com"
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-100 focus:outline-none focus:border-green-600 font-mono"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">port</label>
          <input
            type="number"
            value={ep.port}
            min={1}
            max={65535}
            onChange={(e) => onChange({ ...ep, port: parseInt(e.target.value) || 443 })}
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-100 focus:outline-none focus:border-green-600"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">protocol</label>
          <select
            value={ep.protocol ?? ""}
            onChange={(e) => {
              const val = e.target.value as Protocol | "";
              onChange({ ...ep, protocol: val === "" ? undefined : val });
            }}
            className="w-full bg-gray-800 border border-gray-700 rounded px-1 py-1 text-xs text-gray-100 focus:outline-none focus:border-green-600"
          >
            <option value="">tcp (default)</option>
            <option value={Protocol.REST}>rest (L7 inspection)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">enforcement</label>
          <select
            value={ep.enforcement}
            onChange={(e) => onChange({ ...ep, enforcement: e.target.value as Enforcement })}
            className="w-full bg-gray-800 border border-gray-700 rounded px-1 py-1 text-xs text-gray-100 focus:outline-none focus:border-green-600"
          >
            <option value={Enforcement.ENFORCE}>enforce</option>
            <option value={Enforcement.AUDIT}>audit (log only)</option>
          </select>
        </div>
      </div>

      {/* Access vs Rules toggle */}
      <div className="flex gap-2 mb-2">
        <button
          onClick={switchToAccess}
          className={`text-xs px-2 py-1 rounded transition-colors ${
            !rulesMode
              ? "bg-green-900/60 text-green-400 border border-green-700"
              : "text-gray-500 hover:text-gray-300"
          }`}
        >
          Access preset
        </button>
        <button
          onClick={switchToRules}
          className={`text-xs px-2 py-1 rounded transition-colors ${
            rulesMode
              ? "bg-blue-900/60 text-blue-400 border border-blue-700"
              : "text-gray-500 hover:text-gray-300"
          }`}
        >
          Fine-grained rules
        </button>
      </div>

      {!rulesMode ? (
        <div>
          <label className="block text-xs text-gray-500 mb-1">access</label>
          <select
            value={ep.access ?? Access.READ_ONLY}
            onChange={(e) => onChange({ ...ep, access: e.target.value as Access })}
            className="w-full bg-gray-800 border border-gray-700 rounded px-1 py-1 text-xs text-gray-100 focus:outline-none focus:border-green-600"
          >
            <option value={Access.READ_ONLY}>read-only (GET, HEAD, OPTIONS)</option>
            <option value={Access.READ_WRITE}>read-write (+ POST, PUT, PATCH)</option>
            <option value={Access.FULL}>full (all methods)</option>
          </select>
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-500">Rules</span>
            <button
              onClick={addRule}
              className="text-xs text-green-500 hover:text-green-400"
            >
              + Add rule
            </button>
          </div>
          {(ep.rules ?? []).map((rule, i) => (
            <RuleEditor
              key={i}
              rule={rule}
              onChange={(r) => updateRule(i, r)}
              onRemove={() => removeRule(i)}
            />
          ))}
          {(ep.rules ?? []).length === 0 && (
            <p className="text-xs text-gray-600 italic">No rules — add at least one</p>
          )}
        </div>
      )}
    </div>
  );
}

interface Props {
  policyKey: string;
  entry: NetworkPolicyEntry;
  onClose: () => void;
  isNew?: boolean;
}

export default function NetworkPolicyForm({ policyKey, entry, onClose, isNew }: Props) {
  const dispatch = usePolicyDispatch();
  const [key, setKey] = useState(policyKey);
  const [draft, setDraft] = useState<NetworkPolicyEntry>(entry);
  const [binInput, setBinInput] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    setKey(policyKey);
    setDraft(entry);
  }, [policyKey, entry]);

  function validate(): boolean {
    const errs: string[] = [];
    if (!key.trim()) errs.push("Policy key is required");
    if (!draft.name?.trim()) errs.push("Policy name is required");
    if (draft.endpoints.length === 0) errs.push("At least one endpoint is required");
    draft.endpoints.forEach((ep, i) => {
      if (!ep.host) errs.push(`Endpoint ${i + 1}: host is required`);
      if (!ep.port || ep.port < 1 || ep.port > 65535)
        errs.push(`Endpoint ${i + 1}: port must be 1–65535`);
    });
    setErrors(errs);
    return errs.length === 0;
  }

  function save() {
    if (!validate()) return;
    dispatch({
      type: "UPDATE_NETWORK_ENTRY",
      payload: { key: key.trim(), entry: draft },
    });
    onClose();
  }

  function remove() {
    dispatch({ type: "DELETE_NETWORK_ENTRY", payload: { key: policyKey } });
    onClose();
  }

  function addBinary() {
    const path = binInput.trim();
    if (!path) return;
    setDraft((d) => ({
      ...d,
      binaries: [...(d.binaries ?? []), { path }],
    }));
    setBinInput("");
  }

  function removeBinary(idx: number) {
    setDraft((d) => ({
      ...d,
      binaries: (d.binaries ?? []).filter((_, i) => i !== idx),
    }));
  }

  function addEndpoint() {
    setDraft((d) => ({
      ...d,
      endpoints: [
        ...d.endpoints,
        { host: "", port: 443, enforcement: Enforcement.ENFORCE, access: Access.READ_ONLY },
      ],
    }));
  }

  function updateEndpoint(idx: number, ep: Endpoint) {
    setDraft((d) => {
      const eps = [...d.endpoints];
      eps[idx] = ep;
      return { ...d, endpoints: eps };
    });
  }

  function removeEndpoint(idx: number) {
    setDraft((d) => ({
      ...d,
      endpoints: d.endpoints.filter((_, i) => i !== idx),
    }));
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800">
        <span className="text-sm font-semibold text-gray-200">
          {isNew ? "New Policy Entry" : "Edit Policy Entry"}
        </span>
        <button onClick={onClose} className="text-gray-600 hover:text-gray-300 text-lg leading-none">
          ×
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {errors.length > 0 && (
          <div className="mb-3 bg-red-950/40 border border-red-800/50 rounded px-3 py-2">
            {errors.map((e, i) => (
              <p key={i} className="text-red-400 text-xs">
                {e}
              </p>
            ))}
          </div>
        )}

        {/* Key */}
        <div className="mb-3">
          <label className="block text-xs text-gray-400 mb-1">
            Policy key <span className="text-gray-600">(map key in YAML)</span>
          </label>
          <input
            type="text"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="github_api"
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-gray-100 focus:outline-none focus:border-green-600 font-mono"
          />
        </div>

        {/* Name */}
        <div className="mb-4">
          <label className="block text-xs text-gray-400 mb-1">
            name <span className="text-gray-600">(display name in logs)</span>
          </label>
          <input
            type="text"
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            placeholder="github-api-readonly"
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-gray-100 focus:outline-none focus:border-green-600"
          />
        </div>

        {/* Endpoints */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Endpoints
            </h3>
            <button
              onClick={addEndpoint}
              className="text-xs text-green-500 hover:text-green-400"
            >
              + Add endpoint
            </button>
          </div>
          {draft.endpoints.map((ep, i) => (
            <EndpointEditor
              key={i}
              ep={ep}
              onChange={(updated) => updateEndpoint(i, updated)}
              onRemove={() => removeEndpoint(i)}
            />
          ))}
          {draft.endpoints.length === 0 && (
            <p className="text-xs text-gray-600 italic">No endpoints — add at least one</p>
          )}
        </div>

        {/* Binaries */}
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Binaries
          </h3>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={binInput}
              onChange={(e) => setBinInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addBinary()}
              placeholder="/usr/local/bin/claude"
              className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-100 focus:outline-none focus:border-green-600 font-mono"
            />
            <button
              onClick={addBinary}
              className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 rounded"
            >
              Add
            </button>
          </div>
          <div className="space-y-1">
            {(draft.binaries ?? []).map((bin, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded px-2 py-1"
              >
                <span className="text-xs font-mono text-gray-300">{bin.path}</span>
                <button
                  onClick={() => removeBinary(i)}
                  className="text-gray-600 hover:text-red-400 text-sm ml-2"
                >
                  ×
                </button>
              </div>
            ))}
            {(draft.binaries ?? []).length === 0 && (
              <p className="text-xs text-gray-600 italic">No binaries — all binaries can use this policy if empty</p>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 px-3 py-2 border-t border-gray-800">
        <button
          onClick={save}
          className="flex-1 py-1.5 text-sm font-semibold text-gray-950 rounded transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#76b900" }}
        >
          Save
        </button>
        {!isNew && (
          <button
            onClick={remove}
            className="px-3 py-1.5 text-sm text-red-400 border border-red-900 hover:border-red-700 rounded transition-colors"
          >
            Delete
          </button>
        )}
        <button
          onClick={onClose}
          className="px-3 py-1.5 text-sm text-gray-400 hover:text-gray-200 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
