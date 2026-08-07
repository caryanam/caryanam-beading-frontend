import { useEffect, useState, useMemo } from "react";
import { Download, IndianRupee, LineChart as LineIcon, Percent, Users, Car } from "lucide-react";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { AppShell } from "@/components/app-shell";
import { adminNav } from "@/components/nav-config";
import { Panel, StatCard } from "@/components/premium";
import { getSubmittedInspections, getRegisteredDealers, AdminDealer, AdminInspectionSummary } from "@/lib/api/admin-api";

const axis = { stroke: "var(--muted-foreground)", fontSize: 11, tickLine: false, axisLine: false };
const tip = {
  borderRadius: 14,
  border: "1px solid var(--border)",
  background: "var(--card)",
  fontSize: 12,
  fontWeight: 600,
};

export function AdminAnalytics() {
  const [dealers, setDealers] = useState<AdminDealer[]>([]);
  const [inspections, setInspections] = useState<AdminInspectionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const [dealRes, insRes] = await Promise.all([
          getRegisteredDealers(),
          getSubmittedInspections(),
        ]);
        if (dealRes.success && dealRes.data) {
          setDealers(dealRes.data);
        }
        if (insRes.success && insRes.data) {
          setInspections(insRes.data);
        }
      } catch (err) {
        console.error("Failed to load analytics datasets", err);
        toast.error("Failed to load analytics datasets");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const totalInspections = inspections.length;
  const approvedCount = useMemo(() => inspections.filter((ins) => ins.status === "APPROVED").length, [inspections]);
  const liveCount = useMemo(() => inspections.filter((ins) => ins.vehicleStatus === "LIVE").length, [inspections]);
  const totalBidsCount = useMemo(() => inspections.reduce((sum, ins) => sum + (ins.totalBids || 0), 0), [inspections]);
  const grossBiddingValue = useMemo(() => inspections.reduce((sum, ins) => sum + (ins.currentHighestBid || 0), 0), [inspections]);

  const approvalRate = useMemo(() => {
    if (totalInspections === 0) return "0%";
    return `${((approvedCount / totalInspections) * 100).toFixed(1)}%`;
  }, [approvedCount, totalInspections]);

  const monthlyBidVolume = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const counts: Record<string, number> = {};
    const now = new Date();
    const activeMonths: string[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mName = months[d.getMonth()];
      activeMonths.push(mName);
      counts[mName] = 0;
    }

    inspections.forEach((ins) => {
      if (!ins.submittedAt) return;
      const d = new Date(ins.submittedAt);
      const mName = months[d.getMonth()];
      if (counts[mName] !== undefined) {
        counts[mName] += ins.totalBids || 0;
      }
    });

    return activeMonths.map((m) => ({
      month: m,
      bids: counts[m] || 0,
    }));
  }, [inspections]);

  const monthlyVehicleActivity = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const activeMonths: string[] = [];
    const submittedCounts: Record<string, number> = {};
    const approvedCounts: Record<string, number> = {};

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mName = months[d.getMonth()];
      activeMonths.push(mName);
      submittedCounts[mName] = 0;
      approvedCounts[mName] = 0;
    }

    inspections.forEach((ins) => {
      if (!ins.submittedAt) return;
      const d = new Date(ins.submittedAt);
      const mName = months[d.getMonth()];
      if (submittedCounts[mName] !== undefined) {
        submittedCounts[mName] += 1;
        if (ins.status === "APPROVED") {
          approvedCounts[mName] += 1;
        }
      }
    });

    return activeMonths.map((m) => ({
      month: m,
      Submitted: submittedCounts[m] || 0,
      Approved: approvedCounts[m] || 0,
    }));
  }, [inspections]);

  const exportInspectionsCSV = () => {
    if (!inspections.length) {
      toast.error("No inspection data available to export");
      return;
    }
    const headers = ["Inspection ID", "Vehicle Number", "Brand", "Model", "Variant", "Status", "Vehicle Status", "Highest Bid (₹)", "Total Bids"];
    const rows = inspections.map((i) => [
      i.inspectionId,
      `"${i.vehicleNumber || ""}"`,
      `"${i.brand || ""}"`,
      `"${i.model || ""}"`,
      `"${i.variant || ""}"`,
      i.status,
      i.vehicleStatus || "N/A",
      i.currentHighestBid || 0,
      i.totalBids || 0,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `inspections_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success("Inspections report exported as CSV");
  };

  const exportDealersCSV = () => {
    if (!dealers.length) {
      toast.error("No dealer data available to export");
      return;
    }
    const headers = ["Dealer ID", "Dealership Name", "Owner Name", "Email", "Mobile Number", "Total Bids", "Won Bids"];
    const rows = dealers.map((d) => [
      d.id,
      `"${d.dealershipName || ""}"`,
      `"${d.ownerName || ""}"`,
      `"${d.email || ""}"`,
      `"${d.mobileNumber || ""}"`,
      d.totalBids || 0,
      d.wonBidsCount || 0,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `dealers_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success("Dealers network report exported as CSV");
  };

  return (
    <AppShell role="admin" nav={adminNav} title="Analytics" breadcrumb={["Admin", "Analytics"]}>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Gross Bidding Volume"
          value={loading ? "..." : `₹${grossBiddingValue.toLocaleString("en-IN")}`}
          delta={`${totalBidsCount} total active bids`}
          icon={IndianRupee}
          accent
        />
        <StatCard
          label="Approved Vehicles"
          value={loading ? "..." : approvedCount.toString()}
          delta={`Out of ${totalInspections} submitted`}
          icon={LineIcon}
        />
        <StatCard
          label="Approval Rate"
          value={loading ? "..." : approvalRate}
          delta={`${liveCount} live in auction`}
          icon={Percent}
        />
        <StatCard
          label="Active Dealers"
          value={loading ? "..." : dealers.length.toString()}
          delta="Enrolled dealer network"
          icon={Users}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={exportInspectionsCSV}
          className="flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold shadow-soft transition-all cursor-pointer bg-primary text-primary-foreground shadow-[0_4px_14px_rgba(255,193,7,0.35)] hover:bg-accent"
        >
          <Download className="size-4 text-primary-foreground" /> Export Inspections CSV
        </button>
        <button
          onClick={exportDealersCSV}
          className="flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold shadow-soft transition-all cursor-pointer border border-border bg-card hover:border-primary/50 hover:bg-secondary"
        >
          <Download className="size-4 text-primary" /> Export Dealers Network CSV
        </button>
      </div>

      <div className="grid gap-5 xl:grid-cols-2 mt-6">
        <Panel title="Monthly Bid Volume Trend">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyBidVolume}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="month" {...axis} />
                <YAxis {...axis} width={36} allowDecimals={false} />
                <Tooltip contentStyle={tip} />
                <Line
                  type="monotone"
                  dataKey="bids"
                  name="Total Bids"
                  stroke="#FFC700"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#FFC700", stroke: "#111111", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Monthly Inspection Submissions vs Approvals">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyVehicleActivity}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="month" {...axis} />
                <YAxis {...axis} width={30} allowDecimals={false} />
                <Tooltip contentStyle={tip} cursor={{ fill: "var(--secondary)" }} />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                <Bar dataKey="Submitted" fill="#94A3B8" radius={[6, 6, 0, 0]} barSize={20} />
                <Bar dataKey="Approved" fill="#10B981" radius={[6, 6, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
