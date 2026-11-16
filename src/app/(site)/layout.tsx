import DocumentShell from "@/app/document";
export { metadata, viewport } from "@/app/document";

export default function ApplicationRoot({ children }: { children: React.ReactNode }) {
  return <DocumentShell>{children}</DocumentShell>;
}
