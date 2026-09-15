import JobDetailClient from "./JobDetailClient";

export function generateStaticParams() {
  return [{ jobId: "demo-job" }];
}

export default function JobDetailPage() {
  return <JobDetailClient />;
}
