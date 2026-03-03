import VerifyEmailClient from "./VerifyEmailClient";

export const dynamic = "force-dynamic";

type VerifyPageProps = {
  searchParams?: {
    email?: string;
  };
};

export default function VerifyPage({ searchParams }: VerifyPageProps) {
  return <VerifyEmailClient initialEmail={searchParams?.email ?? ""} />;
}
