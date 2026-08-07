import { useState, useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
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
import { addToWishlist, removeFromWishlist, getDealerWishlist } from "@/lib/api/dealer-api";

export function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  delta?: string;
  icon: any;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-3xl p-6 transition-all duration-300",
        accent
          ? "surface-dark border border-[#FFC700]/40 text-white shadow-lift"
          : "border border-border bg-card shadow-soft hover:border-[#FFC700]/35 hover:shadow-md",
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "text-xs font-black uppercase tracking-wider",
            accent ? "text-[#FFC700]" : "text-muted-foreground",
          )}
        >
          {label}
        </span>
        <span
          className={cn(
            "grid size-11 shrink-0 place-items-center rounded-2xl border transition-colors shadow-sm",
            accent
              ? "border-[#FFC700]/50 bg-[#FFC700]/25 text-[#FFC700]"
              : "border-[#FFC700]/30 bg-[#FFC700]/10 text-[#FFC700]",
          )}
        >
          <Icon className="size-5" />
        </span>
      </div>
      <p
        className={cn(
          "relative z-10 mt-6 text-3xl font-extrabold tracking-tight",
          accent ? "text-white" : "text-foreground",
        )}
      >
        {value}
      </p>
      {delta && (
        <p
          className={cn(
            "relative z-10 mt-2 flex items-center gap-1 text-xs font-semibold",
            accent ? "text-[#FFC700]" : "text-muted-foreground",
          )}
        >
          <ArrowUpRight className="size-3.5 text-[#FFC700]" />
          {delta}
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
        "rounded-3xl border border-border bg-card p-6 shadow-soft transition-all duration-300 hover:border-[#FFC700]/35",
        className,
      )}
    >
      {(title || action) && (
        <header className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
          <div className="min-w-0">
            {title && (
              <h2 className="truncate text-lg font-extrabold tracking-tight text-foreground">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1 text-sm font-medium text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          {action}
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

  useEffect(() => {
    setIsFav(isFavourite ?? false);
  }, [isFavourite]);

  useEffect(() => {
    let isMounted = true;
    const checkWishlist = async () => {
      try {
        const res = await getDealerWishlist();
        if (isMounted && res.success && res.data) {
          const inWishlist = res.data.some(
            (item: any) => String(item.inspectionId || item.id) === String(vehicle.id)
          );
          setIsFav(inWishlist);
        }
      } catch (err) {
        console.error("Error checking wishlist from API", err);
      }
    };

    checkWishlist();

    const handleUpdate = () => checkWishlist();
    window.addEventListener("wishlist-updated", handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener("wishlist-updated", handleUpdate);
    };
  }, [vehicle.id, isFavourite]);

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

  return (
    <Link
      to={`/dealer/vehicles/${vehicle.id}`}
      className={cn(
        "card-lift group relative overflow-hidden rounded-3xl border transition-all duration-300 bg-card block cursor-pointer",
        isLive
          ? "border-emerald-500/60 ring-2 ring-emerald-500/20 shadow-[0_4px_22px_rgba(16,185,129,0.16)] hover:shadow-[0_8px_32px_rgba(16,185,129,0.28)]"
          : isComingSoon
          ? "border-indigo-500/50 ring-1 ring-indigo-500/20 shadow-[0_4px_22px_rgba(99,102,241,0.14)] hover:shadow-[0_8px_32px_rgba(99,102,241,0.25)]"
          : isSoldOut || isEnded
          ? "border-border/80 opacity-90 hover:opacity-100"
          : "border-border shadow-soft hover:shadow-md",
      )}
    >
      {/* Top Banner & Vehicle Image */}
      <div className="relative aspect-[16/8] w-full overflow-hidden bg-secondary">
        <img
          src={vehicle.image}
          alt={`${vehicle.brand} ${vehicle.model}`}
          loading="lazy"
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-50" />

        {/* Top-Left Dynamic Status Overlay Badge */}
        {isLive ? (
          <div className="absolute left-2.5 top-2.5 z-10 flex items-center gap-1.5 rounded-full bg-emerald-600 text-white backdrop-blur-md px-3 py-1 text-[10px] font-black shadow-md shadow-emerald-600/30 animate-pulse">
            <span className="relative flex size-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full size-2 bg-white"></span>
            </span>
            <span className="uppercase tracking-wider">🔥 LIVE AUCTION</span>
          </div>
        ) : isComingSoon ? (
          <div className="absolute left-2.5 top-2.5 z-10 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white backdrop-blur-md px-3 py-1 text-[10px] font-black shadow-md shadow-indigo-600/30">
            <Clock className="size-3 shrink-0" />
            <span className="uppercase tracking-wider">⚡ COMING SOON</span>
          </div>
        ) : (
          <div className="absolute left-2.5 top-2.5 z-10 flex items-center gap-1 rounded-full bg-white/95 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-600 shadow-sm border border-emerald-500/20">
            <CheckCircle2 className="size-3 text-emerald-500 fill-emerald-500/20 shrink-0" />
            <span>VERIFIED LISTING</span>
          </div>
        )}

        {/* Top-Right Floating Watchlist Heart */}
        <button
          type="button"
          onClick={toggleFav}
          className={cn(
            "absolute top-2.5 right-2.5 p-2 rounded-full backdrop-blur-md shadow-md transition-all duration-200 hover:scale-110 cursor-pointer z-20 border",
            isFav
              ? "bg-rose-500 border-rose-500 text-white shadow-rose-500/40 ring-2 ring-rose-300 dark:ring-rose-900"
              : "bg-white/95 dark:bg-slate-900/90 border-slate-100 dark:border-slate-800 text-slate-600 hover:text-rose-500"
          )}
          title={isFav ? "Remove from watchlist" : "Add to watchlist"}
        >
          <Heart
            className={cn(
              "size-4 transition-all duration-200",
              isFav ? "fill-white text-white scale-110" : "fill-transparent stroke-[2.2]"
            )}
          />
        </button>
      </div>

      {/* Top Floating 2-Specs Bar (Mileage & Fuel Type) */}
      <div className="mx-3 -mt-3.5 relative z-10 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 p-1 shadow-sm grid grid-cols-2 gap-1.5">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80">
          <div className="size-6 rounded-full bg-slate-200/80 dark:bg-slate-700 flex items-center justify-center shrink-0 text-slate-700 dark:text-slate-300">
            <Gauge className="size-3" />
          </div>
          <div className="min-w-0 leading-tight">
            <p className="text-[11px] font-black text-foreground truncate">
              {typeof vehicle.odometer === "number"
                ? `${(vehicle.odometer / 1000).toFixed(0)}k km`
                : "N/A"}
            </p>
            <p className="text-[9px] font-semibold text-muted-foreground truncate">Mileage</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80">
          <div className="size-6 rounded-full bg-slate-200/80 dark:bg-slate-700 flex items-center justify-center shrink-0 text-slate-700 dark:text-slate-300">
            <Fuel className="size-3" />
          </div>
          <div className="min-w-0 leading-tight">
            <p className="text-[11px] font-black text-foreground truncate">{vehicle.fuel}</p>
            <p className="text-[9px] font-semibold text-muted-foreground truncate">Fuel Type</p>
          </div>
        </div>
      </div>

      {/* Main Card Content */}
      <div className="px-3.5 pt-2 pb-3 space-y-2">
        {/* Model Brand Title Header */}
        <div>
          <h3 className="text-base font-black text-foreground group-hover:text-primary transition-colors tracking-tight truncate leading-tight">
            {vehicle.brand} {vehicle.model}
          </h3>
          <p className="text-[11px] font-semibold text-muted-foreground mt-0.5 truncate">
            {vehicle.year} Model • {vehicle.variant || "Standard"}
          </p>
        </div>

        {/* Bottom 2-Specs Grid (Transmission & Owner Type) */}
        <div className="grid grid-cols-2 gap-1.5">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80">
            <div className="size-6 rounded-full bg-slate-200/80 dark:bg-slate-700 flex items-center justify-center shrink-0 text-slate-700 dark:text-slate-300">
              <Cog className="size-3" />
            </div>
            <div className="min-w-0 leading-tight">
              <p className="text-[11px] font-black text-foreground truncate">
                {vehicle.transmission === "Automatic" ? "Auto" : "Manual"}
              </p>
              <p className="text-[9px] font-semibold text-muted-foreground truncate">Transmission</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80">
            <div className="size-6 rounded-full bg-slate-200/80 dark:bg-slate-700 flex items-center justify-center shrink-0 text-slate-700 dark:text-slate-300">
              <User className="size-3" />
            </div>
            <div className="min-w-0 leading-tight">
              <p className="text-[11px] font-black text-foreground truncate">{vehicle.owner || "1st Owner"}</p>
              <p className="text-[9px] font-semibold text-muted-foreground truncate">Owner Type</p>
            </div>
          </div>
        </div>

        {/* Pricing Footer & Status / CTA Button */}
        <div className="flex items-center justify-between gap-2 border-t border-slate-200/80 dark:border-slate-800/80 pt-2">
          <div className="flex items-baseline gap-3 min-w-0">
            <div className="min-w-0">
              <span className="text-[8.5px] font-bold text-muted-foreground uppercase tracking-wider block">
                ACTUAL PRICE
              </span>
              <span className="truncate text-xs font-bold text-muted-foreground block mt-0.5">
                {inr(vehicle.basePrice)}
              </span>
            </div>
            <div className="min-w-0">
              <span className="text-[8.5px] font-bold text-muted-foreground uppercase tracking-wider block">
                {isSoldOut ? "WINNING BID" : "HIGHEST BID"}
              </span>
              <span className="truncate text-sm font-black text-foreground block mt-0.5">
                <span className="flex items-center gap-1">
                  {isComingSoon || !vehicle.highestBid || vehicle.bids === 0
                    ? "No Bids"
                    : inr(vehicle.highestBid)}
                  {isLive && (
                    <span className="relative flex size-1.5 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full size-1.5 bg-emerald-500"></span>
                    </span>
                  )}
                </span>
              </span>
            </div>
          </div>

          <div className="shrink-0">
            {isLive ? (
              <span className="rounded-full bg-[#FFC700] hover:bg-[#FFD633] px-3.5 py-1.5 text-xs font-black text-[#0D0E12] shadow-md shadow-amber-500/20 transition-all hover:scale-105 cursor-pointer flex items-center gap-1.5 animate-pulse">
                <span>BID NOW</span>
                <ChevronRight className="size-3.5 stroke-[3]" />
              </span>
            ) : (
              <StatusChip status={vehicle.auction} />
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
