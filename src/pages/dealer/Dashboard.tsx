import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Gavel, Trophy, Wallet, Zap, Heart } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { dealerNav } from "@/components/nav-config";
import { Panel, StatCard, VehicleCard } from "@/components/premium";
import { bidHistory, inr, timeLeft } from "@/lib/mock-data";
import {
  getMarketplaceInspections,
  getDealerWishlist,
  getDealerBidsHistory,
  type DealerInspectionSummary,
} from "@/lib/api/dealer-api";
import { readSession } from "@/lib/session";

export function DealerDashboard() {
  const [inspections, setInspections] = useState<DealerInspectionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [bidsCount, setBidsCount] = useState(0);
  const [favCount, setFavCount] = useState(0);

  useEffect(() => {
    const fetchBidsCount = async () => {
      try {
        const res = await getDealerBidsHistory();
        if (res.success && res.data) {
          setBidsCount(res.data.length);
        }
      } catch (err) {
        console.error("Failed to load bids history count", err);
        const session = readSession("dealer");
        const email = session?.email || "default_dealer";
        const bidsList = JSON.parse(
          localStorage.getItem(`dealer_${email}_bids`) || "[]",
        );
        setBidsCount(bidsList.length);
      }
    };
    fetchBidsCount();
  }, []);

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
          : basePrice;

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
        odometer: v.odometer || 45000,
        owner: v.ownerName,
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
        endsAt: v.auctionEndTime || Date.now() + 1000 * 60 * 60 * 24 * 2,
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

  return (
    <AppShell
      role="dealer"
      nav={dealerNav}
      title="Bidding Console"
      breadcrumb={["Dealer", "Dashboard"]}
    >
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Live Bidding Rooms"
          value={loading ? "..." : live.length.toString()}
          delta="Active bidding sessions"
          icon={Zap}
          accent
        />
        <StatCard
          label="Upcoming Auctions"
          value={loading ? "..." : upcoming.length.toString()}
          delta="Coming Soon rooms"
          icon={Trophy}
        />
        <StatCard
          label="My Bids"
          value={bidsCount.toString()}
          delta="Bids placed by you"
          icon={Gavel}
        />
        <StatCard
          label="My Watchlist"
          value={favCount.toString()}
          delta="Saved to favourites"
          icon={Heart}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel
          title="Featured Bidding Room"
          description={
            featured
              ? `${featured.brand} ${featured.model} live auction`
              : "Real-time auction stream"
          }
          className="xl:col-span-2"
          action={
            <Link
              to="/dealer/marketplace"
              className="rounded-2xl border border-border px-4 py-2.5 text-xs font-bold transition-all hover:border-[#FFC700] hover:bg-secondary cursor-pointer"
            >
              Browse Marketplace
            </Link>
          }
        >
          {loading ? (
            <div className="flex h-48 items-center justify-center">
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
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider mb-3 ${
                        featured.auction === "live"
                          ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
                          : "border-[#FFC700]/40 bg-[#FFC700]/15 text-[#FFC700]"
                      }`}
                    >
                      {featured.auction === "live" ? (
                        <span className="relative flex size-1.5 shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full size-1.5 bg-emerald-500"></span>
                        </span>
                      ) : (
                        <Zap className="size-3 fill-current" />
                      )}
                      {featured.auction === "live"
                        ? "Live Auction"
                        : "Coming Soon"}
                    </span>
                    <p className="mt-1 truncate text-4xl font-extrabold text-white tracking-tight">
                      {inr(featured.highestBid)}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-white/70">
                      {featured.brand} {featured.model} · {featured.bids} active
                      bids placed
                    </p>
                  </div>
                  <div className="shrink-0 rounded-2xl border border-[#FFC700]/40 bg-[#FFC700]/10 px-4 py-3.5 text-center shadow-sm">
                    <p className="text-[10px] font-extrabold tracking-widest text-[#FFC700] uppercase">
                      Closes In
                    </p>
                    <p className="mt-1 text-lg font-extrabold text-white">
                      {timeLeft(featured.endsAt)}
                    </p>
                  </div>
                </div>

                <Link
                  to={`/dealer/vehicles/${featured.id}`}
                  className="relative z-10 mt-7 block rounded-2xl bg-[#FFC700] hover:bg-[#FFD633] py-3.5 text-center text-sm font-extrabold text-[#0D0E12] shadow-[0_4px_20px_rgba(255,199,0,0.4)] transition-all hover:shadow-[0_6px_24px_rgba(255,199,0,0.55)]"
                >
                  {featured.auction === "live"
                    ? "Enter Live Bidding Room"
                    : "View Upcoming Details"}
                </Link>
              </div>

              <table className="mt-6 w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs font-bold uppercase text-muted-foreground">
                    <th className="pb-3 font-bold">Dealer</th>
                    <th className="pb-3 text-right font-bold">Bid Amount</th>
                    <th className="pb-3 text-right font-bold">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {bidHistory.slice(0, 4).map((b, i) => (
                    <tr
                      key={i}
                      className="border-b border-border/60 last:border-0 hover:bg-secondary/50"
                    >
                      <td className="py-3.5 font-extrabold text-foreground">
                        {b.dealer}
                      </td>
                      <td className="py-3.5 text-right font-extrabold text-[#0D0E12]">
                        {inr(b.amount)}
                      </td>
                      <td className="py-3.5 text-right text-xs font-bold text-muted-foreground">
                        {b.time}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </Panel>

        <Panel
          title="Settlements & Invoices"
          description="Payment due schedule"
        >
          <ul className="space-y-3 text-sm">
            {[
              ["INV-3391", "₹18,15,000", "Due in 2 days", "warning"],
              ["INV-3388", "₹6,35,000", "Due in 6 days", "warning"],
              ["INV-3380", "₹22,40,000", "Paid & Verified", "success"],
            ].map(([id, amt, note, type]) => (
              <li
                key={id}
                className="rounded-2xl border border-border p-4 transition-all hover:border-[#FFC700]/50 bg-card shadow-soft"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-extrabold text-foreground">{id}</span>
                  <span className="font-extrabold text-foreground">{amt}</span>
                </div>
                <p
                  className={`mt-1.5 text-xs font-bold ${type === "success" ? "text-emerald-600" : "text-amber-600"}`}
                >
                  {note}
                </p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel
        title="Recommended Vehicle Inventory"
        description="Inspected & verified cars matching your segment"
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
