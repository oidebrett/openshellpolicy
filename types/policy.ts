// TypeScript types for OpenShell Policy Schema v1

export enum Protocol {
  REST = "rest",
  TCP = "tcp",
  UDP = "udp",
}

export enum Enforcement {
  ENFORCE = "enforce",
  AUDIT = "audit",
}

export enum Access {
  FULL = "full",
  READ_ONLY = "read-only",
  READ_WRITE = "read-write",
}

export enum LandlockCompatibility {
  BEST_EFFORT = "best_effort",
  HARD_REQUIREMENT = "hard_requirement",
}

export interface Rule {
  allow: {
    method: string;
    path: string;
    query?: Record<string, string>;
  };
}

export interface Endpoint {
  host: string;
  port: number;
  protocol?: Protocol;
  tls?: "skip";
  enforcement: Enforcement;
  access?: Access;
  rules?: Rule[];
}

export interface Binary {
  path: string;
}

export interface NetworkPolicyEntry {
  name: string;
  endpoints: Endpoint[];
  binaries?: Binary[];
}

export type NetworkPolicyMap = Record<string, NetworkPolicyEntry>;

export interface FilesystemPolicy {
  include_workdir?: boolean;
  read_only?: string[];
  read_write?: string[];
}

export interface LandlockPolicy {
  compatibility?: LandlockCompatibility;
}

export interface ProcessPolicy {
  run_as_user?: string;
  run_as_group?: string;
}

export interface OpenShellPolicy {
  version: 1;
  filesystem_policy?: FilesystemPolicy;
  landlock?: LandlockPolicy;
  process?: ProcessPolicy;
  network_policies?: NetworkPolicyMap;
}
