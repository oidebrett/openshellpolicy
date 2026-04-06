# OpenShell Policy Editor

A visual editor for [NVIDIA OpenShell](https://docs.nvidia.com/openshell/latest/) sandbox policies — build, visualize, and validate agent sandbox policies without hand-editing YAML.

[![npm](https://img.shields.io/npm/v/@contextware/openshellpolicy)](https://www.npmjs.com/package/@contextware/openshellpolicy)

---

## Quickstart

```bash
npx @contextware/openshellpolicy
```

Opens the editor in your browser at `http://localhost:3847/editor/`. No install, no account, no data leaves your machine.

---

## Features

- **Visual graph** — sandbox node, endpoints, and binaries with color-coded edges showing access level and enforcement mode
- **Bidirectional YAML sync** — edit visually or paste raw YAML; both stay in sync in real time
- **Live validation** — catches invalid paths, root process identity, access/rules conflicts, and port errors as you type
- **Form-based builder** — add endpoints, set L7 rules (method + path glob), scope to specific binaries
- **Import / Export** — upload an existing policy file or download the one you built
- **Built-in tutorials** — three step-by-step walkthroughs covering common patterns

---

## Running from source

```bash
git clone https://github.com/oidebrett/openshellpolicy.git
cd openshellpolicy
npm install
npm run dev       # dev server at http://localhost:3000
npm run build     # production static export → out/
npm test          # vitest unit tests
```

**Stack:** Next.js 16 · TypeScript · React Flow · Monaco Editor · Tailwind CSS · Zod · js-yaml · Vitest

---

## Learn more

For background on NVIDIA OpenShell, what policies control, the full schema reference, and tutorial walkthroughs — visit the editor landing page after running `npx @contextware/openshellpolicy`, or go straight to the [OpenShell docs](https://docs.nvidia.com/openshell/latest/).

---

## Related packages

- [`@contextware/mcp-scan`](https://www.npmjs.com/package/@contextware/mcp-scan) — Zero-dependency CLI for discovering unprotected MCP servers
- [`@contextware/better-agents`](https://www.npmjs.com/package/@contextware/better-agents) — CLI for production-ready agent projects with LangWatch best practices

---

## Contributing

Issues and PRs welcome. If you find a gap between the editor's schema support and the official OpenShell docs, please open an issue with a link to the relevant doc section.

---

> Not affiliated with or endorsed by NVIDIA Corporation.
