import * as yaml from "js-yaml";
import type {
  OpenShellPolicy,
  NetworkPolicyEntry,
} from "@/types/policy";
import { LandlockCompatibility } from "@/types/policy";

export function parsePolicy(yamlStr: string): OpenShellPolicy | null {
  try {
    const parsed = yaml.load(yamlStr) as OpenShellPolicy;
    if (parsed && typeof parsed === "object" && parsed.version === 1) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function serializePolicy(policy: OpenShellPolicy): string {
  return yaml.dump(policy, {
    indent: 2,
    lineWidth: 120,
    noRefs: true,
    sortKeys: false,
  });
}

export function getDefaultPolicy(): OpenShellPolicy {
  return {
    version: 1,
    filesystem_policy: {
      include_workdir: true,
      read_only: ["/etc", "/usr/local/lib"],
      read_write: ["/tmp"],
    },
    landlock: {
      compatibility: LandlockCompatibility.BEST_EFFORT,
    },
    process: {
      run_as_user: "sandbox",
      run_as_group: "sandbox",
    },
    network_policies: {},
  };
}

export function applyNetworkPolicyPatch(
  policy: OpenShellPolicy,
  key: string,
  entry: NetworkPolicyEntry
): OpenShellPolicy {
  return {
    ...policy,
    network_policies: {
      ...(policy.network_policies ?? {}),
      [key]: entry,
    },
  };
}
