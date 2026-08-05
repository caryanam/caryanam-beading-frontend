import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/app-shell";
import { inspectorNav } from "@/components/nav-config";
import { DataTable, type Column } from "@/components/data-table";
import { StatusChip } from "@/components/premium";
import {
  getMyInspections,
  getInspectionDetails,
  deleteInspectionDraft,
  type InspectionSummary,
} from "@/lib/api/inspector-api";
import { toast } from "sonner";
import { Trash2, Edit3, Download, Eye, X, CheckCircle2, AlertCircle } from "lucide-react";
import { inr } from "@/lib/mock-data";
import { API_BASE_URL } from "@/lib/api";

export function InspectorVehicles() {
  const [inspections, setInspections] = useState<InspectionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("All");

  const [previewId, setPreviewId] = useState<number | null>(null);
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const fetchInspections = async () => {
    setLoading(true);
    try {
      const res = await getMyInspections();
      if (res.success && res.data) {
        const processed = res.data.map((item) => ({
          ...item,
          ownerName: item.ownerName || "1st Owner",
          vehicleName: `${item.brand || ""} ${item.model || ""} ${item.variant || ""}`.trim(),
        }));
        setInspections(processed);
      }
    } catch (err: any) {
      console.error("Failed to load inspections table", err);
      toast.error("Could not load vehicles list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInspections();
  }, []);

  const openPreview = async (id: number) => {
    setPreviewId(id);
    setPreviewData(null);
    setLoadingPreview(true);
    try {
      const res = await getInspectionDetails(id);
      if (res.success && res.data) {
        setPreviewData(res.data);
      }
    } catch (err) {
      toast.error("Failed to load inspection details for preview.");
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this inspection draft? This action is permanent.")) {
      return;
    }
    try {
      const res = await deleteInspectionDraft(id);
      if (res.success) {
        toast.success("Inspection draft deleted successfully.");
        fetchInspections();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete draft.");
    }
  };

  const columns: Column<InspectionSummary>[] = [
    {
      key: "inspectionId",
      header: "ID",
      cell: (v) => <span className="font-extrabold text-xs">#{v.inspectionId}</span>,
    },
    {
      key: "vehicle",
      header: "Vehicle Details",
      cell: (v) => (
        <div className="min-w-0">
          <p className="truncate font-bold text-sm text-foreground">
            {v.brand} {v.model} {v.variant}
          </p>
          <p className="text-xs text-muted-foreground">{v.vehicleNumber}</p>
        </div>
      ),
    },
    { key: "ownerName", header: "Owner", cell: (v) => v.ownerName || "1st Owner" },
    {
      key: "suggestedPrice",
      header: "Suggested Price",
      cell: (v) => (v.suggestedPrice ? inr(v.suggestedPrice) : "N/A"),
    },
    {
      key: "submittedAt",
      header: "Submitted On",
      cell: (v) =>
        v.submittedAt
          ? new Date(v.submittedAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "Not Submitted",
    },
    {
      key: "status",
      header: "Status",
      cell: (v) => {
        let chipStatus: any = "pending";
        if (v.status === "APPROVED") chipStatus = "approved";
        else if (v.status === "REJECTED") chipStatus = "rejected";
        else if (v.status === "DRAFT") chipStatus = "draft";
        else if (v.status === "SUBMITTED") chipStatus = "submitted";
        return (
          <div className="flex flex-col gap-1">
            <StatusChip status={chipStatus} />
            {v.status === "REJECTED" && v.rejectionReason && (
              <span className="text-[10px] font-extrabold text-rose-500 max-w-[140px] leading-tight mt-0.5">
                Reason: {v.rejectionReason}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "actions" as any,
      header: "Actions",
      cell: (v) => {
        const canEdit = v.status !== "APPROVED"; // Draft, Submitted, Rejected can be edited to correct/resubmit
        const canDelete = v.status === "DRAFT" || v.status === "REJECTED";

        return (
          <div className="flex items-center gap-1.5">
            {/* 1. Preview Action */}
            <button
              onClick={() => openPreview(v.inspectionId)}
              className="grid size-8 place-items-center rounded-xl bg-card border border-border text-foreground hover:border-[#FFC700] hover:text-[#FFC700] transition-colors shadow-soft cursor-pointer"
              title="Preview Inspection Report"
            >
              <Eye className="size-3.5" />
            </button>

            {/* 2. Edit Action */}
            {canEdit && (
              <Link
                to={`/inspector/add-vehicle?id=${v.inspectionId}`}
                className="grid size-8 place-items-center rounded-xl bg-card border border-border text-foreground hover:border-[#FFC700] hover:text-[#FFC700] transition-colors shadow-soft"
                title={v.status === "REJECTED" ? "Correct & Resubmit Report" : "Edit Inspection"}
              >
                <Edit3 className="size-3.5 text-[#FFC700]" />
              </Link>
            )}

            {/* 3. PDF Download Action */}
            <a
              href={`${API_BASE_URL}/api/inspector/inspection/${v.inspectionId}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded-xl border border-border bg-card px-2.5 py-1.5 text-xs font-extrabold text-foreground hover:border-[#FFC700] hover:text-[#FFC700] transition-colors shadow-soft"
              title="Download PDF Report"
            >
              <Download className="size-3.5" />
            </a>

            {/* 4. Delete Action */}
            {canDelete && (
              <button
                onClick={() => handleDelete(v.inspectionId)}
                className="grid size-8 place-items-center rounded-xl bg-card border border-border text-rose-500 hover:border-rose-500/50 hover:bg-rose-500/10 transition-colors shadow-soft cursor-pointer"
                title="Delete Draft"
              >
                <Trash2 className="size-3.5" />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  const filteredInspections = inspections.filter((v) => {
    if (statusFilter === "All") return true;
    if (statusFilter === "Draft") {
      return v.status === "DRAFT" || v.status === "IN_PROGRESS";
    }
    return v.status.toUpperCase() === statusFilter.toUpperCase();
  });

  const actionButtons = (
    <div className="flex items-center gap-2">
      {["All", "Draft", "Submitted", "Approved", "Rejected"].map((status) => {
        const active = statusFilter === status;
        return (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`rounded-2xl border px-3.5 py-2 text-xs font-extrabold transition-all cursor-pointer ${
              active
                ? "bg-[#FFC700] border-[#FFC700] text-[#0D0E12] shadow-sm"
                : "border-border bg-card text-foreground hover:bg-secondary"
            }`}
          >
            {status}
          </button>
        );
      })}
    </div>
  );

  return (
    <AppShell
      role="inspector"
      nav={inspectorNav}
      title="My Vehicles"
      breadcrumb={["Inspector", "My Vehicles"]}
    >
      {loading ? (
        <div className="flex h-60 items-center justify-center bg-card border border-border rounded-3xl shadow-soft">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <DataTable
          rows={filteredInspections}
          columns={columns}
          searchKeys={["vehicleName", "vehicleNumber", "ownerName"]}
          placeholder="Search by vehicle name, owner name..."
          actions={actionButtons}
        />
      )}

      {/* Inspection Preview Modal */}
      {previewId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl max-h-[90vh] rounded-3xl border border-border bg-card p-6 shadow-2xl overflow-y-auto no-scrollbar animate-in fade-in-50 zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h2 className="text-lg font-black text-foreground">
                  Inspection Preview #{previewId}
                </h2>
                <p className="text-xs font-semibold text-muted-foreground">
                  Review submitted data & vehicle details
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`${API_BASE_URL}/api/inspector/inspection/${previewId}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-xl bg-[#FFC700] text-[#0D0E12] px-3.5 py-1.5 text-xs font-extrabold shadow-sm hover:bg-[#FFD633] transition-all"
                >
                  <Download className="size-3.5" /> PDF Report
                </a>
                <button
                  onClick={() => setPreviewId(null)}
                  className="rounded-xl border border-border bg-card p-2 text-foreground hover:bg-secondary transition-all"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {loadingPreview ? (
              <div className="flex h-60 items-center justify-center">
                <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : !previewData ? (
              <div className="py-12 text-center text-muted-foreground">
                Failed to load inspection details.
              </div>
            ) : (
              <div className="mt-6 space-y-6">
                {/* Status Alert Banner */}
                {previewData.status === "REJECTED" && (
                  <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-500 flex items-start gap-3">
                    <AlertCircle className="size-5 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-extrabold text-sm">Report Rejected by Admin</p>
                      <p className="text-xs font-semibold mt-1">
                        Reason: {previewData.rejectionReason || "Please verify details."}
                      </p>
                      <Link
                        to={`/inspector/add-vehicle?id=${previewId}`}
                        onClick={() => setPreviewId(null)}
                        className="inline-flex items-center gap-1.5 mt-2.5 rounded-xl bg-rose-500 text-white px-3 py-1 text-xs font-extrabold shadow-sm"
                      >
                        <Edit3 className="size-3" /> Correct & Resubmit
                      </Link>
                    </div>
                  </div>
                )}

                {/* 1. Vehicle & Customer Details */}
                <div className="rounded-2xl border border-border bg-secondary/30 p-4">
                  <h3 className="text-xs font-black uppercase text-[#FFC700] tracking-wider mb-3">
                    1. Customer & Vehicle Overview
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[10px] font-bold">Customer Name</span>
                      <span className="font-extrabold text-foreground">
                        {previewData.vehicleDetails?.customerName || previewData.vehicleDetails?.ownerName || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px] font-bold">Customer Mobile</span>
                      <span className="font-extrabold text-foreground">
                        {previewData.vehicleDetails?.customerMobileNumber || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px] font-bold">Registration No</span>
                      <span className="font-extrabold text-foreground">
                        {previewData.vehicleDetails?.vehicleNumber || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px] font-bold">Make & Model</span>
                      <span className="font-extrabold text-foreground">
                        {previewData.vehicleDetails?.brand} {previewData.vehicleDetails?.model} {previewData.vehicleDetails?.variant}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px] font-bold">Manufacturing Year</span>
                      <span className="font-extrabold text-foreground">
                        {previewData.vehicleDetails?.manufacturingYear || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px] font-bold">Fuel & Transmission</span>
                      <span className="font-extrabold text-foreground">
                        {previewData.vehicleDetails?.fuelType} / {previewData.vehicleDetails?.transmission}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px] font-bold">Odometer Reading</span>
                      <span className="font-extrabold text-foreground">
                        {previewData.vehicleDetails?.odometerReading ? `${previewData.vehicleDetails.odometerReading} km` : "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px] font-bold">Insurance Status</span>
                      <span className="font-extrabold text-foreground">
                        {previewData.vehicleDetails?.insuranceStatus || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px] font-bold">Suggested Price</span>
                      <span className="font-extrabold text-[#FFC700]">
                        {previewData.vehicleDetails?.suggestedPrice ? inr(previewData.vehicleDetails.suggestedPrice) : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Rating Breakdown */}
                {previewData.ratings && (
                  <div className="rounded-2xl border border-border bg-secondary/30 p-4">
                    <h3 className="text-xs font-black uppercase text-[#FFC700] tracking-wider mb-3">
                      2. Section Performance Ratings
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                      <div className="rounded-xl border border-border bg-card p-3">
                        <span className="text-[10px] font-bold text-muted-foreground block">Exterior</span>
                        <span className="text-lg font-black text-amber-500">{previewData.ratings.exterior} / 5.0</span>
                      </div>
                      <div className="rounded-xl border border-border bg-card p-3">
                        <span className="text-[10px] font-bold text-muted-foreground block">Mechanical</span>
                        <span className="text-lg font-black text-amber-500">{previewData.ratings.mechanical} / 5.0</span>
                      </div>
                      <div className="rounded-xl border border-border bg-card p-3">
                        <span className="text-[10px] font-bold text-muted-foreground block">Tyres</span>
                        <span className="text-lg font-black text-amber-500">{previewData.ratings.tyre} / 5.0</span>
                      </div>
                      <div className="rounded-xl border border-border bg-card p-3">
                        <span className="text-[10px] font-bold text-muted-foreground block">Interior</span>
                        <span className="text-lg font-black text-amber-500">{previewData.ratings.interior} / 5.0</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Exterior Panel Inspection */}
                {previewData.exteriorPanelDetails && (
                  <div className="rounded-2xl border border-border bg-secondary/30 p-4">
                    <h3 className="text-xs font-black uppercase text-[#FFC700] tracking-wider mb-3">
                      3. Exterior Panel Inspection
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {previewData.exteriorPanelDetails.map((p: any, idx: number) => {
                        const cond = p.condition || "OK";
                        let colorClass = "text-emerald-500 bg-emerald-500/10 border-emerald-500/30";
                        if (cond === "REPAINTED" || cond === "CHANGED" || cond === "SCRATCH" || cond === "DENT") {
                          colorClass = "text-amber-500 bg-amber-500/10 border-amber-500/30";
                        } else if (cond === "DAMAGED" || cond === "RUST") {
                          colorClass = "text-rose-500 bg-rose-500/10 border-rose-500/30";
                        }

                        return (
                          <div key={idx} className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card p-2.5">
                            <span className="text-xs font-extrabold text-foreground truncate">{p.panelName}</span>
                            <span className={`rounded-lg border px-2 py-0.5 text-[10px] font-black uppercase ${colorClass}`}>
                              {cond}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Footer Action */}
                <div className="pt-2 text-right">
                  <Link
                    to={`/inspector/add-vehicle?id=${previewId}`}
                    onClick={() => setPreviewId(null)}
                    className="inline-flex items-center gap-2 rounded-2xl bg-[#FFC700] hover:bg-[#FFD633] text-[#0D0E12] px-5 py-2.5 text-xs font-black shadow-sm transition-all"
                  >
                    <Edit3 className="size-4" /> Edit & Update Report
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
