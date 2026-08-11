import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, FileText, Upload, XCircle } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { inspectorNav } from "@/components/nav-config";
import { Panel, StatCard, StatusChip } from "@/components/premium";
import { getMyInspections, getInspectorStats, type InspectionSummary } from "@/lib/api/inspector-api";
import { inr } from "@/lib/mock-data";
import { toast } from "sonner";
import { formatIndianDateTime } from "@/lib/utils";

export function InspectorDashboard() {
  const [inspections, setInspections] = useState<InspectionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayInspections: 0,
    pendingUploads: 0,
    completedReports: 0,
    vehiclesSubmitted: 0,
  });

  useEffect(() => {
    const fetchInspections = async () => {
      setLoading(true);
      try {
        const res = await getMyInspections();
        if (res.success && res.data) {
          const sorted = [...res.data].sort((a: any, b: any) => b.inspectionId - a.inspectionId);
          setInspections(sorted);
          
          // Calculate fallback counts locally from inspections list
          const pending = res.data.filter(
            (ins) => ins.status === "DRAFT" || ins.status === "IN_PROGRESS"
          ).length;
          const completed = res.data.filter(
            (ins) => ins.status === "SUBMITTED" || ins.status === "APPROVED" || ins.status === "REJECTED"
          ).length;
          const submitted = res.data.filter(
            (ins) => ins.status !== "DRAFT" && ins.status !== "IN_PROGRESS"
          ).length;
          const today = res.data.filter((ins) => {
            if (!ins.submittedAt) return ins.status === "DRAFT" || ins.status === "IN_PROGRESS";
            const date = new Date(ins.submittedAt);
            const now = new Date();
            return (
              date.getDate() === now.getDate() &&
              date.getMonth() === now.getMonth() &&
              date.getFullYear() === now.getFullYear()
            );
          }).length;

          setStats({
            todayInspections: today,
            pendingUploads: pending,
            completedReports: completed,
            vehiclesSubmitted: submitted,
          });
        }

        // Now attempt to query the backend API statistics endpoint directly
        try {
          const statsRes = await getInspectorStats();
          if (statsRes.success && statsRes.data) {
            setStats({
              todayInspections: statsRes.data.todayInspections,
              pendingUploads: statsRes.data.pendingUploads,
              completedReports: statsRes.data.completedReports,
              vehiclesSubmitted: statsRes.data.vehiclesSubmitted,
            });
          }
        } catch (statsErr) {
          console.warn("Failed to fetch stats from API, using client calculation fallback", statsErr);
        }
      } catch (err: any) {
        console.error("Failed to load dashboard inspections", err);
        toast.error("Could not retrieve inspection stats.");
      } finally {
        setLoading(false);
      }
    };
    fetchInspections();
  }, []);

  // Dynamically generate recent activity logs
  const dynamicActivity = inspections
    .filter((ins) => ins.status !== "DRAFT" && ins.status !== "IN_PROGRESS")
    .map((ins) => {
      let title = "";
      const carName = `${ins.brand || ""} ${ins.model || ""} ${ins.variant || ""}`.trim();
      const time = formatIndianDateTime(ins.submittedAt);

      if (ins.status === "APPROVED") {
        title = `Inspection for ${carName} was approved`;
      } else if (ins.status === "REJECTED") {
        title = `Inspection for ${carName} was rejected`;
      } else if (ins.status === "SUBMITTED") {
        title = `Submitted inspection for ${carName}`;
      }

      return { title, time, status: ins.status };
    })
    .slice(0, 4);

  const fallbackCarImage = "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=200&q=80&sat=-100";

  const draftCount = inspections.filter(
    (ins) => ins.status === "DRAFT" || ins.status === "IN_PROGRESS"
  ).length;

  const submittedCount = inspections.filter(
    (ins) => ins.status === "SUBMITTED"
  ).length;

  const approvedCount = inspections.filter(
    (ins) => ins.status === "APPROVED"
  ).length;

  const rejectedCount = inspections.filter(
    (ins) => ins.status === "REJECTED"
  ).length;

  return (
    <AppShell
      role="inspector"
      nav={inspectorNav}
      title="Inspection Overview"
      breadcrumb={["Inspector", "Dashboard"]}
    >
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard 
          label="Draft Inspections" 
          value={loading ? "..." : draftCount.toString()} 
          delta="In progress & saved drafts" 
          icon={FileText} 
          accent 
        />
        <StatCard 
          label="Submitted Inspections" 
          value={loading ? "..." : submittedCount.toString()} 
          delta="Awaiting admin approval" 
          icon={Upload} 
        />
        <StatCard 
          label="Approved Inspections" 
          value={loading ? "..." : approvedCount.toString()} 
          delta="Live in marketplace" 
          icon={CheckCircle2} 
        />
        <StatCard 
          label="Rejected Inspections" 
          value={loading ? "..." : rejectedCount.toString()} 
          delta="Needs photo / data revision" 
          icon={XCircle} 
        />
      </div>

      <Panel
        title="Start a new inspection"
        description="Capture vehicle details, images and the 200-point report."
        action={
          <Link
            to="/inspector/add-vehicle"
            className="rounded-2xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 cursor-pointer"
          >
            Add vehicle
          </Link>
        }
      >
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ["1. Vehicle details", "RC, insurance, owner and specification capture."],
            ["2. Condition & media", "Upload multiple images with drag & drop preview."],
            ["3. Report & submit", "Attach the PDF report and submit to admin."],
          ].map(([t, d]) => (
            <div key={t} className="rounded-2xl border border-border bg-secondary p-5">
              <p className="text-sm font-medium">{t}</p>
              <p className="mt-2 text-xs text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Recent uploads" className="xl:col-span-2">
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : inspections.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center text-center">
              <p className="text-sm font-semibold text-muted-foreground">No inspections uploaded yet.</p>
              <p className="text-xs text-muted-foreground mt-1">Start by clicking "Add vehicle" to create your first report.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {inspections.slice(0, 5).map((v) => {
                const s = (v.status || "").toUpperCase();
                let chipStatus = "draft";
                if (s === "APPROVED") chipStatus = "approved";
                else if (s === "REJECTED") chipStatus = "rejected";
                else if (s === "SUBMITTED") chipStatus = "submitted";
                else if (s === "DRAFT" || s === "IN_PROGRESS") chipStatus = "draft";

                return (
                  <li key={v.inspectionId} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                    {v.vehicleImage ? (
                      <img
                        src={v.vehicleImage}
                        alt=""
                        loading="lazy"
                        className="size-14 shrink-0 rounded-2xl object-cover shadow-soft"
                      />
                    ) : (
                      <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-secondary text-base font-extrabold text-muted-foreground border border-border shadow-soft uppercase">
                        {((v.brand || "").slice(0, 1) + (v.model || "").slice(0, 1)) || "VE"}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-bold text-foreground">
                          {v.brand} {v.model} {v.variant}
                        </p>
                        <span className="text-[10px] font-bold text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-md">
                          #{v.inspectionId}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {v.vehicleNumber} · suggested {v.suggestedPrice ? inr(v.suggestedPrice) : "N/A"} · Inspector: {v.inspectorName}
                      </p>
                    </div>
                    {v.status === "DRAFT" || v.status === "IN_PROGRESS" ? (
                      <Link
                        to={`/inspector/add-vehicle?id=${v.inspectionId}`}
                        className="text-xs font-extrabold text-[#FFC700] bg-[#FFC700]/10 border border-[#FFC700]/30 rounded-xl px-3 py-1.5 hover:bg-[#FFC700] hover:text-[#0D0E12] transition-all whitespace-nowrap"
                      >
                        Edit Draft
                      </Link>
                    ) : (
                      <StatusChip status={chipStatus} />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel title="Activity">
          {dynamicActivity.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center text-center">
              <p className="text-xs font-semibold text-muted-foreground">No recent activity.</p>
            </div>
          ) : (
            <ol className="space-y-5">
              {dynamicActivity.map((a, idx) => {
                let dotClass = "bg-muted-foreground";
                if (a.status === "APPROVED") dotClass = "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]";
                else if (a.status === "REJECTED") dotClass = "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]";
                else if (a.status === "SUBMITTED") dotClass = "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]";

                return (
                  <li key={idx} className="relative pl-6">
                    <span className={`absolute top-1.5 left-0 size-2 rounded-full ${dotClass}`} />
                    <p className="text-sm font-extrabold text-foreground">{a.title}</p>
                    <p className="text-[10px] font-bold text-muted-foreground mt-0.5">{a.time}</p>
                  </li>
                );
              })}
            </ol>
          )}
        </Panel>
      </div>
    </AppShell>
  );
}
