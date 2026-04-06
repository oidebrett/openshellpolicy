"use client";

import React, { useState } from "react";

interface TutorialStep {
  title: string;
  description: string;
  hint?: string;
  code?: string;
}

interface Tutorial {
  id: string;
  title: string;
  description: string;
  duration: string;
  steps: TutorialStep[];
}

const TUTORIALS: Tutorial[] = [
  {
    id: "github-readonly",
    title: "Allow GitHub API (Read-Only)",
    description: "Create your first network policy granting read-only access to the GitHub API.",
    duration: "~3 min",
    steps: [
      {
        title: "Default deny-all",
        description:
          "By default, every outbound connection from a sandbox is blocked. The canvas shows an empty sandbox node — no policies, no allowed traffic. Try running curl inside a sandbox and you'll get a 403 from the proxy.",
        hint: "This is the principle of least privilege: deny everything, then explicitly allow only what's needed.",
        code: "curl: (56) Received HTTP code 403 from proxy after CONNECT",
      },
      {
        title: "Add a network policy",
        description:
          "Click '+ Add Policy' in the left panel. Give it a key like 'github_api'. Set the name to 'github-api-readonly'. This name appears in deny logs so choose something descriptive.",
        hint: "The policy key is the YAML map key. The name field is the human-readable display name used in logs.",
      },
      {
        title: "Configure the endpoint",
        description:
          "Add an endpoint: host = api.github.com, port = 443. Set protocol = rest — this enables L7 HTTP inspection so OpenShell can enforce method-level rules. Set enforcement = enforce.",
      },
      {
        title: "Set access = read-only",
        description:
          "Choose the 'Access preset' mode and select 'read-only'. This allows GET, HEAD, and OPTIONS — but blocks POST, PUT, DELETE. The sandbox proxy will reject any mutating request.",
        hint: "read-only is a shorthand for three HTTP methods. Use 'Fine-grained rules' if you need per-path control.",
        code: "access: read-only  # GET, HEAD, OPTIONS only",
      },
      {
        title: "Add your agent binary",
        description:
          "In the Binaries section, add the path to your agent: /usr/local/bin/claude (or whichever binary you're sandboxing). Only the listed binaries can use this policy.",
        hint: "Glob patterns are supported: /usr/local/bin/cla* or /sandbox/.vscode-server/**",
        code: "binaries:\n  - path: /usr/local/bin/claude",
      },
      {
        title: "Apply and verify",
        description:
          "Click Save. The YAML panel updates instantly with your new policy. Apply it with: openshell policy set <sandbox> --policy your-policy.yaml --wait. The --wait flag blocks until the sandbox confirms the policy is loaded — no restart required.",
        code: "openshell policy set demo --policy github-readonly.yaml --wait",
      },
    ],
  },
  {
    id: "l7-rules",
    title: "Fine-Grained L7 Path Rules",
    description: "Write per-path HTTP rules instead of access presets for precise control.",
    duration: "~4 min",
    steps: [
      {
        title: "When access presets aren't enough",
        description:
          "Access presets (read-only, read-write, full) control HTTP methods but not paths. If you need to allow GET /repos/** but block GET /admin/**, you need fine-grained rules.",
        hint: "rules and access are mutually exclusive on the same endpoint — you use one or the other.",
      },
      {
        title: "Add a policy and set protocol=rest",
        description:
          "Create a new network policy entry. Add an endpoint for your target host. Set protocol = rest — L7 rules only work when the proxy can inspect HTTP traffic. Omit protocol for raw TCP passthrough (no method/path matching).",
        code: "protocol: rest  # enables HTTP inspection",
      },
      {
        title: "Switch to Fine-grained rules",
        description:
          "In the endpoint editor, click 'Fine-grained rules' to switch from access preset to per-rule mode. You'll see a rule list. Each rule has a method, a path glob, and optional query parameter matchers.",
      },
      {
        title: "Add a GET rule with path glob",
        description:
          "Add a rule: method = GET, path = /repos/**. The ** glob matches any number of path segments, so this allows reading any repository resource: /repos/owner/repo, /repos/owner/repo/contents, etc.",
        hint: "Use * for a single path segment and ** for multiple. /repos/*/issues matches /repos/owner/issues but not /repos/owner/repo/issues.",
        code: "- allow:\n    method: GET\n    path: /repos/**",
      },
      {
        title: "Add a POST rule scoped to one path",
        description:
          "Add another rule: method = POST, path = /repos/*/issues. This allows creating issues in any repository but blocks all other POST targets. The agent can read broadly but only write to a specific endpoint.",
        code: "- allow:\n    method: POST\n    path: /repos/*/issues",
      },
      {
        title: "Save and inspect the YAML",
        description:
          "Click Save. Look at the YAML panel — the rules array appears under the endpoint. Notice that the access field is absent: rules and access are mutually exclusive. The edge in the graph shows '2 rules' as the label.",
        code: "endpoints:\n  - host: api.github.com\n    port: 443\n    protocol: rest\n    enforcement: enforce\n    rules:\n      - allow:\n          method: GET\n          path: /repos/**\n      - allow:\n          method: POST\n          path: /repos/*/issues",
      },
    ],
  },
  {
    id: "audit-mode",
    title: "Audit Mode — Build Policy Iteratively",
    description: "Use audit mode to observe traffic before blocking it. Build policies from real behavior.",
    duration: "~3 min",
    steps: [
      {
        title: "The problem with guessing",
        description:
          "Writing a policy from scratch means guessing every endpoint your agent needs. Miss one and the agent fails at runtime. OpenShell's audit mode lets you observe real traffic first, then lock it down.",
        hint: "Audit mode is the OpenShell equivalent of 'permissive' in SELinux — log violations without blocking.",
      },
      {
        title: "Add a policy with enforcement=audit",
        description:
          "Create a new policy entry for your agent. Add an endpoint that covers the expected traffic (or even a wildcard host). Set enforcement = audit instead of enforce. The edge in the graph will be animated orange to indicate audit mode.",
        code: "enforcement: audit  # log only, no blocking",
      },
      {
        title: "Run your agent",
        description:
          "Deploy the sandbox with the audit policy. Run your agent normally — all traffic flows through but OpenShell logs every request it would have blocked under enforce mode. No need to predict every endpoint in advance.",
        hint: "Use --keep when creating the sandbox so it stays alive for inspection: openshell sandbox create --name dev --keep",
      },
      {
        title: "Inspect the deny logs",
        description:
          "After running your agent, pull the logs from outside the sandbox. Look for l7_decision=deny lines — these are requests that passed in audit mode but would be blocked in enforce mode.",
        code: "openshell logs dev --level warn --since 30m\n\n# You'll see lines like:\n# l7_decision=deny dst_host=api.github.com l7_action=POST\n# action=deny dst_host=registry.npmjs.org deny_reason=\"no matching policy\"",
      },
      {
        title: "Add policies for observed endpoints",
        description:
          "For each denied destination in the logs, add a network policy entry in the editor. Use the host/port from the log. Start with access=full while you understand the traffic, then tighten to read-only or rules.",
        hint: "Build iteratively: add what you observe, re-run the agent, check logs, repeat until clean.",
      },
      {
        title: "Switch to enforce",
        description:
          "Once your logs are clean (no unexpected denials), switch all endpoints from enforcement=audit to enforcement=enforce. Apply the updated policy. Now your agent has a tightly-scoped policy built from actual behavior — not guesswork.",
        code: "# Before:\nenforcement: audit\n\n# After:\nenforcement: enforce",
      },
    ],
  },
];

