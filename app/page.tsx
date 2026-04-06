import Link from "next/link";

const features = [
  {
    icon: "⬡",
    title: "Visual Editor",
    description:
      "Drag-and-drop policy graph built with React Flow. See your sandbox, endpoints, and binaries at a glance.",
  },
  {
    icon: "⇄",
    title: "YAML Sync",
    description:
      "Every visual change is instantly reflected in the Monaco YAML editor — and vice versa. Full bidirectional sync.",
  },
  {
    icon: "✓",
    title: "Live Validation",
    description:
      "Zod-powered schema validation catches invalid paths, root users, and access/rules conflicts in real time.",
  },
  {
    icon: "◈",
    title: "Tutorials",
    description:
      "Step-by-step walkthroughs: allow GitHub API, write L7 path rules, iterate safely with audit mode.",
  },
  {
    icon: "↑",
    title: "Import / Export",
    description:
      "Upload an existing policy YAML file or download your work with one click. No account required.",
  },
  {
    icon: "⊞",
    title: "L7 Rules",
    description:
      "Craft per-path HTTP rules (method + glob path + query params) when access presets aren't granular enough.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans">
      {/* Nav */}
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-sm flex items-center justify-center font-bold text-gray-950 text-sm"
            style={{ backgroundColor: "#76b900" }}
          >
            OS
          </div>
          <span className="font-semibold text-lg tracking-tight">
            OpenShell Policy
          </span>
        </div>
        <div className="flex items-center gap-6 text-sm text-gray-400">
          <a
            href="https://docs.nvidia.com/openshell/latest/reference/policy-schema.html"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            Docs
          </a>
          <a
            href="https://github.com/NVIDIA/OpenShell"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            GitHub
          </a>
          <Link
            href="/editor"
            className="px-4 py-2 rounded-md text-gray-950 font-semibold text-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#76b900" }}
          >
            Open Editor
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-20 text-center">
        <div
          className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-6 tracking-wider uppercase"
          style={{ backgroundColor: "#76b90020", color: "#76b900" }}
        >
          NVIDIA OpenShell
        </div>
        <h1 className="text-5xl font-bold leading-tight tracking-tight mb-6">
          Visual Policy Editor
          <br />
          for{" "}
          <span style={{ color: "#76b900" }}>NVIDIA OpenShell</span>
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed mb-10">
          Build, visualize, and validate OpenShell sandbox policies without
          hand-editing YAML. Inspired by{" "}
          <a
            href="https://networkpolicy.io"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-gray-200 transition-colors"
          >
            networkpolicy.io
          </a>{" "}
          for Kubernetes.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/editor"
            className="px-8 py-3 rounded-md font-semibold text-gray-950 text-base transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#76b900" }}
          >
            Open Editor
          </Link>
          <a
            href="https://docs.nvidia.com/openshell/latest/sandboxes/policies.html"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-3 rounded-md border border-gray-700 font-semibold text-gray-300 text-base hover:border-gray-500 hover:text-white transition-colors"
          >
            Read the Docs
          </a>
        </div>
      </section>

      {/* What is OpenShell */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
          <h2 className="text-2xl font-semibold mb-4">What is NVIDIA OpenShell?</h2>
          <p className="text-gray-400 leading-relaxed mb-4">
            OpenShell is an open-source sandbox runtime (Apache 2.0) for safely executing
            autonomous AI agents. It provides kernel-level isolation using Linux containers,
            Landlock LSM, and seccomp filters. Policies are declarative YAML files
            that control exactly what an agent can access — filesystem paths, network
            endpoints, and process identity.
          </p>
          <p className="text-gray-400 leading-relaxed mb-4">
            The default stance is <span className="text-white font-medium">deny-all</span> outbound
            traffic. You explicitly allow what each agent binary needs using named
            network policy entries. The network policy section is hot-reloadable at
            runtime; filesystem, landlock, and process settings are locked at sandbox
            creation.
          </p>
          <div className="flex gap-4 mt-6 flex-wrap">
            <a
              href="https://docs.nvidia.com/openshell/latest/reference/policy-schema.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm underline underline-offset-2 hover:text-white transition-colors"
              style={{ color: "#76b900" }}
            >
              Policy Schema Reference →
            </a>
            <a
              href="https://github.com/NVIDIA/OpenShell"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm underline underline-offset-2 hover:text-white transition-colors"
              style={{ color: "#76b900" }}
            >
              GitHub — NVIDIA/OpenShell →
            </a>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <h2 className="text-3xl font-semibold text-center mb-12">
          Everything you need to build safe agent policies
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-600 transition-colors"
            >
              <div
                className="text-2xl mb-4 font-mono"
                style={{ color: "#76b900" }}
              >
                {f.icon}
              </div>
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 px-6 py-8 text-center text-sm text-gray-600">
        <p>
          OpenShell Policy Editor — not affiliated with NVIDIA Corporation. For
          official support see{" "}
          <a
            href="https://docs.nvidia.com/openshell"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-gray-400 transition-colors"
          >
            docs.nvidia.com/openshell
          </a>
          .
        </p>
      </footer>
    </div>
  );
}
