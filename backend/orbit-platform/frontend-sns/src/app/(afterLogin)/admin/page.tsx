import Link from "next/link";
import styles from "@/app/(afterLogin)/page.module.css";

export default function AdminIndexPage() {
  return (
    <section className={styles.section}>
      <strong>Choose a control plane section</strong>
      <div className={styles.list}>
        <Link className={styles.buttonSecondary} href="/admin/telemetry">
          Telemetry summary
        </Link>
        <Link className={styles.buttonSecondary} href="/admin/policies">
          Policy management
        </Link>
        <Link className={styles.buttonSecondary} href="/admin/contracts">
          Contract registry
        </Link>
        <Link className={styles.buttonSecondary} href="/admin/clients">
          Client profiles
        </Link>
        <Link className={styles.buttonSecondary} href="/admin/rollouts">
          Rollout controls
        </Link>
      </div>
    </section>
  );
}
