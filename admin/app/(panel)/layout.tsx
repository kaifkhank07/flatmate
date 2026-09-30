import Shell from "@/components/shell";

/** Every authenticated page renders inside the app chrome. */
export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return <Shell>{children}</Shell>;
}
