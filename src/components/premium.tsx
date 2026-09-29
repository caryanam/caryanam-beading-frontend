import { useState, useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  Heart,
  Clock,
  ShieldCheck,
  ChevronRight,
  CheckCircle2,
  ArrowUpRight,
  Gauge,
  Fuel,
  Cog,
  User,
  Zap,
  Shield,
  Headphones,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { type Vehicle, inr, timeLeft } from "@/lib/mock-data";
import { readSession } from "@/lib/session";
import { addToWishlist, removeFromWishlist, getDealerWishlist, getDealerBidsHistory } from "@/lib/api/dealer-api";

export function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  accent,
  active,
  onClick,
  className,
}: {
  label: string;
  value: string | number;
  delta?: string;
  icon: any;
  accent?: boolean;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const isClickable = Boolean(onClick);
  return (
    <div
      onClick={onClick}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={cn(
        "group relative overflow-hidden rounded-2xl sm:rounded-3xl p-4 sm:p-6 transition-all duration-300 select-none",
        isClickable && "cursor-pointer active:scale-[0.98]",
        active
          ? "border-2 border-[#FFC700] ring-4 ring-[#FFC700]/20 bg-card shadow-md scale-[1.01]"
          : accent
          ? "surface-dark border border-[#FFC700]/40 text-white shadow-lift"
          : "border border-border bg-card shadow-soft hover:border-[#FFC700]/50 hover:shadow-md",
        className
      )}
    >
      <div className="flex items-start sm:items-center justify-between gap-2">
        <span
          className={cn(
            "text-[10px] sm:text-xs font-black uppercase tracking-wider line-clamp-2",
            accent ? "text-[#FFC700]" : "text-muted-foreground",
          )}
        >
          {label}
        </span>
        <span
          className={cn(
            "grid size-9 sm:size-11 shrink-0 place-items-center rounded-xl sm:rounded-2xl border transition-colors shadow-sm",
            accent
              ? "border-[#FFC700]/50 bg-[#FFC700]/25 text-[#FFC700]"
              : "border-[#FFC700]/30 bg-[#FFC700]/10 text-[#FFC700]",
          )}
        >
          <Icon className="size-4 sm:size-5" />
        </span>
      </div>
      <p
        className={cn(
          "relative z-10 mt-3 sm:mt-6 text-2xl sm:text-3xl font-extrabold tracking-tight",
          accent ? "text-white" : "text-foreground",
        )}
      >
        {value}
      </p>
      {delta && (
        <p
          className={cn(
            "relative z-10 mt-1 sm:mt-2 flex items-center gap-1 text-[11px] sm:text-xs font-semibold truncate",
            accent ? "text-[#FFC700]" : "text-muted-foreground",
          )}
        >
          <ArrowUpRight className="size-3 sm:size-3.5 text-[#FFC700] shrink-0" />
          <span className="truncate">{delta}</span>
        </p>
      )}
    </div>
  );
}

