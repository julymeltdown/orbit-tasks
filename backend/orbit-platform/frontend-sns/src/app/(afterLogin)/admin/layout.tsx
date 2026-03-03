import Link from "next/link";
import type { ReactNode } from "react";
import styles from "@/app/(afterLogin)/page.module.css";

type Props = { children: ReactNode };

export default function AdminLayout({ children }: Props) {
  return (
    <div className={styles.page}>
      <div className={styles.heading}>Admin Control Plane</div>
      <div className={styles.row}>
        <Link className={styles.buttonSecondary} href="/admin">
          Overview
        </Link>
        <Link className={styles.buttonSecondary} href="/admin/telemetry">
          Telemetry
        </Link>
        <Link className={styles.buttonSecondary} href="/admin/policies">
          Policies
        </Link>
        <Link className={styles.buttonSecondary} href="/admin/contracts">
          Contracts
        </Link>
        <Link className={styles.buttonSecondary} href="/admin/clients">
          Clients
        </Link>
        <Link className={styles.buttonSecondary} href="/admin/rollouts">
          Rollouts
        </Link>
      </div>
      {children}
    </div>
  );
}
