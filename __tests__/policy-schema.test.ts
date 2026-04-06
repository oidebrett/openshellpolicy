import { describe, it, expect } from "vitest";
import { validatePolicy } from "../lib/schema/policy-schema";

const VALID_MINIMAL = `
version: 1
`;

const VALID_FULL = `
version: 1
filesystem_policy:
  include_workdir: true
  read_only:
    - /usr
    - /etc
  read_write:
    - /tmp
    - /sandbox
landlock:
  compatibility: best_effort
process:
  run_as_user: sandbox
  run_as_group: sandbox
network_policies:
  github_api:
    name: github-api-readonly
    endpoints:
      - host: api.github.com
        port: 443
        protocol: rest
        enforcement: enforce
        access: read-only
    binaries:
      - path: /usr/local/bin/claude
`;

const VALID_WITH_RULES = `
version: 1
network_policies:
  custom:
    name: custom-api
    endpoints:
      - host: api.example.com
        port: 443
        protocol: rest
        enforcement: enforce
        rules:
          - allow:
              method: GET
              path: /repos/**
          - allow:
              method: POST
              path: /repos/*/issues
    binaries:
      - path: /usr/bin/curl
`;

describe("validatePolicy", () => {
  it("accepts minimal valid policy (version: 1 only)", () => {
    const result = validatePolicy(VALID_MINIMAL);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.policy?.version).toBe(1);
  });

  it("accepts full valid policy with all sections", () => {
    const result = validatePolicy(VALID_FULL);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.policy?.network_policies?.github_api?.name).toBe("github-api-readonly");
  });

  it("accepts policy with fine-grained rules", () => {
    const result = validatePolicy(VALID_WITH_RULES);
    expect(result.valid).toBe(true);
    expect(result.policy?.network_policies?.custom?.endpoints[0].rules).toHaveLength(2);
  });

  it("rejects wrong version number", () => {
    const result = validatePolicy("version: 2");
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("version"))).toBe(true);
  });

  it("rejects invalid YAML syntax", () => {
    const result = validatePolicy("version: 1\n  bad: [unclosed");
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/YAML parse error/i);
  });

  it("rejects run_as_user = root", () => {
    const yaml = `
version: 1
process:
  run_as_user: root
  run_as_group: sandbox
`;
    const result = validatePolicy(yaml);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("root"))).toBe(true);
  });

  it("rejects run_as_user = 0", () => {
    const yaml = `
version: 1
process:
  run_as_user: "0"
  run_as_group: sandbox
`;
    const result = validatePolicy(yaml);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("'0'"))).toBe(true);
  });

  it("rejects run_as_group = root", () => {
    const yaml = `
version: 1
process:
  run_as_user: sandbox
  run_as_group: root
`;
    const result = validatePolicy(yaml);
    expect(result.valid).toBe(false);
  });

  it("rejects non-absolute filesystem path", () => {
    const yaml = `
version: 1
filesystem_policy:
  read_only:
    - relative/path
`;
    const result = validatePolicy(yaml);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("absolute"))).toBe(true);
  });

  it("rejects filesystem path with '..'", () => {
    const yaml = `
version: 1
filesystem_policy:
  read_only:
    - /usr/../etc
`;
    const result = validatePolicy(yaml);
    expect(result.valid).toBe(false);
  });

  it("rejects endpoint with both access and rules", () => {
    const yaml = `
version: 1
network_policies:
  conflict:
    name: conflict
    endpoints:
      - host: example.com
        port: 443
        enforcement: enforce
        access: read-only
        rules:
          - allow:
              method: GET
              path: /
    binaries:
      - path: /usr/bin/curl
`;
    const result = validatePolicy(yaml);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("access") && e.includes("rules"))).toBe(true);
  });

  it("rejects port out of range", () => {
    const yaml = `
version: 1
network_policies:
  bad_port:
    name: bad
    endpoints:
      - host: example.com
        port: 99999
        enforcement: enforce
    binaries:
      - path: /usr/bin/curl
`;
    const result = validatePolicy(yaml);
    expect(result.valid).toBe(false);
  });

  it("accepts audit enforcement mode", () => {
    const yaml = `
version: 1
network_policies:
  audited:
    name: audit-policy
    endpoints:
      - host: api.github.com
        port: 443
        enforcement: audit
        access: full
    binaries:
      - path: /usr/local/bin/claude
`;
    const result = validatePolicy(yaml);
    expect(result.valid).toBe(true);
  });

  it("rejects invalid enforcement value", () => {
    const yaml = `
version: 1
network_policies:
  bad:
    name: bad
    endpoints:
      - host: example.com
        port: 443
        enforcement: block
    binaries:
      - path: /usr/bin/curl
`;
    const result = validatePolicy(yaml);
    expect(result.valid).toBe(false);
  });

  it("accepts wildcard host", () => {
    const yaml = `
version: 1
network_policies:
  wildcard:
    name: wildcard
    endpoints:
      - host: "*.example.com"
        port: 443
        enforcement: enforce
        access: read-only
    binaries:
      - path: /usr/bin/curl
`;
    const result = validatePolicy(yaml);
    expect(result.valid).toBe(true);
  });
});