export function Panel({
  title,
  description,
  action,
  children,
  className,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl sm:rounded-3xl border border-border bg-card p-4 sm:p-6 shadow-soft transition-all duration-300 hover:border-[#FFC700]/35",
        className,
      )}
    >
      {(title || action) && (
        <header className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            {title && (
              <h2 className="truncate text-base sm:text-lg font-extrabold tracking-tight text-foreground">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm font-medium text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

const chipStyles: Record<string, string> = {
  approved: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 font-bold shadow-xs dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-700/50",
  active: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 font-bold shadow-xs dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-700/50",
  verified: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 font-bold shadow-xs dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-700/50",
  live: "bg-emerald-600 text-white border-emerald-600 font-extrabold shadow-sm dark:bg-emerald-500 dark:text-slate-950 dark:border-emerald-400",
  won: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 font-bold shadow-xs dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-700/50",
  negotiable: "bg-amber-500/15 text-amber-700 border-amber-500/30 font-bold shadow-xs dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700/50",
  negotiation: "bg-amber-500/15 text-amber-700 border-amber-500/30 font-bold shadow-xs dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700/50",
  under_negotiation: "bg-amber-500/15 text-amber-700 border-amber-500/30 font-bold shadow-xs dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700/50",
  pending: "bg-amber-500/15 text-amber-800 border-amber-500/30 font-bold shadow-xs dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700/50",
  submitted: "bg-amber-500/15 text-amber-800 border-amber-500/30 font-bold shadow-xs dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700/50",
  scheduled: "bg-indigo-500/15 text-indigo-700 border-indigo-500/30 font-bold shadow-xs dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-700/50",
  "coming soon": "bg-indigo-500/15 text-indigo-700 border-indigo-500/30 font-bold shadow-xs dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-700/50",
  draft: "bg-slate-500/15 text-slate-700 border-slate-500/30 font-bold shadow-xs dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  "in_progress": "bg-slate-500/15 text-slate-700 border-slate-500/30 font-bold shadow-xs dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  "in progress": "bg-slate-500/15 text-slate-700 border-slate-500/30 font-bold shadow-xs dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  completed: "bg-gray-500/15 text-gray-700 border-gray-500/30 font-bold shadow-xs dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
  ended: "bg-gray-500/15 text-gray-700 border-gray-500/30 font-bold shadow-xs dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
  "auction ended": "bg-gray-500/15 text-gray-700 border-gray-500/30 font-bold shadow-xs dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
  "auction_ended": "bg-gray-500/15 text-gray-700 border-gray-500/30 font-bold shadow-xs dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
  "sold out": "bg-rose-500/15 text-rose-700 border-rose-500/30 font-bold shadow-xs dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-700/50",
  "sold_out": "bg-rose-500/15 text-rose-700 border-rose-500/30 font-bold shadow-xs dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-700/50",
  sold: "bg-rose-500/15 text-rose-700 border-rose-500/30 font-bold shadow-xs dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-700/50",
  rejected: "bg-rose-500/15 text-rose-700 border-rose-500/30 font-bold shadow-xs dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-700/50",
  blocked: "bg-rose-500/15 text-rose-700 border-rose-500/30 font-bold shadow-xs dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-700/50",
  suspended: "bg-rose-500/15 text-rose-700 border-rose-500/30 font-bold shadow-xs dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-700/50",
  lost: "bg-rose-500/15 text-rose-700 border-rose-500/30 font-bold shadow-xs dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-700/50",
};

export function StatusChip({ status }: { status: string }) {
  const key = (status || "").toLowerCase();
  let label = status;
  if (key === "draft" || key === "in_progress" || key === "in progress") {
    label = "Draft";
  } else if (key === "scheduled" || key === "coming soon") {
    label = "Coming Soon";
  } else if (key === "ended" || key === "auction ended" || key === "auction_ended" || key === "completed") {
    label = "Auction Ended";
  } else if (key === "sold out" || key === "sold_out" || key === "sold") {
    label = "Sold Out";
  } else if (key === "live") {
    label = "LIVE";
  } else if (key === "negotiable" || key === "negotiation" || key === "under_negotiation") {
    label = "Negotiable";
  } else if (key === "won") {
    label = "Won";
  } else if (key === "lost") {
    label = "Lost";
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] uppercase tracking-wider font-extrabold shadow-2xs transition-colors",
        chipStyles[key] ?? "bg-slate-500/15 text-slate-700 border-slate-500/30 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
      )}
    >
      {key === "live" && (
        <span className="relative flex size-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full size-2 bg-emerald-500"></span>
        </span>
      )}
      {label}
    </span>
  );
}

export function ScoreBadge({ score }: { score: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FFC700]/30 bg-card px-3.5 py-1 text-xs font-bold shadow-soft">
      <ShieldCheck className="size-3.5 text-[#FFC700]" />
      <span className="text-muted-foreground">Score</span>{" "}
      <span className="text-[#0D0E12] font-extrabold">{score}</span>/100
    </span>
  );
}


export function VehicleCard({
  vehicle,
  isFavourite,
  onToggleFavourite,
}: {
  vehicle: Vehicle;
  isFavourite?: boolean;
  onToggleFavourite?: () => void;
}) {
  const [isFav, setIsFav] = useState(isFavourite ?? false);
  const [userBidStatus, setUserBidStatus] = useState<"top" | "outbid" | "none">(
    vehicle.userBidStatus ?? "none"
  );

  useEffect(() => {
    setIsFav(isFavourite ?? false);
  }, [isFavourite]);

  useEffect(() => {
    if (vehicle.userBidStatus !== undefined) {
      setUserBidStatus(vehicle.userBidStatus);
    }
  }, [vehicle.userBidStatus]);

  useEffect(() => {
    let isMounted = true;
    const checkBidsAndWishlist = async () => {
      try {
        const [wRes, bRes] = await Promise.all([
          getDealerWishlist().catch(() => ({ success: false, data: [] })),
          getDealerBidsHistory().catch(() => ({ success: false, data: [] })),
        ]);

        if (isMounted && wRes.success && wRes.data) {
          const inWishlist = wRes.data.some(
            (item: any) => String(item.inspectionId || item.id) === String(vehicle.id)
          );
          setIsFav(inWishlist);
        }

        if (isMounted && bRes.success && bRes.data) {
          const bidRecord = bRes.data.find(
            (b: any) => String(b.vehicleId || b.id) === String(vehicle.id)
          );
          if (bidRecord) {
            const myBid = Number(bidRecord.myBid || 0);
            const highest = Number(vehicle.highestBid || bidRecord.highestBid || 0);
            if (myBid > 0 && myBid >= highest) {
              setUserBidStatus("top");
            } else if (myBid > 0 && myBid < highest) {
              setUserBidStatus("outbid");
            } else {
              setUserBidStatus("none");
            }
          } else if (vehicle.userBidStatus === undefined) {
            setUserBidStatus("none");
          }
        }
      } catch (err) {
        console.error("Error checking wishlist/bids from API", err);
      }
    };

    checkBidsAndWishlist();

    const handleUpdate = () => checkBidsAndWishlist();
    window.addEventListener("wishlist-updated", handleUpdate);
    window.addEventListener("bids-updated", handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener("wishlist-updated", handleUpdate);
      window.removeEventListener("bids-updated", handleUpdate);
    };
  }, [vehicle.id, vehicle.highestBid, vehicle.userBidStatus]);

  const toggleFav = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (isFav) {
        await removeFromWishlist(Number(vehicle.id));
        setIsFav(false);
        toast.success("Removed from watchlist.");
      } else {
        await addToWishlist(Number(vehicle.id));
        setIsFav(true);
        toast.success("Added to watchlist!");
      }
      if (onToggleFavourite) {
        onToggleFavourite();
      }
      window.dispatchEvent(new CustomEvent("wishlist-updated"));
    } catch (err) {
      console.error("Failed to toggle wishlist", err);
      toast.error("Could not update watchlist.");
    }
  };

  const isLive = vehicle.auction === "live";
  const isEnded =
    (vehicle.auction as string) === "ended" ||
    (vehicle.auction as string) === "auction ended" ||
    (vehicle.auction as string) === "auction_ended" ||
    (vehicle.auction as string) === "completed";
  const isSoldOut =
    (vehicle.auction as string) === "sold out" ||
    (vehicle.auction as string) === "sold_out" ||
    (vehicle.auction as string) === "sold";
  const isComingSoon =
    vehicle.auction === "scheduled" ||
    (vehicle.auction as string) === "coming soon";

  const [timeRemaining, setTimeRemaining] = useState(timeLeft(vehicle.endsAt));

  useEffect(() => {
    setTimeRemaining(timeLeft(vehicle.endsAt));
    const timerId = setInterval(() => {
      setTimeRemaining(timeLeft(vehicle.endsAt));
    }, 1000);
    return () => clearInterval(timerId);
  }, [vehicle.endsAt]);

  const getTimerParts = (endsAt?: number) => {
    if (!endsAt) return { hours: "00", minutes: "00", seconds: "00" };
    const diff = endsAt - Date.now();
    if (diff <= 0) return { hours: "00", minutes: "00", seconds: "00" };
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return {
      hours: String(h).padStart(2, "0"),
      minutes: String(m).padStart(2, "0"),
      seconds: String(s).padStart(2, "0"),
    };
  };

  const timerParts = getTimerParts(vehicle.endsAt);
  const locationText = vehicle.location || (vehicle as any).city;
  const rtoText = vehicle.rtoInformation || (vehicle as any).rto;
  const locationPillLabel = [locationText, rtoText].filter(Boolean).join(" • ");
  const engineRating = vehicle.engineRating || (vehicle as any).overallRating || (vehicle as any).rating;
  const isFreelancerVehicle =
    (vehicle as any).isFreelancer ||
    (vehicle as any).sourceType === "FREELANCER" ||
    (vehicle as any).inspector?.toLowerCase().includes("freelancer") ||
    !!(vehicle as any).freelancerName;

  const targetLink = isFreelancerVehicle
    ? `/dealer/freelancer-vehicles/${vehicle.id}`
    : `/dealer/vehicles/${vehicle.id}`;

  return (
    <Link
      to={targetLink}
      className={cn(
        "group relative overflow-hidden rounded-3xl border transition-all duration-300 bg-card block cursor-pointer hover:-translate-y-1 hover:shadow-xl",
        isLive
          ? "border-emerald-500/50 ring-1 ring-emerald-500/20 shadow-[0_4px_22px_rgba(16,185,129,0.14)]"
          : isComingSoon
          ? "border-indigo-500/50 ring-1 ring-indigo-500/20 shadow-[0_4px_22px_rgba(99,102,241,0.14)]"
          : "border-border shadow-soft"
      )}
    >
      {/* Top Banner Image with Overlay Badges */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-secondary">
        <img
          src={vehicle.image}
          alt={`${vehicle.brand} ${vehicle.model}`}
          loading="lazy"
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

        {/* Top-Left Dynamic Status Badge */}
        {isLive ? (
          <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-emerald-600 text-white backdrop-blur-md px-3 py-1 text-[10px] font-black shadow-md animate-pulse">
            <span className="relative flex size-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full size-2 bg-white"></span>
            </span>
            <span className="uppercase tracking-wider">LIVE</span>
          </div>
        ) : isComingSoon ? (
          <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white backdrop-blur-md px-3 py-1 text-[10px] font-black shadow-md">
            <Clock className="size-3 shrink-0" />
            <span className="uppercase tracking-wider">COMING SOON</span>
          </div>
        ) : (
          <div className="absolute left-3 top-3 z-10 flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-md px-2.5 py-1 text-[10px] font-black text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />
            <span>VERIFIED</span>
          </div>
        )}

        {/* Top-Right Watchlist Heart */}
        <button
          type="button"
          onClick={toggleFav}
          className={cn(
            "absolute top-3 right-3 p-2.5 rounded-full backdrop-blur-md shadow-md transition-all duration-200 hover:scale-110 cursor-pointer z-20 border",
            isFav
              ? "bg-rose-500 border-rose-500 text-white shadow-rose-500/40"
              : "bg-black/50 border-white/20 text-white hover:text-rose-400"
          )}
          title={isFav ? "Remove from watchlist" : "Add to watchlist"}
        >
          <Heart
            className={cn(
              "size-4 transition-all duration-200",
              isFav ? "fill-white text-white" : "fill-transparent stroke-[2.2]"
            )}
          />
        </button>

        {/* Bottom-Left Location Badge Pill (📍 Palghar • MH-04) */}
        {locationPillLabel ? (
          <div className="absolute left-3 bottom-3 z-10 flex items-center gap-1.5 rounded-full bg-black/70 backdrop-blur-md px-3 py-1 text-[11px] font-extrabold text-white border border-white/15 max-w-[70%] truncate">
            <MapPin className="size-3 text-amber-400 shrink-0" />
            <span className="truncate">{locationPillLabel}</span>
          </div>
        ) : null}

        {/* Bottom-Right Carousel Indicator Dots */}
        <div className="absolute right-3 bottom-3 z-10 flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-2 py-1 rounded-full">
          <span className="size-1.5 rounded-full bg-[#FFC700]" />
          <span className="size-1.5 rounded-full bg-white/40" />
          <span className="size-1.5 rounded-full bg-white/40" />
        </div>
      </div>

      {/* 2. Main Card Content */}
      <div className="p-4 space-y-2">
        {/* Title Header & Engine Rating Pill Row */}
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-tight truncate">
            {[vehicle.year, vehicle.brand, vehicle.model].filter(Boolean).join(" ")}
          </p>
          {engineRating ? (
            <div className="flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-black text-emerald-600 shrink-0">
              <span>ENGINE {engineRating}</span>
              <span className="text-emerald-500">★</span>
            </div>
          ) : null}
        </div>

        {/* Variant Title Line (Bold Uppercase) */}
        <h3 className="text-base font-black text-foreground uppercase tracking-tight line-clamp-1 group-hover:text-primary transition-colors">
          {(vehicle.variant || `${vehicle.brand} ${vehicle.model}`).toUpperCase()}
        </h3>

        {/* Inline Specs Text Line: 58,906 km • 2nd owner • Diesel */}
        <p className="text-xs font-extrabold text-muted-foreground truncate">
          {[
            vehicle.odometer ? `${Number(vehicle.odometer).toLocaleString("en-IN")} km` : null,
            vehicle.owner || null,
            vehicle.fuel || null,
          ]
            .filter(Boolean)
            .join(" • ")}
        </p>

        {/* Dashed Separator Line */}
        <div className="my-3 border-t border-dashed border-border/80" />

        {/* Bottom Pricing & Digital Countdown Timer Row */}
        <div className="flex items-center justify-between gap-3 pt-0.5">
          <div>
            <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block">
              {isComingSoon ? "PRICE" : isSoldOut ? "WINNING BID" : vehicle.highestBid > 0 ? "HIGHEST BID" : "STARTING BID"}
            </span>
            <span className="text-lg font-black text-foreground tracking-tight block mt-0.5">
              {inr(isComingSoon ? vehicle.basePrice : (vehicle.highestBid > 0 ? vehicle.highestBid : vehicle.basePrice))}
            </span>
          </div>

          {/* 3-Circle Pill Digital Countdown Timer (Normal: Grey, Top Bid: Green, Outbid: Red) */}
          {isLive ? (
            <div
              className={cn(
                "inline-flex items-center gap-1.5 p-1 px-2 rounded-full border shadow-xs transition-all duration-200",
                userBidStatus === "top"
                  ? "bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/60 dark:border-emerald-700/60 dark:text-emerald-300"
                  : userBidStatus === "outbid"
                  ? "bg-rose-50 border-rose-300 text-rose-700 dark:bg-rose-950/60 dark:border-rose-700/60 dark:text-rose-300"
                  : "bg-slate-100/90 border-slate-200/90 text-slate-700 dark:bg-slate-800/80 dark:border-slate-700/80 dark:text-slate-200"
              )}
            >
              {/* Hours circle */}
              <div
                className={cn(
                  "size-8 rounded-full flex flex-col items-center justify-center border shadow-2xs shrink-0 transition-colors",
                  userBidStatus === "top"
                    ? "bg-white border-emerald-200 text-emerald-700 dark:bg-emerald-900/80 dark:border-emerald-600/50 dark:text-emerald-200"
                    : userBidStatus === "outbid"
                    ? "bg-white border-rose-200 text-rose-700 dark:bg-rose-900/80 dark:border-rose-600/50 dark:text-rose-200"
                    : "bg-white border-slate-200/90 text-slate-800 dark:bg-slate-900/90 dark:border-slate-700 dark:text-slate-100"
                )}
              >
                <span className="text-[11px] font-black leading-tight tracking-tight">
                  {timerParts.hours}
                </span>
                <span className={cn(
                  "text-[7px] font-bold uppercase leading-none tracking-wider",
                  userBidStatus === "top" ? "text-emerald-600 dark:text-emerald-400" :
                  userBidStatus === "outbid" ? "text-rose-600 dark:text-rose-400" :
                  "text-slate-500 dark:text-slate-400"
                )}>
                  hr
                </span>
              </div>

              {/* Colon separator */}
              <span
                className={cn(
                  "text-xs font-black select-none leading-none",
                  userBidStatus === "top"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : userBidStatus === "outbid"
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-slate-400 dark:text-slate-500"
                )}
              >
                :
              </span>

              {/* Minutes circle */}
              <div
                className={cn(
                  "size-8 rounded-full flex flex-col items-center justify-center border shadow-2xs shrink-0 transition-colors",
                  userBidStatus === "top"
                    ? "bg-white border-emerald-200 text-emerald-700 dark:bg-emerald-900/80 dark:border-emerald-600/50 dark:text-emerald-200"
                    : userBidStatus === "outbid"
                    ? "bg-white border-rose-200 text-rose-700 dark:bg-rose-900/80 dark:border-rose-600/50 dark:text-rose-200"
                    : "bg-white border-slate-200/90 text-slate-800 dark:bg-slate-900/90 dark:border-slate-700 dark:text-slate-100"
                )}
              >
                <span className="text-[11px] font-black leading-tight tracking-tight">
                  {timerParts.minutes}
                </span>
                <span className={cn(
                  "text-[7px] font-bold uppercase leading-none tracking-wider",
                  userBidStatus === "top" ? "text-emerald-600 dark:text-emerald-400" :
                  userBidStatus === "outbid" ? "text-rose-600 dark:text-rose-400" :
                  "text-slate-500 dark:text-slate-400"
                )}>
                  min
                </span>
              </div>

              {/* Colon separator */}
              <span
                className={cn(
                  "text-xs font-black select-none leading-none",
                  userBidStatus === "top"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : userBidStatus === "outbid"
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-slate-400 dark:text-slate-500"
                )}
              >
                :
              </span>

              {/* Seconds circle */}
              <div
                className={cn(
                  "size-8 rounded-full flex flex-col items-center justify-center border shadow-2xs shrink-0 transition-colors",
                  userBidStatus === "top"
                    ? "bg-white border-emerald-200 text-emerald-700 dark:bg-emerald-900/80 dark:border-emerald-600/50 dark:text-emerald-200"
                    : userBidStatus === "outbid"
                    ? "bg-white border-rose-200 text-rose-700 dark:bg-rose-900/80 dark:border-rose-600/50 dark:text-rose-200"
                    : "bg-white border-slate-200/90 text-slate-800 dark:bg-slate-900/90 dark:border-slate-700 dark:text-slate-100"
                )}
              >
                <span className="text-[11px] font-black leading-tight tracking-tight">
                  {timerParts.seconds}
                </span>
                <span className={cn(
                  "text-[7px] font-bold uppercase leading-none tracking-wider",
                  userBidStatus === "top" ? "text-emerald-600 dark:text-emerald-400" :
                  userBidStatus === "outbid" ? "text-rose-600 dark:text-rose-400" :
                  "text-slate-500 dark:text-slate-400"
                )}>
                  sec
                </span>
              </div>
            </div>
          ) : (
            <div className="shrink-0">
              <StatusChip
                status={
                  vehicle.auction === "sold out" || vehicle.auction === "sold"
                    ? (userBidStatus === "top" ? "won" : "sold out")
                    : userBidStatus === "top"
                    ? "negotiable"
                    : vehicle.auction
                }
              />
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
