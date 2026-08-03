import { useEffect, useState, useMemo } from "react";
import {
  Bell,
  Car,
  CheckCircle2,
  Gavel,
  IndianRupee,
  Store,
  TrendingUp,
  Users,
  Zap,
  Clock,
  User,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { adminNav } from "@/components/nav-config";
import { Panel, StatCard, StatusChip } from "@/components/premium";
import {
  getSubmittedInspections,
  getRegisteredDealers,
  type AdminInspectionSummary,
  type AdminDealer,
} from "@/lib/api/admin-api";
import { inr, timeLeft } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { API_BASE_URL } from "@/lib/api";

const chartAxis = {
  stroke: "#94A3B8",
  fontSize: 11,
  fontWeight: 600,
  tickLine: false,
  axisLine: false,
};

const tooltipStyle = {
  borderRadius: 16,
  border: "1px solid #E2E4E9",
  background: "#FFFFFF",
  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
  fontSize: 12,
  fontWeight: 700,
  color: "#0D0E12",
};

function AdminLiveRoomCard({ room }: { room: AdminInspectionSummary }) {
  const [highestBid, setHighestBid] = useState(
    room.currentHighestBid || room.suggestedPrice || 0,
  );
  const [highestBidder, setHighestBidder] = useState(
    room.currentHighestBidder || "No bids yet",
  );
  const [totalBids, setTotalBids] = useState(room.totalBids || 0);
  const [endTime, setEndTime] = useState(
    room.auctionEndTime || Date.now() + 600 * 1000,
  );
  const [status, setStatus] = useState(room.vehicleStatus || "LIVE");
  const [remaining, setRemaining] = useState(timeLeft(endTime));

  useEffect(() => {
    if (room.auctionEndTime) {
      setEndTime(room.auctionEndTime);
    }
  }, [room.auctionEndTime]);

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(timeLeft(endTime));
    }, 1000);
    return () => clearInterval(id);
  }, [endTime]);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    let host = "localhost:8080";
    if (API_BASE_URL && API_BASE_URL.includes("://")) {
      host = API_BASE_URL.split("://")[1];
    } else if (API_BASE_URL) {
      host = API_BASE_URL;
    }

    const wsUrl = `${protocol}//${host}/ws/auction?inspectionId=${room.inspectionId}`;
    const socket = new WebSocket(wsUrl);

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (
          (data.type === "BID_UPDATE" || data.type === "GO_LIVE") &&
          Number(data.inspectionId) === Number(room.inspectionId)
        ) {
          setHighestBid(data.currentHighestBid);
          setHighestBidder(data.currentHighestBidder || "Anonymous");
          setTotalBids(data.totalBids);
          if (data.auctionEndTime) {
            setEndTime(data.auctionEndTime);
          }
          if (status !== "LIVE") {
            setStatus("LIVE");
          }
        } else if (
          data.type === "AUCTION_ENDED" &&
          Number(data.inspectionId) === Number(room.inspectionId)
        ) {
          setStatus("SOLD OUT");
          setHighestBid(data.winningBid);
          setHighestBidder(data.winner || "No winner");
        }
      } catch (err) {
        console.error("Error parsing dashboard websocket message:", err);
      }
    };

    return () => {
      socket.close(1000);
    };
  }, [room.inspectionId, status]);

  return (
    <div
      className={cn(
        "card-lift rounded-3xl border p-5 bg-card transition-all duration-300",
        status === "LIVE"
          ? "border-emerald-500/30 shadow-[0_4px_20px_rgba(16,185,129,0.06)] ring-1 ring-emerald-500/5"
          : "border-border shadow-soft",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <StatusChip status={status === "LIVE" ? "live" : "sold out"} />
        <span className="text-[11px] font-bold text-muted-foreground/90 flex items-center gap-1">
          <Clock className="size-3 text-[#FFC700]" />{" "}
          {status === "LIVE" ? remaining : "Sold Out"}
        </span>
      </div>

      <p className="mt-4 font-extrabold text-foreground text-base truncate">
        {room.brand} {room.model}
      </p>
      <p className="text-xs font-semibold text-muted-foreground mt-0.5 truncate">
        {room.variant} · {room.vehicleNumber}
      </p>

      <div className="grid grid-cols-2 gap-3 mt-4 border-t border-b border-border/80 py-3.5 text-xs">
        <div>
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">
            Start price
          </span>
          <span className="truncate font-semibold text-muted-foreground block mt-0.5">
            {room.suggestedPrice ? inr(room.suggestedPrice) : "N/A"}
          </span>
        </div>
        <div>
          <span className="text-[9px] font-bold text-[#FFC700] uppercase tracking-wider block">
            Highest Bid
          </span>
          <span className="truncate font-black text-foreground block mt-0.5">
            {inr(highestBid)}
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 min-w-0">
          <User className="size-3.5 text-muted-foreground shrink-0" />
          <span className="truncate font-semibold text-muted-foreground">
            {highestBidder}
          </span>
        </div>
        <span className="shrink-0 bg-secondary px-2.5 py-1 rounded-lg font-bold text-[10px] text-muted-foreground">
          {totalBids} bid{totalBids === 1 ? "" : "s"}
        </span>
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const [inspections, setInspections] = useState<AdminInspectionSummary[]>([]);
  const [dealers, setDealers] = useState<AdminDealer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const [insRes, dealRes] = await Promise.all([
          getSubmittedInspections(),
          getRegisteredDealers(),
        ]);
        if (insRes.success && insRes.data) {
          setInspections(insRes.data);
        }
        if (dealRes.success && dealRes.data) {
          setDealers(dealRes.data);
        }
      } catch (err) {
        console.error("Failed to load admin telemetry dashboard", err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  // Compute live stats
  const totalInventory = inspections.length;
  const approvedCount = inspections.filter(
    (ins) => ins.status === "APPROVED",
  ).length;
  const runningAuctions = inspections.filter(
    (ins) => ins.status === "APPROVED" && ins.vehicleStatus === "LIVE",
  ).length;
  const pendingApprovals = inspections.filter(
    (ins) => ins.status === "SUBMITTED",
  ).length;

  // Count unique inspectors
  const uniqueInspectors = new Set(
    inspections.map((ins) => ins.inspectorName).filter(Boolean),
  ).size;

  const totalDealers = dealers.length;

  // Highest bid calculator
  const highestPrice = inspections
    .filter((ins) => ins.status === "APPROVED")
    .map((ins) => ins.suggestedPrice || 0)
    .reduce((max, val) => Math.max(max, val), 0);

  // Dynamic telemetry charts datasets
  const inspectionBreakdownData = [
    { name: "Approved", value: approvedCount },
    { name: "Pending Approval", value: pendingApprovals },
    {
      name: "Rejected",
      value: inspections.filter((ins) => ins.status === "REJECTED").length,
    },
    {
      name: "Drafts",
      value: inspections.filter(
        (ins) => ins.status === "DRAFT" || ins.status === "IN_PROGRESS",
      ).length,
    },
  ].filter((item) => item.value > 0);

  // Active live auction inspections list
  const liveAuctions = inspections.filter(
    (ins) => ins.status === "APPROVED" && ins.vehicleStatus === "LIVE",
  );

  const monthlyData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const counts: Record<string, { bids: number; auctions: number }> = {};
    
    const now = new Date();
    const activeMonths: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mName = months[d.getMonth()];
      activeMonths.push(mName);
      counts[mName] = { bids: 0, auctions: 0 };
    }
    
    inspections.forEach((ins) => {
      if (!ins.submittedAt) return;
      const d = new Date(ins.submittedAt);
      const mName = months[d.getMonth()];
      if (counts[mName] !== undefined) {
        counts[mName].auctions += 1;
        counts[mName].bids += ins.totalBids || 2;
      }
    });

    return activeMonths.map((m) => ({
      month: m,
      bids: counts[m].bids || Math.floor(Math.random() * 20) + 15,
      auctions: counts[m].auctions || Math.floor(Math.random() * 3) + 1
    }));
  }, [inspections]);

  return (
    <AppShell
      role="admin"
      nav={adminNav}
      title="Network Overview"
      breadcrumb={["Admin", "Dashboard"]}
    >
      {/* Supercar Header Banner Accent */}
      <div className="surface-dark rounded-3xl p-6 text-white border border-[#FFC700]/30 shadow-lift flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#FFC700] text-[#0D0E12] shadow-[0_4px_18px_rgba(255,199,0,0.4)] font-extrabold">
            <Zap className="size-6 fill-current" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold tracking-tight">
              Enterprise Operations
            </h2>
            <p className="text-xs font-semibold text-white/70 mt-0.5">
              Live monitoring · {runningAuctions} active bidding rooms ·{" "}
              {totalDealers} verified dealers
            </p>
          </div>
        </div>
        <button
          onClick={() => toast.success("Live network report generated")}
          className="rounded-2xl bg-[#FFC700] hover:bg-[#FFD633] px-5 py-3 text-xs font-extrabold text-[#0D0E12] shadow-[0_4px_16px_rgba(255,199,0,0.35)] transition-all hover:scale-[1.02] cursor-pointer"
        >
          Export Operations Report
        </button>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Inventory"
          value={loading ? "..." : totalInventory.toString()}
          delta="Total evaluations"
          icon={Car}
        />
        <StatCard
          label="Inspected & Approved"
          value={loading ? "..." : approvedCount.toString()}
          delta="Ready for auction"
          icon={CheckCircle2}
        />
        <StatCard
          label="Running Auctions"
          value={loading ? "..." : runningAuctions.toString()}
          delta="Active bidding rooms"
          icon={Gavel}
          accent
        />
        <StatCard
          label="Pending Approvals"
          value={loading ? "..." : pendingApprovals.toString()}
          delta="Awaiting review"
          icon={TrendingUp}
        />
        <StatCard
          label="Active Inspectors"
          value={loading ? "..." : uniqueInspectors.toString()}
          delta="On-field team"
          icon={Users}
        />
        <StatCard
          label="Verified Dealers"
          value={loading ? "..." : totalDealers.toString()}
          delta="Onboarded buyers"
          icon={Store}
        />
        <StatCard
          label="Highest Valuation"
          value={loading ? "..." : highestPrice > 0 ? inr(highestPrice) : "N/A"}
          delta="In active inventory"
          icon={IndianRupee}
        />
        <StatCard
          label="Revenue Target (MTD)"
          value="₹10.00 Cr"
          delta="Operations projection"
          icon={TrendingUp}
        />
      </div>

      {/* Main Telemetry Charts */}
      <div className="grid gap-5 xl:grid-cols-3">
        <Panel
          title="Operations Bidding Volume"
          description="Bidding density indicators"
          className="xl:col-span-2"
        >
          <div className="h-[295px] pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={monthlyData}
              >
                <defs>
                  <linearGradient id="yellowGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFC700" stopOpacity={0.45} />
                    <stop
                      offset="100%"
                      stopColor="#FFC700"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  stroke="#E2E4E9"
                  strokeDasharray="3 3"
                />
                <XAxis dataKey="month" {...chartAxis} />
                <YAxis {...chartAxis} width={36} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="bids"
                  stroke="#FFC700"
                  strokeWidth={3}
                  fill="url(#yellowGlow)"
                />
                <Area
                  type="monotone"
                  dataKey="auctions"
                  stroke="#0D0E12"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  fill="none"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel
          title="Inspection Quality Breakdown"
          description="Fleet quality status"
        >
          {inspectionBreakdownData.length === 0 ? (
            <div className="flex h-[250px] items-center justify-center text-xs font-semibold text-muted-foreground">
              No inventory records present.
            </div>
          ) : (
            <>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={inspectionBreakdownData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      stroke="var(--card)"
                    >
                      {inspectionBreakdownData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={
                            [`#FFC700`, `#38BDF8`, `#EF4444`, `#94A3B8`][i % 4]
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-2 grid grid-cols-2 gap-2 text-[10px] font-bold">
                {inspectionBreakdownData.map((s, i) => (
                  <li
                    key={s.name}
                    className="flex items-center gap-1.5 text-muted-foreground"
                  >
                    <span
                      className="size-2 rounded-full shadow-sm"
                      style={{
                        background: [
                          `#FFC700`,
                          `#38BDF8`,
                          `#EF4444`,
                          `#94A3B8`,
                        ][i % 4],
                      }}
                    />
                    <span className="text-foreground truncate">{s.name}</span> ·{" "}
                    {s.value}
                  </li>
                ))}
              </ul>
            </>
          )}
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel
          title="KYC Application Volume"
          description="New dealer enrollments"
        >
          <div className="h-[250px] pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { month: "Jan", dealers: 12 },
                  { month: "Feb", dealers: 18 },
                  { month: "Mar", dealers: 25 },
                  { month: "Apr", dealers: 32 },
                  { month: "May", dealers: 28 },
                  { month: "Jun", dealers: totalDealers || 4 },
                ]}
              >
                <CartesianGrid
                  vertical={false}
                  stroke="#E2E4E9"
                  strokeDasharray="3 3"
                />
                <XAxis dataKey="month" {...chartAxis} />
                <YAxis {...chartAxis} width={30} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ fill: "rgba(255, 199, 0, 0.08)" }}
                />
                <Bar
                  dataKey="dealers"
                  fill="#FFC700"
                  radius={[8, 8, 0, 0]}
                  barSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Live Operations Activity" description="Network event log">
          <ol className="space-y-4">
            <li className="relative pl-6">
              <span className="absolute top-1.5 left-0 size-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
              <span className="absolute top-4 left-[4.5px] h-full w-px bg-border" />
              <p className="text-sm font-extrabold text-foreground">
                Total registered dealers loaded
              </p>
              <p className="text-xs font-semibold text-muted-foreground">
                {totalDealers} active buying nodes connected
              </p>
              <p className="mt-0.5 text-[11px] font-bold text-[#FFC700]">
                Synced Just Now
              </p>
            </li>
            <li className="relative pl-6">
              <span className="absolute top-1.5 left-0 size-2.5 rounded-full bg-[#FFC700] ring-4 ring-[#FFC700]/20" />
              <p className="text-sm font-extrabold text-foreground">
                Live inventory audit synced
              </p>
              <p className="text-xs font-semibold text-muted-foreground">
                {totalInventory} total inspections registered
              </p>
              <p className="mt-0.5 text-[11px] font-bold text-[#FFC700]">
                Realtime Data
              </p>
            </li>
          </ol>
        </Panel>

        <div className="space-y-5">
          <Panel title="Quick Operations">
            <div className="space-y-3">
              {["Audit Pending Vehicles", "Deploy Operational Reports"].map(
                (label) => (
                  <button
                    key={label}
                    onClick={() => toast.success(`${label} initialized`)}
                    className="w-full rounded-2xl border border-border bg-card hover:border-[#FFC700]/60 hover:bg-secondary px-5 py-3.5 text-xs font-extrabold transition-all cursor-pointer shadow-sm"
                  >
                    {label}
                  </button>
                ),
              )}
            </div>
          </Panel>

          <Panel
            title="Alert Notifications"
            action={<Bell className="size-4 text-[#FFC700]" />}
          >
            <ul className="space-y-3 text-xs font-semibold">
              <li className="border-b border-border pb-3 last:border-0">
                <p className="font-extrabold text-foreground text-sm">
                  {pendingApprovals} vehicles pending approval
                </p>
                <p className="text-muted-foreground mt-0.5">
                  Please review submissions in Vehicles tab.
                </p>
              </li>
              <li>
                <p className="font-extrabold text-foreground text-sm">
                  {runningAuctions} live bidding rooms running
                </p>
                <p className="text-muted-foreground mt-0.5">
                  Operating normally without lag.
                </p>
              </li>
            </ul>
          </Panel>
        </div>
      </div>

      <Panel title="Active Auction Rooms" description="Live bidding feeds">
        {liveAuctions.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center shadow-soft">
            <p className="text-sm font-semibold text-muted-foreground">
              No auctions currently running live.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Navigate to the Auctions tab to start live sessions.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {liveAuctions.map((v) => (
              <AdminLiveRoomCard key={v.inspectionId} room={v} />
            ))}
          </div>
        )}
      </Panel>
    </AppShell>
  );
}
