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
import { API_BASE_URL } from "@/lib/api";
import {
  Activity,
  ArrowLeft,
  Clock,
  Crown,
  Gavel,
  PlayCircle,
  RefreshCw,
  Square,
  Tag,
  Zap,
  Car,
  Fuel,
  Gauge,
  Settings2,
  TrendingUp,
  ShieldCheck,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusChip } from "@/components/premium";

export function AdminAuctionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [inspection, setInspection] = useState<any>(null);
  const [bidHistory, setBidHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [remaining, setRemaining] = useState("");

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

  // WebSocket for live bid updates
  useEffect(() => {
    if (!id) return;

    let ws: WebSocket | null = null;
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      let host = "localhost:8080";
      if (API_BASE_URL && API_BASE_URL.includes("://")) {
        host = API_BASE_URL.split("://")[1];
      } else if (API_BASE_URL) {
        host = API_BASE_URL;
      }
      const wsUrl = `${protocol}//${host}/ws/auction?inspectionId=${id}`;
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "BID_UPDATE" && data.bidHistory) {
            setBidHistory(data.bidHistory);
            setInspection((prev: any) => {
              if (!prev) return prev;
              const v = prev.vehicleDetails || prev.vehicle || {};
              return {
                ...prev,
                vehicleDetails: {
                  ...v,
                  currentHighestBid: data.currentHighestBid,
                  currentHighestBidder: data.currentHighestBidder,
                  totalBids: data.totalBids,
                  vehicleStatus: "LIVE",
                },
              };
            });
            toast.info(`New bid of ${inr(data.currentHighestBid)} placed!`);
          } else if (data.type === "AUCTION_ENDED") {
            fetchDetail();
            toast.info("Live auction ended.");
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

  useEffect(() => {
    const endsAt = inspection?.vehicleDetails?.auctionEndTime;
    if (!endsAt) return;
    const interval = setInterval(() => {
      setRemaining(timeLeft(endsAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [inspection?.vehicleDetails?.auctionEndTime]);

  const handleGoLive = async () => {
    if (!id) return;
    try {
      toast.info("Launching live auction room...");
      const res = await startLiveAuction(Number(id));
      if (res.success) {
        toast.success("Auction is now LIVE!");
        fetchDetail();
      } else {
        toast.error((res as any).message || "Failed to launch auction.");
      }
    } catch (err) {
      toast.error("Failed to start live auction.");
    }
  };

  const handleStopAuction = async () => {
    if (!id || !inspection) return;
    const v = inspection.vehicleDetails || inspection.vehicle || {};
    const vehicleName = `${v.brand || ""} ${v.model || ""}`;
    if (
      !window.confirm(
        `Are you sure you want to stop the live auction for ${vehicleName}?`,
      )
    ) {
      return;
    }
    try {
      toast.info("Stopping live auction...");
      const res = await stopLiveAuction(Number(id));
      if (res.success) {
        toast.success("Auction stopped successfully.");
        fetchDetail();
      } else {
        toast.error((res as any).message || "Failed to stop auction.");
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
        <div className="flex h-96 flex-col items-center justify-center gap-4 bg-card border border-border rounded-3xl shadow-soft">
          <span className="h-12 w-12 animate-spin rounded-full border-4 border-[#FFC700] border-t-transparent" />
          <p className="text-xs font-black text-muted-foreground animate-pulse">
            Loading Auction Bidding Data...
          </p>
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
        <div className="rounded-3xl border border-dashed border-border bg-card p-16 text-center shadow-soft">
          <p className="text-lg font-black text-foreground">
            Auction Record Not Found
          </p>
          <Link
            to="/admin/auctions"
            className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-[#FFC700] px-5 py-2.5 text-xs font-black text-[#0D0E12] shadow-sm hover:scale-105 transition-all"
          >
            <ArrowLeft className="size-4" /> Return to Auctions List
          </Link>
        </div>
      </AppShell>
    );
  }

  const v = inspection.vehicleDetails || inspection.vehicle || {};
  const vehicleStatus = v.vehicleStatus || inspection.status || "APPROVED";
  const isLive = vehicleStatus === "LIVE";
  const isSold =
    vehicleStatus === "SOLD OUT" ||
    vehicleStatus === "SOLD";
  const isEnded =
    vehicleStatus === "ENDED" ||
    vehicleStatus === "AUCTION ENDED" ||
    vehicleStatus === "AUCTION_ENDED" ||
    vehicleStatus === "COMPLETED";

  const topBidder = v.currentHighestBidder
    ? v.currentHighestBidder.dealershipName ||
    v.currentHighestBidder.ownerName ||
    v.currentHighestBidder
    : bidHistory[0]?.dealer || "No Bids";
  const topBid = v.currentHighestBid || bidHistory[0]?.amount || 0;
  const basePrice = v.suggestedPrice || 0;
  const totalBids = v.totalBids || bidHistory.length || 0;

  const photos = (inspection.inspectionPhotos || [])
    .filter((img: any) => img.imageUrl)
    .map((img: any) => img.imageUrl);
  const primaryPhoto =
    photos[0] ||
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80";

  return (
    <AppShell
      role="admin"
      nav={adminNav}
      title={`Auction Details - ${v.brand || ""} ${v.model || ""}`}
      breadcrumb={["Admin", "Auctions", v.vehicleNumber || id || "Detail"]}
    >
      <div className="space-y-6">
        {/* Top Hero Breadcrumb & Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => navigate("/admin/auctions")}
              className="grid size-11 place-items-center rounded-2xl border border-border bg-secondary hover:bg-secondary/80 text-foreground transition-all cursor-pointer shadow-sm hover:scale-105"
              title="Back to Auctions List"
            >
              <ArrowLeft className="size-5 stroke-[2.5]" />
            </button>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-xl border border-border bg-secondary font-mono font-black text-xs text-foreground tracking-wider uppercase">
                  {v.vehicleNumber || "UNREGISTERED"}
                </span>
                <span
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-black capitalize tracking-wide border flex items-center gap-1.5",
                    isLive
                      ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                      : isSold
                        ? "bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400"
                        : "bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400",
                  )}
                >
                  {isLive && (
                    <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
                  )}
                  {isLive
                    ? "Live Room"
                    : isSold
                      ? "Sold Out"
                      : "Scheduled"}
                </span>
              </div>
              <h1 className="text-xl font-black tracking-tight text-foreground sm:text-2xl uppercase mt-1">
                {v.brand} {v.model} {v.variant}
              </h1>
            </div>
          </div>

          {/* Action Control Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={fetchDetail}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-border bg-secondary hover:bg-secondary/80 px-4 py-2.5 text-xs font-extrabold text-foreground transition-all cursor-pointer shadow-sm"
            >
              <RefreshCw className="size-4 text-[#FFC700]" /> Refresh
            </button>

            {isLive && (
              <>
                <button
                  onClick={() => navigate("/admin/live-bidding")}
                  className="inline-flex items-center gap-2 rounded-2xl border border-[#FFC700]/40 bg-[#FFC700]/15 hover:bg-[#FFC700]/25 px-5 py-2.5 text-xs font-black text-[#FFC700] transition-all cursor-pointer shadow-sm"
                >
                  <Activity className="size-4 animate-pulse" /> Monitor Live Room
                </button>
                <button
                  onClick={handleStopAuction}
                  className="inline-flex items-center gap-2 rounded-2xl border border-rose-500/40 bg-rose-500/15 hover:bg-rose-500/25 px-5 py-2.5 text-xs font-black text-rose-600 dark:text-rose-400 transition-all cursor-pointer shadow-sm"
                >
                  <Square className="size-4 fill-current text-rose-500" /> Stop Auction
                </button>
              </>
            )}

            {!isLive && !isSold && (
              <button
                onClick={handleGoLive}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#FFC700] hover:bg-[#FFD633] px-6 py-2.5 text-xs font-black text-[#0D0E12] shadow-[0_4px_16px_rgba(255,199,0,0.35)] transition-all hover:scale-105 cursor-pointer"
              >
                <PlayCircle className="size-4" /> Launch Live Auction
              </button>
            )}
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-[#FFC700]/40 bg-[#FFC700]/5 p-5 shadow-soft flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-[#FFC700] uppercase tracking-widest">
                {isSold ? "Auction Winner" : "Highest Active Bidder"}
              </span>
              <Crown className="size-5 text-[#FFC700]" />
            </div>
            <div className="mt-3">
              <p className="text-xl font-black text-foreground truncate">
                {topBidder}
              </p>
              <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">
                {isSold ? "Confirmed Winner" : "Bidding Leader"}
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-5 shadow-soft flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                Highest Bid
              </span>
              <Gavel className="size-5 text-emerald-500" />
            </div>
            <div className="mt-3">
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                {topBid > 0 ? inr(topBid) : "No Bids Yet"}
              </p>
              <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">
                Current Best Offer
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-5 shadow-soft flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                Base Price
              </span>
              <Tag className="size-5 text-[#FFC700]" />
            </div>
            <div className="mt-3">
              <p className="text-xl font-black text-foreground">
                {basePrice > 0 ? inr(basePrice) : "N/A"}
              </p>
              <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">
                Suggested Price
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-5 shadow-soft flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                Total Bids
              </span>
              <Zap className="size-5 text-amber-500" />
            </div>
            <div className="mt-3">
              <p className="text-xl font-black text-foreground">
                {totalBids}
              </p>
              <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">
                Total Bids Placed
              </p>
            </div>
          </div>
        </div>

        {/* Main 2-Column Content Layout */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left 2 Columns: Auction Bidding History Feed */}
          <div className="lg:col-span-2 rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h3 className="text-base font-black text-foreground tracking-tight flex items-center gap-2">
                <TrendingUp className="size-5 text-[#FFC700]" /> Auction Bidding History ({bidHistory.length})
              </h3>
              {isLive && (
                <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-ping" /> Real-Time Live
                </span>
              )}
            </div>

            {bidHistory.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-12 text-center text-xs font-semibold text-muted-foreground">
                No bids have been placed for this vehicle yet.
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {bidHistory.map((bid: any, idx: number) => {
                  const isTop = idx === 0;
                  const bAmount = bid.amount || bid.bidAmount || 0;
                  const bDealer =
                    bid.dealer ||
                    bid.dealerName ||
                    bid.dealershipName ||
                    "Registered Dealer";
                  const bTime =
                    bid.time ||
                    (bid.createdAt
                      ? new Date(bid.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                      : "Just now");

                  return (
                    <div
                      key={idx}
                      className={cn(
                        "flex items-center justify-between rounded-2xl border p-4 text-xs transition-all",
                        isTop
                          ? "border-[#FFC700]/50 bg-[#FFC700]/15 shadow-sm"
                          : "border-border bg-secondary/30",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "flex size-8 items-center justify-center rounded-xl text-xs font-black shrink-0",
                            isTop
                              ? "bg-[#FFC700] text-[#0D0E12] shadow-sm"
                              : "bg-secondary text-muted-foreground border border-border",
                          )}
                        >
                          #{idx + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-extrabold text-foreground text-sm">
                              {bDealer}
                            </p>
                            {isTop && (
                              <span className="px-2 py-0.5 rounded-full bg-[#FFC700] text-[#0D0E12] font-black text-[9px] uppercase tracking-wider">
                                Leader / Highest Offer
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">
                            {bTime}
                          </p>
                        </div>
                      </div>

                      <span
                        className={cn(
                          "font-black text-base tracking-tight",
                          isTop ? "text-[#FFC700]" : "text-foreground",
                        )}
                      >
                        {inr(bAmount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Vehicle Basic Information & Image Card */}
          <div className="space-y-6">
            {/* Auction Control Room Card */}
            <div className="surface-dark rounded-3xl p-6 text-white border border-[#FFC700]/40 shadow-lift space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <span className="text-xs font-black text-[#FFC700] uppercase tracking-wider">
                  AUCTION CONTROL ROOM
                </span>
                <StatusChip status={vehicleStatus} />
              </div>

              <div className="space-y-3 font-semibold text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Room Status:</span>
                  <span className="font-black text-white uppercase">{vehicleStatus}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Reserve Base:</span>
                  <span className="font-black text-[#FFC700]">{inr(basePrice)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Leading Bid:</span>
                  <span className={cn("font-black", topBid > 0 ? "text-emerald-400" : "text-emerald-400")}>
                    {topBid > 0 ? inr(topBid) : "No bids"}
                  </span>
                </div>
              </div>

              {isLive ? (
                <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-3">
                  {remaining && (
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-[#FFC700] flex items-center gap-1.5">
                        <Clock className="size-4" /> Live Countdown
                      </span>
                      <span className="text-white font-mono">{remaining}</span>
                    </div>
                  )}
                  <button
                    onClick={handleStopAuction}
                    className="w-full rounded-2xl bg-rose-500 hover:bg-rose-600 py-3.5 text-xs font-black text-white shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Square className="size-3.5 fill-current" /> Stop Live Auction
                  </button>
                </div>
              ) : isSold ? (
                <div className="rounded-2xl bg-white/5 border border-white/10 p-4 text-center">
                  <p className="text-xs font-black text-rose-400">Auction Ended / Sold Out</p>
                </div>
              ) : (
                <button
                  onClick={handleGoLive}
                  className="w-full rounded-2xl bg-[#FFC700] hover:bg-[#FFD633] py-3.5 text-xs font-black text-[#0D0E12] shadow-[0_4px_20px_rgba(255,199,0,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                >
                  <PlayCircle className="size-4" /> Launch Live Auction Room
                </button>
              )}
            </div>

            {/* Primary Vehicle Image Card */}
            <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-secondary">
                <img
                  src={primaryPhoto}
                  alt={`${v.brand} ${v.model}`}
                  className="size-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80" />
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <p className="text-sm font-black uppercase tracking-tight">
                    {v.brand} {v.model} {v.variant}
                  </p>
                  <p className="text-[10px] text-white/80 font-semibold">
                    {v.manufacturingYear || 2021} Model
                  </p>
                </div>
              </div>
            </div>

            {/* Basic Vehicle Details Panel */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
              <h3 className="text-base font-black text-foreground tracking-tight flex items-center gap-2 border-b border-border pb-3">
                <Car className="size-4 text-[#FFC700]" /> Vehicle Basic Details
              </h3>

              <dl className="space-y-3 text-xs">
                <div className="flex items-center justify-between rounded-2xl bg-secondary/40 p-3 border border-border">
                  <dt className="text-muted-foreground font-semibold">Vehicle Number</dt>
                  <dd className="font-mono font-black text-foreground">{v.vehicleNumber || "N/A"}</dd>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-secondary/40 p-3 border border-border">
                  <dt className="text-muted-foreground font-semibold">Make & Model</dt>
                  <dd className="font-extrabold text-foreground">{v.brand} {v.model}</dd>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-secondary/40 p-3 border border-border">
                  <dt className="text-muted-foreground font-semibold">Variant</dt>
                  <dd className="font-extrabold text-foreground">{v.variant || "Standard"}</dd>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-secondary/40 p-3 border border-border">
                  <dt className="text-muted-foreground font-semibold">Manufacturing Year</dt>
                  <dd className="font-extrabold text-foreground">{v.manufacturingYear || "2021"}</dd>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-secondary/40 p-3 border border-border">
                  <dt className="text-muted-foreground font-semibold">Fuel Type</dt>
                  <dd className="font-extrabold text-foreground">{v.fuelType || "Petrol"}</dd>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-secondary/40 p-3 border border-border">
                  <dt className="text-muted-foreground font-semibold">Transmission</dt>
                  <dd className="font-extrabold text-foreground">{v.transmission || "Manual"}</dd>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-secondary/40 p-3 border border-border">
                  <dt className="text-muted-foreground font-semibold">Odometer Reading</dt>
                  <dd className="font-extrabold text-foreground">
                    {v.odometerReading ? `${v.odometerReading.toLocaleString("en-IN")} km` : "N/A"}
                  </dd>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-secondary/40 p-3 border border-border">
                  <dt className="text-muted-foreground font-semibold">Owner Profile</dt>
                  <dd className="font-extrabold text-foreground">{v.ownerName || "1st Owner"}</dd>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-[#FFC700]/10 p-3 border border-[#FFC700]/30">
                  <dt className="text-[#FFC700] font-black">Base Price</dt>
                  <dd className="font-black text-[#FFC700] text-sm">{inr(basePrice)}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
