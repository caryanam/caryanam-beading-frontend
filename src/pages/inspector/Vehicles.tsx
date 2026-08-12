import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AppShell } from "@/components/app-shell";
import { inspectorNav } from "@/components/nav-config";
import { DataTable, type Column } from "@/components/data-table";
import { StatusChip, Panel } from "@/components/premium";
import { ConfirmModal } from "@/components/confirm-modal";
import { cn, formatIndianDateTime } from "@/lib/utils";
import {
  getMyInspections,
  getInspectionDetails,
  deleteInspectionDraft,
  downloadInspectorInspectionPdf,
  type InspectionSummary,
} from "@/lib/api/inspector-api";
import { toast } from "sonner";
import {
  Trash2, Edit3, Download, Eye, X, CheckCircle2, AlertCircle, ArrowLeft,
  Car, ShieldCheck, ClipboardCheck, Wrench, Disc, Zap, Camera, CheckCircle,
  ChevronRight, Star, Loader2
} from "lucide-react";
import { inr } from "@/lib/mock-data";
import { API_BASE_URL } from "@/lib/api";

export function InspectorVehicles() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [inspections, setInspections] = useState<InspectionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("All");

  const [previewId, setPreviewId] = useState<number | null>(null);
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [activeDetailStep, setActiveDetailStep] = useState(0);
  const [downloadingPdfId, setDownloadingPdfId] = useState<number | null>(null);

  const handleDownloadPdf = async (id: number) => {
    setDownloadingPdfId(id);
    try {
      await downloadInspectorInspectionPdf(id);
    } catch (err: any) {
      console.error(err);
    } finally {
      setDownloadingPdfId(null);
    }
  };

  const detailSteps = [
    { title: "Vehicle Specs", subtitle: "Basic registration & owner details" },
    { title: "Exterior Body", subtitle: "32-point panel & side photos" },
    { title: "Mechanical", subtitle: "Engine, oil & motor bay photos" },
    { title: "Tyres Specifications", subtitle: "Remaining tread depth % & toolkit" },
    { title: "Interior & Electrical", subtitle: "Cabin, electrical & remarks" },
  ];

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

  const previewParam = searchParams.get("id") || searchParams.get("preview");

  useEffect(() => {
    if (previewParam) {
      const idNum = Number(previewParam);
      if (!isNaN(idNum) && idNum !== previewId) {
        openPreview(idNum, false);
      }
    }
  }, [previewParam]);

  const openPreview = async (id: number, updateUrl = true) => {
    setPreviewId(id);
    setActiveDetailStep(0);
    if (updateUrl) {
      setSearchParams({ id: String(id) });
    }
    setPreviewData(null);
    setLoadingPreview(true);
    try {
      const res = await getInspectionDetails(id);
      if (res.success && res.data) {
        setPreviewData(res.data);
      }
    } catch (err) {
      toast.error("Failed to load inspection details.");
    } finally {
      setLoadingPreview(false);
    }
  };

  const closeDetailView = () => {
    setPreviewId(null);
    setPreviewData(null);
    setSearchParams({});
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);
    try {
      const res = await deleteInspectionDraft(deleteTargetId);
      if (res.success) {
        toast.success("Inspection draft deleted successfully.");
        fetchInspections();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete draft.");
    } finally {
      setDeleting(false);
      setDeleteTargetId(null);
    }
  };

  const columns: Column<InspectionSummary>[] = [
    {
      key: "inspectionId",
      header: "ID",
      cell: (_, idx) => <span className="font-extrabold text-xs">#{idx}</span>,
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
          ? formatIndianDateTime(v.submittedAt)
          : "Not Submitted",
    },
    {
      key: "status",
      header: "Status",
      cell: (v) => {
        const s = (v.status || "").toUpperCase();
        let chipStatus = "draft";
        if (s === "APPROVED") chipStatus = "approved";
        else if (s === "REJECTED") chipStatus = "rejected";
        else if (s === "SUBMITTED") chipStatus = "submitted";
        else if (s === "DRAFT" || s === "IN_PROGRESS") chipStatus = "draft";

        return (
          <div className="flex flex-col gap-1">
            <StatusChip status={chipStatus} />
            {s === "REJECTED" && v.rejectionReason && (
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
        const canEdit = v.status !== "APPROVED"; 
        const canDelete = v.status === "DRAFT" || v.status === "REJECTED";

        return (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => openPreview(v.inspectionId)}
              className="grid size-8 place-items-center rounded-xl bg-card border border-border text-foreground hover:border-[#FFC700] hover:text-[#FFC700] transition-colors shadow-soft cursor-pointer"
              title="Preview Inspection Report"
            >
              <Eye className="size-3.5" />
            </button>

            {canEdit && (
              <Link
                to={`/inspector/add-vehicle?id=${v.inspectionId}`}
                className="grid size-8 place-items-center rounded-xl bg-card border border-border text-foreground hover:border-[#FFC700] hover:text-[#FFC700] transition-colors shadow-soft"
                title={v.status === "REJECTED" ? "Correct & Resubmit Report" : "Edit Inspection"}
              >
                <Edit3 className="size-3.5 text-[#FFC700]" />
              </Link>
            )}

            <button
              type="button"
              disabled={downloadingPdfId === v.inspectionId}
              onClick={() => handleDownloadPdf(v.inspectionId)}
              className="flex items-center gap-1 rounded-xl border border-border bg-card px-2.5 py-1.5 text-xs font-extrabold text-foreground hover:border-[#FFC700] hover:text-[#FFC700] transition-colors shadow-soft cursor-pointer disabled:opacity-50"
              title="Download PDF Report"
            >
              {downloadingPdfId === v.inspectionId ? (
                <Loader2 className="size-3.5 animate-spin text-[#FFC700]" />
              ) : (
                <Download className="size-3.5" />
              )}
            </button>

            {canDelete && (
              <button
                onClick={() => setDeleteTargetId(v.inspectionId)}
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

  const getStatusCount = (status: string) => {
    if (status === "All") return inspections.length;
    if (status === "Draft") {
      return inspections.filter((v) => v.status === "DRAFT" || v.status === "IN_PROGRESS").length;
    }
    return inspections.filter((v) => v.status.toUpperCase() === status.toUpperCase()).length;
  };

  const actionButtons = (
    <div className="flex flex-wrap items-center gap-2">
      {["All", "Draft", "Submitted", "Approved", "Rejected"].map((status) => {
        const active = statusFilter === status;
        const count = getStatusCount(status);
        return (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`rounded-2xl border px-3.5 py-2 text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${active
              ? "bg-[#FFC700] border-[#FFC700] text-[#0D0E12] shadow-sm"
              : "border-border bg-card text-foreground hover:bg-secondary"
              }`}
          >
            <span>{status}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-black ${active
                ? "bg-[#0D0E12]/15 text-[#0D0E12]"
                : "bg-secondary text-muted-foreground"
                }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );

  return (
    <AppShell
      role="inspector"
      nav={inspectorNav}
      title={
        previewId !== null
          ? previewData?.vehicleDetails
            ? `${previewData.vehicleDetails.brand || ""} ${previewData.vehicleDetails.model || ""} Inspection Detail`
            : `Inspection #${previewId}`
          : "My Vehicles"
      }
      breadcrumb={
        previewId !== null
          ? ["Inspector", "My Vehicles", `Inspection #${previewId}`]
          : ["Inspector", "My Vehicles"]
      }
    >
      {previewId === null ? (
        loading ? (
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
        )
      ) : (
        <div className="space-y-6">
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <button
                onClick={closeDetailView}
                className="inline-flex items-center justify-center size-10 rounded-2xl border border-border bg-secondary/50 text-foreground hover:bg-secondary hover:border-[#FFC700] transition-all cursor-pointer shadow-sm shrink-0"
                title="Back to My Vehicles"
              >
                <ArrowLeft className="size-5 text-[#FFC700]" />
              </button>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-black text-foreground tracking-tight">
                    {previewData?.vehicleDetails?.brand} {previewData?.vehicleDetails?.model} {previewData?.vehicleDetails?.variant}
                  </h2>
                  <span className="rounded-lg bg-secondary border border-border px-2.5 py-0.5 text-xs font-extrabold text-foreground">
                    {previewData?.vehicleDetails?.vehicleNumber || `#${previewId}`}
                  </span>
                  {previewData?.status && (
                    <StatusChip status={previewData.status} />
                  )}
                </div>
                <p className="text-xs font-semibold text-muted-foreground mt-1">
                  Inspection Report  • Submitted on {previewData?.submittedAt ? formatIndianDateTime(previewData.submittedAt) : "Draft"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">

              <button
                type="button"
                disabled={previewId !== null && downloadingPdfId === previewId}
                onClick={() => previewId && handleDownloadPdf(previewId)}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#FFC700] hover:bg-[#FFD633] text-[#0D0E12] px-4 py-2.5 text-xs font-black shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {previewId !== null && downloadingPdfId === previewId ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Generating PDF...
                  </>
                ) : (
                  <>
                    <Download className="size-4" /> Download PDF Report
                  </>
                )}
              </button>
              <Link
                to={`/inspector/add-vehicle?id=${previewId}`}
                className="inline-flex items-center gap-2 rounded-2xl border border-border bg-secondary/60 hover:bg-secondary text-foreground px-4 py-2.5 text-xs font-black shadow-sm transition-all"
              >
                <Edit3 className="size-4 text-[#FFC700]" /> Edit & Update
              </Link>
            </div>
          </div>

          {loadingPreview ? (
            <div className="flex h-60 items-center justify-center bg-card border border-border rounded-3xl shadow-soft">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : !previewData ? (
            <div className="rounded-3xl border border-border bg-card p-12 text-center text-muted-foreground">
              Failed to load inspection details.
            </div>
          ) : (
            <div className="space-y-8">
              {/* Status Alert Banner */}
              {previewData.status === "REJECTED" && (
                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 text-rose-500 flex items-start gap-3">
                  <AlertCircle className="size-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-extrabold text-sm">Report Rejected by Admin</p>
                    <p className="text-xs font-semibold mt-1">
                      Reason: {previewData.rejectionReason || "Please verify details."}
                    </p>
                    <Link
                      to={`/inspector/add-vehicle?id=${previewId}`}
                      className="inline-flex items-center gap-1.5 mt-3 rounded-xl bg-rose-500 text-white px-3.5 py-1.5 text-xs font-extrabold shadow-sm hover:bg-rose-600 transition-all"
                    >
                      <Edit3 className="size-3.5" /> Correct & Resubmit
                    </Link>
                  </div>
                </div>
              )}

              {/* 5-Step Stepper Indicator Bar (Matches AddVehicle.tsx) */}
              <div className="grid gap-3 sm:grid-cols-5">
                {detailSteps.map((s, idx) => {
                  const isActive = idx === activeDetailStep;
                  const isDone = idx < activeDetailStep;
                  return (
                    <div
                      key={s.title}
                      onClick={() => setActiveDetailStep(idx)}
                      className={cn(
                        "rounded-2xl border p-4 shadow-soft transition-all duration-200 cursor-pointer",
                        isActive
                          ? "border-[#FFC700] bg-card shadow-md ring-2 ring-[#FFC700]/30"
                          : isDone
                            ? "border-[#FFC700]/40 bg-card/60"
                            : "border-border bg-card/40 opacity-70",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "flex size-7 items-center justify-center rounded-xl text-xs font-black transition-colors",
                            isActive
                              ? "bg-[#FFC700] text-[#0D0E12]"
                              : isDone
                                ? "bg-[#FFC700]/20 text-[#FFC700]"
                                : "bg-secondary text-muted-foreground",
                          )}
                        >
                          {isDone ? <CheckCircle2 className="size-4" /> : idx + 1}
                        </div>
                        <span className="text-xs font-extrabold text-foreground">
                          {s.title}
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-1 text-[11px] font-semibold text-muted-foreground">
                        {s.subtitle}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* STEP 1: Vehicle Specs */}
              {activeDetailStep === 0 && (
                <div className="space-y-8">
                  <Panel
                    title="Step 1: Vehicle Specs & Registration"
                    description="Owner details, car registration, manufacturing year, and valuation."
                  >
                    <div className="grid gap-4.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                      <div className="rounded-2xl border border-border bg-secondary/30 p-4">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Customer Name</span>
                        <span className="font-extrabold text-foreground text-sm">{previewData.vehicleDetails?.customerName || "N/A"}</span>
                      </div>
                      <div className="rounded-2xl border border-border bg-secondary/30 p-4">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Customer Mobile</span>
                        <span className="font-extrabold text-foreground text-sm">{previewData.vehicleDetails?.customerMobileNumber || "N/A"}</span>
                      </div>
                      <div className="rounded-2xl border border-border bg-secondary/30 p-4">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Owner Profile Status</span>
                        <span className="font-extrabold text-foreground text-sm">{previewData.vehicleDetails?.ownerName || "1st Owner"}</span>
                      </div>
                      <div className="rounded-2xl border border-border bg-secondary/30 p-4">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Registration Number</span>
                        <span className="font-black text-[#FFC700] text-sm">{previewData.vehicleDetails?.vehicleNumber || "N/A"}</span>
                      </div>
                      <div className="rounded-2xl border border-border bg-secondary/30 p-4">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Make & Model</span>
                        <span className="font-extrabold text-foreground text-sm">{previewData.vehicleDetails?.brand} {previewData.vehicleDetails?.model} {previewData.vehicleDetails?.variant}</span>
                      </div>
                      <div className="rounded-2xl border border-border bg-secondary/30 p-4">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Manufacturing Year</span>
                        <span className="font-extrabold text-foreground text-sm">{previewData.vehicleDetails?.manufacturingYear || "N/A"}</span>
                      </div>
                      <div className="rounded-2xl border border-border bg-secondary/30 p-4">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Fuel Type & Transmission</span>
                        <span className="font-extrabold text-foreground text-sm">{previewData.vehicleDetails?.fuelType} / {previewData.vehicleDetails?.transmission}</span>
                      </div>
                      <div className="rounded-2xl border border-border bg-secondary/30 p-4">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Odometer Reading</span>
                        <span className="font-extrabold text-foreground text-sm">{previewData.vehicleDetails?.odometerReading ? `${previewData.vehicleDetails.odometerReading} km` : "N/A"}</span>
                      </div>
                      <div className="rounded-2xl border border-border bg-secondary/30 p-4">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Insurance Status</span>
                        <span className="font-extrabold text-foreground text-sm">{previewData.vehicleDetails?.insuranceStatus || "N/A"}</span>
                      </div>
                      <div className="rounded-2xl border border-border bg-secondary/30 p-4">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Suggested Price Valuation</span>
                        <span className="font-black text-[#FFC700] text-sm">{previewData.vehicleDetails?.suggestedPrice ? inr(previewData.vehicleDetails.suggestedPrice) : "N/A"}</span>
                      </div>
                    </div>
                  </Panel>
                </div>
              )}

              {/* STEP 2: Exterior Body */}
              {activeDetailStep === 1 && (
                <div className="space-y-8">
                  <Panel
                    title="Step 2: Exterior Body Checklist"
                    description="State condition and paint parameters of exterior sheet metal panels."
                    action={
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={cn(
                              "size-5 transition-colors",
                              star <= Math.round(previewData.ratings?.exterior || 4)
                                ? "fill-[#FFC700] text-[#FFC700]"
                                : "text-border fill-transparent"
                            )}
                          />
                        ))}
                        <span className="ml-2 text-xs font-bold text-foreground">
                          {previewData.ratings?.exterior ? `${previewData.ratings.exterior} / 5 Stars` : "4 / 5 Stars"}
                        </span>
                      </div>
                    }
                  >
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 items-start">
                      {(previewData.exteriorPanelDetails || []).map((p: any, idx: number) => {
                        const cond = p.condition || "OK";
                        let colorClass = "text-emerald-500 bg-emerald-500/10 border-emerald-500/30";
                        if (cond === "REPAINTED" || cond === "CHANGED" || cond === "SCRATCH" || cond === "DENT") {
                          colorClass = "text-amber-500 bg-amber-500/10 border-amber-500/30";
                        } else if (cond === "DAMAGED" || cond === "RUST") {
                          colorClass = "text-rose-500 bg-rose-500/10 border-rose-500/30";
                        }

                        return (
                          <div key={idx} className="rounded-2xl border border-border bg-card p-3.5 shadow-soft flex flex-col gap-2">
                            <div className="flex items-center justify-between gap-2 w-full">
                              <span className="text-xs font-extrabold text-foreground truncate">{p.panelName}</span>
                              <span className={`rounded-lg border px-2 py-0.5 text-[10px] font-black uppercase ${colorClass}`}>
                                {cond}
                              </span>
                            </div>

                            {p.imageUrl ? (
                              <div className="relative group aspect-[16/10] w-full overflow-hidden rounded-xl border border-border bg-secondary shadow-inner">
                                <img
                                  src={p.imageUrl}
                                  alt={p.panelName}
                                  className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => window.open(p.imageUrl, "_blank")}
                                    className="inline-flex items-center gap-1 rounded-xl bg-[#FFC700] text-[#0D0E12] px-3 py-1.5 text-[11px] font-black shadow-md hover:bg-[#FFD633] transition-all cursor-pointer"
                                  >
                                    <Eye className="size-3.5" /> View Photo
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex h-14 w-full items-center justify-center rounded-xl border border-dashed border-border/60 bg-secondary/30 text-[10px] font-bold text-muted-foreground">
                                No panel photo attached
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </Panel>

                  <Panel
                    title="Mandatory Exterior Images"
                    description="Upload clean, high-resolution photos of five primary panels."
                  >
                    <div className="grid gap-4.5 sm:grid-cols-2 lg:grid-cols-3">
                      {[
                        { type: "FRONT_VIEW", label: "FRONT SIDE IMAGE" },
                        { type: "RIGHT_FRONT_VIEW", label: "RIGHT SIDE IMAGE" },
                        { type: "REAR_VIEW", label: "REAR SIDE IMAGE" },
                        { type: "LEFT_FRONT_VIEW", label: "LEFT SIDE IMAGE" },
                        { type: "ROOF_VIEW", label: "ROOF TOP IMAGE" },
                      ].map((slot) => {
                        const matchedPhoto = (previewData.inspectionPhotos || []).find(
                          (p: any) =>
                            p.photoType?.toUpperCase() === slot.type ||
                            p.displayName?.toUpperCase().includes(slot.label.split(" ")[0])
                        );
                        const imgUrl = matchedPhoto?.imageUrl;

                        return (
                          <div key={slot.type} className="rounded-2xl border border-border bg-card p-4 shadow-soft flex flex-col gap-2">
                            <span className="text-xs font-extrabold text-foreground truncate">{slot.label}</span>
                            <div className="relative group aspect-[16/10] w-full overflow-hidden rounded-xl border border-border bg-secondary shadow-inner flex items-center justify-center">
                              {imgUrl ? (
                                <>
                                  <img src={imgUrl} alt={slot.label} className="size-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button
                                      type="button"
                                      onClick={() => window.open(imgUrl, "_blank")}
                                      className="inline-flex items-center gap-1 rounded-xl bg-[#FFC700] text-[#0D0E12] px-3 py-1.5 text-[11px] font-black shadow-md hover:bg-[#FFD633] transition-all cursor-pointer"
                                    >
                                      <Eye className="size-3.5" /> View Photo
                                    </button>
                                  </div>
                                </>
                              ) : (
                                <div className="flex size-full items-center justify-center text-[10px] text-muted-foreground font-bold">
                                  No Image Attached
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Panel>
                </div>
              )}

              {/* STEP 3: Mechanical */}
              {activeDetailStep === 2 && (
                <div className="space-y-8">
                  <Panel
                    title="Step 3: Mechanical Health Diagnostics"
                    description="Check items inside engine compartment, transmission bay and brake assemblies."
                    action={
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={cn(
                              "size-5 transition-colors",
                              star <= Math.round(previewData.ratings?.mechanical || 5)
                                ? "fill-[#FFC700] text-[#FFC700]"
                                : "text-border fill-transparent"
                            )}
                          />
                        ))}
                        <span className="ml-2 text-xs font-bold text-foreground">
                          {previewData.ratings?.mechanical ? `${previewData.ratings.mechanical} / 5 Stars` : "5 / 5 Stars"}
                        </span>
                      </div>
                    }
                  >
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 items-start">
                      {[
                        { label: "Engine / Motor Status", val: previewData.mechanicalDetails?.engineStatus },
                        { label: "Engine Oil", val: previewData.mechanicalDetails?.engineOil },
                        { label: "Brakes Oil", val: previewData.mechanicalDetails?.brakeOil },
                        { label: "Steering Oil", val: previewData.mechanicalDetails?.steeringOil },
                        { label: "Coolant", val: previewData.mechanicalDetails?.coolant },
                        { label: "Brakes Booster", val: previewData.mechanicalDetails?.brakeBooster },
                        { label: "Brakes Working", val: previewData.mechanicalDetails?.brakeWorking },
                        { label: "Apron Condition", val: previewData.mechanicalDetails?.apron },
                        { label: "Chassis Alignment", val: previewData.mechanicalDetails?.chassis },
                        { label: "Suspension", val: previewData.mechanicalDetails?.suspension },
                        { label: "Suspension Bushing", val: previewData.mechanicalDetails?.bush },
                        { label: "Oil Leakage", val: previewData.mechanicalDetails?.leakage },
                        { label: "Exhaust Smoke Color", val: previewData.mechanicalDetails?.smoke },
                        { label: "Manual Transmission Fluid Level", val: previewData.mechanicalDetails?.transmission },
                        { label: "Differential Fluid Level", val: previewData.mechanicalDetails?.differential },
                        { label: "Fluid Leakages", val: previewData.mechanicalDetails?.fluidLeakage },
                        { label: "Steering Gearbox & Linkage", val: previewData.mechanicalDetails?.gearbox },
                        { label: "Driveline / Axle", val: previewData.mechanicalDetails?.axle },
                        { label: "Engine / Motor Noise", val: previewData.mechanicalDetails?.engineNoise },
                      ].map((item, idx) => {
                        const matchedPhoto = [
                          ...(previewData.inspectionPhotos || []),
                          ...(previewData.inspectionVideos || []),
                        ]
                          .filter((p: any) => p && (p.imageUrl || p.videoUrl || p.url))
                          .find(
                            (p: any) =>
                              p.photoType?.toUpperCase() === item.label.toUpperCase() ||
                              p.imageCategory?.toUpperCase() === item.label.toUpperCase() ||
                              p.displayName?.toUpperCase() === item.label.toUpperCase() ||
                              (item.label.includes("Noise") && (p.imageCategory?.toUpperCase().includes("NOISE") || p.displayName?.toUpperCase().includes("NOISE")))
                          );
                        const rawUrl = matchedPhoto?.imageUrl || matchedPhoto?.videoUrl || matchedPhoto?.url;
                        const imgUrl = rawUrl && !rawUrl.startsWith("http") && !rawUrl.startsWith("data:")
                          ? `${API_BASE_URL.replace(/\/+$/, "")}${rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`}`
                          : rawUrl;

                        return (
                          <div key={idx} className="rounded-2xl border border-border bg-card p-3.5 shadow-soft flex flex-col gap-2.5">
                            <div className="flex items-center justify-between gap-2 w-full">
                              <span className="text-xs font-bold text-foreground truncate min-w-0">{item.label}</span>
                              <span className="rounded-xl border border-border bg-secondary px-2.5 py-1 text-xs font-extrabold text-foreground shrink-0">
                                {item.val || "OK"}
                              </span>
                            </div>

                            {imgUrl && (
                              <div className="relative group aspect-[16/10] w-full overflow-hidden rounded-xl border border-border bg-black shadow-inner">
                                {/\.(mp4|webm|mov|avi|mkv|3gp|flv|wmv)($|\?)/i.test(imgUrl) ? (
                                  <video
                                    src={imgUrl}
                                    controls
                                    preload="metadata"
                                    playsInline
                                    className="size-full object-cover rounded-xl"
                                  >
                                    <source src={imgUrl} type="video/mp4" />
                                  </video>
                                ) : (
                                  <img
                                    src={imgUrl}
                                    alt={item.label}
                                    className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                                  />
                                )}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                  <button
                                    type="button"
                                    onClick={() => window.open(imgUrl, "_blank")}
                                    className="inline-flex items-center gap-1 rounded-xl bg-[#FFC700] text-[#0D0E12] px-3 py-1.5 text-[11px] font-black shadow-md hover:bg-[#FFD633] transition-all cursor-pointer pointer-events-auto"
                                  >
                                    <Eye className="size-3.5" /> {/\.(mp4|webm|mov|avi|mkv|3gp|flv|wmv)($|\?)/i.test(imgUrl) ? "View Video" : "View Photo"}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </Panel>

                  <Panel
                    title="Under-Bonnet Engine Room Photos"
                    description="Engine compartment and battery bay photos."
                  >
                    <div className="grid gap-4.5 sm:grid-cols-2 lg:grid-cols-2">
                      {[
                        { type: "ENGINE_IMAGE", label: "ENGINE ROOM PHOTO" },
                        { type: "BATTERY_IMAGE", label: "BATTERY BAY PHOTO" },
                      ].map((slot) => {
                        const matchedPhoto = (previewData.inspectionPhotos || []).find(
                          (p: any) =>
                            p.photoType?.toUpperCase() === slot.type ||
                            (slot.type === "ENGINE_IMAGE" && (p.imageCategory?.toUpperCase().includes("ENGINE") || p.displayName?.toUpperCase().includes("ENGINE"))) ||
                            (slot.type === "BATTERY_IMAGE" && (p.imageCategory?.toUpperCase().includes("BATTERY") || p.imageCategory?.toUpperCase().includes("INTERIOR") || p.displayName?.toUpperCase().includes("BATTERY")))
                        );
                        const imgUrl = matchedPhoto?.imageUrl;

                        return (
                          <div key={slot.type} className="rounded-2xl border border-border bg-card p-4 shadow-soft flex flex-col gap-2">
                            <span className="text-xs font-extrabold text-foreground truncate">{slot.label}</span>
                            <div className="relative group aspect-[16/10] w-full overflow-hidden rounded-xl border border-border bg-secondary shadow-inner flex items-center justify-center">
                              {imgUrl ? (
                                <>
                                  <img src={imgUrl} alt={slot.label} className="size-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button
                                      type="button"
                                      onClick={() => window.open(imgUrl, "_blank")}
                                      className="inline-flex items-center gap-1 rounded-xl bg-[#FFC700] text-[#0D0E12] px-3 py-1.5 text-[11px] font-black shadow-md hover:bg-[#FFD633] transition-all cursor-pointer"
                                    >
                                      <Eye className="size-3.5" /> View Photo
                                    </button>
                                  </div>
                                </>
                              ) : (
                                <div className="flex size-full items-center justify-center text-[10px] text-muted-foreground font-bold">
                                  No Image Attached
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Panel>
                </div>
              )}

              {/* STEP 4: Tyres Specifications */}
              {activeDetailStep === 3 && (
                <div className="space-y-8">
                  <Panel
                    title="Step 4: Tyres Specifications"
                    description="Enter remaining tread depth percentage and brand names for all wheels."
                    action={
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={cn(
                              "size-5 transition-colors",
                              star <= Math.round(previewData.ratings?.tyre || 4)
                                ? "fill-[#FFC700] text-[#FFC700]"
                                : "text-border fill-transparent"
                            )}
                          />
                        ))}
                        <span className="ml-2 text-xs font-bold text-foreground">
                          {previewData.ratings?.tyre ? `${previewData.ratings.tyre} / 5 Stars` : "4 / 5 Stars"}
                        </span>
                      </div>
                    }
                  >
                    <div className="grid gap-5 md:grid-cols-2">
                      {[
                        { label: "Front Right Tyre", brand: previewData.tyreDetails?.frontRightBrand, tread: previewData.tyreDetails?.frontRightTread, year: previewData.tyreDetails?.frontRightYear },
                        { label: "Rear Right Tyre", brand: previewData.tyreDetails?.rearRightBrand, tread: previewData.tyreDetails?.rearRightTread, year: previewData.tyreDetails?.rearRightYear },
                        { label: "Rear Left Tyre", brand: previewData.tyreDetails?.rearLeftBrand, tread: previewData.tyreDetails?.rearLeftTread, year: previewData.tyreDetails?.rearLeftYear },
                        { label: "Front Left Tyre", brand: previewData.tyreDetails?.frontLeftBrand, tread: previewData.tyreDetails?.frontLeftTread, year: previewData.tyreDetails?.frontLeftYear },
                        { label: "Spare Wheel", brand: previewData.tyreDetails?.spareBrand, tread: previewData.tyreDetails?.spareTread, year: previewData.tyreDetails?.spareYear },
                      ].map((t, idx) => (
                        <div key={idx} className="rounded-2xl border border-border bg-card p-5 shadow-soft flex flex-col gap-3">
                          <div className="flex items-center justify-between border-b border-border pb-2.5">
                            <p className="text-sm font-extrabold text-foreground">{t.label}</p>
                            <span className="rounded-xl border border-border bg-[#FFC700]/15 border-[#FFC700]/30 px-3 py-1 text-xs font-black text-[#FFC700]">
                              Tread: {t.tread ? `${t.tread}%` : "60%"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs font-extrabold text-muted-foreground">
                            <span>Brand & Model:</span>
                            <span className="text-foreground font-black">{t.brand || "JK 2019"}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <h4 className="text-xs font-extrabold uppercase text-muted-foreground mt-6 mb-3">Emergency Toolkit & Equipment</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                      {[
                        { name: "Jack", present: previewData.tyreDetails?.hasJack },
                        { name: "Handle", present: previewData.tyreDetails?.hasHandle },
                        { name: "Tool Kit", present: previewData.tyreDetails?.hasToolkit },
                        { name: "First Aid Box", present: previewData.tyreDetails?.hasFirstAidBox },
                        { name: "Emergency Triangle", present: previewData.tyreDetails?.hasTriangle },
                      ].map((eq, idx) => (
                        <div key={idx} className="rounded-2xl border border-border bg-card p-3.5 flex items-center justify-between shadow-soft">
                          <span className="font-bold text-foreground text-xs">{eq.name}</span>
                          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${eq.present ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-rose-500/10 text-rose-600 border border-rose-500/20"}`}>
                            {eq.present ? "Available" : "Missing"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Panel>

                  <Panel
                    title="Tyres & Spare Wheel Photos"
                    description="Individual photos of four active tyres and spare wheel in boot."
                  >
                    <div className="grid gap-4.5 sm:grid-cols-2 lg:grid-cols-3">
                      {[
                        { type: "FRONT_RIGHT_TYRE", label: "RIGHT SIDE FRONT TYRE IMG" },
                        { type: "REAR_RIGHT_TYRE", label: "RIGHT SIDE REAR TYRE IMG" },
                        { type: "REAR_LEFT_TYRE", label: "LEFT SIDE REAR TYRE IMG" },
                        { type: "FRONT_LEFT_TYRE", label: "LEFT SIDE FRONT TYRE IMG" },
                        { type: "SPARE_WHEEL", label: "SPARE WHEEL IMG" },
                        { type: "TYRES_OVERVIEW", label: "TYRES OVERVIEW IMAGE" },
                      ].map((slot) => {
                        const matchedPhoto = (previewData.inspectionPhotos || []).find((p: any) => {
                          if (p.photoType?.toUpperCase() === slot.type) return true;
                          const cat = (p.imageCategory || p.displayName || "").toUpperCase().replace(/[^A-Z]/g, "");
                          if (slot.type === "FRONT_RIGHT_TYRE") return cat.includes("FRONTRIGHT") || cat.includes("RFTYRE") || cat === "RF";
                          if (slot.type === "REAR_RIGHT_TYRE") return cat.includes("REARRIGHT") || cat.includes("RRTYRE") || cat === "RR";
                          if (slot.type === "FRONT_LEFT_TYRE") return cat.includes("FRONTLEFT") || cat.includes("LFTYRE") || cat === "LF";
                          if (slot.type === "REAR_LEFT_TYRE") return cat.includes("REARLEFT") || cat.includes("LRTYRE") || cat === "LR";
                          if (slot.type === "SPARE_WHEEL") return cat.includes("SPARE");
                          if (slot.type === "TYRES_OVERVIEW") return cat.includes("OVERVIEW") || cat === "TYRES" || cat.includes("GENERAL");
                          return false;
                        });
                        const imgUrl = matchedPhoto?.imageUrl;

                        return (
                          <div key={slot.type} className="rounded-2xl border border-border bg-card p-4 shadow-soft flex flex-col gap-2">
                            <span className="text-xs font-extrabold text-foreground truncate">{slot.label}</span>
                            <div className="relative group aspect-[16/10] w-full overflow-hidden rounded-xl border border-border bg-secondary shadow-inner flex items-center justify-center">
                              {imgUrl ? (
                                <>
                                  <img src={imgUrl} alt={slot.label} className="size-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button
                                      type="button"
                                      onClick={() => window.open(imgUrl, "_blank")}
                                      className="inline-flex items-center gap-1 rounded-xl bg-[#FFC700] text-[#0D0E12] px-3 py-1.5 text-[11px] font-black shadow-md hover:bg-[#FFD633] transition-all cursor-pointer"
                                    >
                                      <Eye className="size-3.5" /> View Photo
                                    </button>
                                  </div>
                                </>
                              ) : (
                                <div className="flex size-full items-center justify-center text-[10px] text-muted-foreground font-bold">
                                  No Image Attached
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Panel>
                </div>
              )}

              {/* STEP 5: Interior & Electrical */}
              {activeDetailStep === 4 && (
                <div className="space-y-8">
                  <Panel
                    title="Step 5: Interior & Electrical Checklist"
                    description="Evaluate interior electronics, battery brand, AC cooling and accessories."
                    action={
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={cn(
                              "size-5 transition-colors",
                              star <= Math.round(previewData.ratings?.interior || 4)
                                ? "fill-[#FFC700] text-[#FFC700]"
                                : "text-border fill-transparent"
                            )}
                          />
                        ))}
                        <span className="ml-2 text-xs font-bold text-foreground">
                          {previewData.ratings?.interior ? `${previewData.ratings.interior} / 5 Stars` : "4 / 5 Stars"}
                        </span>
                      </div>
                    }
                  >
                    {/* Top Specs Bar */}
                    <div className="grid gap-4 sm:grid-cols-3 mb-6">
                      <div className="rounded-2xl border border-border bg-card p-4 shadow-soft flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground">Battery Company</span>
                        <span className="text-sm font-extrabold text-foreground">{previewData.interiorDetails?.batteryBrand || "N/A"}</span>
                      </div>
                      <div className="rounded-2xl border border-border bg-card p-4 shadow-soft flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground">Full Battery Serial Number</span>
                        <span className="text-sm font-extrabold text-foreground">{previewData.interiorDetails?.batterySerialNumber || "N/A"}</span>
                      </div>
                      <div className="rounded-2xl border border-border bg-card p-4 shadow-soft flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground">AC Cooling Performance</span>
                        <span className="text-sm font-extrabold text-foreground">{previewData.interiorDetails?.acCooling || "N/A"}</span>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 items-start">
                      {[
                        { label: "Push Start Button", val: previewData.interiorDetails?.pushButton },
                        { label: "Sunroof", val: previewData.interiorDetails?.sunroof },
                        { label: "Right Side Tail Lamp", val: previewData.interiorDetails?.rightTailLamp },
                        { label: "Left Side Tail Lamp", val: previewData.interiorDetails?.leftTailLamp },
                        { label: "Right Side Head Light", val: previewData.interiorDetails?.rightHeadLamp },
                        { label: "Left Side Head Light", val: previewData.interiorDetails?.leftHeadLamp },
                        { label: "Right Indicator", val: previewData.interiorDetails?.indicators },
                        { label: "Left Indicator", val: previewData.interiorDetails?.indicators },
                        { label: "Boot Floor", val: previewData.interiorDetails?.bootFloor },
                        { label: "Washer Fluid", val: "OK" },
                        { label: "Dashboard", val: previewData.interiorDetails?.dashboard },
                        { label: "Left Side Fog Lamp", val: previewData.interiorDetails?.fogLamps },
                        { label: "Right Side Fog Lamp", val: previewData.interiorDetails?.fogLamps },
                        { label: "Rear Stop Light", val: "OK" },
                        { label: "Power Window All Buttons", val: previewData.interiorDetails?.powerWindows },
                        { label: "Music System", val: previewData.interiorDetails?.musicSystem },
                        { label: "Adjustable Steering", val: "OK" },
                        { label: "Steering Mounted Controls", val: previewData.interiorDetails?.steeringMountedControls },
                        { label: "Wiper Washer Front", val: previewData.interiorDetails?.wiper },
                        { label: "Rear Defogger", val: previewData.interiorDetails?.rearDefogger },
                        { label: "Rear Wiper Washer", val: previewData.interiorDetails?.rearWasher },
                        { label: "Instrument Cluster", val: previewData.interiorDetails?.instrumentCluster },
                        { label: "Infotainment System", val: previewData.interiorDetails?.infotainment },
                        { label: "Central Lock", val: previewData.interiorDetails?.centralLock },
                        { label: "All Sensors", val: previewData.interiorDetails?.sensors },
                      ].map((item, idx) => {
                        const itemClean = item.label.toUpperCase().replace(/[^A-Z]/g, "");
                        const matchedPhoto = (previewData.inspectionPhotos || []).find((p: any) => {
                          const pType = (p.photoType || "").toUpperCase().replace(/[^A-Z]/g, "");
                          const pCat = (p.imageCategory || "").toUpperCase().replace(/[^A-Z]/g, "");
                          const pDisp = (p.displayName || "").toUpperCase().replace(/[^A-Z]/g, "");

                          if (pCat === itemClean || pDisp === itemClean) return true;
                          if (pCat === "INTERIOR" || pCat === "EXTERIOR" || pCat === "MECHANICAL" || pCat === "TYRE" || pCat === "TYRES") return false;

                          if (pType && (pType === itemClean || itemClean.includes(pType) || pType.includes(itemClean))) return true;
                          if (pCat && (pCat.includes(itemClean) || itemClean.includes(pCat))) return true;
                          if (pDisp && (pDisp.includes(itemClean) || itemClean.includes(pDisp))) return true;
                          if (itemClean.includes("POWERWINDOW") && (pCat.includes("POWERWINDOW") || pDisp.includes("POWERWINDOW"))) return true;
                          return false;
                        });
                        const imgUrl = matchedPhoto?.imageUrl;

                        return (
                          <div key={idx} className="rounded-2xl border border-border bg-card p-3.5 shadow-soft flex flex-col gap-2.5">
                            <div className="flex items-center justify-between gap-2 w-full">
                              <span className="text-xs font-bold text-foreground truncate min-w-0">{item.label}</span>
                              <span className="rounded-xl border border-border bg-secondary px-2.5 py-1 text-xs font-extrabold text-foreground shrink-0">
                                {item.val || "OK / WORKING"}
                              </span>
                            </div>

                            {imgUrl && (
                              <div className="relative group aspect-[16/10] w-full overflow-hidden rounded-xl border border-border bg-secondary shadow-inner">
                                <img
                                  src={imgUrl}
                                  alt={item.label}
                                  className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <button
                                    type="button"
                                    onClick={() => window.open(imgUrl, "_blank")}
                                    className="inline-flex items-center gap-1 rounded-xl bg-[#FFC700] text-[#0D0E12] px-3 py-1.5 text-[11px] font-black shadow-md hover:bg-[#FFD633] transition-all cursor-pointer"
                                  >
                                    <Eye className="size-3.5" /> View Photo
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-6 space-y-4">
                      <div>
                        <label className="block text-xs font-extrabold text-foreground mb-1.5">
                          Inspector Remarks & Notes
                        </label>
                        <div className="w-full rounded-2xl border border-border bg-card p-4 text-sm font-semibold text-foreground shadow-soft min-h-[100px]">
                          {previewData.interiorDetails?.remarks || "No remarks entered."}
                        </div>
                      </div>
                    </div>
                  </Panel>

                  <Panel
                    title="Interior & Cabin Mandatory Photos"
                    description="Odometer reading and AC panel photos."
                  >
                    <div className="grid gap-4.5 sm:grid-cols-2 lg:grid-cols-4">
                      {[
                        { type: "ODOMETER_IMAGE", label: "ODOMETER READING PHOTO" },
                        { type: "AC_CONTROL_IMAGE", label: "AC CONTROL PANEL PHOTO" },
                      ].map((slot) => {
                        const matchedPhoto = (previewData.inspectionPhotos || []).find((p: any) => {
                          if (p.photoType?.toUpperCase() === slot.type) return true;
                          const cat = (p.imageCategory || p.displayName || "").toUpperCase().replace(/[^A-Z]/g, "");
                          if (slot.type === "ODOMETER_IMAGE") return cat.includes("ODOMETER");
                          if (slot.type === "AC_CONTROL_IMAGE") return cat.includes("AC");
                          return false;
                        });
                        const imgUrl = matchedPhoto?.imageUrl;

                        return (
                          <div key={slot.type} className="rounded-2xl border border-border bg-card p-4 shadow-soft flex flex-col gap-2">
                            <span className="text-xs font-extrabold text-foreground truncate">{slot.label}</span>
                            <div className="relative group aspect-[16/10] w-full overflow-hidden rounded-xl border border-border bg-secondary shadow-inner flex items-center justify-center">
                              {imgUrl ? (
                                <>
                                  <img src={imgUrl} alt={slot.label} className="size-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button
                                      type="button"
                                      onClick={() => window.open(imgUrl, "_blank")}
                                      className="inline-flex items-center gap-1 rounded-xl bg-[#FFC700] text-[#0D0E12] px-3 py-1.5 text-[11px] font-black shadow-md hover:bg-[#FFD633] transition-all cursor-pointer"
                                    >
                                      <Eye className="size-3.5" /> View Photo
                                    </button>
                                  </div>
                                </>
                              ) : (
                                <div className="flex size-full items-center justify-center text-[10px] text-muted-foreground font-bold">
                                  No Image Attached
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Panel>
                </div>
              )}

              {/* Stepper Navigation Action Controls (Same as AddVehicle.tsx) */}
              <div className="flex flex-wrap justify-between items-center gap-4 border-t border-border pt-6">
                <button
                  onClick={() => setActiveDetailStep((s) => Math.max(0, s - 1))}
                  disabled={activeDetailStep === 0}
                  className="rounded-2xl border border-border bg-card px-6 py-3 text-xs font-extrabold shadow-soft transition-all hover:bg-secondary disabled:opacity-40 cursor-pointer"
                >
                  Previous Step
                </button>

                <div className="flex items-center gap-3">
                  {activeDetailStep < detailSteps.length - 1 ? (
                    <button
                      onClick={() => setActiveDetailStep((s) => s + 1)}
                      className="flex items-center gap-2 rounded-2xl bg-[#FFC700] hover:bg-[#FFD633] px-6 py-3 text-xs font-extrabold text-[#0D0E12] shadow-[0_4px_18px_rgba(255,199,0,0.35)] transition-all cursor-pointer"
                    >
                      Continue Next Step <ChevronRight className="size-4" />
                    </button>
                  ) : (
                    <Link
                      to={`/inspector/add-vehicle?id=${previewId}`}
                      className="flex items-center gap-2 rounded-2xl bg-[#FFC700] hover:bg-[#FFD633] px-6 py-3 text-xs font-extrabold text-[#0D0E12] shadow-[0_4px_18px_rgba(255,199,0,0.4)] transition-all hover:shadow-[0_6px_24px_rgba(255,199,0,0.55)] cursor-pointer"
                    >
                      <Edit3 className="size-4" /> Edit & Update Vehicle
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDelete}
        title="Delete Inspection Draft"
        description="Are you sure you want to delete this inspection draft? This action is permanent and cannot be undone."
        confirmText="Delete Draft"
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
      />
    </AppShell>
  );
}
