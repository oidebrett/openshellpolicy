# OpenShell Policy Editor

A visual editor for [NVIDIA OpenShell](https://docs.nvidia.com/openshell/latest/) sandbox policies — think of it as [networkpolicy.io](https://networkpolicy.io) but for AI agent sandboxes instead of Kubernetes pods.

---

## What is NVIDIA OpenShell?

NVIDIA OpenShell is an open-source sandbox runtime (Apache 2.0) for safely running autonomous AI agents (Claude Code, Codex, Copilot, etc.) on your infrastructure. It wraps each agent in a Linux container with kernel-level enforcement via **Landlock LSM** and **seccomp filters**, then sits a policy-aware proxy in front of all outbound network traffic.

The default posture is **deny-all**. Nothing gets out unless you explicitly say so in a policy file.

Policies are declarative YAML. They control three things:

| Section | What it controls | Hot-reloadable? |
|---------|-----------------|----------------|
| `filesystem_policy` | Which directories the agent can read or write | No — locked at sandbox creation |
| `process` | OS user/group the agent runs as | No — locked at sandbox creation |
| `network_policies` | Which binaries can reach which endpoints, and how | **Yes** — apply without restart |

The network policy section supports **L7 enforcement**: the proxy terminates TLS, inspects HTTP traffic, and can allow or deny based on method (`GET`, `POST`, etc.) and URL path glob — not just host and port.

---

## Why this editor?

Writing OpenShell policies by hand is manageable for one sandbox. It gets painful fast when you're managing multiple agents, iterating on policy, or onboarding a team that doesn't know the schema by heart.

This editor gives you:

- **Visual graph** — see your sandbox, every allowed endpoint, and every scoped binary at a glance. Color-coded edges show access level (read-only, read-write, full) and enforcement mode (enforce vs audit).
- **Bidirectional YAML sync** — edit visually and watch the YAML update in real time, or paste/upload raw YAML and have it render as a graph immediately.
- **Live schema validation** — catches common mistakes before you deploy: non-absolute paths, root process identity, `access` and `rules` set on the same endpoint, port out of range.
- **Form-based policy builder** — add endpoints, set L7 rules (method + path glob), scope to specific binaries — no YAML muscle memory required.
- **Import / export** — upload an existing policy file or download the one you've built. No account, no cloud, no data leaves your browser.
- **Step-by-step tutorials** — built into the editor, covering the common patterns from scratch.

---

## Quickstart

```bash
git clone https://github.com/oidebrett/openshellpolicy.git
cd openshellpolicy
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The landing page links to the editor at `/editor`. No backend required — everything runs in the browser.

---

## Tutorials (built into the editor)

The editor includes three guided walkthroughs accessible from the bottom-right corner:

**1. Allow GitHub API (Read-Only)**
Start from a blank policy, add a network policy entry for `api.github.com:443`, set `access: read-only`, scope it to your agent binary. Covers the default-deny baseline and how `access` presets map to HTTP methods.

**2. Fine-Grained L7 Path Rules**
When access presets aren't precise enough, write per-path rules. Covers `protocol: rest`, the difference between `*` and `**` glob patterns, and why `access` and `rules` are mutually exclusive on the same endpoint.

**3. Audit Mode — Build Policy Iteratively**
Don't guess which endpoints your agent needs. Start with `enforcement: audit`, run the agent, inspect the deny logs, then flip to `enforcement: enforce` once the policy is clean. Covers the full iterate-from-observation workflow.

---

## Policy schema reference

```yaml
version: 1                        # required, must be 1

filesystem_policy:                # static — locked at sandbox creation
  include_workdir: true           # add agent's working directory to read_write
  read_only: [/usr, /etc, /lib]
  read_write: [/tmp, /sandbox]

landlock:
  compatibility: best_effort      # or hard_requirement

process:
  run_as_user: sandbox            # cannot be root or 0
  run_as_group: sandbox

network_policies:                 # dynamic — hot-reloadable via openshell policy set
  github_api:
    name: github-api-readonly
    endpoints:
      - host: api.github.com
        port: 443
        protocol: rest            # enables L7 HTTP inspection
        enforcement: enforce      # or audit (log only, no blocking)
        access: read-only         # GET, HEAD, OPTIONS only
        # OR use fine-grained rules (mutually exclusive with access):
        # rules:
        #   - allow: { method: GET, path: /repos/** }
        #   - allow: { method: POST, path: /repos/*/issues }
    binaries:
      - path: /usr/local/bin/claude
```

Full reference: [docs.nvidia.com/openshell/latest/reference/policy-schema.html](https://docs.nvidia.com/openshell/latest/reference/policy-schema.html)

---

## Development

```bash
npm run dev       # dev server at http://localhost:3000
npm run build     # production build
npm test          # run unit tests (vitest)
npm run lint      # ESLint
```

**Stack:** Next.js 16 · TypeScript · React Flow · Monaco Editor · Tailwind CSS · Zod · js-yaml · Vitest

---

## Contributing

Issues and PRs welcome. If you find a gap between the editor's schema support and the official OpenShell docs, please open an issue with a link to the relevant doc section.

---

## Disclaimer

This project is not affiliated with or endorsed by NVIDIA Corporation. For official OpenShell support, see [docs.nvidia.com/openshell](https://docs.nvidia.com/openshell).
