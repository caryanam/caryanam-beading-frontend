import { useEffect, useState } from "react";
import { Download, FileText } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { adminNav } from "@/components/nav-config";
import { Panel, StatusChip } from "@/components/premium";
import { getSubmittedInspections, downloadAdminInspectionPdf, type AdminInspectionSummary } from "@/lib/api/admin-api";
import { API_BASE_URL } from "@/lib/api";

export function AdminReports() {
  const [inspections, setInspections] = useState<AdminInspectionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const res = await getSubmittedInspections();
        if (res.success && res.data) {
          // Exclude drafts
          const nonDrafts = res.data.filter(
            (ins: any) => ins.status !== "DRAFT" && ins.status !== "IN_PROGRESS"
          );
          setInspections(nonDrafts);
        }
      } catch (err: any) {
        console.error("Failed to load reports", err);
        toast.error("Could not load reports list.");
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const downloadReport = (id: number) => {
    const pdfUrl = `${API_BASE_URL}/api/admin/inspection/${id}/pdf`;
    window.open(pdfUrl, "_blank");
    toast.success("Opening PDF report in new tab...");
  };

  return (
    <AppShell
      role="admin"
      nav={adminNav}
      title="Inspection Reports"
      breadcrumb={["Admin", "Inspection Reports"]}
    >
      {loading ? (
        <div className="flex h-60 items-center justify-center bg-card border border-border rounded-3xl shadow-soft">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : inspections.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-16 text-center shadow-soft w-full">
          <p className="font-extrabold text-foreground text-lg">No inspection reports submitted yet.</p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {inspections.map((v) => (
            <Panel key={v.inspectionId} className="card-lift">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-sm text-foreground">
                    {v.brand} {v.model}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {v.vehicleNumber} · {v.inspectorName}
                  </p>
                </div>
                <StatusChip status={v.status} />
              </div>
              <div className="mt-6 flex items-center gap-4 rounded-2xl border border-border bg-secondary p-5">
                <FileText className="size-8 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">inspection-{v.inspectionId}.pdf</p>
                  <p className="text-xs text-muted-foreground mt-0.5">200-point report · 2.4 MB</p>
                </div>
              </div>
              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => downloadReport(v.inspectionId)}
                  className="flex-1 rounded-2xl border border-border py-2.5 text-xs font-bold hover:bg-secondary cursor-pointer transition-colors"
                >
                  Preview
                </button>
                <button
                  onClick={() => downloadReport(v.inspectionId)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary py-2.5 text-xs font-bold text-primary-foreground hover:opacity-90 cursor-pointer transition-opacity"
                >
                  <Download className="size-4" /> Download PDF
                </button>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </AppShell>
  );
}
