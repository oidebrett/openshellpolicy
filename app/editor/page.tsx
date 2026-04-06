"use client";

import dynamic from "next/dynamic";
import { PolicyProvider } from "@/lib/policy/store";
import Header from "@/components/editor/Header";
import Sidebar from "@/components/editor/Sidebar";

// Dynamically import heavy client-only components
const PolicyGraph = dynamic(
  () => import("@/components/visualization/PolicyGraph"),
  { ssr: false, loading: () => <div className="flex-1 bg-gray-900" /> }
);

const YamlPanel = dynamic(
  () => import("@/components/yaml/YamlPanel"),
  { ssr: false, loading: () => <div className="w-[350px] bg-gray-950" /> }
);

const TutorialPanel = dynamic(
  () => import("@/components/tutorials/TutorialPanel"),
  { ssr: false }
);

export default function EditorPage() {
  return (
    <PolicyProvider>
      <div className="flex flex-col h-screen bg-gray-900 text-gray-100 overflow-hidden">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          {/* Left sidebar */}
          <div className="w-[280px] flex-shrink-0 bg-gray-950 border-r border-gray-800 flex flex-col overflow-hidden">
            <Sidebar />
          </div>

          {/* Center canvas */}
          <div className="flex-1 relative overflow-hidden">
            <PolicyGraph />
          </div>

          {/* Right YAML panel */}
          <div className="w-[350px] flex-shrink-0 bg-gray-950 border-l border-gray-800 flex flex-col overflow-hidden relative">
            <YamlPanel />
            <TutorialPanel />
          </div>
        </div>
      </div>
    </PolicyProvider>
  );
}
