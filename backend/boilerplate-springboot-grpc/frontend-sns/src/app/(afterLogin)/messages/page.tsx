"use client";

import styles from "@/app/(afterLogin)/page.module.css";

export default function MessagesPage() {
  return (
    <div className={styles.page}>
      <div className={styles.heading}>Messages</div>
      <section className={styles.section}>
        <div>Messaging is not connected yet.</div>
        <div className={styles.muted}>Use notifications for system alerts.</div>
      </section>
    </div>
  );
}
