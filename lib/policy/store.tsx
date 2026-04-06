"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  type Dispatch,
} from "react";
import type {
  OpenShellPolicy,
  NetworkPolicyEntry,
  FilesystemPolicy,
  ProcessPolicy,
  LandlockPolicy,
} from "@/types/policy";
import { getDefaultPolicy } from "@/lib/yaml/policy-yaml";

// ---- Action types ----
export type PolicyAction =
  | { type: "SET_POLICY"; payload: OpenShellPolicy }
  | {
      type: "UPDATE_NETWORK_ENTRY";
      payload: { key: string; entry: NetworkPolicyEntry };
    }
  | { type: "DELETE_NETWORK_ENTRY"; payload: { key: string } }
  | { type: "UPDATE_FILESYSTEM"; payload: FilesystemPolicy }
  | { type: "UPDATE_PROCESS"; payload: ProcessPolicy }
  | { type: "UPDATE_LANDLOCK"; payload: LandlockPolicy };

// ---- Reducer ----
function policyReducer(
  state: OpenShellPolicy,
  action: PolicyAction
): OpenShellPolicy {
  switch (action.type) {
    case "SET_POLICY":
      return action.payload;

    case "UPDATE_NETWORK_ENTRY": {
      const { key, entry } = action.payload;
      return {
        ...state,
        network_policies: {
          ...(state.network_policies ?? {}),
          [key]: entry,
        },
      };
    }

    case "DELETE_NETWORK_ENTRY": {
      const { key } = action.payload;
      const next = { ...(state.network_policies ?? {}) };
      delete next[key];
      return { ...state, network_policies: next };
    }

    case "UPDATE_FILESYSTEM":
      return { ...state, filesystem_policy: action.payload };

    case "UPDATE_PROCESS":
      return { ...state, process: action.payload };

    case "UPDATE_LANDLOCK":
      return { ...state, landlock: action.payload };

    default:
      return state;
  }
}

// ---- Contexts ----
const PolicyContext = createContext<OpenShellPolicy | null>(null);
const PolicyDispatchContext = createContext<Dispatch<PolicyAction> | null>(
  null
);

// ---- Provider ----
export function PolicyProvider({
  children,
  initialPolicy,
}: {
  children: React.ReactNode;
  initialPolicy?: OpenShellPolicy;
}) {
  const [state, dispatch] = useReducer(
    policyReducer,
    initialPolicy ?? getDefaultPolicy()
  );

  return (
    <PolicyContext.Provider value={state}>
      <PolicyDispatchContext.Provider value={dispatch}>
        {children}
      </PolicyDispatchContext.Provider>
    </PolicyContext.Provider>
  );
}

// ---- Hooks ----
export function usePolicy(): OpenShellPolicy {
  const ctx = useContext(PolicyContext);
  if (ctx === null) {
    throw new Error("usePolicy must be used within a PolicyProvider");
  }
  return ctx;
}

export function usePolicyDispatch(): Dispatch<PolicyAction> {
  const ctx = useContext(PolicyDispatchContext);
  if (ctx === null) {
    throw new Error("usePolicyDispatch must be used within a PolicyProvider");
  }
  return ctx;
}
