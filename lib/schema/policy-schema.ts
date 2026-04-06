import { z } from "zod";
import * as yaml from "js-yaml";
import type { OpenShellPolicy } from "@/types/policy";

// ---- Helper validators ----
const isAbsolutePath = (p: string) =>
  p.startsWith("/") && !p.includes("..") && p.length <= 4096;

const absolutePathSchema = z
  .string()
  .refine(isAbsolutePath, {
    message:
      "Path must be absolute, contain no '..', and be ≤ 4096 characters",
  });

// ---- Enums ----
const ProtocolSchema = z.enum(["rest", "tcp", "udp"]);
const EnforcementSchema = z.enum(["enforce", "audit"]);
const AccessSchema = z.enum(["full", "read-only", "read-write"]);
const LandlockCompatibilitySchema = z.enum([
  "best_effort",
  "hard_requirement",
]);

// ---- Rule ----
const RuleSchema = z.object({
  allow: z.object({
    method: z.string().min(1),
    path: z.string().min(1),
    query: z.record(z.string(), z.string()).optional(),
  }),
});

// ---- Endpoint ----
// access and rules are mutually exclusive
const EndpointSchema = z
  .object({
    host: z.string().min(1),
    port: z.number().int().min(1).max(65535),
    protocol: ProtocolSchema.optional(),
    tls: z.literal("skip").optional(),
    enforcement: EnforcementSchema,
    access: AccessSchema.optional(),
    rules: z.array(RuleSchema).optional(),
  })
  .refine(
    (ep) => !(ep.access !== undefined && ep.rules !== undefined),
    {
      message: "Endpoint cannot have both 'access' and 'rules' set simultaneously",
    }
  );

// ---- Binary ----
const BinarySchema = z.object({
  path: z.string().min(1),
});

// ---- NetworkPolicyEntry ----
const NetworkPolicyEntrySchema = z.object({
  name: z.string().min(1),
  endpoints: z.array(EndpointSchema).min(1),
  binaries: z.array(BinarySchema).optional(),
});

// ---- NetworkPolicyMap ----
const NetworkPolicyMapSchema = z.record(z.string(), NetworkPolicyEntrySchema);

// ---- FilesystemPolicy ----
const FilesystemPolicySchema = z
  .object({
    include_workdir: z.boolean().optional(),
    read_only: z
      .array(absolutePathSchema)
      .max(256, { message: "read_only paths: maximum 256 entries" })
      .optional(),
    read_write: z
      .array(absolutePathSchema)
      .max(256, { message: "read_write paths: maximum 256 entries" })
      .optional(),
  })
  .optional();

// ---- LandlockPolicy ----
const LandlockPolicySchema = z
  .object({
    compatibility: LandlockCompatibilitySchema.optional(),
  })
  .optional();

// ---- ProcessPolicy ----
const forbiddenUsers = new Set(["root", "0"]);

const ProcessPolicySchema = z
  .object({
    run_as_user: z
      .string()
      .refine((v) => !forbiddenUsers.has(v), {
        message: "run_as_user cannot be 'root' or '0'",
      })
      .optional(),
    run_as_group: z
      .string()
      .refine((v) => !forbiddenUsers.has(v), {
        message: "run_as_group cannot be 'root' or '0'",
      })
      .optional(),
  })
  .optional();

// ---- Top-level policy ----
export const OpenShellPolicySchema = z.object({
  version: z.literal(1),
  filesystem_policy: FilesystemPolicySchema,
  landlock: LandlockPolicySchema,
  process: ProcessPolicySchema,
  network_policies: NetworkPolicyMapSchema.optional(),
});

export type ValidatedOpenShellPolicy = z.infer<typeof OpenShellPolicySchema>;

// ---- validatePolicy ----
export function validatePolicy(yamlStr: string): {
  valid: boolean;
  errors: string[];
  policy?: OpenShellPolicy;
} {
  let parsed: unknown;
  try {
    parsed = yaml.load(yamlStr);
  } catch (err) {
    return {
      valid: false,
      errors: [
        `YAML parse error: ${err instanceof Error ? err.message : String(err)}`,
      ],
    };
  }

  const result = OpenShellPolicySchema.safeParse(parsed);
  if (!result.success) {
    const errors = result.error.issues.map((issue) => {
      const path = issue.path.length ? issue.path.join(".") + ": " : "";
      return `${path}${issue.message}`;
    });
    return { valid: false, errors };
  }

  return { valid: true, errors: [], policy: result.data as OpenShellPolicy };
}
