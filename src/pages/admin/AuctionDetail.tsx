import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { adminNav } from "@/components/nav-config";
import {
  getInspectionById,
  getAdminBidHistory,
  startLiveAuction,
  stopLiveAuction,
} from "@/lib/api/admin-api";
import { inr, timeLeft } from "@/lib/mock-data";
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Crown,
  Flame,
  Gavel,
  PlayCircle,
  Radio,
  RefreshCw,
  Shield,
  Square,
  Tag,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminAuctionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [inspection, setInspection] = useState<any>(null);
  const [bidHistory, setBidHistory] = useState<{ dealer: string; amount: number; time: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setNow] = useState(Date.now());

  const fetchDetail = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const numId = Number(id);
      const [insRes, bidsRes] = await Promise.all([
        getInspectionById(numId),
        getAdminBidHistory(numId),
      ]);

      if (insRes.success && insRes.data) {
        setInspection(insRes.data);
      }
      if (bidsRes.success && bidsRes.data) {
        setBidHistory(bidsRes.data);
      }
    } catch (err) {
      console.error("Error fetching auction detail page data", err);
      toast.error("Could not load auction details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  // Ticking timer every second
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // WebSocket for live bid updates
  useEffect(() => {
    if (!id) return;

    let ws: WebSocket | null = null;
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.hostname}:8080/ws/auction?inspectionId=${id}`;
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "BID_UPDATE" && data.bidHistory) {
            setBidHistory(data.bidHistory);
            setInspection((prev: any) => {
              if (!prev) return prev;
              return {
                ...prev,
                currentHighestBid: data.currentHighestBid,
                currentHighestBidder: data.currentHighestBidder,
                totalBids: data.totalBids,
              };
            });
          } else if (data.type === "AUCTION_ENDED") {
            fetchDetail();
          }
        } catch (e) {
          console.error("Error parsing WebSocket message", e);
        }
      };
    } catch (e) {
      console.error("WebSocket connection error", e);
    }

    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [id]);

  const handleGoLive = async () => {
    if (!id) return;
    try {
      toast.info("Launching live auction room...");
      const res = await startLiveAuction(Number(id));
      if (res.success) {
        toast.success("Auction is now LIVE!");
        fetchDetail();
      }
    } catch (err) {
      toast.error("Failed to start live auction.");
    }
  };

  const handleStopAuction = async () => {
    if (!id || !inspection) return;
    const vehicleName = `${inspection.vehicle?.brand || ""} ${inspection.vehicle?.model || ""}`;
    if (!window.confirm(`Are you sure you want to stop the live auction for ${vehicleName}?`)) {
      return;
    }
    try {
      toast.info("Stopping live auction...");
      const res = await stopLiveAuction(Number(id));
      if (res.success) {
        toast.success("Auction stopped successfully.");
        fetchDetail();
      }
    } catch (err) {
      toast.error("Failed to stop auction.");
    }
  };

  if (loading) {
    return (
      <AppShell
        role="admin"
        nav={adminNav}
        title="Auction Details"
        breadcrumb={["Admin", "Auctions", "Details"]}
      >
        <div className="flex h-60 items-center justify-center bg-card border border-border rounded-3xl shadow-soft">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </AppShell>
    );
  }

  if (!inspection) {
    return (
      <AppShell
        role="admin"
        nav={adminNav}
        title="Auction Details"
        breadcrumb={["Admin", "Auctions", "Details"]}
      >
        <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center shadow-soft">
          <p className="text-lg font-black text-foreground">Auction Record Not Found</p>
          <Link
            to="/admin/auctions"
            className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-[#FFC700] px-4 py-2 text-xs font-black text-[#0D0E12]"
          >
            <ArrowLeft className="size-4" /> Return to Auctions List
          </Link>
        </div>
      </AppShell>
    );
  }

  const v = inspection.vehicle || {};
  const vehicleStatus = v.vehicleStatus || "APPROVED";
  const isLive = vehicleStatus === "LIVE";
  const isSold =
    vehicleStatus === "SOLD OUT" ||
    vehicleStatus === "SOLD" ||
    vehicleStatus === "ENDED";

  const topBidder = v.currentHighestBidder ? (v.currentHighestBidder.dealershipName || v.currentHighestBidder) : "No Bids";
  const topBid = v.currentHighestBid || v.suggestedPrice || 0;

  return (
    <AppShell
      role="admin"
      nav={adminNav}
      title={`Auction Details - ${v.brand || ""} ${v.model || ""}`}
      breadcrumb={["Admin", "Auctions", v.vehicleNumber || id || "Detail"]}
    >
      {/* Top Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/admin/auctions")}
            className="inline-flex items-center justify-center size-10 rounded-2xl border border-border bg-card hover:bg-secondary text-foreground transition-all cursor-pointer shadow-soft"
            title="Back to Auctions List"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-lg border border-border bg-muted font-mono font-black text-xs text-foreground tracking-wider uppercase">
                {v.vehicleNumber}
              </span>
              <span
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-black capitalize tracking-wide border",
                  isLive
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                    : isSold
                    ? "bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400"
                    : "bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400",
                )}
              >
                {isLive ? "Live Room" : isSold ? "Sold Out" : "Ready for Auction"}
              </span>
            </div>
            <h2 className="text-2xl font-black text-foreground tracking-tight mt-1">
              {v.brand} {v.model} {v.variant}
            </h2>
          </div>
        </div>

        {/* Action Buttons Header */}
        <div className="flex items-center gap-2">
          {isLive && (
            <>
              <button
                onClick={() => navigate("/admin/live-bidding")}
                className="inline-flex items-center gap-1.5 rounded-2xl border border-[#FFC700]/30 bg-[#FFC700]/15 hover:bg-[#FFC700]/25 px-4 py-2.5 text-xs font-black text-[#FFC700] transition-all cursor-pointer shadow-soft"
              >
                <Activity className="size-4" /> Monitor Live Room
              </button>
              <button
                onClick={handleStopAuction}
                className="inline-flex items-center gap-1.5 rounded-2xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 px-4 py-2.5 text-xs font-black text-rose-600 dark:text-rose-400 transition-all cursor-pointer shadow-soft"
              >
                <Square className="size-3.5 text-rose-500 fill-current" /> Stop Auction
              </button>
            </>
          )}

          {!isLive && !isSold && (
            <button
              onClick={handleGoLive}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-[#FFC700] hover:bg-[#FFD633] px-5 py-2.5 text-xs font-black text-[#0D0E12] transition-all cursor-pointer shadow-soft"
            >
              <PlayCircle className="size-4" /> Launch Live Auction
            </button>
          )}
        </div>
      </div>

      {/* 4 Winner & Telemetry Overview Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <div className="rounded-3xl border border-[#FFC700]/40 bg-[#FFC700]/5 p-5 shadow-soft">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black text-[#FFC700] uppercase tracking-widest">
              {isSold ? "Winner Dealer" : "Current Bidding Leader"}
            </span>
            <Crown className="size-5 text-[#FFC700]" />
          </div>
          <span className="text-xl font-black text-foreground block truncate">
            {topBidder}
          </span>
          <span className="text-[10px] font-semibold text-muted-foreground block mt-1">
            {isSold ? "Confirmed Auction Winner" : "Highest Active Bidder"}
          </span>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              Winning / Highest Bid
            </span>
            <Gavel className="size-5 text-emerald-500" />
          </div>
          <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 block">
            {inr(topBid)}
          </span>
          <span className="text-[10px] font-semibold text-muted-foreground block mt-1">
            Current Best Offer
          </span>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              Valuation Base Target
            </span>
            <Tag className="size-5 text-muted-foreground" />
          </div>
          <span className="text-xl font-black text-foreground block">
            {v.suggestedPrice ? inr(v.suggestedPrice) : "N/A"}
          </span>
          <span className="text-[10px] font-semibold text-muted-foreground block mt-1">
            Inspector Reserve Price
          </span>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              Total Bids Placed
            </span>
            <Zap className="size-5 text-[#FFC700]" />
          </div>
          <span className="text-xl font-black text-foreground block">
            {v.totalBids || bidHistory.length || 0}
          </span>
          <span className="text-[10px] font-semibold text-muted-foreground block mt-1">
            Total Dealer Participation
          </span>
        </div>
      </div>

      {/* Main Content Grid: Bidding Log & Specifications */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Column: Complete Bid History Log */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-base font-black text-foreground tracking-tight flex items-center gap-2">
              <Gavel className="size-4 text-[#FFC700]" /> Bidding Log & Dealer Offers ({bidHistory.length})
            </h3>
            <button
              onClick={fetchDetail}
              className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <RefreshCw className="size-3 text-[#FFC700]" /> Refresh
            </button>
          </div>

          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
            {bidHistory.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center text-xs font-semibold text-muted-foreground">
                No bids have been submitted for this vehicle yet. Launch the room or wait for dealer activity.
              </div>
            ) : (
              bidHistory.map((bid, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex items-center justify-between rounded-2xl border p-4 text-xs transition-all",
                    idx === 0
                      ? "border-[#FFC700]/50 bg-[#FFC700]/10 shadow-sm"
                      : "border-border bg-secondary/30",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex size-8 items-center justify-center rounded-xl text-xs font-black shrink-0",
                        idx === 0
                          ? "bg-[#FFC700] text-[#0D0E12] shadow-sm"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-black text-foreground text-sm">{bid.dealer}</p>
                        {idx === 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-[#FFC700] text-[#0D0E12] font-black text-[9px] uppercase tracking-wider">
                            Winner / Leader
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">{bid.time}</p>
                    </div>
                  </div>

                  <span
                    className={cn(
                      "font-black text-base",
                      idx === 0 ? "text-[#FFC700]" : "text-foreground",
                    )}
                  >
                    {inr(bid.amount)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Vehicle Specifications & Evaluation Summary */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <h3 className="text-base font-black text-foreground tracking-tight flex items-center gap-2 border-b border-border pb-3">
            <Shield className="size-4 text-[#FFC700]" /> Evaluation Summary Specifications
          </h3>

          <div className="grid gap-3.5 sm:grid-cols-2 text-xs">
            <div className="rounded-2xl bg-secondary/40 p-4 border border-border">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                Registration Number
              </span>
              <span className="font-mono font-black text-foreground mt-1 block text-sm">
                {v.vehicleNumber}
              </span>
            </div>

            <div className="rounded-2xl bg-secondary/40 p-4 border border-border">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                Manufacturing Year
              </span>
              <span className="font-extrabold text-foreground mt-1 block text-sm">
                {v.manufacturingYear || "2021"}
              </span>
            </div>

            <div className="rounded-2xl bg-secondary/40 p-4 border border-border">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                Fuel Type
              </span>
              <span className="font-extrabold text-foreground mt-1 block text-sm">
                {v.fuelType || "Petrol"}
              </span>
            </div>

            <div className="rounded-2xl bg-secondary/40 p-4 border border-border">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                Transmission
              </span>
              <span className="font-extrabold text-foreground mt-1 block text-sm">
                {v.transmission || "Manual"}
              </span>
            </div>

            <div className="rounded-2xl bg-secondary/40 p-4 border border-border sm:col-span-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                Odometer Reading
              </span>
              <span className="font-extrabold text-foreground mt-1 block text-sm">
                {v.odometerReading ? `${v.odometerReading.toLocaleString()} km` : "45,000 km"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
