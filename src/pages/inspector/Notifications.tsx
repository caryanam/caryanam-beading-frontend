import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { inspectorNav } from "@/components/nav-config";
import { Panel } from "@/components/premium";
import { getMyInspections } from "@/lib/api/inspector-api";

interface NotificationItem {
  id: number;
  title: string;
  meta: string;
  time: string;
  status: string;
}

export function InspectorNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [readIds, setReadIds] = useState<number[]>(() => {
    return JSON.parse(localStorage.getItem("read_notification_ids") || "[]");
  });

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await getMyInspections();
      if (res.success && res.data) {
        // Map each inspection to a dynamic notification item based on status
        const mapped = res.data
          .filter((ins) => ins.status !== "DRAFT" && ins.status !== "IN_PROGRESS") // Show submitted, approved, rejected
          .map((ins) => {
            let title = "";
            let meta = "";
            const time = ins.submittedAt
              ? new Date(ins.submittedAt).toLocaleString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Just now";

            const carName = `${ins.brand || ""} ${ins.model || ""} ${ins.variant || ""}`.trim();

            if (ins.status === "APPROVED") {
              title = `Inspection Approved: ${carName}`;
              meta = `The evaluation for vehicle ${ins.vehicleNumber} has been approved by the Admin and is now ready for bidding.`;
            } else if (ins.status === "REJECTED") {
              title = `Inspection Rejected: ${carName}`;
              meta = `The evaluation for vehicle ${ins.vehicleNumber} was rejected. Reason: ${ins.rejectionReason || "Please verify vehicle details."}`;
            } else if (ins.status === "SUBMITTED") {
              title = `Inspection Submitted: ${carName}`;
              meta = `The evaluation report for vehicle ${ins.vehicleNumber} has been submitted successfully and is pending admin approval.`;
            }

            return {
              id: ins.inspectionId,
              title,
              meta,
              time,
              status: ins.status,
            };
          });

        // Sort notifications so that newest are at the top
        mapped.sort((a, b) => b.id - a.id);
        setNotifications(mapped);
      }
    } catch (err) {
      console.error("Failed to load notifications", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markAsRead = (id: number) => {
    const updated = [...readIds, id];
    setReadIds(updated);
    localStorage.setItem("read_notification_ids", JSON.stringify(updated));
    // Trigger storage event so AppShell receives the update
    window.dispatchEvent(new Event("storage"));
  };

  const markAllAsRead = () => {
    const unreadNotifications = notifications.filter(n => !readIds.includes(n.id));
    if (unreadNotifications.length === 0) return;
    
    const updated = [...readIds, ...unreadNotifications.map(n => n.id)];
    setReadIds(updated);
    localStorage.setItem("read_notification_ids", JSON.stringify(updated));
    window.dispatchEvent(new Event("storage"));
  };

  const hasUnread = notifications.some(n => !readIds.includes(n.id));

  return (
    <AppShell
      role="inspector"
      nav={inspectorNav}
      title="Notification Center"
      breadcrumb={["Inspector", "Notifications"]}
    >
      <Panel
        title="Recent Notifications"
        description={`${notifications.filter(n => !readIds.includes(n.id)).length} unread updates`}
        action={
          hasUnread && (
            <button
              onClick={markAllAsRead}
              className="rounded-xl border border-border bg-card hover:bg-secondary px-3.5 py-1.5 text-xs font-extrabold text-foreground transition-all cursor-pointer"
            >
              Mark all as read
            </button>
          )
        }
      >
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : notifications.length === 0 ? (
          <p className="text-sm font-semibold text-muted-foreground py-6 text-center">
            No recent notifications.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {notifications.map((n) => {
              const isRead = readIds.includes(n.id);
              let dotColor = "bg-muted-foreground/30";
              if (!isRead) {
                if (n.status === "APPROVED") dotColor = "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]";
                else if (n.status === "REJECTED") dotColor = "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]";
                else if (n.status === "SUBMITTED") dotColor = "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]";
              }

              return (
                <li
                  key={n.id}
                  className={`flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0 transition-opacity duration-200 ${
                    isRead ? "opacity-60" : "opacity-100"
                  }`}
                >
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    <span className={`mt-2 size-2.5 shrink-0 rounded-full transition-all ${dotColor}`} />
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm text-foreground ${isRead ? "font-bold" : "font-extrabold"}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.meta}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[10px] font-bold text-muted-foreground">{n.time}</span>
                    {!isRead && (
                      <button
                        onClick={() => markAsRead(n.id)}
                        className="rounded-lg border border-border bg-card px-2.5 py-1 text-[10px] font-extrabold text-foreground hover:bg-secondary transition-all cursor-pointer whitespace-nowrap shadow-soft"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </AppShell>
  );
}
