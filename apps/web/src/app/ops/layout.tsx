import type { ReactNode } from "react";

import { OpsShell } from "@/components/ops-shell";

type OpsLayoutProps = {
  children: ReactNode;
};

export default function OpsLayout({ children }: OpsLayoutProps) {
  return <OpsShell>{children}</OpsShell>;
}
