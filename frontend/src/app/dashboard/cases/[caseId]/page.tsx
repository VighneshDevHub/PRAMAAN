import CaseDetailClient from "./CaseDetailClient";

export function generateStaticParams() {
  return [{ caseId: "demo-case" }];
}

export default function CaseDetailPage() {
  return <CaseDetailClient />;
}
