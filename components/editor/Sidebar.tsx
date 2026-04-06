"use client";

import React, { useState } from "react";
import { usePolicy, usePolicyDispatch } from "@/lib/policy/store";
import NetworkPolicyForm from "@/components/forms/NetworkPolicyForm";
import FilesystemForm from "@/components/forms/FilesystemForm";
import ProcessForm from "@/components/forms/ProcessForm";
import type { NetworkPolicyEntry } from "@/types/policy";
import { Enforcement, Access } from "@/types/policy";

type Tab = "network" | "filesystem" | "process";

interface EditState {
  key: string;
  entry: NetworkPolicyEntry;
  isNew: boolean;
}

function newEntry(key: string): NetworkPolicyEntry {
  return {
    name: key,
    endpoints: [
      {
        host: "",
        port: 443,
        enforcement: Enforcement.ENFORCE,
        access: Access.READ_ONLY,
      },
    ],
    binaries: [],
  };
}

export default function Sidebar() {
  const policy = usePolicy();
  const dispatch = usePolicyDispatch();
  const [tab, setTab] = useState<Tab>("network");
  const [editing, setEditing] = useState<EditState | null>(null);

  const networkEntries = Object.entries(policy.network_policies ?? {});

  function openNew() {
    const key = `policy_${Date.now()}`;
    setEditing({ key, entry: newEntry(key), isNew: true });
  }

  function openEdit(key: string, entry: NetworkPolicyEntry) {
    setEditing({ key, entry, isNew: false });
  }

  function closeEdit() {
    setEditing(null);
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "network", label: "Network" },
    { id: "filesystem", label: "Filesystem" },
    { id: "process", label: "Process" },
  ];

  // When editing a network entry, show the form full-height
  if (editing) {
    return (
      <NetworkPolicyForm
        policyKey={editing.key}
        entry={editing.entry}
        onClose={closeEdit}
        isNew={editing.isNew}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex border-b border-gray-800 flex-shrink-0">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              tab === t.id
                ? "text-white border-b-2 -mb-px"
                : "text-gray-500 hover:text-gray-300"
            }`}
            style={tab === t.id ? { borderBottomColor: "#76b900" } : {}}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === "network" && (
          <div>
            <div className="px-3 py-2 flex justify-between items-center border-b border-gray-800">
              <span className="text-xs text-gray-400 font-medium">
                {networkEntries.length} entr{networkEntries.length !== 1 ? "ies" : "y"}
              </span>
              <button
                onClick={openNew}
                className="text-xs px-2 py-1 rounded text-gray-950 font-semibold transition-opacity hover:opacity-80"
                style={{ backgroundColor: "#76b900" }}
              >
                + Add Policy
              </button>
            </div>

            {networkEntries.length === 0 && (
              <div className="px-3 py-6 text-center">
                <p className="text-xs text-gray-600">No network policies yet.</p>
                <p className="text-xs text-gray-600 mt-1">
                  All outbound traffic is <span className="text-red-500">denied</span> by default.
                </p>
                <button
                  onClick={openNew}
                  className="mt-3 text-xs underline underline-offset-2 hover:text-white transition-colors"
                  style={{ color: "#76b900" }}
                >
                  Add your first policy →
                </button>
              </div>
            )}

            {networkEntries.map(([key, entry]) => (
              <button
                key={key}
                onClick={() => openEdit(key, entry)}
                className="w-full text-left px-3 py-2.5 border-b border-gray-800 hover:bg-gray-800/50 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-200 group-hover:text-white">
                    {entry.name || key}
                  </span>
                  <span className="text-xs text-gray-600 group-hover:text-gray-400">
                    Edit →
                  </span>
                </div>
                <div className="mt-0.5 text-xs text-gray-500 font-mono truncate">
                  {entry.endpoints
                    .slice(0, 2)
                    .map((ep) => `${ep.host}:${ep.port}`)
                    .join(", ")}
                  {entry.endpoints.length > 2 && ` +${entry.endpoints.length - 2}`}
                </div>
                <div className="mt-0.5 flex gap-1 flex-wrap">
                  {entry.endpoints.slice(0, 2).map((ep, i) => (
                    <span
                      key={i}
                      className={`text-xs px-1 rounded ${
                        ep.enforcement === "audit"
                          ? "bg-orange-900/40 text-orange-400"
                          : "bg-green-900/40 text-green-500"
                      }`}
                    >
                      {ep.access ?? (ep.rules ? `${ep.rules.length} rules` : ep.enforcement)}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        )}

        {tab === "filesystem" && <FilesystemForm />}
        {tab === "process" && <ProcessForm />}
      </div>
    </div>
  );
}
