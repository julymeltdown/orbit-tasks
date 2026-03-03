import { FormEvent, useEffect, useMemo, useState } from "react";
import { PresenceBadge } from "@/components/profile/PresenceBadge";
import { Presence, useProfileStore } from "@/stores/profileStore";

export function ProfileSettingsPage() {
  const { settings, isLoading, error, loadSettings, saveSettings } = useProfileStore();

  const [timezone, setTimezone] = useState("UTC");
  const [locale, setLocale] = useState("en-US");
  const [presence, setPresence] = useState<Presence>("online");
  const [notificationPreference, setNotificationPreference] = useState("MENTIONS_ONLY");
  const [mentionPush, setMentionPush] = useState(true);
  const [threadPush, setThreadPush] = useState(true);
  const [digestEnabled, setDigestEnabled] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (!settings) {
      return;
    }
    setTimezone(settings.timezone);
    setLocale(settings.locale);
    setPresence(settings.presence);
    setNotificationPreference(settings.notificationPreference);
    setMentionPush(settings.mentionPush);
    setThreadPush(settings.threadPush);
    setDigestEnabled(settings.digestEnabled);
  }, [settings]);

  const updatedAt = useMemo(() => {
    if (!settings?.updatedAt) {
      return "-";
    }
    return new Date(settings.updatedAt).toLocaleString();
  }, [settings?.updatedAt]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await saveSettings({
      timezone,
      locale,
      presence,
      notificationPreference,
      mentionPush,
      threadPush,
      digestEnabled
    });
  }

  return (
    <section className="orbit-shell__content-grid">
      <article className="orbit-card" style={{ gridColumn: "span 8", padding: 20 }}>
        <h2 style={{ marginTop: 0 }}>Profile Settings</h2>
        <p style={{ color: "var(--orbit-text-subtle)" }}>
          Presence, timezone, and notification preferences sync to thread/mention/inbox surfaces.
        </p>

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontWeight: 700, fontSize: 12, textTransform: "uppercase" }}>Timezone</span>
            <input className="orbit-input" value={timezone} onChange={(e) => setTimezone(e.target.value)} required />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontWeight: 700, fontSize: 12, textTransform: "uppercase" }}>Locale</span>
            <input className="orbit-input" value={locale} onChange={(e) => setLocale(e.target.value)} required />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontWeight: 700, fontSize: 12, textTransform: "uppercase" }}>Presence</span>
            <select className="orbit-input" value={presence} onChange={(e) => setPresence(e.target.value as Presence)}>
              <option value="online">Online</option>
              <option value="focus">Focus</option>
              <option value="offline">Offline</option>
            </select>
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontWeight: 700, fontSize: 12, textTransform: "uppercase" }}>Notification Pref</span>
            <select
              className="orbit-input"
              value={notificationPreference}
              onChange={(e) => setNotificationPreference(e.target.value)}
            >
              <option value="MENTIONS_ONLY">Mentions only</option>
              <option value="MENTIONS_AND_THREADS">Mentions + Threads</option>
              <option value="ALL_ACTIVITY">All activity</option>
              <option value="DIGEST_ONLY">Digest only</option>
            </select>
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input type="checkbox" checked={mentionPush} onChange={(e) => setMentionPush(e.target.checked)} />
            Mention push enabled
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input type="checkbox" checked={threadPush} onChange={(e) => setThreadPush(e.target.checked)} />
            Thread push enabled
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input type="checkbox" checked={digestEnabled} onChange={(e) => setDigestEnabled(e.target.checked)} />
            Daily digest enabled
          </label>

          {error && (
            <p style={{ margin: 0, color: "var(--orbit-danger)" }} role="alert">
              {error}
            </p>
          )}

          <button className="orbit-button" type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save settings"}
          </button>
        </form>
      </article>

      <aside className="orbit-panel" style={{ gridColumn: "span 4", padding: 20 }}>
        <h3 style={{ marginTop: 0 }}>Presence Preview</h3>
        <PresenceBadge presence={presence} />
        <p style={{ color: "var(--orbit-text-subtle)", marginTop: 14 }}>
          Updated at: {updatedAt}
        </p>
      </aside>
    </section>
  );
}
