import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "OpenShell Policy Editor",
  description: "Visual policy editor for NVIDIA OpenShell sandbox policies",
};

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
