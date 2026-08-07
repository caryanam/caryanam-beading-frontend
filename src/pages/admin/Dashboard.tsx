import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Car,
  CheckCircle2,
  ChevronRight,
  Gavel,
  Store,
  TrendingUp,
  User,
  Users,
  Zap,
  Download,
  ShieldCheck,
  ClipboardList,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { AppShell } from "@/components/app-shell";
import { adminNav } from "@/components/nav-config";
import { Panel, StatCard, StatusChip } from "@/components/premium";
import {
  getSubmittedInspections,
  getRegisteredDealers,
  type AdminInspectionSummary,
  type AdminDealer,
} from "@/lib/api/admin-api";
import { inr } from "@/lib/mock-data";
import { toast } from "sonner";

const COLORS = ["#10B981", "#FFC700", "#EF4444", "#696974"];

const chartAxis = {
  stroke: "#696974",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
};

const tooltipStyle = {
  backgroundColor: "#0D0E12",
  borderColor: "rgba(255, 199, 0, 0.3)",
  borderRadius: "16px",
  color: "#FFFFFF",
  fontSize: "12px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
};

function AdminLiveRoomCard({ room }: { room: AdminInspectionSummary }) {
  const highestBid = room.currentHighestBid || room.suggestedPrice || 0;
  const highestBidder = room.currentHighestBidder || (room as any).highestBidderName || "No Bids Yet";
  const totalBids = room.totalBids || 0;

  return (
    <div className="card-lift relative overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-soft hover:border-[#FFC700]/60 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="relative flex size-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full size-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-black text-emerald-500 uppercase tracking-widest">
            LIVE BIDDING
          </span>
        </div>
        <Link
          to={`/admin/live-bidding?room=${room.inspectionId}`}
          className="rounded-xl bg-[#FFC700]/10 hover:bg-[#FFC700] text-[#FFC700] hover:text-[#0D0E12] px-3 py-1.5 text-[11px] font-black transition-all cursor-pointer flex items-center gap-1"
        >
          View Room <ChevronRight className="size-3" />
        </Link>
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
    (ins) => ins.status === "APPROVED"
  ).length;
  const runningAuctions = inspections.filter(
    (ins) => ins.status === "APPROVED" && ins.vehicleStatus === "LIVE"
  ).length;
  const pendingApprovals = inspections.filter(
    (ins) => ins.status === "SUBMITTED"
  ).length;

  const uniqueInspectors = new Set(
    inspections.map((ins) => ins.inspectorName).filter(Boolean)
  ).size;

  const totalDealers = dealers.length;

  const inspectionBreakdownData = useMemo(() => {
    const approved = inspections.filter((ins) => ins.status === "APPROVED").length;
    const pending = inspections.filter((ins) => ins.status === "SUBMITTED").length;
    const rejected = inspections.filter((ins) => ins.status === "REJECTED").length;
    const drafts = inspections.filter(
      (ins) => ins.status === "DRAFT" || ins.status === "IN_PROGRESS"
    ).length;

    return [
      { name: "Approved", value: approved },
      { name: "Pending Approval", value: pending },
      { name: "Rejected", value: rejected },
      { name: "Drafts", value: drafts },
    ].filter((item) => item.value > 0);
  }, [inspections]);

  const liveAuctions = inspections.filter(
    (ins) => ins.status === "APPROVED" && ins.vehicleStatus === "LIVE"
  );

  const monthlyData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const counts: Record<string, { bids: number; auctions: number }> = {};
    
    months.forEach((mName) => {
      counts[mName] = { bids: 0, auctions: 0 };
    });
    
    inspections.forEach((ins) => {
      if (!ins.submittedAt) return;
      const d = new Date(ins.submittedAt);
      const mName = months[d.getMonth()];
      if (counts[mName] !== undefined) {
        counts[mName].auctions += 1;
        counts[mName].bids += (ins.totalBids || 0);
      }
    });

    return months.map((m) => ({
      month: m,
      bids: counts[m].bids,
      auctions: counts[m].auctions
    }));
  }, [inspections]);

  // Working Export Operations Report handler
  const handleExportReport = () => {
    try {
      const headers = ["ID", "Vehicle Number", "Vehicle Details", "Owner", "Inspector", "Status", "Submitted At"];
      const rows = inspections.map((ins, index) => [
        index + 1,
        `"${ins.vehicleNumber || ''}"`,
        `"${ins.brand || ''} ${ins.model || ''} ${ins.variant || ''}"`,
        `"${ins.ownerName || ''}"`,
        `"${ins.inspectorName || ''}"`,
        `"${ins.status || ''}"`,
        `"${ins.submittedAt ? new Date(ins.submittedAt).toLocaleString("en-IN") : 'N/A'}"`,
      ]);

      const csvContent = [
        "CARYANAM BIDDING - ENTERPRISE OPERATIONS SUMMARY REPORT",
        `Generated On: ${new Date().toLocaleString("en-IN")}`,
        `Total Inventory: ${totalInventory} | Approved: ${approvedCount} | Live Rooms: ${runningAuctions} | Pending Review: ${pendingApprovals} | Registered Dealers: ${totalDealers}`,
        "",
        headers.join(","),
        ...rows.map((r) => r.join(",")),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `caryanam_operations_report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Operations Summary Report downloaded successfully!");
    } catch (err) {
      console.error("Export report error", err);
      toast.error("Failed to generate report.");
    }
  };

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
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              Enterprise Operations
            </h2>
            <p className="text-xs font-semibold text-white/70 mt-0.5">
              Live monitoring · {runningAuctions} active bidding rooms ·{" "}
              {totalDealers} verified dealers
            </p>
          </div>
        </div>
        <Link
          to="/admin/live-bidding"
          className="rounded-2xl bg-[#FFC700] hover:bg-[#FFD633] px-6 py-3 text-xs font-extrabold text-[#0D0E12] shadow-[0_4px_16px_rgba(255,199,0,0.35)] transition-all hover:scale-[1.02] cursor-pointer flex items-center gap-2"
        >
          <Zap className="size-4 fill-current" /> Live Bidding
        </Link>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
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
      </div>

      {/* Quick Action Navigation Grid */}
      <Panel title="Quick Admin Actions" description="Fast operational shortcuts">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            to="/admin/live-bidding"
            className="group card-lift flex items-center justify-between rounded-2xl border border-border bg-card p-4 hover:border-[#FFC700] transition-all shadow-soft"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <Zap className="size-5" />
              </div>
              <div>
                <p className="text-sm font-extrabold text-foreground group-hover:text-[#FFC700] transition-colors">
                  Live Bidding
                </p>
                <p className="text-xs text-muted-foreground font-medium">
                  {runningAuctions} active rooms
                </p>
              </div>
            </div>
            <ChevronRight className="size-4 text-muted-foreground group-hover:text-[#FFC700] group-hover:translate-x-1 transition-all" />
          </Link>

          <Link
            to="/admin/vehicles"
            className="group card-lift flex items-center justify-between rounded-2xl border border-border bg-card p-4 hover:border-[#FFC700] transition-all shadow-soft"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#FFC700]/10 text-[#FFC700] border border-[#FFC700]/20">
                <Car className="size-5" />
              </div>
              <div>
                <p className="text-sm font-extrabold text-foreground group-hover:text-[#FFC700] transition-colors">
                  Manage Vehicles
                </p>
                <p className="text-xs text-muted-foreground font-medium">
                  {pendingApprovals} pending review
                </p>
              </div>
            </div>
            <ChevronRight className="size-4 text-muted-foreground group-hover:text-[#FFC700] group-hover:translate-x-1 transition-all" />
          </Link>

          <Link
            to="/admin/auctions"
            className="group card-lift flex items-center justify-between rounded-2xl border border-border bg-card p-4 hover:border-[#FFC700] transition-all shadow-soft"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <Gavel className="size-5" />
              </div>
              <div>
                <p className="text-sm font-extrabold text-foreground group-hover:text-[#FFC700] transition-colors">
                  Auctions Control
                </p>
                <p className="text-xs text-muted-foreground font-medium">
                  Schedule & start rooms
                </p>
              </div>
            </div>
            <ChevronRight className="size-4 text-muted-foreground group-hover:text-[#FFC700] group-hover:translate-x-1 transition-all" />
          </Link>

          <Link
            to="/admin/dealers"
            className="group card-lift flex items-center justify-between rounded-2xl border border-border bg-card p-4 hover:border-[#FFC700] transition-all shadow-soft"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
                <Store className="size-5" />
              </div>
              <div>
                <p className="text-sm font-extrabold text-foreground group-hover:text-[#FFC700] transition-colors">
                  Dealer Network
                </p>
                <p className="text-xs text-muted-foreground font-medium">
                  {totalDealers} registered dealers
                </p>
              </div>
            </div>
            <ChevronRight className="size-4 text-muted-foreground group-hover:text-[#FFC700] group-hover:translate-x-1 transition-all" />
          </Link>
        </div>
      </Panel>

      {/* Main Telemetry Charts */}
      <div className="grid gap-5 xl:grid-cols-3">
        <Panel
          title="Operations Bidding Volume"
          description="Bidding density indicators"
          className="xl:col-span-2"
        >
          <div className="h-[295px] pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="yellowGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFC700" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#FFC700" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#E2E4E9" strokeDasharray="3 3" />
                <XAxis dataKey="month" {...chartAxis} />
                <YAxis {...chartAxis} width={30} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="bids"
                  stroke="#FFC700"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#yellowGlow)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel
          title="Inspection Pipeline"
          description="Status ratio breakdown"
        >
          {loading ? (
            <div className="flex h-[250px] items-center justify-center">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : (
            <>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={inspectionBreakdownData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {inspectionBreakdownData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <ul className="mt-2 space-y-1 text-xs font-bold text-muted-foreground">
                {inspectionBreakdownData.map((s, idx) => (
                  <li key={s.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      />
                      <span>{s.name}</span>
                    </div>
                    <span className="text-foreground font-black">{s.value}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Panel>
      </div>

      {/* Live Operations Log */}
      <Panel title="Live Operations Activity" description="Network event log">
        <ol className="grid gap-4 sm:grid-cols-2">
          <li className="relative pl-6 bg-secondary/40 p-4 rounded-2xl border border-border">
            <span className="absolute top-4 left-3 size-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
            <p className="text-sm font-extrabold text-foreground ml-2">
              Registered Dealers Sync
            </p>
            <p className="text-xs font-semibold text-muted-foreground ml-2 mt-0.5">
              {totalDealers} active buying nodes connected
            </p>
            <p className="mt-1 text-[10px] font-black text-[#FFC700] uppercase tracking-wider ml-2">
              Synced Realtime
            </p>
          </li>
          <li className="relative pl-6 bg-secondary/40 p-4 rounded-2xl border border-border">
            <span className="absolute top-4 left-3 size-2.5 rounded-full bg-[#FFC700] ring-4 ring-[#FFC700]/20" />
            <p className="text-sm font-extrabold text-foreground ml-2">
              Live Vehicle Audit
            </p>
            <p className="text-xs font-semibold text-muted-foreground ml-2 mt-0.5">
              {totalInventory} total inspections registered
            </p>
            <p className="mt-1 text-[10px] font-black text-[#FFC700] uppercase tracking-wider ml-2">
              Active Network
            </p>
          </li>
        </ol>
      </Panel>

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
