import type { ReactNode } from "react";

type Props = { children: ReactNode };

export default function ProfileLayout({ children }: Props) {
  return <>{children}</>;
}
