import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, FileText, Upload, XCircle, PlusCircle, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { freelancerNav } from "@/components/nav-config";
import { Panel, StatCard } from "@/components/premium";
import { useAuth } from "@/hooks/use-auth";
import { getFreelancerInspections } from "@/lib/api/freelancer-api";

export function FreelancerDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [stats, setStats] = useState({
    draftCount: 0,
    submittedCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
  });

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const res = await getFreelancerInspections();
      let list: any[] = [];
      if (res.success && res.data) {
        list = res.data;
      }

      setVehicles(list);
      setStats({
        draftCount: list.filter((v: any) => v.status === "draft" || v.status === "DRAFT").length,
        submittedCount: list.filter((v: any) => v.status === "pending" || v.status === "SUBMITTED" || v.status === "PENDING_APPROVAL").length,
        approvedCount: list.filter((v: any) => v.status === "approved" || v.status === "APPROVED" || v.status === "live" || v.status === "LIVE").length,
        rejectedCount: list.filter((v: any) => v.status === "rejected" || v.status === "REJECTED").length,
      });
    } catch (err) {
      console.error("Failed to load freelancer dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  return (
    <AppShell role="freelancer" nav={freelancerNav} title="Freelancer Dashboard" breadcrumb={["Freelancer", "Dashboard"]}>
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 p-8 text-black shadow-xl">
          <div className="relative z-10 max-w-2xl space-y-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-black/15 px-3 py-1 text-xs font-black uppercase tracking-wider backdrop-blur-md">
              <ShieldCheck className="size-4" /> Freelancer Portal
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.name || "Freelancer"}!
            </h1>
            <p className="text-sm font-medium opacity-90">
              Welcome to your Freelancer portal. Manage your vehicle submissions and track evaluation approvals.
            </p>
          </div>
        </div>

        {/* 4 Stat Cards: Draft, Submitted, Approved, Rejected */}
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Draft Inspections"
            value={loading ? "..." : stats.draftCount.toString()}
            delta="In progress & saved drafts"
            icon={FileText}
            accent
          />
          <StatCard
            label="Submitted Inspections"
            value={loading ? "..." : stats.submittedCount.toString()}
            delta="Awaiting admin approval"
            icon={Upload}
          />
          <StatCard
            label="Approved Inspections"
            value={loading ? "..." : stats.approvedCount.toString()}
            delta="Live in marketplace"
            icon={CheckCircle2}
          />
          <StatCard
            label="Rejected Inspections"
            value={loading ? "..." : stats.rejectedCount.toString()}
            delta="Needs photo / data revision"
            icon={XCircle}
          />
        </div>

        {/* Start a new inspection Panel */}
        <Panel
          title="Start a new vehicle submission"
          description="Capture vehicle specs, basic images and walkaround video."
          action={
            <Link
              to="/freelancer/add-vehicle"
              className="rounded-2xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 cursor-pointer"
            >
              Add vehicle
            </Link>
          }
        >
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["1. Vehicle Details", "Registration, owner, insurance and basic spec capture."],
              ["2. Basic Photos", "Upload up to 10 photos of exterior, interior & documents."],
              ["3. Video & Submit", "Upload 1 walkaround video and submit for admin approval."],
            ].map(([t, d]) => (
              <div key={t} className="rounded-2xl border border-border bg-secondary p-5">
                <p className="text-sm font-medium">{t}</p>
                <p className="mt-2 text-xs text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
        </Panel>

        {/* Recent Uploads */}
        <Panel title="Recent Uploads">
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : vehicles.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center text-center">
              <p className="text-sm font-semibold text-muted-foreground">No vehicles uploaded yet.</p>
              <p className="text-xs text-muted-foreground mt-1">Start by clicking "Add vehicle" to create your first submission.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {vehicles.slice(0, 5).map((v, idx) => (
                <li key={v.id || v.inspectionId || idx} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                  <div>
                    <p className="text-sm font-bold text-foreground">{v.brand} {v.model} {v.variant}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{v.regNo || v.registrationNumber || v.vehicleNumber} • Expected: ₹{(v.price || v.suggestedPrice || 0).toLocaleString()}</p>
                  </div>
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold capitalize text-muted-foreground">
                    {v.status || "Pending"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </AppShell>
  );
}
