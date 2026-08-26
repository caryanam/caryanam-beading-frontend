import { useEffect, useState, useRef, type ReactNode } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Bell,
  BellOff,
  ChevronRight,
  ExternalLink,
  LogOut,
  Menu,
  Moon,
  Sun,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn, formatIndianDateTime } from "@/lib/utils";
import { clearSession, readSession, type Session } from "@/lib/session";
import type { Role } from "@/lib/mock-data";
import { getMyInspections, getInspectorNotifications, markInspectorNotificationAsRead, markAllInspectorNotificationsAsRead } from "@/lib/api/inspector-api";
import { getFreelancerNotifications, markFreelancerNotificationAsRead, markAllFreelancerNotificationsAsRead } from "@/lib/api/freelancer-api";
import { getSubmittedInspections, getAdminNotifications, markAdminNotificationAsRead, markAllAdminNotificationsAsRead } from "@/lib/api/admin-api";
import { getMarketplaceInspections, getDealerNotifications, markDealerNotificationAsRead, markAllDealerNotificationsAsRead } from "@/lib/api/dealer-api";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

export interface NotificationPopupItem {
  id: string | number;
  rawId: number;
  title: string;
  meta: string;
  time: string;
  status: string;
  link: string;
  isRead?: boolean;
}

export function AppShell({
  role,
  nav,
  title,
  breadcrumb,
  children,
}: {
  role: Role;
  nav: NavItem[];
  title: string;
  breadcrumb: string[];
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationItems, setNotificationItems] = useState<NotificationPopupItem[]>([]);
  const [readIds, setReadIds] = useState<number[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("read_notification_ids") || "[]");
    } catch {
      return [];
    }
  });
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSession(readSession(role));
  }, [role]);

  // Click outside to close notifications dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotifications]);

  const fetchNotifications = async () => {
    try {
      if (role === "inspector") {
        try {
          const notifRes = await getInspectorNotifications();
          if (notifRes.success && notifRes.data && notifRes.data.length > 0) {
            const list: NotificationPopupItem[] = notifRes.data.map((n: any) => ({
              id: n.id,
              rawId: n.id,
              title: n.title,
              meta: n.message,
              time: formatIndianDateTime(n.createdAt),
              status: n.type,
              isRead: n.isRead,
              link: "/inspector/vehicles",
            }));
            setNotificationItems(list);
            setUnreadCount(list.filter((n) => !n.isRead).length);
          } else {
            const res = await getMyInspections();
            if (res.success && res.data) {
              const list: NotificationPopupItem[] = res.data
                .filter((ins) => ins.status !== "DRAFT" && ins.status !== "IN_PROGRESS")
                .map((ins) => {
                  const carName = `${ins.brand || ""} ${ins.model || ""} ${ins.variant || ""}`.trim();
                  let notifTitle = "";
                  let notifMeta = "";
                  if (ins.status === "APPROVED") {
                    notifTitle = `Inspection Approved: ${carName}`;
                    notifMeta = `Vehicle ${ins.vehicleNumber} approved by Admin and ready for live bidding.`;
                  } else if (ins.status === "REJECTED") {
                    notifTitle = `Inspection Rejected: ${carName}`;
                    notifMeta = `Vehicle ${ins.vehicleNumber} rejected. Reason: ${ins.rejectionReason || "Please verify details."}`;
                  } else {
                    notifTitle = `Inspection Submitted: ${carName}`;
                    notifMeta = `Report for ${ins.vehicleNumber} submitted successfully and pending approval.`;
                  }
                  const timeStr = formatIndianDateTime(ins.submittedAt);

                  return {
                    id: ins.inspectionId,
                    rawId: ins.inspectionId,
                    title: notifTitle,
                    meta: notifMeta,
                    time: timeStr,
                    status: ins.status,
                    isRead: false,
                    link: "/inspector/vehicles",
                  };
                });

              list.sort((a, b) => b.rawId - a.rawId);
              setNotificationItems(list);
              setUnreadCount(list.filter((n) => !n.isRead).length);
            }
          }
        } catch (e) {
          console.error("Failed to load inspector notifications", e);
        }
      } else if (role === "freelancer") {
        try {
          const notifRes = await getFreelancerNotifications();
          if (notifRes.success && notifRes.data && notifRes.data.length > 0) {
            const list: NotificationPopupItem[] = notifRes.data.map((n: any) => ({
              id: n.id,
              rawId: n.id,
              title: n.title,
              meta: n.message,
              time: formatIndianDateTime(n.createdAt),
              status: n.type,
              isRead: n.isRead,
              link: "/freelancer/vehicles",
            }));
            setNotificationItems(list);
            setUnreadCount(list.filter((n) => !n.isRead).length);
          } else {
            setNotificationItems([]);
            setUnreadCount(0);
          }
        } catch (e) {
          console.error("Failed to load freelancer notifications", e);
        }
      } else if (role === "dealer") {
        try {
          const notifRes = await getDealerNotifications();
          if (notifRes.success && notifRes.data && notifRes.data.length > 0) {
            const list: NotificationPopupItem[] = notifRes.data.map((n: any) => ({
              id: n.id,
              rawId: n.id,
              title: n.title,
              meta: n.message,
              time: formatIndianDateTime(n.createdAt),
              status: n.type,
              isRead: n.isRead,
              link: n.inspectionId ? `/dealer/vehicles/${n.inspectionId}` : `/dealer/marketplace`,
            }));
            setNotificationItems(list);
            setUnreadCount(list.filter((n) => !n.isRead).length);
          } else {
            const res = await getMarketplaceInspections();
            if (res.success && res.data) {
              const list: NotificationPopupItem[] = res.data.map((ins) => {
                const carName = `${ins.brand || ""} ${ins.model || ""} ${ins.variant || ""}`.trim();
                let notifTitle = "";
                let notifMeta = "";
                const vStatus = ins.vehicleStatus || "READY_FOR_AUCTION";

                if (vStatus === "AUCTION_LIVE") {
                  notifTitle = `🔥 Live Auction: ${carName}`;
                  notifMeta = `Bidding is LIVE now for vehicle ${ins.vehicleNumber}! Highest bid: ₹${ins.currentHighestBid || ins.suggestedPrice || 0}`;
                } else if (vStatus === "AUCTION_COMPLETED") {
                  notifTitle = `Auction Closed: ${carName}`;
                  notifMeta = `Bidding has completed for vehicle ${ins.vehicleNumber}.`;
                } else {
                  notifTitle = `🚗 New Vehicle: ${carName}`;
                  notifMeta = `Vehicle ${ins.vehicleNumber} is available for bidding.`;
                }
                const timeStr = formatIndianDateTime(ins.submittedAt);

                return {
                  id: ins.inspectionId,
                  rawId: ins.inspectionId,
                  title: notifTitle,
                  meta: notifMeta,
                  time: timeStr,
                  status: ins.status,
                  isRead: false,
                  link: `/dealer/vehicles/${ins.inspectionId}`,
                };
              });

              list.sort((a, b) => b.rawId - a.rawId);
              setNotificationItems(list);
              setUnreadCount(list.filter((n) => !n.isRead).length);
            }
          }
        } catch (e) {
          console.error("Failed to load dealer notifications", e);
        }
      } else if (role === "admin") {
        try {
          const notifRes = await getAdminNotifications();
          if (notifRes.success && notifRes.data && notifRes.data.length > 0) {
            const list: NotificationPopupItem[] = notifRes.data.map((n: any) => ({
              id: n.id,
              rawId: n.id,
              title: n.title,
              meta: n.message,
              time: formatIndianDateTime(n.createdAt),
              status: n.type,
              isRead: n.isRead,
              link: n.inspectionId ? `/admin/auctions/${n.inspectionId}` : `/admin/vehicles`,
            }));
            setNotificationItems(list);
            setUnreadCount(list.filter((n) => !n.isRead).length);
            return;
          }
        } catch (e) {
          console.warn("Backend API getAdminNotifications fallback to submitted inspections", e);
        }

        try {
          const res = await getSubmittedInspections();
          if (res.success && res.data) {
            const list: NotificationPopupItem[] = res.data
              .filter((ins: any) => ins.status === "SUBMITTED")
              .map((ins: any) => {
                const carName = `${ins.brand || ""} ${ins.model || ""} ${ins.variant || ""}`.trim();
                const timeStr = formatIndianDateTime(ins.submittedAt);

                return {
                  id: ins.inspectionId,
                  rawId: ins.inspectionId,
                  title: `Pending Approval: ${carName}`,
                  meta: `Vehicle ${ins.vehicleNumber} submitted by ${ins.inspectorName || "Inspector"} requires approval.`,
                  time: timeStr,
                  status: ins.status,
                  isRead: false,
                  link: "/admin/vehicles",
                };
              });

            list.sort((a, b) => b.rawId - a.rawId);
            setNotificationItems(list);
            setUnreadCount(list.filter((n) => !n.isRead).length);
          }
        } catch (e) {
          console.error("Failed to load admin submitted inspections fallback", e);
        }
      }
    } catch (err) {
      console.error("Failed to load notifications", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [role, pathname]);

  const markSingleAsRead = async (rawId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      if (role === "admin") {
        await markAdminNotificationAsRead(rawId);
      } else if (role === "dealer") {
        await markDealerNotificationAsRead(rawId);
      } else if (role === "freelancer") {
        await markFreelancerNotificationAsRead(rawId);
      } else if (role === "inspector") {
        await markInspectorNotificationAsRead(rawId);
      }
      setNotificationItems((prev) =>
        prev.map((item) => (item.rawId === rawId ? { ...item, isRead: true } : item))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification as read via API", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      if (role === "admin") {
        await markAllAdminNotificationsAsRead();
      } else if (role === "dealer") {
        await markAllDealerNotificationsAsRead();
      } else if (role === "freelancer") {
        await markAllFreelancerNotificationsAsRead();
      } else if (role === "inspector") {
        await markAllInspectorNotificationsAsRead();
      }
      setNotificationItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all notifications as read via API", err);
    }
  };

  const [expiredRole, setExpiredRole] = useState<string | null>(null);

  useEffect(() => {
    const handleExpired = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.role === role) {
        setExpiredRole(customEvent.detail.role);
      }
    };
    window.addEventListener("session-expired", handleExpired);
    return () => {
      window.removeEventListener("session-expired", handleExpired);
    };
  }, [role]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const signOut = () => {
    clearSession(role);
    navigate("/", { replace: true });
  };

  const initials = (session?.name ?? role).slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background font-sans antialiased text-foreground">
      {/* Sidebar Navigation: Full drawer on mobile (<lg), compact pill bar on desktop (lg:) */}
      <aside
        className={cn(
          "surface-dark fixed inset-y-0 left-0 z-50 flex h-screen flex-col justify-between py-6 border-r border-[#1E202C] shadow-2xl transition-all duration-300 ease-out lg:translate-x-0 rounded-r-[28px] overflow-x-hidden no-scrollbar",
          "w-[272px] lg:w-20",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Top Logo Badge Section */}
        <div className="flex items-center justify-between px-5 lg:px-0 lg:flex-col lg:items-center w-full shrink-0">
          <Link
            to="/"
            className="flex items-center gap-3 min-w-0 group"
            title="Caryanam Enterprise"
          >
            <div className="relative grid size-11 shrink-0 place-items-center rounded-2xl overflow-hidden shadow-[0_4px_16px_rgba(255,199,0,0.3)] transition-transform group-hover:scale-105 bg-[#0D0E12] border border-[#FFC700]/40">
              <img src="/logo.png" alt="Caryanam Bidding" className="size-full object-cover" />
            </div>
            <div className="min-w-0 lg:hidden">
              <p className="truncate text-sm font-extrabold tracking-[0.2em] text-white uppercase">
                <span className="text-[#FFC700]">Caryanam</span>
              </p>
              <p className="text-[10px] font-bold tracking-[0.15em] text-white/50 uppercase">
                Auction Enterprise
              </p>
            </div>
          </Link>
          <button
            onClick={() => setOpen(false)}
            className="text-white/60 hover:text-white lg:hidden p-1.5 rounded-xl border border-white/10"
            aria-label="Close menu"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Navigation List (Top-aligned & Scrollable) */}
        <nav className="my-3 flex-1 min-h-0 flex flex-col gap-2 py-2 w-full px-3 overflow-y-auto overflow-x-hidden [scrollbar-width:thin] [scrollbar-color:rgba(255,199,0,0.3)_transparent]">
          {nav.map((item) => {
            const active =
              pathname === item.to ||
              (item.to !== `/${role}` && pathname.startsWith(item.to));
            return (
              <div
                key={item.to}
                className="relative group flex items-center w-full"
              >
                <Link
                  to={item.to}
                  title={item.label}
                  className={cn(
                    "flex items-center gap-3.5 rounded-2xl w-full px-4 py-3 text-sm transition-all duration-200 lg:justify-center lg:px-0 lg:size-11",
                    active
                      ? "bg-[#FFC700] text-[#0D0E12] font-extrabold shadow-[0_4px_16px_rgba(255,199,0,0.35)] lg:scale-105"
                      : "text-white/70 font-semibold hover:bg-white/10 hover:text-[#FFC700]",
                  )}
                  aria-label={item.label}
                >
                  <item.icon className="size-5 shrink-0" />
                  <span className="truncate lg:hidden">{item.label}</span>
                </Link>

                {/* Desktop Hover Tooltip Label */}
                <div className="hidden lg:flex pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3.5 items-center opacity-0 -translate-x-1.5 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 ease-out z-[99]">
                  <div className="size-2 rotate-45 bg-[#0D0E12] border-l border-b border-[#FFC700]/30 -mr-1 z-10" />
                  <span className="rounded-xl border border-[#FFC700]/30 bg-[#0D0E12] px-3.5 py-1.5 text-xs font-extrabold text-white shadow-[0_8px_24px_rgba(0,0,0,0.85)] whitespace-nowrap">
                    {item.label}
                  </span>
                </div>
              </div>
            );
          })}
        </nav>

        {/* Bottom Actions: User Profile & Logout */}
        <div className="flex flex-col gap-3 shrink-0 w-full px-4 lg:px-3 lg:items-center">
          <div className="flex items-center gap-3 w-full rounded-2xl border border-white/10 bg-white/5 p-2.5 lg:border-none lg:bg-transparent lg:p-0 lg:justify-center">
            <span
              className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[#FFC700] text-xs font-extrabold text-[#0D0E12] shadow-sm cursor-pointer"
              title={`${session?.name ?? "User"} (${role})`}
            >
              {initials}
            </span>
            <div className="min-w-0 flex-1 lg:hidden">
              <p className="truncate text-xs font-extrabold text-white">
                {session?.name ?? "User"}
              </p>
              <p className="text-[10px] font-bold text-[#FFC700] uppercase tracking-wider">
                {role} Account
              </p>
            </div>
            <div className="hidden lg:flex pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3.5 items-center opacity-0 -translate-x-1.5 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 ease-out z-[99]">
              <div className="size-2 rotate-45 bg-[#0D0E12] border-l border-b border-[#FFC700]/30 -mr-1 z-10" />
              <span className="rounded-xl border border-[#FFC700]/30 bg-[#0D0E12] px-3.5 py-1.5 text-xs font-extrabold text-white shadow-[0_8px_24px_rgba(0,0,0,0.85)] whitespace-nowrap">
                {session?.name ?? "User"} ({role})
              </span>
            </div>
          </div>

          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 text-xs font-extrabold text-white transition-all hover:bg-rose-500/20 hover:border-rose-500/50 hover:text-rose-400 lg:justify-center lg:px-0 lg:size-10"
            aria-label="Logout Session"
            title="Logout Session"
          >
            <LogOut className="size-4 shrink-0 text-[#FFC700] hover:text-rose-400 transition-colors" />
            <span className="lg:hidden">Logout Session</span>
            <div className="hidden lg:flex pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3.5 items-center opacity-0 -translate-x-1.5 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 ease-out z-[99]">
              <div className="size-2 rotate-45 bg-[#0D0E12] border-l border-b border-rose-500/40 -mr-1 z-10" />
              <span className="rounded-xl border border-rose-500/40 bg-[#0D0E12] px-3.5 py-1.5 text-xs font-extrabold text-rose-400 shadow-[0_8px_24px_rgba(0,0,0,0.85)] whitespace-nowrap">
                Logout Session
              </span>
            </div>
          </button>
        </div>
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Header & Main Workspace */}
      <div className="lg:pl-20">
        <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-md transition-all">
          <div className="flex items-center justify-between gap-4 px-6 py-2.5 sm:px-8 sm:py-3">
            {/* Left: Mobile Menu + Breadcrumbs & Page Title */}
            <div className="flex items-center gap-3.5 min-w-0">
              <button
                onClick={() => setOpen(true)}
                className="shrink-0 rounded-2xl border border-border p-2 hover:border-[#FFC700] lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="size-4" />
              </button>

              <div className="min-w-0">
                <nav className="hidden items-center gap-1.5 text-[11px] text-muted-foreground font-medium sm:flex">
                  {breadcrumb.map((crumb, i) => (
                    <span key={crumb} className="flex items-center gap-1">
                      {i > 0 && (
                        <ChevronRight className="size-3 text-muted-foreground/60" />
                      )}
                      <span
                        className={
                          i === breadcrumb.length - 1
                            ? "font-bold text-foreground"
                            : ""
                        }
                      >
                        {crumb}
                      </span>
                    </span>
                  ))}
                </nav>
                <h1 className="truncate text-lg sm:text-xl font-extrabold text-foreground tracking-tight">
                  {title}
                </h1>
              </div>
            </div>

            {/* Right Actions: Theme Toggle, Notifications, Profile Circle, Logout Button */}
            <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
              <button
                onClick={() =>
                  document.documentElement.classList.toggle("dark")
                }
                className="grid size-9 place-items-center rounded-full border border-border bg-card shadow-soft transition-all hover:border-[#FFC700] hover:bg-[#FFC700]/10"
                title="Toggle Theme"
              >
                <Moon className="size-4 text-foreground dark:hidden" />
                <Sun className="size-4 text-foreground hidden dark:block" />
              </button>

              {/* Notification Popover Dropdown */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setShowNotifications((prev) => !prev)}
                  className={cn(
                    "relative grid size-9 place-items-center rounded-full border border-border bg-card shadow-soft transition-all cursor-pointer",
                    showNotifications
                      ? "border-[#FFC700] bg-[#FFC700]/10 text-[#FFC700]"
                      : "hover:border-[#FFC700] hover:bg-[#FFC700]/10 text-foreground"
                  )}
                  title="Notifications"
                >
                  <Bell className="size-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 grid size-4 min-w-4 place-items-center rounded-full bg-[#FFC700] px-1 text-[9px] font-extrabold text-[#0D0E12] shadow-sm animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="fixed inset-x-3 top-16 z-50 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-3 w-auto sm:w-96 max-w-md mx-auto sm:mx-0 rounded-3xl border border-border bg-card/95 backdrop-blur-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.35)] animate-in fade-in-50 zoom-in-95 duration-150">
                    <div className="flex items-center justify-between border-b border-border pb-3 px-1">
                      <div className="flex items-center gap-2">
                        <p className="font-extrabold text-sm text-foreground">Notifications</p>
                        {unreadCount > 0 && (
                          <span className="rounded-full bg-[#FFC700] px-2 py-0.5 text-[10px] font-black text-[#0D0E12]">
                            {unreadCount} UNREAD
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-[11px] font-bold text-[#FFC700] hover:underline cursor-pointer"
                          >
                            Mark all as read
                          </button>
                        )}
                        <button
                          onClick={() => setShowNotifications(false)}
                          className="rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
                          title="Close"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 max-h-[360px] sm:max-h-[440px] overflow-y-auto space-y-2 pr-1.5 overscroll-contain [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-secondary/30 [&::-webkit-scrollbar-thumb]:bg-[#FFC700]/50 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#FFC700]">
                      {notificationItems.length === 0 ? (
                        <div className="py-8 text-center text-muted-foreground">
                          <BellOff className="size-8 mx-auto opacity-30 mb-2" />
                          <p className="text-xs font-semibold">No notifications</p>
                        </div>
                      ) : (
                        notificationItems.map((n) => {
                          const isRead = !!n.isRead;
                          let dotBg = "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]";
                          if (n.status === "REJECTED") {
                            dotBg = "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]";
                          } else if (n.status === "SUBMITTED" || n.status === "READY_FOR_AUCTION") {
                            dotBg = "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]";
                          }

                          return (
                            <div
                              key={n.id}
                              onClick={(e) => {
                                markSingleAsRead(n.rawId, e);
                                if (n.link) {
                                  setShowNotifications(false);
                                  navigate(n.link);
                                }
                              }}
                              className={cn(
                                "group flex items-start gap-2.5 rounded-2xl p-3 border transition-all cursor-pointer",
                                isRead
                                  ? "border-transparent hover:bg-secondary/60 opacity-60"
                                  : "border-[#FFC700]/30 bg-[#FFC700]/5 hover:bg-[#FFC700]/10 opacity-100"
                              )}
                              title={isRead ? "Read notification" : "Click to view and mark as read"}
                            >
                              <span className={cn("mt-1.5 size-2.5 shrink-0 rounded-full transition-all", dotBg)} />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-1.5">
                                  <p className="truncate text-xs font-extrabold text-foreground group-hover:text-[#FFC700] transition-colors">
                                    {n.title}
                                  </p>
                                  <span className="text-[9px] font-bold text-muted-foreground shrink-0">{n.time}</span>
                                </div>
                                <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug line-clamp-2">
                                  {n.meta}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile Info and Avatar */}
              <div className="flex items-center gap-2.5">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-[11px] font-black text-foreground uppercase tracking-wider leading-tight">
                    {session?.name ?? "User"}
                  </span>
                  <span className="text-[9px] text-muted-foreground font-semibold tracking-wide leading-none mt-0.5 max-w-[160px] truncate">
                    {session?.email ?? ""}
                  </span>
                </div>
                <span
                  className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-[#FFC700] to-[#E6B200] text-xs font-extrabold text-[#0D0E12] shadow-sm cursor-pointer shrink-0"
                  title={`${session?.name ?? "User"} (${role})`}
                >
                  {initials}
                </span>
              </div>

              {/* Top Header Logout Action Button */}
              <button
                onClick={signOut}
                className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-extrabold text-foreground transition-all hover:border-rose-500/50 hover:bg-rose-500/10 hover:text-rose-500 shadow-soft"
                title="Logout Session"
              >
                <LogOut className="size-3.5 text-rose-500" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>

        <main className="animate-rise mx-auto max-w-[1440px] space-y-5 sm:space-y-8 px-3.5 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8">
          {children}
        </main>
      </div>

      {expiredRole && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md">
          <div className="mx-4 w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-[0_20px_50px_rgba(0,0,0,0.15)] animate-in fade-in-50 zoom-in-95 duration-200 text-center">
            <div className="grid size-14 place-items-center rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 mx-auto">
              <Zap className="size-7 fill-current" />
            </div>
            <h3 className="mt-5 text-xl font-extrabold text-foreground tracking-tight">
              {expiredRole === "admin"
                ? "Admin Session Expired"
                : expiredRole === "dealer"
                  ? "Dealer Session Expired"
                  : expiredRole === "freelancer"
                    ? "Freelancer Session Expired"
                    : "Inspector Session Expired"}
            </h3>
            <p className="mt-3 text-sm font-semibold text-muted-foreground leading-relaxed">
              {expiredRole === "admin"
                ? "Your administrator session has expired. Please log in again to continue managing the bidding network."
                : expiredRole === "dealer"
                  ? "Your bidding console session has expired. Please log in again to place bids and browse the marketplace."
                  : expiredRole === "freelancer"
                    ? "Your freelancer session has expired. Please log in again to save drafts and submit vehicle reports."
                    : "Your vehicle evaluation session has expired. Please log in again to save drafts and submit reports."}
            </p>
            <button
              onClick={() => {
                clearSession(role);
                setExpiredRole(null);
                navigate("/", { replace: true });
              }}
              className="mt-6 w-full rounded-2xl bg-[#FFC700] hover:bg-[#FFD633] py-3.5 text-center text-sm font-extrabold text-[#0D0E12] shadow-[0_4px_16px_rgba(255,199,0,0.35)] transition-all cursor-pointer"
            >
              Log in again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
