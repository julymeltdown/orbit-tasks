import SignupEmailClient from "./SignupEmailClient";

export const dynamic = "force-dynamic";

type SignupPageProps = {
  searchParams?: {
    email?: string;
  };
};

export default function SignupPage({ searchParams }: SignupPageProps) {
  return <SignupEmailClient initialEmail={searchParams?.email ?? ""} />;
}