export default function TutorialPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  function openTutorial(t: Tutorial) {
    setSelectedTutorial(t);
    setCurrentStep(0);
  }

  function closeTutorial() {
    setSelectedTutorial(null);
    setCurrentStep(0);
  }

  function next() {
    if (selectedTutorial && currentStep < selectedTutorial.steps.length - 1) {
      setCurrentStep((s) => s + 1);
    }
  }

  function prev() {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  }

  const step = selectedTutorial?.steps[currentStep];

  return (
    <div className="absolute bottom-0 right-0 z-20 w-80">
      {/* Collapsed toggle */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="absolute bottom-3 right-3 px-3 py-2 text-xs font-semibold text-gray-950 rounded-md shadow-lg transition-opacity hover:opacity-90 flex items-center gap-1.5"
          style={{ backgroundColor: "#76b900" }}
        >
          <span>◈</span>
          Tutorials
        </button>
      )}

      {/* Open panel */}
      {isOpen && (
        <div className="bg-gray-900 border border-gray-700 rounded-tl-xl shadow-2xl overflow-hidden"
          style={{ maxHeight: "70vh", width: 320 }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800"
            style={{ borderTopColor: "#76b900", borderTopWidth: 2 }}>
            <div className="flex items-center gap-2">
              {selectedTutorial && (
                <button
                  onClick={closeTutorial}
                  className="text-gray-500 hover:text-gray-300 text-sm mr-1"
                >
                  ←
                </button>
              )}
              <span className="text-sm font-semibold text-gray-100">
                {selectedTutorial ? selectedTutorial.title : "Tutorials"}
              </span>
            </div>
            <button
              onClick={() => {
                setIsOpen(false);
                closeTutorial();
              }}
              className="text-gray-600 hover:text-gray-300"
            >
              ×
            </button>
          </div>

          {/* Tutorial list */}
          {!selectedTutorial && (
            <div className="overflow-y-auto" style={{ maxHeight: "calc(70vh - 52px)" }}>
              {TUTORIALS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => openTutorial(t)}
                  className="w-full text-left px-4 py-3 border-b border-gray-800 hover:bg-gray-800/50 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium text-gray-200 group-hover:text-white">
                      {t.title}
                    </span>
                    <span className="text-xs text-gray-600 flex-shrink-0 mt-0.5">{t.duration}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{t.description}</p>
                </button>
              ))}
              <div className="px-4 py-3 text-xs text-gray-600 text-center">
                <a
                  href="https://docs.nvidia.com/openshell/latest/tutorials/first-network-policy.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-gray-400 transition-colors"
                >
                  Full tutorial docs →
                </a>
              </div>
            </div>
          )}

          {/* Step view */}
          {selectedTutorial && step && (
            <div className="flex flex-col overflow-hidden" style={{ maxHeight: "calc(70vh - 52px)" }}>
              {/* Progress bar */}
              <div className="h-1 bg-gray-800 flex-shrink-0">
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    backgroundColor: "#76b900",
                    width: `${((currentStep + 1) / selectedTutorial.steps.length) * 100}%`,
                  }}
                />
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4">
                {/* Step counter */}
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="text-xs font-mono px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: "#76b90030", color: "#76b900" }}
                  >
                    {currentStep + 1} / {selectedTutorial.steps.length}
                  </span>
                  <div className="flex gap-1">
                    {selectedTutorial.steps.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentStep(i)}
                        className="w-1.5 h-1.5 rounded-full transition-colors"
                        style={{
                          backgroundColor: i <= currentStep ? "#76b900" : "#374151",
                        }}
                      />
                    ))}
                  </div>
                </div>

                <h3 className="text-sm font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed mb-3">{step.description}</p>

                {step.hint && (
                  <div className="bg-blue-950/30 border border-blue-900/40 rounded px-3 py-2 mb-3">
                    <p className="text-xs text-blue-300 leading-relaxed">
                      <span className="font-semibold">Tip: </span>
                      {step.hint}
                    </p>
                  </div>
                )}

                {step.code && (
                  <pre className="bg-gray-950 border border-gray-800 rounded px-3 py-2 text-xs text-green-400 font-mono overflow-x-auto whitespace-pre-wrap break-words">
                    {step.code}
                  </pre>
                )}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800 flex-shrink-0">
                <button
                  onClick={prev}
                  disabled={currentStep === 0}
                  className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  ← Back
                </button>

                {currentStep < selectedTutorial.steps.length - 1 ? (
                  <button
                    onClick={next}
                    className="px-4 py-1.5 text-xs font-semibold text-gray-950 rounded transition-opacity hover:opacity-90"
                    style={{ backgroundColor: "#76b900" }}
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    onClick={closeTutorial}
                    className="px-4 py-1.5 text-xs font-semibold text-gray-950 rounded transition-opacity hover:opacity-90"
                    style={{ backgroundColor: "#76b900" }}
                  >
                    Done ✓
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
