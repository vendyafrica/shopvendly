import "../../styles/marketing/globals.css";
import type { ReactNode } from "react";

export default function LandingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
