import { describe, it, expect } from "vitest";
import {
  parsePolicy,
  serializePolicy,
  getDefaultPolicy,
  applyNetworkPolicyPatch,
} from "../lib/yaml/policy-yaml";
import type { OpenShellPolicy, NetworkPolicyEntry } from "../types/policy";
import { Enforcement, Access } from "../types/policy";

describe("getDefaultPolicy", () => {
  it("returns version 1", () => {
    const policy = getDefaultPolicy();
    expect(policy.version).toBe(1);
  });

  it("has filesystem_policy with expected defaults", () => {
    const policy = getDefaultPolicy();
    expect(policy.filesystem_policy?.include_workdir).toBe(true);
    expect(policy.filesystem_policy?.read_only).toContain("/etc");
    expect(policy.filesystem_policy?.read_write).toContain("/tmp");
  });

  it("has process defaults of sandbox user", () => {
    const policy = getDefaultPolicy();
    expect(policy.process?.run_as_user).toBe("sandbox");
    expect(policy.process?.run_as_group).toBe("sandbox");
  });

  it("has best_effort landlock by default", () => {
    const policy = getDefaultPolicy();
    expect(policy.landlock?.compatibility).toBe("best_effort");
  });

  it("has empty network_policies", () => {
    const policy = getDefaultPolicy();
    expect(policy.network_policies).toEqual({});
  });
});

describe("serializePolicy", () => {
  it("produces valid YAML string", () => {
    const policy = getDefaultPolicy();
    const yaml = serializePolicy(policy);
    expect(typeof yaml).toBe("string");
    expect(yaml).toContain("version: 1");
  });

  it("includes network policies in output", () => {
    const policy: OpenShellPolicy = {
      version: 1,
      network_policies: {
        github: {
          name: "github-api",
          endpoints: [
            { host: "api.github.com", port: 443, enforcement: Enforcement.ENFORCE, access: Access.READ_ONLY },
          ],
          binaries: [{ path: "/usr/local/bin/claude" }],
        },
      },
    };
    const yaml = serializePolicy(policy);
    expect(yaml).toContain("api.github.com");
    expect(yaml).toContain("read-only");
    expect(yaml).toContain("/usr/local/bin/claude");
  });

  it("omits undefined fields", () => {
    const policy: OpenShellPolicy = { version: 1 };
    const yaml = serializePolicy(policy);
    expect(yaml).not.toContain("filesystem_policy");
    expect(yaml).not.toContain("network_policies");
  });
});

describe("parsePolicy", () => {
  it("parses valid policy YAML", () => {
    const yaml = `
version: 1
process:
  run_as_user: sandbox
  run_as_group: sandbox
`;
    const result = parsePolicy(yaml);
    expect(result).not.toBeNull();
    expect(result?.version).toBe(1);
    expect(result?.process?.run_as_user).toBe("sandbox");
  });

  it("returns null for invalid YAML syntax", () => {
    const result = parsePolicy("version: 1\n  bad: [");
    expect(result).toBeNull();
  });

  it("returns null for wrong version", () => {
    const result = parsePolicy("version: 2");
    expect(result).toBeNull();
  });

  it("returns null for empty string", () => {
    const result = parsePolicy("");
    expect(result).toBeNull();
  });

  it("parses network policies correctly", () => {
    const yaml = `
version: 1
network_policies:
  github:
    name: github-api
    endpoints:
      - host: api.github.com
        port: 443
        enforcement: enforce
        access: read-only
    binaries:
      - path: /usr/local/bin/claude
`;
    const result = parsePolicy(yaml);
    expect(result?.network_policies?.github?.endpoints[0].host).toBe("api.github.com");
    expect(result?.network_policies?.github?.binaries?.[0].path).toBe("/usr/local/bin/claude");
  });
});

