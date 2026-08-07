import { useState, useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Heart,
  Clock,
  ShieldCheck,
  ChevronRight,
  CheckCircle2,
  ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { type Vehicle, inr, timeLeft } from "@/lib/mock-data";
import { readSession } from "@/lib/session";
import { addToWishlist, removeFromWishlist } from "@/lib/api/dealer-api";

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
  approved: "bg-black/80 backdrop-blur-md text-emerald-400 border-emerald-500/40 font-black shadow-md",
  active: "bg-black/80 backdrop-blur-md text-emerald-400 border-emerald-500/40 font-black shadow-md",
  verified: "bg-black/80 backdrop-blur-md text-emerald-400 border-emerald-500/40 font-black shadow-md",
  live: "bg-black/85 backdrop-blur-md text-emerald-400 border-emerald-500/50 font-black shadow-md shadow-emerald-500/20",
  won: "bg-black/80 backdrop-blur-md text-emerald-400 border-emerald-500/40 font-black shadow-md",
  pending: "bg-black/80 backdrop-blur-md text-amber-400 border-amber-500/40 font-black shadow-md",
  submitted: "bg-black/80 backdrop-blur-md text-amber-400 border-amber-500/40 font-black shadow-md",
  scheduled: "bg-[#FFC700] text-[#0D0E12] border-[#FFC700] font-black shadow-md",
  "coming soon": "bg-[#FFC700] text-[#0D0E12] border-[#FFC700] font-black shadow-md",
  draft: "bg-black/80 backdrop-blur-md text-slate-300 border-white/20 font-extrabold shadow-md",
  "in_progress": "bg-black/80 backdrop-blur-md text-slate-300 border-white/20 font-extrabold shadow-md",
  "in progress": "bg-black/80 backdrop-blur-md text-slate-300 border-white/20 font-extrabold shadow-md",
  completed: "bg-black/80 backdrop-blur-md text-slate-300 border-slate-500/40 font-black shadow-md",
  ended: "bg-black/80 backdrop-blur-md text-slate-300 border-slate-500/40 font-black shadow-md",
  "auction ended": "bg-black/80 backdrop-blur-md text-slate-300 border-slate-500/40 font-black shadow-md",
  "auction_ended": "bg-black/80 backdrop-blur-md text-slate-300 border-slate-500/40 font-black shadow-md",
  "sold out": "bg-black/80 backdrop-blur-md text-rose-400 border-rose-500/40 font-black shadow-md",
  "sold_out": "bg-black/80 backdrop-blur-md text-rose-400 border-rose-500/40 font-black shadow-md",
  sold: "bg-black/80 backdrop-blur-md text-rose-400 border-rose-500/40 font-black shadow-md",
  rejected: "bg-black/80 backdrop-blur-md text-rose-500 border-rose-500/40 font-black shadow-md",
  blocked: "bg-black/80 backdrop-blur-md text-rose-500 border-rose-500/40 font-black shadow-md",
  suspended: "bg-black/80 backdrop-blur-md text-rose-500 border-rose-500/40 font-black shadow-md",
  lost: "bg-black/80 backdrop-blur-md text-rose-500 border-rose-500/40 font-black shadow-md",
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
        "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs uppercase tracking-wider font-black shadow-md",
        chipStyles[key] ?? "bg-black/80 backdrop-blur-md text-white border-white/20",
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
    const handleUpdate = () => {
      const session = readSession("dealer");
      const email = session?.email || "default_dealer";
      const favList = JSON.parse(
        localStorage.getItem(`dealer_${email}_favourites`) || "[]",
      );
      setIsFav(
        favList.some((item: any) => String(item.id) === String(vehicle.id)),
      );
    };
    window.addEventListener("wishlist-updated", handleUpdate);
    return () => window.removeEventListener("wishlist-updated", handleUpdate);
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
    <article
      className={cn(
        "card-lift group relative overflow-hidden rounded-2xl border transition-all duration-300 bg-card",
        isLive
          ? "border-emerald-500/40 shadow-[0_0_24px_rgba(16,185,129,0.08)] hover:shadow-[0_0_30px_rgba(16,185,129,0.18)] ring-1 ring-emerald-500/10"
          : isSoldOut || isEnded
          ? "border-border/80 opacity-95"
          : "border-border shadow-soft hover:shadow-md",
      )}
    >
      {/* Image Area with shorter aspect ratio */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-secondary">
        <img
          src={vehicle.image}
          alt={`${vehicle.brand} ${vehicle.model}`}
          loading="lazy"
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60" />

        {/* Floating Badges */}
        <div className="absolute left-3.5 top-3 z-10">
          <StatusChip status={vehicle.auction} />
        </div>

        {/* Floating Favourite Icon */}
        <button
          onClick={toggleFav}
          className="absolute bottom-3.5 right-3.5 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-all hover:scale-110 border border-white/10 shadow-sm cursor-pointer z-10"
          title="Toggle Watchlist"
        >
          <Heart
            className={`size-4 ${isFav ? "fill-rose-500 text-rose-500" : "text-white"}`}
          />
        </button>
      </div>

      {/* Content Area with tighter spacing */}
      <div className="p-4 space-y-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-extrabold text-foreground group-hover:text-[#FFC700] transition-colors leading-snug">
            {vehicle.brand} {vehicle.model}
          </h3>
          <p className="truncate text-xs font-semibold text-muted-foreground mt-0.5">
            {vehicle.year} Model · {vehicle.variant || "Standard"}
          </p>
        </div>

        {/* Compact spec pills line */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold text-muted-foreground/90">
          <span className="bg-secondary px-2.5 py-1 rounded-lg">
            {typeof vehicle.odometer === "number"
              ? `${vehicle.odometer.toLocaleString("en-IN")} km`
              : "N/A"}
          </span>
          <span className="bg-secondary px-2.5 py-1 rounded-lg">
            {vehicle.fuel}
          </span>
          <span className="bg-secondary px-2.5 py-1 rounded-lg">
            {vehicle.transmission === "Automatic" ? "Auto" : "Manual"}
          </span>
          <span className="bg-secondary px-2.5 py-1 rounded-lg">
            {vehicle.owner || "1st Owner"}
          </span>
          <span className="ml-auto text-[11px] font-semibold">
            {isSoldOut ? (
              <span className="text-rose-600 dark:text-rose-400 font-extrabold flex items-center gap-1">
                <CheckCircle2 className="size-3" /> Sold Out
              </span>
            ) : isEnded ? (
              <span className="text-muted-foreground font-extrabold flex items-center gap-1">
                <CheckCircle2 className="size-3 text-amber-500" /> Auction Ended
              </span>
            ) : isLive ? (
              <span className="text-muted-foreground/85 flex items-center gap-1">
                <Clock className="size-3 text-[#FFC700]" /> {timeRemaining}
              </span>
            ) : null}
          </span>
        </div>

        {/* Bidding Info & single CTA button */}
        <div className="flex items-center justify-between gap-3 border-t border-border/80 pt-3">
          <div className="flex items-baseline gap-4 min-w-0">
            <div className="min-w-0">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">
                Actual Price
              </span>
              <span className="truncate text-xs font-semibold text-muted-foreground block mt-0.5">
                {inr(vehicle.basePrice)}
              </span>
            </div>
            <div className="min-w-0">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">
                {isSoldOut ? "Winning Bid" : "Highest Bid"}
              </span>
              <span className="truncate text-sm font-black text-foreground block mt-0.5">
                <span className="flex items-center gap-1.5">
                  {isComingSoon || !vehicle.highestBid || vehicle.bids === 0
                    ? "No Bids Yet"
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

          {isSoldOut ? (
            <Link
              to={`/dealer/vehicles/${vehicle.id}`}
              className="rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 px-3.5 py-2 text-xs font-extrabold text-rose-600 dark:text-rose-400 shadow-sm transition-all flex items-center gap-1.5 shrink-0"
            >
              <span>Sold Out</span>
              <ChevronRight className="size-3.5 stroke-[2.5]" />
            </Link>
          ) : isEnded ? (
            <Link
              to={`/dealer/vehicles/${vehicle.id}`}
              className="rounded-xl border border-border bg-secondary hover:bg-secondary/80 px-3.5 py-2 text-xs font-extrabold text-foreground shadow-sm transition-all flex items-center gap-1.5 shrink-0"
            >
              <span>Auction Ended</span>
              <ChevronRight className="size-3.5 stroke-[2.5]" />
            </Link>
          ) : (
            <Link
              to={`/dealer/vehicles/${vehicle.id}`}
              className="rounded-xl bg-[#FFC700] hover:bg-[#FFD633] px-3.5 py-2 text-xs font-extrabold text-[#0D0E12] shadow-sm transition-all hover:scale-[1.02] cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <span>{isLive ? "Bid Now" : "View Room"}</span>
              <ChevronRight className="size-3.5 stroke-[2.5]" />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
