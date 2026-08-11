import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Gavel, Zap, Trophy, TrendingUp, ArrowUpRight, Car } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { dealerNav } from "@/components/nav-config";
import { DataTable, type Column } from "@/components/data-table";
import { StatusChip, StatCard } from "@/components/premium";
import { inr } from "@/lib/mock-data";
import { getDealerBidsHistory } from "@/lib/api/dealer-api";
import { formatIndianDateTime } from "@/lib/utils";

interface DealerBidRecord {
  id: string;
  vehicleId: string;
  brand: string;
  model: string;
  regNo: string;
  myBid: number;
  highestBid: number;
  totalBids: number;
  timestamp: string;
  status: string;
  auction: "live" | "scheduled" | "completed";
}

export function DealerBids() {
  const [bids, setBids] = useState<DealerBidRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "live" | "won" | "lost">("all");

  useEffect(() => {
    const fetchBids = async () => {
      setLoading(true);
      try {
        const res = await getDealerBidsHistory();
        if (res.success && res.data) {
          setBids(res.data);
        }
      } catch (err) {
        console.error("Failed to load dealer bids list", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBids();
  }, []);

  const totalBidsCount = bids.length;
  const liveBidsCount = useMemo(
    () => bids.filter((b) => b.auction === "live").length,
    [bids]
  );
  const wonBidsCount = useMemo(
    () => bids.filter((b) => b.auction !== "live" && b.myBid >= b.highestBid).length,
    [bids]
  );
  const lostBidsCount = useMemo(
    () => bids.filter((b) => b.auction !== "live" && b.myBid < b.highestBid).length,
    [bids]
  );
  const totalBidValue = useMemo(
    () => bids.reduce((acc, b) => acc + (b.myBid || 0), 0),
    [bids]
  );

  const filteredBids = useMemo(() => {
    if (activeTab === "live") return bids.filter((b) => b.auction === "live");
    if (activeTab === "won")
      return bids.filter((b) => b.auction !== "live" && b.myBid >= b.highestBid);
    if (activeTab === "lost")
      return bids.filter((b) => b.auction !== "live" && b.myBid < b.highestBid);
    return bids;
  }, [bids, activeTab]);

  const columns: Column<DealerBidRecord>[] = [
    {
      key: "vehicle",
      header: "Vehicle",
      cell: (v) => (
        <div className="min-w-0">
          <Link
            to={`/dealer/vehicles/${v.vehicleId || v.id}`}
            className="truncate font-bold text-sm text-foreground hover:text-[#FFC700] hover:underline inline-flex items-center gap-1 group"
          >
            <span>
              {v.brand} {v.model}
            </span>
            <ArrowUpRight className="size-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-[#FFC700]" />
          </Link>
          <p className="text-xs text-muted-foreground mt-0.5 font-medium">{v.regNo}</p>
        </div>
      ),
    },
    {
      key: "mybid",
      header: "My Bid",
      cell: (v) => (
        <span className="font-extrabold text-foreground">{inr(v.myBid)}</span>
      ),
    },
    {
      key: "highest",
      header: "Highest Bid",
      cell: (v) => (
        <span className="font-medium text-muted-foreground">{inr(v.highestBid)}</span>
      ),
    },

    {
      key: "timestamp",
      header: "Bid Time",
      cell: (v) => (
        <span className="text-xs text-muted-foreground font-medium">
          {formatIndianDateTime(v.timestamp)}
        </span>
      ),
    },
    {
      key: "outcome",
      header: "Outcome",
      cell: (v) => {
        if (v.auction === "live") {
          return <StatusChip status="live" />;
        }
        const isWin = v.myBid >= v.highestBid;
        return <StatusChip status={isWin ? "won" : "lost"} />;
      },
    },
    {
      key: "action",
      header: "Action",
      cell: (v) => (
        <Link
          to={`/dealer/vehicles/${v.vehicleId || v.id}`}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FFC700]/10 text-[#0D0E12] dark:text-[#FFC700] hover:bg-[#FFC700] hover:text-black transition-colors"
        >
          {v.auction === "live" ? "Increase Bid" : "View Vehicle"}
        </Link>
      ),
    },
  ];

  return (
    <AppShell
      role="dealer"
      nav={dealerNav}
      title="My Bids"
      breadcrumb={["Dealer", "My Bids"]}
    >
      <div className="space-y-6">
        {/* Stat Cards Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Bids Placed"
            value={totalBidsCount}
            icon={Gavel}
            accent
          />
          <StatCard
            label="Active Auctions"
            value={liveBidsCount}
            icon={Zap}
          />
          <StatCard
            label="Bids Won"
            value={wonBidsCount}
            icon={Trophy}
          />
          <StatCard
            label="Total Bids Value"
            value={inr(totalBidValue)}
            icon={TrendingUp}
          />
        </div>

        {/* Section Header & Filter Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-foreground tracking-tight">
              Bidding History
            </h2>
            <span className="px-3 py-0.5 rounded-full text-xs font-black bg-[#FFC700]/20 text-[#0D0E12] dark:text-[#FFC700] border border-[#FFC700]/30 shadow-2xs">
              {totalBidsCount} Total {totalBidsCount === 1 ? "Bid" : "Bids"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === "all"
                  ? "bg-[#0D0E12] text-white dark:bg-[#FFC700] dark:text-black shadow-sm"
                  : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground border border-border"
              }`}
            >
              All Bids ({totalBidsCount})
            </button>
            <button
              onClick={() => setActiveTab("live")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === "live"
                  ? "bg-[#0D0E12] text-white dark:bg-[#FFC700] dark:text-black shadow-sm"
                  : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground border border-border"
              }`}
            >
              Live ({liveBidsCount})
            </button>
            <button
              onClick={() => setActiveTab("won")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === "won"
                  ? "bg-[#0D0E12] text-white dark:bg-[#FFC700] dark:text-black shadow-sm"
                  : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground border border-border"
              }`}
            >
              Won ({wonBidsCount})
            </button>
            <button
              onClick={() => setActiveTab("lost")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === "lost"
                  ? "bg-[#0D0E12] text-white dark:bg-[#FFC700] dark:text-black shadow-sm"
                  : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground border border-border"
              }`}
            >
              Lost ({lostBidsCount})
            </button>
          </div>
        </div>

        {/* Bids Table / Empty States */}
        {loading ? (
          <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-soft">
            <div className="animate-spin inline-block size-8 border-3 border-current border-t-transparent text-[#FFC700] rounded-full mb-3" />
            <p className="text-sm font-semibold text-muted-foreground">
              Loading your bids history...
            </p>
          </div>
        ) : bids.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-16 text-center shadow-soft">
            <div className="mx-auto size-14 grid place-items-center rounded-2xl bg-[#FFC700]/15 text-[#FFC700] mb-4">
              <Gavel className="size-7" />
            </div>
            <p className="font-extrabold text-foreground text-lg">
              You have not placed any bids yet.
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Visit the marketplace tab to browse live vehicle auctions and start placing your bids.
            </p>
            <Link
              to="/dealer/marketplace"
              className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-2xl text-xs font-extrabold bg-[#0D0E12] text-white dark:bg-[#FFC700] dark:text-black hover:opacity-90 transition-opacity"
            >
              <Car className="size-4" />
              Browse Marketplace
            </Link>
          </div>
        ) : filteredBids.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center shadow-soft">
            <p className="font-extrabold text-foreground text-base">
              No bids found for "{activeTab}" filter.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Try switching tabs to view all your placed bids.
            </p>
            <button
              onClick={() => setActiveTab("all")}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-muted text-foreground hover:bg-muted/80 transition-colors"
            >
              View All Bids ({totalBidsCount})
            </button>
          </div>
        ) : (
          <DataTable
            rows={filteredBids}
            columns={columns}
            searchKeys={["brand", "model", "regNo"]}
            placeholder="Search by brand, model, registration no..."
            actions={null}
          />
        )}
      </div>
    </AppShell>
  );
}

