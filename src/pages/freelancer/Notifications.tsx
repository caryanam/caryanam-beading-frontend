import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { freelancerNav } from "@/components/nav-config";
import { Panel } from "@/components/premium";
import {
  getFreelancerNotifications,
  markFreelancerNotificationAsRead,
  markAllFreelancerNotificationsAsRead,
} from "@/lib/api/freelancer-api";
import { formatIndianDateTime } from "@/lib/utils";

interface NotificationItem {
  id: number;
  title: string;
  meta: string;
  time: string;
  status: string;
  isRead: boolean;
}

export function FreelancerNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await getFreelancerNotifications();
      if (res.success && res.data && res.data.length > 0) {
        const mapped: NotificationItem[] = res.data.map((n: any) => ({
          id: n.id,
          title: n.title,
          meta: n.message,
          time: formatIndianDateTime(n.createdAt),
          status: n.type,
          isRead: !!n.isRead,
        }));
        setNotifications(mapped);
      } else {
        setNotifications([]);
      }
    } catch (err) {
      console.error("Failed to load notifications", err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markAsRead = async (id: number) => {
    try {
      await markFreelancerNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    }
  };

  const markAllAsRead = async () => {
    try {
      await markAllFreelancerNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <AppShell
      role="freelancer"
      nav={freelancerNav}
      title="Notification Center"
      breadcrumb={["Freelancer", "Notifications"]}
    >
      <Panel
        title="Recent Notifications"
        description={`${unreadCount} unread updates`}
        action={
          unreadCount > 0 && (
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
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          </div>
        ) : notifications.length === 0 ? (
          <p className="text-sm font-semibold text-muted-foreground py-6 text-center">
            No recent notifications.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {notifications.map((n) => {
              const isRead = n.isRead;
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
