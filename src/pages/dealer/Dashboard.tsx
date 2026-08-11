import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Gavel, Trophy, Zap, Heart, Car, ChevronRight, ShieldCheck, Clock } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { dealerNav } from "@/components/nav-config";
import { Panel, StatCard, VehicleCard } from "@/components/premium";
import { inr, timeLeft } from "@/lib/mock-data";
import {
  getMarketplaceInspections,
  getDealerWishlist,
  getDealerBidsHistory,
  getVehicleBidHistory,
  getDealerProfile,
  type DealerInspectionSummary,
} from "@/lib/api/dealer-api";
import { readSession } from "@/lib/session";
import { formatIndianDateTime, maskDealerName } from "@/lib/utils";

export function DealerDashboard() {
  const [inspections, setInspections] = useState<DealerInspectionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [bidsCount, setBidsCount] = useState(0);
  const [favCount, setFavCount] = useState(0);
  const [wonBidsCount, setWonBidsCount] = useState(0);

  const session = readSession("dealer");
  const dealerName = session?.name || session?.email || "Valued Dealer";

  useEffect(() => {
    const fetchBidsCount = async () => {
      try {
        const [bidsRes, profileRes] = await Promise.all([
          getDealerBidsHistory(),
          getDealerProfile(),
        ]);
        if (bidsRes.success && bidsRes.data) {
          setBidsCount(bidsRes.data.length);
        }
        if (profileRes.success && profileRes.data) {
          setWonBidsCount((profileRes.data as any).wonBidsCount || 0);
        }
      } catch (err) {
        console.error("Failed to load bids history count from API", err);
      }
    };
    fetchBidsCount();
  }, [session?.email]);

  useEffect(() => {
    const fetchWishlistCount = async () => {
      try {
        const res = await getDealerWishlist();
        if (res.success && res.data) {
          setFavCount(res.data.length);
        }
      } catch (err) {
        console.error("Failed to load wishlist count", err);
      }
    };
    fetchWishlistCount();

    window.addEventListener("wishlist-updated", fetchWishlistCount);
    return () => window.removeEventListener("wishlist-updated", fetchWishlistCount);
  }, []);

  useEffect(() => {
    const fetchMarketplace = async () => {
      setLoading(true);
      try {
        const res = await getMarketplaceInspections();
        if (res.success && res.data) {
          setInspections(res.data);
        }
      } catch (err: any) {
        console.error("Failed to load marketplace inspections", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMarketplace();
  }, []);

  // Map backend inspection summaries to format expected by VehicleCard
  const mappedVehicles = useMemo(() => {
    return inspections.map((v) => {
      const basePrice = v.suggestedPrice || 350000;
      const bidCount = v.totalBids || 0;
      const highestBid =
        v.currentHighestBid && v.currentHighestBid > 0
          ? v.currentHighestBid
          : 0;

      let fuelType:
        | "Petrol"
        | "Diesel"
        | "CNG"
        | "LPG"
        | "Electric"
        | "Hybrid" = "Petrol";
      const f = (v.fuel || "").toLowerCase();
      if (f.includes("diesel")) fuelType = "Diesel";
      else if (f.includes("cng")) fuelType = "CNG";
      else if (f.includes("lpg")) fuelType = "LPG";
      else if (f.includes("hybrid")) fuelType = "Hybrid";
      else if (f.includes("electric") || f.includes("ev"))
        fuelType = "Electric";
      else if (v.fuel) fuelType = v.fuel as any;

      let transmissionType: "Manual" | "Automatic" = "Manual";
      const t = (v.transmission || "").toLowerCase();
      if (t.includes("auto")) transmissionType = "Automatic";

      return {
        id: String(v.inspectionId),
        regNo: v.vehicleNumber,
        brand: v.brand,
        model: v.model,
        variant: v.variant,
        year: v.year || 2020,
        fuel: fuelType,
        transmission: transmissionType,
        odometer: v.odometer ?? 0,
        owner: v.ownerName || "1st Owner",
        score: 88 + (v.inspectionId % 10),
        basePrice,
        highestBid,
        bids: bidCount,
        status: "approved" as const,
        auction:
          v.vehicleStatus === "LIVE"
            ? ("live" as const)
            : (v.vehicleStatus === "SOLD OUT" || v.vehicleStatus === "SOLD_OUT" || v.vehicleStatus === "SOLD" || v.vehicleStatus === "ENDED")
              ? ("sold out" as const)
              : ("scheduled" as const),
        image:
          v.vehicleImage ||
          "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=400&q=80",
        endsAt: v.auctionEndTime || undefined,
        inspector: v.inspectorName || "Certified Inspector",
      };
    });
  }, [inspections]);

  const live = useMemo(
    () => mappedVehicles.filter((v) => v.auction === "live"),
    [mappedVehicles],
  );
  const upcoming = useMemo(
    () => mappedVehicles.filter((v) => v.auction === "scheduled"),
    [mappedVehicles],
  );

  const featured = live[0] || upcoming[0] || null;
  const [featuredBids, setFeaturedBids] = useState<any[]>([]);

  useEffect(() => {
    if (featured?.id) {
      const loadFeaturedBids = async () => {
        try {
          const res = await getVehicleBidHistory(Number(featured.id));
          if (res.success && res.data) {
            setFeaturedBids(res.data);
          }
        } catch (err) {
          console.error("Failed to load featured room bids", err);
        }
      };
      loadFeaturedBids();
    } else {
      setFeaturedBids([]);
    }
  }, [featured?.id]);

  return (
    <AppShell
      role="dealer"
      nav={dealerNav}
      title="Bidding Console"
      breadcrumb={["Dealer", "Dashboard"]}
    >
      {/* Supercar Header Banner Accent */}
      <div className="surface-dark rounded-3xl p-6 text-white border border-[#FFC700]/30 shadow-lift flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#FFC700] text-[#0D0E12] shadow-[0_4px_18px_rgba(255,199,0,0.4)] font-extrabold">
            <Zap className="size-6 fill-current" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              Welcome, {dealerName}
            </h2>
            <p className="text-xs font-semibold text-white/70 mt-0.5">
              Live Auctions Active · {live.length} Bidding Rooms Online · {mappedVehicles.length} Vehicles Inspected
            </p>
          </div>
        </div>
        <Link
          to="/dealer/marketplace"
          className="rounded-2xl bg-[#FFC700] hover:bg-[#FFD633] px-6 py-3 text-xs font-extrabold text-[#0D0E12] shadow-[0_4px_16px_rgba(255,199,0,0.35)] transition-all hover:scale-[1.02] cursor-pointer flex items-center gap-2"
        >
          Explore Bidding Marketplace <ChevronRight className="size-4" />
        </Link>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Live Bidding Rooms"
          value={loading ? "..." : live.length.toString()}
          delta="Active bidding sessions"
          icon={Zap}
          accent
        />
        <StatCard
          label="Auctions Won"
          value={wonBidsCount.toString()}
          delta="Assigned won vehicles"
          icon={Trophy}
        />
        <StatCard
          label="Upcoming Auctions"
          value={loading ? "..." : upcoming.length.toString()}
          delta="Coming Soon rooms"
          icon={Car}
        />
        <StatCard
          label="My Bids Placed"
          value={bidsCount.toString()}
          delta="Total active & past bids"
          icon={Gavel}
        />
        <StatCard
          label="My Watchlist"
          value={favCount.toString()}
          delta="Saved favourite vehicles"
          icon={Heart}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        {/* Featured Bidding Room Panel */}
        <Panel
          title="Featured Bidding Room"
          description={
            featured
              ? `${featured.brand} ${featured.model} ${featured.variant}`
              : "Real-time auction stream"
          }
          className="xl:col-span-2"
          action={
            <Link
              to="/dealer/marketplace"
              className="rounded-2xl border border-border px-4 py-2 text-xs font-extrabold text-foreground transition-all hover:border-[#FFC700] hover:bg-secondary cursor-pointer flex items-center gap-1"
            >
              Browse All <ChevronRight className="size-3.5" />
            </Link>
          }
        >
          {loading ? (
            <div className="flex h-52 items-center justify-center">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : !featured ? (
            <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center shadow-soft">
              <p className="text-sm font-semibold text-muted-foreground">
                No auctions currently running live or coming soon.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Please check back later for new inventory reports.
              </p>
            </div>
          ) : (
            <>
              <div className="surface-dark rounded-3xl p-7 text-white border border-[#FFC700]/40 shadow-lift relative overflow-hidden before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_right,rgba(255,199,0,0.18),transparent_60%)]">
                <div className="relative z-10 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
                  <div className="min-w-0">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-[10px] font-black uppercase tracking-wider mb-3 ${
                        featured.auction === "live"
                          ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
                          : "border-[#FFC700]/40 bg-[#FFC700]/15 text-[#FFC700]"
                      }`}
                    >
                      {featured.auction === "live" ? (
                        <span className="relative flex size-2 shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full size-2 bg-emerald-500"></span>
                        </span>
                      ) : (
                        <Zap className="size-3 fill-current" />
                      )}
                      {featured.auction === "live"
                        ? "LIVE BIDDING ACTIVE"
                        : "COMING SOON"}
                    </span>
                    <p className="mt-1 truncate text-4xl font-black text-white tracking-tight">
                      {featured.auction !== "live" || !featured.highestBid
                        ? "No Bids Yet"
                        : inr(featured.highestBid)}
                    </p>
                    <p className="mt-2 text-sm font-bold text-white/80">
                      {featured.brand} {featured.model} {featured.variant}
                    </p>
                  </div>
                  {featured.auction === "live" && featured.endsAt && (
                    <div className="shrink-0 rounded-2xl border border-[#FFC700]/40 bg-[#FFC700]/10 px-4 py-3 text-center shadow-sm">
                      <p className="text-[10px] font-black tracking-widest text-[#FFC700] uppercase">
                        CLOSES IN
                      </p>
                      <p className="mt-1 text-lg font-black text-white">
                        {timeLeft(featured.endsAt)}
                      </p>
                    </div>
                  )}
                </div>

                <Link
                  to={`/dealer/vehicles/${featured.id}`}
                  className="relative z-10 mt-7 block rounded-2xl bg-[#FFC700] hover:bg-[#FFD633] py-3.5 text-center text-sm font-black text-[#0D0E12] shadow-[0_4px_20px_rgba(255,199,0,0.4)] transition-all hover:shadow-[0_6px_24px_rgba(255,199,0,0.55)] cursor-pointer"
                >
                  {featured.auction === "live"
                    ? "Enter Live Bidding Room"
                    : "View Vehicle Inspection Report"}
                </Link>
              </div>
            </>
          )}
        </Panel>

        {/* Quick Operations Sidebar */}
        <div className="space-y-5">
          <Panel title="Dealer Shortcuts" description="Instant access options">
            <div className="space-y-3">
              <Link
                to="/dealer/marketplace"
                className="group card-lift flex items-center justify-between rounded-2xl border border-border bg-card p-4 hover:border-[#FFC700] transition-all shadow-soft"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    <Zap className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-foreground group-hover:text-[#FFC700] transition-colors">
                      Live Marketplace
                    </p>
                    <p className="text-xs text-muted-foreground font-semibold">
                      {live.length} active bidding rooms
                    </p>
                  </div>
                </div>
                <ChevronRight className="size-4 text-muted-foreground group-hover:text-[#FFC700] group-hover:translate-x-1 transition-all" />
              </Link>

              <Link
                to="/dealer/bids"
                className="group card-lift flex items-center justify-between rounded-2xl border border-border bg-card p-4 hover:border-[#FFC700] transition-all shadow-soft"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[#FFC700]/10 text-[#FFC700] border border-[#FFC700]/20">
                    <Gavel className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-foreground group-hover:text-[#FFC700] transition-colors">
                      My Placed Bids
                    </p>
                    <p className="text-xs text-muted-foreground font-semibold">
                      {bidsCount} total submitted bids
                    </p>
                  </div>
                </div>
                <ChevronRight className="size-4 text-muted-foreground group-hover:text-[#FFC700] group-hover:translate-x-1 transition-all" />
              </Link>

              <Link
                to="/dealer/favourites"
                className="group card-lift flex items-center justify-between rounded-2xl border border-border bg-card p-4 hover:border-[#FFC700] transition-all shadow-soft"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
                    <Heart className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-foreground group-hover:text-[#FFC700] transition-colors">
                      Saved Watchlist
                    </p>
                    <p className="text-xs text-muted-foreground font-semibold">
                      {favCount} saved vehicles
                    </p>
                  </div>
                </div>
                <ChevronRight className="size-4 text-muted-foreground group-hover:text-[#FFC700] group-hover:translate-x-1 transition-all" />
              </Link>
            </div>
          </Panel>

          <Panel title="Verification Guarantee" description="200-point inspection badge">
            <div className="rounded-2xl border border-[#FFC700]/30 bg-[#FFC700]/10 p-5 space-y-3">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="size-6 text-[#FFC700]" />
                <p className="font-black text-sm text-foreground">Certified Inspection Reports</p>
              </div>
              <p className="text-xs font-bold text-muted-foreground leading-relaxed">
                Every vehicle on Caryanam Bidding is thoroughly evaluated by certified engineers with verified structural, engine, and document reports.
              </p>
            </div>
          </Panel>
        </div>
      </div>

      {/* Recommended Vehicle Inventory */}
      <Panel
        title="Recommended Vehicle Inventory"
        description="Inspected & verified cars matching your buying segment"
      >
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : mappedVehicles.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center shadow-soft">
            <p className="text-sm font-semibold text-muted-foreground">
              No recommended inventory reports available.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {mappedVehicles.slice(0, 3).map((v) => (
              <VehicleCard key={v.id} vehicle={v} />
            ))}
          </div>
        )}
      </Panel>
    </AppShell>
  );
}
