import VerifyClient from "./VerifyClient";

export function generateStaticParams() {
  return [{ certId: "demo-certificate" }];
}

export default function VerifyPage({ params }: { params: { certId: string } }) {
  return <VerifyClient params={params} />;
}