describe("round-trip: serialize → parse", () => {
  it("round-trips default policy without loss", () => {
    const original = getDefaultPolicy();
    const yaml = serializePolicy(original);
    const parsed = parsePolicy(yaml);
    expect(parsed?.version).toBe(original.version);
    expect(parsed?.process?.run_as_user).toBe(original.process?.run_as_user);
    expect(parsed?.landlock?.compatibility).toBe(original.landlock?.compatibility);
  });

  it("round-trips network policies without loss", () => {
    const original: OpenShellPolicy = {
      version: 1,
      network_policies: {
        npm: {
          name: "npm-registry",
          endpoints: [
            { host: "registry.npmjs.org", port: 443, enforcement: Enforcement.ENFORCE, access: Access.READ_ONLY },
          ],
          binaries: [{ path: "/usr/bin/npm" }],
        },
      },
    };
    const yaml = serializePolicy(original);
    const parsed = parsePolicy(yaml);
    expect(parsed?.network_policies?.npm?.name).toBe("npm-registry");
    expect(parsed?.network_policies?.npm?.endpoints[0].host).toBe("registry.npmjs.org");
  });

  it("round-trips L7 rules without loss", () => {
    const original: OpenShellPolicy = {
      version: 1,
      network_policies: {
        custom: {
          name: "custom",
          endpoints: [
            {
              host: "api.example.com",
              port: 443,
              enforcement: Enforcement.ENFORCE,
              rules: [{ allow: { method: "GET", path: "/repos/**" } }],
            },
          ],
          binaries: [{ path: "/usr/bin/curl" }],
        },
      },
    };
    const yaml = serializePolicy(original);
    const parsed = parsePolicy(yaml);
    expect(parsed?.network_policies?.custom?.endpoints[0].rules?.[0].allow.method).toBe("GET");
    expect(parsed?.network_policies?.custom?.endpoints[0].rules?.[0].allow.path).toBe("/repos/**");
  });
});

describe("applyNetworkPolicyPatch", () => {
  it("adds a new entry to network_policies", () => {
    const base = getDefaultPolicy();
    const entry: NetworkPolicyEntry = {
      name: "github",
      endpoints: [{ host: "api.github.com", port: 443, enforcement: Enforcement.ENFORCE, access: Access.READ_ONLY }],
    };
    const result = applyNetworkPolicyPatch(base, "github_api", entry);
    expect(result.network_policies?.github_api).toBeDefined();
    expect(result.network_policies?.github_api?.name).toBe("github");
  });

  it("overwrites an existing entry with the same key", () => {
    const base: OpenShellPolicy = {
      version: 1,
      network_policies: {
        github_api: {
          name: "old-name",
          endpoints: [{ host: "old.com", port: 80, enforcement: Enforcement.ENFORCE }],
        },
      },
    };
    const entry: NetworkPolicyEntry = {
      name: "new-name",
      endpoints: [{ host: "api.github.com", port: 443, enforcement: Enforcement.ENFORCE, access: Access.FULL }],
    };
    const result = applyNetworkPolicyPatch(base, "github_api", entry);
    expect(result.network_policies?.github_api?.name).toBe("new-name");
    expect(result.network_policies?.github_api?.endpoints[0].host).toBe("api.github.com");
  });

  it("preserves other entries when patching", () => {
    const base: OpenShellPolicy = {
      version: 1,
      network_policies: {
        existing: {
          name: "existing",
          endpoints: [{ host: "kept.com", port: 443, enforcement: Enforcement.ENFORCE }],
        },
      },
    };
    const entry: NetworkPolicyEntry = {
      name: "new",
      endpoints: [{ host: "new.com", port: 443, enforcement: Enforcement.AUDIT }],
    };
    const result = applyNetworkPolicyPatch(base, "new_policy", entry);
    expect(result.network_policies?.existing).toBeDefined();
    expect(result.network_policies?.new_policy).toBeDefined();
  });

  it("does not mutate the original policy", () => {
    const base = getDefaultPolicy();
    const entry: NetworkPolicyEntry = {
      name: "test",
      endpoints: [{ host: "test.com", port: 443, enforcement: Enforcement.ENFORCE }],
    };
    applyNetworkPolicyPatch(base, "test", entry);
    expect(base.network_policies?.test).toBeUndefined();
  });
});
