"use client";

import React, { useCallback, useEffect, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import { usePolicy, usePolicyDispatch } from "@/lib/policy/store";
import type { NetworkPolicyEntry } from "@/types/policy";
import { Enforcement } from "@/types/policy";

// ---- Custom node styles ----
const sandboxStyle: React.CSSProperties = {
  background: "#1a2a0a",
  border: "2px solid #76b900",
  borderRadius: 10,
  padding: "10px 20px",
  color: "#76b900",
  fontWeight: 700,
  minWidth: 140,
  textAlign: "center",
};

const endpointStyle: React.CSSProperties = {
  background: "#0d1a2a",
  border: "2px solid #2563eb",
  borderRadius: 8,
  padding: "8px 14px",
  color: "#93c5fd",
  fontSize: 12,
  minWidth: 130,
  textAlign: "center",
};

const binaryStyle: React.CSSProperties = {
  background: "#1a1a1a",
  border: "2px solid #6b7280",
  borderRadius: 8,
  padding: "8px 14px",
  color: "#9ca3af",
  fontSize: 12,
  minWidth: 130,
  textAlign: "center",
};

function edgeColor(enforcement?: string, access?: string): string {
  if (enforcement === Enforcement.AUDIT) return "#f97316"; // orange
  if (access === "full" || access === "read-write") return "#76b900"; // green
  return "#76b900"; // default green
}

function edgeLabel(entry: NetworkPolicyEntry, epIdx: number): string {
  const ep = entry.endpoints[epIdx];
  if (!ep) return "";
  if (ep.access) return ep.access;
  if (ep.rules && ep.rules.length > 0) return `${ep.rules.length} rule(s)`;
  return ep.enforcement === Enforcement.AUDIT ? "audit" : "allowed";
}

function buildGraph(
  policy: ReturnType<typeof usePolicy>,
  onNodeClick: (key: string, entry: NetworkPolicyEntry) => void
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const user = policy.process?.run_as_user ?? "sandbox";

  // When empty place sandbox at top so it doesn't overlap the hint text
  const sandboxY = entries.length === 0 ? 60 : 300;

  // Sandbox node
  nodes.push({
    id: "sandbox",
    type: "default",
    position: { x: 400, y: sandboxY },
    data: {
      label: (
        <div style={sandboxStyle}>
          <div style={{ fontSize: 11, opacity: 0.7 }}>sandbox</div>
          <div>{user}</div>
        </div>
      ),
    },
    style: { border: "none", background: "transparent", padding: 0 },
  });

  const entries = Object.entries(policy.network_policies ?? {});
  const cols = Math.ceil(Math.sqrt(entries.length)) || 1;

  entries.forEach(([key, entry], entryIdx) => {
    const col = entryIdx % cols;
    const row = Math.floor(entryIdx / cols);
    const baseX = 50 + col * 200;
    const baseY = 50 + row * 120;

    // Entry label node (endpoint)
    const nodeId = `ep-${key}`;
    nodes.push({
      id: nodeId,
      type: "default",
      position: { x: baseX, y: baseY },
      data: {
        label: (
          <div
            style={endpointStyle}
            onClick={() => onNodeClick(key, entry)}
            title="Click to edit"
          >
            <div style={{ fontWeight: 600 }}>{entry.name || key}</div>
            {entry.endpoints.slice(0, 2).map((ep, i) => (
              <div key={i} style={{ opacity: 0.7, fontSize: 11 }}>
                {ep.host}:{ep.port}
              </div>
            ))}
            {entry.endpoints.length > 2 && (
              <div style={{ opacity: 0.5, fontSize: 10 }}>
                +{entry.endpoints.length - 2} more
              </div>
            )}
          </div>
        ),
      },
      style: { border: "none", background: "transparent", padding: 0 },
    });

    const ep0 = entry.endpoints[0];
    const color = ep0
      ? edgeColor(ep0.enforcement, ep0.access)
      : "#76b900";
    const label = edgeLabel(entry, 0);

    edges.push({
      id: `edge-${key}`,
      source: nodeId,
      target: "sandbox",
      label,
      markerEnd: { type: MarkerType.ArrowClosed, color },
      style: { stroke: color, strokeWidth: 2 },
      labelStyle: { fill: "#9ca3af", fontSize: 10 },
      animated: ep0?.enforcement === Enforcement.AUDIT,
    });

    // Binaries
    (entry.binaries ?? []).forEach((bin, binIdx) => {
      const binId = `bin-${key}-${binIdx}`;
      nodes.push({
        id: binId,
        type: "default",
        position: { x: baseX + 220, y: baseY + binIdx * 80 },
        data: {
          label: (
            <div style={binaryStyle}>
              <div style={{ fontSize: 10, opacity: 0.6 }}>binary</div>
              <div
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: 120,
                  whiteSpace: "nowrap",
                }}
                title={bin.path}
              >
                {bin.path.split("/").pop() ?? bin.path}
              </div>
            </div>
          ),
        },
        style: { border: "none", background: "transparent", padding: 0 },
      });

      edges.push({
        id: `bin-edge-${key}-${binIdx}`,
        source: binId,
        target: "sandbox",
        style: { stroke: "#4b5563", strokeWidth: 1, strokeDasharray: "4 3" },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#4b5563" },
      });
    });
  });

  return { nodes, edges };
}

interface SelectedEntry {
  key: string;
  entry: NetworkPolicyEntry;
}

export default function PolicyGraph() {
  const policy = usePolicy();
  const dispatch = usePolicyDispatch();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [_selected, setSelected] = useState<SelectedEntry | null>(null);

  const handleNodeClick = useCallback(
    (key: string, entry: NetworkPolicyEntry) => {
      setSelected({ key, entry });
    },
    []
  );

  useEffect(() => {
    const { nodes: n, edges: e } = buildGraph(policy, handleNodeClick);
    setNodes(n);
    setEdges(e);
  }, [policy, handleNodeClick, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#374151" gap={20} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            if (node.id === "sandbox") return "#76b900";
            if (node.id.startsWith("ep-")) return "#2563eb";
            return "#4b5563";
          }}
          style={{ background: "#111827" }}
        />
      </ReactFlow>

      {Object.keys(policy.network_policies ?? {}).length === 0 && (
        <div className="absolute bottom-8 inset-x-0 flex justify-center pointer-events-none">
          <div className="text-center text-gray-600">
            <p className="text-sm font-medium">No network policies yet</p>
            <p className="text-xs mt-1">Use the left panel to add a policy entry</p>
          </div>
        </div>
      )}
    </div>
  );
}
