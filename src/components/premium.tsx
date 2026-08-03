import { useState, useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Clock,
  Fuel,
  Gauge,
  Settings2,
  ShieldCheck,
  Heart,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { inr, timeLeft, type Vehicle } from "@/lib/mock-data";
import { readSession } from "@/lib/session";
import { toast } from "sonner";
import {
  getDealerWishlist,
  addToWishlist,
  removeFromWishlist,
} from "@/lib/api/dealer-api";

export function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  delta?: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "card-lift relative overflow-hidden rounded-3xl border p-6 transition-all duration-300",
        accent
          ? "surface-dark border-[#FFC700]/40 text-white shadow-lift before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_right,rgba(255,199,0,0.18),transparent_60%)]"
          : "bg-card border-border shadow-soft hover:border-[#FFC700]/60",
      )}
    >
      <div className="relative z-10 flex items-start justify-between gap-4">
        <span
          className={cn(
            "text-xs font-bold tracking-wider uppercase",
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
  approved:
    "bg-emerald-500/10 text-emerald-600 border-emerald-500/25 font-bold",
  active: "bg-emerald-500/10 text-emerald-600 border-emerald-500/25 font-bold",
  verified:
    "bg-emerald-500/10 text-emerald-600 border-emerald-500/25 font-bold",
  live: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-extrabold shadow-[0_0_12px_rgba(16,185,129,0.15)]",
  won: "bg-emerald-500/10 text-emerald-600 border-emerald-500/25 font-bold",
  pending: "bg-amber-500/10 text-amber-600 border-amber-500/25 font-bold",
  submitted: "bg-amber-500/10 text-amber-600 border-amber-500/25 font-bold",
  "on leave": "bg-amber-500/10 text-amber-600 border-amber-500/25 font-bold",
  scheduled:
    "bg-[#FFC700] text-[#0D0E12] border-[#FFC700] font-extrabold shadow-sm",
  draft: "bg-secondary text-muted-foreground border-border font-semibold",
  completed: "bg-secondary text-muted-foreground border-border font-semibold",
  "sold out": "bg-red-500/10 text-red-600 border-red-500/20 font-extrabold shadow-sm",
  "sold_out": "bg-red-500/10 text-red-600 border-red-500/20 font-extrabold shadow-sm",
  "sold": "bg-red-500/10 text-red-600 border-red-500/20 font-extrabold shadow-sm",
  rejected:
    "bg-destructive/10 text-destructive border-destructive/20 font-bold",
  blocked: "bg-destructive/10 text-destructive border-destructive/20 font-bold",
  suspended:
    "bg-destructive/10 text-destructive border-destructive/20 font-bold",
  lost: "bg-destructive/10 text-destructive border-destructive/20 font-bold",
};

export function StatusChip({ status }: { status: string }) {
  const key = status.toLowerCase();
  const label =
    key === "scheduled"
      ? "Coming Soon"
      : (key === "sold out" || key === "sold_out" || key === "sold" || key === "ended")
      ? "SOLD OUT"
      : status;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs capitalize tracking-wide",
        chipStyles[key] ?? "bg-secondary text-muted-foreground border-border",
      )}
    >
      {key === "live" && (
        <span className="relative flex size-1.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full size-1.5 bg-emerald-500"></span>
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
    if (isFavourite !== undefined) {
      setIsFav(isFavourite);
      return;
    }
    const checkFav = async () => {
      try {
        const res = await getDealerWishlist();
        if (res.success && res.data) {
          setIsFav(
            res.data.some((item) => String(item.inspectionId) === vehicle.id),
          );
        }
      } catch (err) {
        console.error("Failed to check wishlist status", err);
      }
    };
    checkFav();
  }, [vehicle.id, isFavourite]);

  useEffect(() => {
    const handleUpdate = () => {
      if (isFavourite === undefined) {
        const checkFav = async () => {
          try {
            const res = await getDealerWishlist();
            if (res.success && res.data) {
              setIsFav(
                res.data.some(
                  (item) => String(item.inspectionId) === vehicle.id,
                ),
              );
            }
          } catch (err) {
            // Ignore error
          }
        };
        checkFav();
      }
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
              ? (vehicle.odometer / 1000).toFixed(0)
              : "45"}
            k km
          </span>
          <span className="bg-secondary px-2.5 py-1 rounded-lg">
            {vehicle.fuel}
          </span>
          <span className="bg-secondary px-2.5 py-1 rounded-lg">
            {vehicle.transmission === "Automatic" ? "Auto" : "Manual"}
          </span>
          <span className="ml-auto text-[11px] text-muted-foreground/85 flex items-center gap-1 font-semibold">
            <Clock className="size-3 text-[#FFC700]" /> {timeRemaining}
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
                Highest Bid
              </span>
              <span className="truncate text-sm font-black text-foreground block mt-0.5">
                <span className="flex items-center gap-1.5">
                  {inr(vehicle.highestBid)}
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

          <Link
            to={`/dealer/vehicles/${vehicle.id}`}
            className="rounded-xl bg-[#FFC700] hover:bg-[#FFD633] px-3.5 py-2 text-xs font-extrabold text-[#0D0E12] shadow-sm transition-all hover:scale-[1.02] cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <span>Bid Now</span>
            <ChevronRight className="size-3.5 stroke-[2.5]" />
          </Link>
        </div>
      </div>
    </article>
  );
}
