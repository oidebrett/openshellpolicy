"use client";

import React from "react";
import { usePolicy, usePolicyDispatch } from "@/lib/policy/store";
import { LandlockCompatibility } from "@/types/policy";

export default function ProcessForm() {
  const policy = usePolicy();
  const dispatch = usePolicyDispatch();

  const proc = policy.process ?? {};
  const landlock = policy.landlock ?? {};

  function updateProcess(field: "run_as_user" | "run_as_group", value: string) {
    dispatch({
      type: "UPDATE_PROCESS",
      payload: { ...proc, [field]: value },
    });
  }

  function isRootError(value: string) {
    return value === "root" || value === "0";
  }

  return (
    <div className="p-3">
      {/* Static warning */}
      <div className="mb-4 bg-amber-950/40 border border-amber-800/50 rounded px-3 py-2 text-xs text-amber-400">
        <strong>Static section</strong> — process settings are locked at sandbox
        creation. Changes require recreating the sandbox.
      </div>

      {/* Process */}
      <div className="mb-5">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Process Identity
        </h3>

        <div className="mb-3">
          <label className="block text-xs text-gray-400 mb-1">run_as_user</label>
          <input
            type="text"
            value={proc.run_as_user ?? ""}
            onChange={(e) => updateProcess("run_as_user", e.target.value)}
            placeholder="sandbox"
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-gray-100 focus:outline-none focus:border-green-600 font-mono"
          />
          {isRootError(proc.run_as_user ?? "") && (
            <p className="text-red-400 text-xs mt-1">Cannot run as root</p>
          )}
        </div>

        <div className="mb-3">
          <label className="block text-xs text-gray-400 mb-1">run_as_group</label>
          <input
            type="text"
            value={proc.run_as_group ?? ""}
            onChange={(e) => updateProcess("run_as_group", e.target.value)}
            placeholder="sandbox"
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-gray-100 focus:outline-none focus:border-green-600 font-mono"
          />
          {isRootError(proc.run_as_group ?? "") && (
            <p className="text-red-400 text-xs mt-1">Cannot run as root</p>
          )}
        </div>
      </div>

      {/* Landlock */}
      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Landlock (Kernel Enforcement)
        </h3>

        <div>
          <label className="block text-xs text-gray-400 mb-1">
            compatibility
          </label>
          <select
            value={landlock.compatibility ?? LandlockCompatibility.BEST_EFFORT}
            onChange={(e) =>
              dispatch({
                type: "UPDATE_LANDLOCK",
                payload: {
                  ...landlock,
                  compatibility: e.target.value as LandlockCompatibility,
                },
              })
            }
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-gray-100 focus:outline-none focus:border-green-600"
          >
            <option value={LandlockCompatibility.BEST_EFFORT}>
              best_effort — skip unavailable paths, warn and continue
            </option>
            <option value={LandlockCompatibility.HARD_REQUIREMENT}>
              hard_requirement — abort if any path is unavailable
            </option>
          </select>
        </div>
      </div>
    </div>
  );
}
