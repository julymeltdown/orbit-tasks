import SignupPasswordClient from "./SignupPasswordClient";

export const dynamic = "force-dynamic";

type SignupPasswordPageProps = {
  searchParams?: {
    email?: string;
  };
};

export default function SignupPasswordPage({ searchParams }: SignupPasswordPageProps) {
  return <SignupPasswordClient email={searchParams?.email ?? ""} />;
}
