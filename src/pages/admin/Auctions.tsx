import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { adminNav } from "@/components/nav-config";
import { DataTable, type Column } from "@/components/data-table";
import {
  getSubmittedInspections,
  startLiveAuction,
  stopLiveAuction,
  updateInspectionVehicleStatus,
  type AdminInspectionSummary,
} from "@/lib/api/admin-api";
import { inr, timeLeft } from "@/lib/mock-data";
import {
  Activity,
  CheckCircle2,
  Clock,
  Copy,
  Crown,
  Eye,
  Flame,
  Gavel,
  PlayCircle,
  Radio,
  RefreshCw,
  Square,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminAuctions() {
  const navigate = useNavigate();
  const [inspections, setInspections] = useState<AdminInspectionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [, setNow] = useState(Date.now());

  const handleMarkAsSoldOut = async (id: number, vehicleName: string) => {
    const res = await updateInspectionVehicleStatus(id, "SOLD OUT");
    if (res.success) {
      toast.success(`Vehicle ${vehicleName} status manually updated to SOLD OUT!`);
      fetchAuctions();
    } else {
      toast.error("Failed to update status.");
    }
  };

  const fetchAuctions = async (showToast = false) => {
    if (showToast) setRefreshing(true);
    try {
      const res = await getSubmittedInspections();
      if (res.success && res.data) {
        const approvedOnly = res.data.filter(
          (ins: any) => ins.status === "APPROVED",
        );
        setInspections(approvedOnly);
        if (showToast) toast.success("Auctions list updated");
      }
    } catch (err: any) {
      console.error("Failed to load approved auctions list", err);
      toast.error("Could not load auctions list.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAuctions();
  }, []);

  // Ticking timer every 1 second for live countdowns
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleGoLive = async (id: number) => {
    try {
      toast.info("Launching live auction room...");
      const res = await startLiveAuction(id);
      if (res.success) {
        toast.success("Auction is now LIVE!");
        fetchAuctions();
      } else {
        toast.error("Failed to start auction.");
      }
    } catch (err: any) {
      console.error("Error setting auction to live", err);
      toast.error("Error setting auction to live.");
    }
  };

  const handleStopAuction = async (id: number, vehicleName: string) => {
    if (!window.confirm(`Are you sure you want to stop the live auction for ${vehicleName}?`)) {
      return;
    }
    try {
      toast.info(`Stopping auction for ${vehicleName}...`);
      const res = await stopLiveAuction(id);
      if (res.success) {
        toast.success(`Auction stopped for ${vehicleName}.`);
        fetchAuctions();
      } else {
        toast.error("Failed to stop auction.");
      }
    } catch (err: any) {
      console.error("Error stopping auction", err);
      toast.error(err.response?.data?.message || "Failed to stop auction.");
    }
  };

  // Metrics calculation
  const metrics = useMemo(() => {
    const total = inspections.length;
    const liveCount = inspections.filter((i) => i.vehicleStatus === "LIVE").length;
    const totalBidsCount = inspections.reduce((acc, i) => acc + (i.totalBids || 0), 0);
    const soldCount = inspections.filter(
      (i) => i.vehicleStatus === "SOLD OUT" || i.vehicleStatus === "SOLD" || i.vehicleStatus === "ENDED"
    ).length;
    return { total, liveCount, totalBidsCount, soldCount };
  }, [inspections]);

  const columns: Column<AdminInspectionSummary>[] = [
    {
      key: "vehicle",
      header: "Vehicle Details",
      cell: (v) => (
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-lg border border-border bg-muted font-mono font-black text-[10px] text-foreground tracking-wider uppercase">
              {v.vehicleNumber}
            </span>
          </div>
          <p className="truncate text-sm font-black text-foreground tracking-tight mt-1">
            {v.brand} {v.model}
          </p>
          <p className="text-xs font-semibold text-muted-foreground">
            Variant: {v.variant || "Standard"}
          </p>
        </div>
      ),
    },
    {
      key: "suggestedPrice",
      header: "Valuation Price",
      cell: (v) => (
        <div className="flex flex-col">
          <span className="text-xs font-black text-foreground">
            {v.suggestedPrice ? inr(v.suggestedPrice) : "N/A"}
          </span>
          <span className="text-[10px] font-semibold text-muted-foreground">
            Base Target
          </span>
        </div>
      ),
    },
    {
      key: "bidsCount",
      header: "Highest Bid & Winner",
      cell: (v) => {
        const isLive = v.vehicleStatus === "LIVE";
        const isSold =
          v.vehicleStatus === "SOLD OUT" ||
          v.vehicleStatus === "SOLD" ||
          v.vehicleStatus === "ENDED";
        const bidCount = v.totalBids || 0;
        const topBid = v.currentHighestBid || v.suggestedPrice || 0;
        const winnerName = v.currentHighestBidder || "No Bids";

        return (
          <div className="flex flex-col">
            <span className={cn("text-xs font-black", isLive ? "text-[#FFC700]" : "text-foreground")}>
              {inr(topBid)}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-muted-foreground mt-0.5">
              <Crown className={cn("size-3", isSold ? "text-amber-500" : "text-[#FFC700]")} />
              {winnerName} ({bidCount} Bids)
            </span>
          </div>
        );
      },
    },
    {
      key: "timer",
      header: "Auction Timer",
      cell: (v) => {
        const isLive = v.vehicleStatus === "LIVE";
        const isSold =
          v.vehicleStatus === "SOLD OUT" ||
          v.vehicleStatus === "SOLD" ||
          v.vehicleStatus === "ENDED";

        if (isLive) {
          const rem = timeLeft(v.auctionEndTime || Date.now() + 600 * 1000);
          const isLow = (v.auctionEndTime || Date.now() + 600 * 1000) - Date.now() <= 120000;
          return (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-black shadow-sm transition-all",
                isLow
                  ? "border-rose-500/40 bg-rose-500/10 text-rose-500 animate-pulse"
                  : "border-[#FFC700]/30 bg-[#FFC700]/10 text-[#FFC700]",
              )}
            >
              <Clock className="size-3.5" />
              <span>{rem}</span>
            </span>
          );
        }

        if (isSold) {
          return (
            <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
              <CheckCircle2 className="size-3.5 text-emerald-500" /> Completed
            </span>
          );
        }

        return (
          <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
            <Clock className="size-3.5 text-muted-foreground/70" /> 10 Mins (Ready)
          </span>
        );
      },
    },
    {
      key: "vehicleStatus",
      header: "Status",
      cell: (v) => {
        const isLive = v.vehicleStatus === "LIVE";
        const isSold =
          v.vehicleStatus === "SOLD OUT" ||
          v.vehicleStatus === "SOLD";
        const isEnded =
          v.vehicleStatus === "ENDED" ||
          v.vehicleStatus === "AUCTION ENDED" ||
          v.vehicleStatus === "AUCTION_ENDED" ||
          v.vehicleStatus === "COMPLETED";

        if (isLive) {
          return (
            <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black capitalize tracking-wide bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
              <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
              Live Room
            </span>
          );
        }
        if (isSold) {
          return (
            <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black capitalize tracking-wide bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400">
              Sold Out
            </span>
          );
        }
        if (isEnded) {
          return (
            <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black capitalize tracking-wide bg-secondary border-border text-foreground">
              Auction Ended
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black capitalize tracking-wide bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400">
            Ready to Launch
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      cell: (v) => {
        const isLive = v.vehicleStatus === "LIVE";
        const isSold =
          v.vehicleStatus === "SOLD OUT" ||
          v.vehicleStatus === "SOLD";

        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/admin/auctions/${v.inspectionId}`)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card hover:bg-secondary px-3 py-1.5 text-xs font-extrabold text-foreground transition-all cursor-pointer shadow-sm"
              title="View Dedicated Auction Page Details & Bidding History"
            >
              <Eye className="size-3.5 text-[#FFC700]" /> Details Page
            </button>

            {isLive && (
              <>
                <button
                  onClick={() => {
                    const link = `${window.location.origin}/public-bid/${v.inspectionId}`;
                    navigator.clipboard.writeText(link);
                    toast.success(`Public Bidding Link copied for ${v.brand} ${v.model}!`);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 text-xs font-black text-blue-600 dark:text-blue-400 transition-all cursor-pointer shadow-sm"
                  title="Copy Public Bidding Room Link"
                >
                  <Copy className="size-3.5" /> Copy Link
                </button>
                <button
                  onClick={() => navigate("/admin/live-bidding")}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#FFC700]/30 bg-[#FFC700]/15 hover:bg-[#FFC700]/25 px-3 py-1.5 text-xs font-extrabold text-[#FFC700] transition-all cursor-pointer shadow-sm"
                  title="Monitor Bidding Room"
                >
                  <Activity className="size-3.5" /> Monitor
                </button>
                <button
                  onClick={() => handleStopAuction(v.inspectionId, `${v.brand} ${v.model}`)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1.5 text-xs font-extrabold text-rose-600 dark:text-rose-400 transition-all cursor-pointer shadow-sm"
                  title="Stop Live Auction"
                >
                  <Square className="size-3 text-rose-500 fill-current" /> Stop
                </button>
              </>
            )}

            {!isLive && !isSold && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleGoLive(v.inspectionId)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#FFC700] hover:bg-[#FFD633] px-3.5 py-1.5 text-xs font-extrabold text-[#0D0E12] transition-all cursor-pointer shadow-sm"
                >
                  <PlayCircle className="size-3.5" /> Go Live
                </button>
                <button
                  onClick={() => handleMarkAsSoldOut(v.inspectionId, `${v.brand} ${v.model}`)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-extrabold text-white transition-all cursor-pointer shadow-sm"
                  title="Manually Change Status to SOLD OUT"
                >
                  <CheckCircle2 className="size-3.5" /> Mark SOLD OUT
                </button>
              </div>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <AppShell
      role="admin"
      nav={adminNav}
      title="Auctions & Bidding Management"
      breadcrumb={["Admin", "Auctions"]}
    >
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-soft transition-all mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-foreground tracking-tight">
                Auctions Control Dashboard
              </h2>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFC700]/15 border border-[#FFC700]/30 text-[#FFC700] text-xs font-extrabold">
                <Radio className="size-3.5 animate-pulse text-[#FFC700]" />
                {metrics.liveCount} Live {metrics.liveCount === 1 ? "Auction" : "Auctions"}
              </span>
            </div>
            <p className="mt-1 text-xs font-semibold text-muted-foreground">
              Launch live 10-minute bidding rooms, monitor active auctions, view details pages & negotiate with winning dealers
            </p>
          </div>

          <button
            onClick={() => fetchAuctions(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2.5 text-xs font-extrabold text-foreground shadow-soft transition-all hover:border-[#FFC700]/60 hover:bg-secondary disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={cn("size-3.5 text-[#FFC700]", refreshing && "animate-spin")} />
            <span>{refreshing ? "Refreshing..." : "Refresh List"}</span>
          </button>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4 mt-6">
          <div className="rounded-2xl border border-border bg-secondary/40 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                Approved Vehicles
              </span>
              <Tag className="size-4 text-muted-foreground" />
            </div>
            <span className="text-xl font-black text-foreground block">
              {metrics.total}
            </span>
            <span className="text-[10px] font-semibold text-muted-foreground block mt-0.5">
              Ready for Auction
            </span>
          </div>

          <div className="rounded-2xl border border-[#FFC700]/40 bg-[#FFC700]/5 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-black text-[#FFC700] uppercase tracking-widest">
                Active Live Rooms
              </span>
              <Flame className="size-4 text-[#FFC700]" />
            </div>
            <span className="text-xl font-black text-foreground block text-[#FFC700]">
              {metrics.liveCount}
            </span>
            <span className="text-[10px] font-bold text-foreground/80 block mt-0.5">
              Real-time Bidding Active
            </span>
          </div>

          <div className="rounded-2xl border border-border bg-secondary/40 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                Live Bids Placed
              </span>
              <Gavel className="size-4 text-emerald-500" />
            </div>
            <span className="text-xl font-black text-foreground block">
              {metrics.totalBidsCount}
            </span>
            <span className="text-[10px] font-semibold text-muted-foreground block mt-0.5">
              Dealer Activity Count
            </span>
          </div>

          <div className="rounded-2xl border border-border bg-secondary/40 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                Completed / Sold
              </span>
              <CheckCircle2 className="size-4 text-rose-500" />
            </div>
            <span className="text-xl font-black text-foreground block">
              {metrics.soldCount}
            </span>
            <span className="text-[10px] font-semibold text-muted-foreground block mt-0.5">
              Auctions Concluded
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex h-60 items-center justify-center bg-card border border-border rounded-3xl shadow-soft">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <DataTable
          rows={inspections}
          columns={columns}
          searchKeys={["brand", "model", "variant", "vehicleNumber", "currentHighestBidder"]}
          placeholder="Search auctions by brand, model, vehicle no, winner..."
          actions={null}
        />
      )}
    </AppShell>
  );
}
