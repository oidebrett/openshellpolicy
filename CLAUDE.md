# CLAUDE.md

## Project: openshellpolicy

A visual policy editor for NVIDIA OpenShell sandbox policies, inspired by [networkpolicy.io](https://networkpolicy.io) for Kubernetes.

## What is NVIDIA OpenShell?

OpenShell is an open-source sandbox runtime for safely executing autonomous AI agents (Apache 2.0). It provides kernel-level isolation using Linux containers, Landlock LSM, and seccomp filters. Policies are declarative YAML files that control what an agent can access.

## Policy Schema (version: 1)

### Static Sections (locked at sandbox creation)
- **filesystem_policy**: `include_workdir` (bool), `read_only` (path list), `read_write` (path list)
- **landlock**: `compatibility` (`best_effort` | `hard_requirement`)
- **process**: `run_as_user` (string, default `sandbox`), `run_as_group` (string, default `sandbox`)

### Dynamic Section: network_policies (hot-reloadable)
A map of named policy entries, each with:
- **name**: display name for logs
- **endpoints[]**: `host`, `port`, `protocol` (`rest` for L7), `tls` (`skip`), `enforcement` (`enforce`|`audit`), `access` (`full`|`read-only`|`read-write`) OR `rules[]`
- **rules[]**: `allow.method`, `allow.path` (glob), `allow.query` (param matchers)
- **binaries[]**: `path` (supports globs)

Default: **deny-all** outbound traffic unless explicitly allowed.

## Tech Stack

- **Next.js 16 (App Router) + TypeScript**
- **React Flow** for visual policy graph
- **Monaco Editor** for YAML panel
- **Tailwind CSS** for styling
- **js-yaml** for YAML parsing/generation
- **Zod** for schema validation
- **Vitest** for unit tests
- **Deployment**: Static export to GitHub Pages

## Development

```bash
npm install
npm run dev       # Start dev server (http://localhost:3000)
npm run build     # Production build
npm run lint      # Lint
npm test          # Run tests
```

## Reference

- [OpenShell Policy Schema Reference](https://docs.nvidia.com/openshell/latest/reference/policy-schema.html)
- [Customize Sandbox Policies](https://docs.nvidia.com/openshell/latest/sandboxes/policies.html)
- [GitHub - NVIDIA/OpenShell](https://github.com/NVIDIA/OpenShell)
