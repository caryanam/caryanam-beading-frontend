import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { adminNav } from "@/components/nav-config";
import { Panel } from "@/components/premium";

const groups = [
  {
    title: "Auction settings",
    fields: ["Default bid increment", "Auction duration (hours)", "Auto-extend window (min)"],
  },
  { title: "Account settings", fields: ["Organisation name", "Support email", "Timezone"] },
  { title: "Security settings", fields: ["Session timeout", "Two-factor policy", "IP allowlist"] },
];

const toggles = [
  "Email notifications for new bids",
  "SMS alerts on auction close",
  "Weekly revenue digest",
  "Inspector submission alerts",
];

export function AdminSettings() {
  return (
    <AppShell role="admin" nav={adminNav} title="Settings" breadcrumb={["Admin", "Settings"]}>
      <div className="grid gap-5 xl:grid-cols-2">
        {groups.map((g) => (
          <Panel key={g.title} title={g.title}>
            <div className="space-y-4">
              {g.fields.map((f) => (
                <label key={f} className="block">
                  <span className="mb-2 block text-xs text-muted-foreground">{f}</span>
                  <input className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-foreground" />
                </label>
              ))}
              <button
                onClick={() => toast.success(`${g.title} saved`)}
                className="rounded-2xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground"
              >
                Save changes
              </button>
            </div>
          </Panel>
        ))}

        <Panel title="Notification settings">
          <ul className="space-y-4">
            {toggles.map((t, i) => (
              <li key={t} className="flex items-center justify-between gap-4">
                <span className="text-sm">{t}</span>
                <input
                  type="checkbox"
                  defaultChecked={i < 2}
                  className="size-5 rounded accent-black"
                />
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </AppShell>
  );
}
