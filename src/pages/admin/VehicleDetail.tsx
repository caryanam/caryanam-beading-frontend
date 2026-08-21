import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { adminNav } from "@/components/nav-config";
import { StatusChip, Panel } from "@/components/premium";
import { inr } from "@/lib/mock-data";
import { API_BASE_URL } from "@/lib/api";
import { cn, formatIndianDateTime } from "@/lib/utils";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Download,
  Eye,
  X,
  Loader2,
  Star,
  ChevronRight,
  ShieldCheck,
  Wrench,
  Gauge,
  User,
  Layers,
  Sparkles,
  Gavel,
  Trophy,
  History,
  TrendingUp,
  BadgeIndianRupee,
  Clock,
} from "lucide-react";
import {
  getInspectionById,
  approveInspection,
  rejectInspection,
  downloadAdminInspectionPdf,
} from "@/lib/api/admin-api";

export function AdminVehicleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [previewData, setPreviewData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeDetailStep, setActiveDetailStep] = useState(0);
  const [bidHistory, setBidHistory] = useState<any[]>([]);

  // Modal State for Approve / Reject actions
  const [modalAction, setModalAction] = useState<"approve" | "reject" | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [reasonError, setReasonError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const detailSteps = [
    { title: "Vehicle Specs", subtitle: "Basic registration & owner details" },
    { title: "Exterior Body", subtitle: "32-point panel & side photos" },
    { title: "Mechanical", subtitle: "Engine, oil & motor bay photos" },
    { title: "Tyres Specifications", subtitle: "Remaining tread depth % & toolkit" },
    { title: "Interior & Electrical", subtitle: "Cabin, electrical & remarks" },
    { title: "Bid History", subtitle: "Live auction & bidding telemetry" },
  ];

  const formatMediaUrl = (url?: string | null) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    const cleanPath = url.startsWith("/") ? url : `/${url}`;
    return `${API_BASE_URL}${cleanPath}`;
  };

  const fetchDetails = async () => {
    if (!id) return;
    setLoading(true);
    try {
      let res: any = null;
      try {
        res = await getInspectionById(Number(id));
      } catch (e) {
        console.warn("Admin getInspectionById failed, trying fallback...", e);
      }

      const raw = res?.data || res;
      if (raw && (raw.inspectionId || raw.vehicleDetails || raw.status || raw.id)) {
        setPreviewData(raw);
        const history = raw.bidHistory || raw.bids || [];
        setBidHistory(history);
      } else {
        toast.error("Could not load vehicle inspection details.");
      }
    } catch (err: any) {
      console.error("Failed to load vehicle inspection details", err);
      toast.error("Could not load vehicle inspection details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  // WebSocket Live Bidding Telemetry for Admin
  useEffect(() => {
    if (!id || loading) return;

    let socket: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connectWebSocket = () => {
      const protocol = API_BASE_URL.startsWith("https") || window.location.protocol === "https:" ? "wss:" : "ws:";
      let host = "localhost:8080";
      if (API_BASE_URL && API_BASE_URL.includes("://")) {
        host = API_BASE_URL.split("://")[1];
      } else if (API_BASE_URL) {
        host = API_BASE_URL;
      }

      const wsUrl = `${protocol}//${host}/ws/auction?inspectionId=${id}`;
      socket = new WebSocket(wsUrl);

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (
            (data.type === "BID_UPDATE" || data.type === "GO_LIVE") &&
            Number(data.inspectionId) === Number(id)
          ) {
            setPreviewData((prev: any) => {
              if (!prev) return prev;
              return {
                ...prev,
                currentHighestBid: data.currentHighestBid,
                currentHighestBidder: data.currentHighestBidder,
                totalBids: data.totalBids,
                vehicleStatus: "LIVE",
              };
            });
            if (data.bidHistory) {
              setBidHistory(data.bidHistory);
            }
          }
        } catch (err) {
          console.error("Error parsing WS message:", err);
        }
      };

      socket.onclose = (e) => {
        if (!e.wasClean) {
          reconnectTimeout = setTimeout(connectWebSocket, 3000);
        }
      };
    };

    connectWebSocket();

    return () => {
      if (socket) socket.close(1000, "Component unmounted");
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [id, loading]);

  const handleDownloadPdf = async () => {
    if (!id) return;
    setDownloadingPdf(true);
    try {
      await downloadAdminInspectionPdf(Number(id));
    } catch (err: any) {
      console.error(err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!id || !modalAction) return;

    if (modalAction === "reject") {
      if (!rejectionReason.trim()) {
        setReasonError("Please enter a rejection reason before confirming.");
        return;
      }
    }

    setActionLoading(true);
    try {
      if (modalAction === "approve") {
        const res = await approveInspection(Number(id));
        if (res.success) {
          toast.success("Inspection approved successfully. Vehicle set to READY_FOR_AUCTION.");
          setModalAction(null);
          fetchDetails();
        }
      } else {
        const res = await rejectInspection(Number(id), rejectionReason.trim());
        if (res.success) {
          toast.success("Inspection rejected successfully.");
          setModalAction(null);
          fetchDetails();
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Failed to ${modalAction} inspection.`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <AppShell role="admin" nav={adminNav} title="Loading Vehicle..." breadcrumb={["Admin", "Vehicles"]}>
        <div className="flex h-96 flex-col items-center justify-center gap-4 bg-card border border-border rounded-3xl shadow-soft">
          <span className="h-12 w-12 animate-spin rounded-full border-4 border-[#FFC700] border-t-transparent" />
          <p className="text-sm font-extrabold text-muted-foreground animate-pulse">
            Fetching 200-Point Inspection Details...
          </p>
        </div>
      </AppShell>
    );
  }

  if (!previewData) {
    return (
      <AppShell role="admin" nav={adminNav} title="Not Found" breadcrumb={["Admin", "Vehicles"]}>
        <div className="rounded-3xl border border-dashed border-border bg-card p-16 text-center shadow-soft">
          <p className="font-extrabold text-foreground text-lg">Vehicle details not found.</p>
          <button
            onClick={() => navigate("/admin/vehicles")}
            className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-[#FFC700] px-5 py-2.5 text-xs font-extrabold text-[#0D0E12] shadow-sm hover:scale-105 transition-all cursor-pointer"
          >
            <ArrowLeft className="size-4" /> Back to Vehicles List
          </button>
        </div>
      </AppShell>
    );
  }

  const vDetails = previewData.vehicleDetails || {};
  const highestBid = previewData.currentHighestBid || previewData.highestBidAmount || 0;
  const highestBidder = previewData.currentHighestBidder || previewData.highestBidderName || "No Bids Placed";
  const totalBidsCount = previewData.totalBids || bidHistory.length || 0;

  return (
    <AppShell
      role="admin"
      nav={adminNav}
      title={vDetails.brand ? `${vDetails.brand} ${vDetails.model}` : `Inspection #${id}`}
      breadcrumb={["Admin", "Vehicles", `Inspection #${id}`]}
    >
      <div className="space-y-6">

        {/* Top Header Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center justify-center size-10 rounded-2xl border border-border bg-secondary/50 text-foreground hover:bg-secondary hover:border-[#FFC700] transition-all cursor-pointer shadow-sm shrink-0"
              title="Back"
            >
              <ArrowLeft className="size-5 text-[#FFC700]" />
            </button>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-foreground tracking-tight">
                  {vDetails.brand} {vDetails.model} {vDetails.variant}
                </h2>
                <span className="rounded-lg bg-secondary border border-border px-2.5 py-0.5 text-xs font-extrabold text-foreground">
                  {vDetails.vehicleNumber || `#${id}`}
                </span>
                {previewData.status && (
                  <StatusChip status={previewData.status} />
                )}
              </div>
              <p className="text-xs font-semibold text-muted-foreground mt-1">
                Inspection Report • Submitted on {previewData.submittedAt ? formatIndianDateTime(previewData.submittedAt) : "Draft"} • Inspector: <span className="font-bold text-foreground">{previewData.inspectorName || "Field Inspector"}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto flex-wrap">
            {previewData.status === "SUBMITTED" && (
              <>
                <button
                  type="button"
                  onClick={() => setModalAction("approve")}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#FFC700] hover:bg-[#FFD633] text-[#0D0E12] px-4 py-2.5 text-xs font-black shadow-sm transition-all cursor-pointer"
                >
                  <CheckCircle2 className="size-4" /> Approve
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRejectionReason("");
                    setReasonError("");
                    setModalAction("reject");
                  }}
                  className="inline-flex items-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 px-4 py-2.5 text-xs font-black transition-all cursor-pointer"
                >
                  <AlertTriangle className="size-4" /> Reject
                </button>
              </>
            )}

            <button
              type="button"
              disabled={downloadingPdf}
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2.5 text-xs font-extrabold text-foreground hover:border-[#FFC700] hover:text-[#FFC700] transition-colors shadow-soft cursor-pointer disabled:opacity-50"
            >
              {downloadingPdf ? <Loader2 className="size-4 animate-spin text-[#FFC700]" /> : <Download className="size-4" />}
              <span>Download PDF Report</span>
            </button>
          </div>
        </div>

        {/* Status Alert Banner */}
        {previewData.status === "REJECTED" && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 text-rose-500 flex items-start gap-3">
            <AlertCircle className="size-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold text-sm">Report Rejected by Admin</p>
              <p className="text-xs font-semibold mt-1">
                Reason: {previewData.rejectionReason || "Please verify details."}
              </p>
            </div>
          </div>
        )}

        {/* 6-Step Stepper Indicator Bar (Including Step 6: Bid History for Admin) */}
        <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-6">
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
                  <span className="text-xs font-extrabold text-foreground truncate">
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
                  <span className="font-extrabold text-foreground text-sm">{vDetails.customerName || "N/A"}</span>
                </div>
                <div className="rounded-2xl border border-border bg-secondary/30 p-4">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Customer Mobile</span>
                  <span className="font-extrabold text-foreground text-sm">{vDetails.customerMobileNumber || "N/A"}</span>
                </div>
                <div className="rounded-2xl border border-border bg-secondary/30 p-4">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Owner Profile Status</span>
                  <span className="font-extrabold text-foreground text-sm">{vDetails.ownerName || "1st Owner"}</span>
                </div>
                <div className="rounded-2xl border border-border bg-secondary/30 p-4">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Registration Number</span>
                  <span className="font-black text-[#FFC700] text-sm">{vDetails.vehicleNumber || "N/A"}</span>
                </div>
                <div className="rounded-2xl border border-border bg-secondary/30 p-4">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Make & Model</span>
                  <span className="font-extrabold text-foreground text-sm">{vDetails.brand} {vDetails.model} {vDetails.variant}</span>
                </div>
                <div className="rounded-2xl border border-border bg-secondary/30 p-4">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Manufacturing Year</span>
                  <span className="font-extrabold text-foreground text-sm">{vDetails.manufacturingYear || "N/A"}</span>
                </div>
                <div className="rounded-2xl border border-border bg-secondary/30 p-4">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Registration Year</span>
                  <span className="font-extrabold text-foreground text-sm">{vDetails.registrationYear || "N/A"}</span>
                </div>
                <div className="rounded-2xl border border-border bg-secondary/30 p-4">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Fuel Type & Transmission</span>
                  <span className="font-extrabold text-foreground text-sm">{vDetails.fuelType} / {vDetails.transmission}</span>
                </div>
                <div className="rounded-2xl border border-border bg-secondary/30 p-4">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Odometer Reading</span>
                  <span className="font-extrabold text-foreground text-sm">{vDetails.odometerReading ? `${vDetails.odometerReading} km` : "N/A"}</span>
                </div>
                <div className="rounded-2xl border border-border bg-secondary/30 p-4">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Insurance Status</span>
                  <span className="font-extrabold text-foreground text-sm">{vDetails.insuranceStatus || "N/A"}</span>
                </div>
                <div className="rounded-2xl border border-border bg-secondary/30 p-4">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Location</span>
                  <span className="font-extrabold text-foreground text-sm">{vDetails?.location || "N/A"}</span>
                </div>
                <div className="rounded-2xl border border-border bg-secondary/30 p-4">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">RTO Information</span>
                  <span className="font-extrabold text-foreground text-sm">{vDetails?.rtoInformation || vDetails?.rto || "N/A"}</span>
                </div>
                <div className="rounded-2xl border border-border bg-secondary/30 p-4">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">RS Availability</span>
                  <span className="font-extrabold text-foreground text-sm">{vDetails?.rsAvailability || "N/A"}</span>
                </div>
                <div className="rounded-2xl border border-border bg-secondary/30 p-4">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Duplicate Key</span>
                  <span className="font-extrabold text-foreground text-sm">{vDetails?.duplicateKey || "N/A"}</span>
                </div>
                <div className="rounded-2xl border border-border bg-secondary/30 p-4">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">RTO NOC Issued</span>
                  <span className="font-extrabold text-foreground text-sm">{vDetails?.rtoNocIssued || "N/A"}</span>
                </div>
                <div className="rounded-2xl border border-border bg-secondary/30 p-4">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Under Hypothecation</span>
                  <span className="font-extrabold text-foreground text-sm">{vDetails?.underHypothecation || "N/A"}</span>
                </div>
                <div className="rounded-2xl border border-border bg-secondary/30 p-4">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Mismatch in RC</span>
                  <span className="font-extrabold text-foreground text-sm">{vDetails?.mismatchInRc || "N/A"}</span>
                </div>
                <div className="rounded-2xl border border-border bg-secondary/30 p-4">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Road Tax Paid</span>
                  <span className="font-extrabold text-foreground text-sm">{vDetails?.roadTaxPaid || "N/A"}</span>
                </div>
                <div className="rounded-2xl border border-border bg-secondary/30 p-4">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Fitness Valid Upto</span>
                  <span className="font-extrabold text-foreground text-sm">{vDetails?.fitnessUpto || "N/A"}</span>
                </div>
                <div className="rounded-2xl border border-border bg-secondary/30 p-4">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Suggested Price Valuation</span>
                  <span className="font-black text-[#FFC700] text-sm">{vDetails.suggestedPrice ? inr(vDetails.suggestedPrice) : "N/A"}</span>
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
                  const cond = (p.condition || "OK").toUpperCase();
                  const isNA = cond === "NA" || cond === "N/A";
                  let colorClass = "text-emerald-500 bg-emerald-500/10 border-emerald-500/30";
                  if (cond === "REPAINTED" || cond === "CHANGED" || cond === "SCRATCH" || cond === "DENT") {
                    colorClass = "text-amber-500 bg-amber-500/10 border-amber-500/30";
                  } else if (cond === "DAMAGED" || cond === "RUST") {
                    colorClass = "text-rose-500 bg-rose-500/10 border-rose-500/30";
                  } else if (isNA) {
                    colorClass = "text-muted-foreground bg-secondary border-border";
                  }

                  const imgUrl = formatMediaUrl(p.imageUrl);

                  return (
                    <div key={idx} className="rounded-2xl border border-border bg-card p-3.5 shadow-soft flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-2 w-full">
                        <span className="text-xs font-extrabold text-foreground truncate">{p.panelName}</span>
                        <span className={`rounded-lg border px-2 py-0.5 text-[10px] font-black uppercase ${colorClass}`}>
                          {cond}
                        </span>
                      </div>

                      {!isNA && imgUrl ? (
                        <div className="relative group aspect-[16/10] w-full overflow-hidden rounded-xl border border-border bg-secondary shadow-inner">
                          <img
                            src={imgUrl}
                            alt={p.panelName}
                            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => window.open(imgUrl, "_blank")}
                              className="inline-flex items-center gap-1 rounded-xl bg-[#FFC700] text-[#0D0E12] px-3 py-1.5 text-[11px] font-black shadow-md hover:bg-[#FFD633] transition-all cursor-pointer"
                            >
                              <Eye className="size-3.5" /> View Photo
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex h-14 w-full items-center justify-center rounded-xl border border-dashed border-border/60 bg-secondary/30 text-[10px] font-bold text-muted-foreground">
                          {isNA ? "N/A - Not Applicable" : "No panel photo attached"}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Panel>

            <Panel
              title="Mandatory Exterior Images"
              description="Clean, high-resolution photos of five primary panels."
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
                  const imgUrl = formatMediaUrl(matchedPhoto?.imageUrl);

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
                                <Eye className="size-3.5" /> Open Full Image
                              </button>
                            </div>
                          </>
                        ) : (
                          <span className="text-xs font-bold text-muted-foreground">No image uploaded</span>
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
                  const valStr = String(item.val || "OK").toUpperCase();
                  const isNA = valStr === "NA" || valStr === "N/A";
                  const isNoiseItem = item.label.includes("Noise");

                  const videoObj = isNoiseItem
                    ? ((previewData.inspectionVideos || []).find((v: any) => v && (v.videoUrl || v.url || v.imageUrl)) ||
                       (previewData.videoUrl ? { videoUrl: previewData.videoUrl } : null))
                    : null;

                  const matchedPhoto = isNA
                    ? null
                    : (videoObj ||
                       (previewData.inspectionPhotos || [])
                        .filter((p: any) => p && (p.imageUrl || p.videoUrl || p.url))
                        .find(
                          (p: any) =>
                            p.photoType?.toUpperCase() === item.label.toUpperCase() ||
                            p.imageCategory?.toUpperCase() === item.label.toUpperCase() ||
                            p.displayName?.toUpperCase() === item.label.toUpperCase()
                        ));

                  const rawUrl = matchedPhoto?.imageUrl || matchedPhoto?.videoUrl || matchedPhoto?.url;
                  const imgUrl = formatMediaUrl(rawUrl);

                  const isVideoFile = isNoiseItem || (imgUrl && (
                    /\.(mp4|webm|mov|avi|mkv|3gp|flv|wmv)($|\?)/i.test(imgUrl) || 
                    matchedPhoto?.videoUrl
                  ));

                  return (
                    <div key={idx} className="rounded-2xl border border-border bg-card p-3.5 shadow-soft flex flex-col gap-2.5">
                      <div className="flex items-center justify-between gap-2 w-full">
                        <span className="text-xs font-bold text-foreground truncate min-w-0">{item.label}</span>
                        <span className="rounded-xl border border-border bg-secondary px-2.5 py-1 text-xs font-extrabold text-foreground shrink-0">
                          {item.val || "OK"}
                        </span>
                      </div>

                      {!isNA && imgUrl && (
                        <div className="relative group aspect-[16/10] w-full overflow-hidden rounded-xl border border-black bg-black shadow-inner">
                          {isVideoFile ? (
                            <video
                              key={imgUrl}
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
                              <Eye className="size-3.5" /> {isVideoFile ? "View Video" : "View Photo"}
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
                  const imgUrl = formatMediaUrl(matchedPhoto?.imageUrl);

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
                  const imgUrl = formatMediaUrl(matchedPhoto?.imageUrl);

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
                  const valStr = String(item.val || "OK / WORKING").toUpperCase();
                  const isNA = valStr === "NA" || valStr === "N/A" || valStr.includes("N/A") || valStr.includes("NOT APPLICABLE");

                  const itemClean = item.label.toUpperCase().replace(/[^A-Z]/g, "");
                  const matchedPhoto = isNA ? null : (previewData.inspectionPhotos || []).find((p: any) => {
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
                  const imgUrl = formatMediaUrl(matchedPhoto?.imageUrl);

                  return (
                    <div key={idx} className="rounded-2xl border border-border bg-card p-3.5 shadow-soft flex flex-col gap-2.5">
                      <div className="flex items-center justify-between gap-2 w-full">
                        <span className="text-xs font-bold text-foreground truncate min-w-0">{item.label}</span>
                        <span className="rounded-xl border border-border bg-secondary px-2.5 py-1 text-xs font-extrabold text-foreground shrink-0">
                          {item.val || "OK / WORKING"}
                        </span>
                      </div>

                      {!isNA && imgUrl && (
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
                  const imgUrl = formatMediaUrl(matchedPhoto?.imageUrl);

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

        {/* STEP 6: Bid History (ADMIN ONLY) */}
        {activeDetailStep === 5 && (
          <div className="space-y-8">
            <Panel
              title="Step 6: Live Auction & Bid History Telemetry"
              description="Complete list of all bids placed by registered dealers on this vehicle."
              action={
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#FFC700]/10 border border-[#FFC700]/30 px-3 py-1 text-xs font-black text-[#FFC700]">
                    <Gavel className="size-3.5" /> Total Bids: {totalBidsCount}
                  </span>
                </div>
              }
            >
              {/* Telemetry Summary Grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
                <div className="rounded-2xl border border-border bg-secondary/30 p-4 flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-xl bg-emerald-500/15 text-emerald-500">
                    <Trophy className="size-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold text-muted-foreground uppercase block">Current Highest Bid</span>
                    <span className="text-lg font-black text-emerald-500 block">{highestBid > 0 ? inr(highestBid) : "No Bids Placed"}</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-secondary/30 p-4 flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-xl bg-[#FFC700]/15 text-[#FFC700]">
                    <User className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-extrabold text-muted-foreground uppercase block">Highest Bidder</span>
                    <span className="text-sm font-black text-foreground truncate block">{highestBidder}</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-secondary/30 p-4 flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-xl bg-blue-500/15 text-blue-500">
                    <TrendingUp className="size-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold text-muted-foreground uppercase block">Suggested Base Price</span>
                    <span className="text-sm font-black text-foreground block">{vDetails.suggestedPrice ? inr(vDetails.suggestedPrice) : "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* Bid History Table */}
              {bidHistory.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-secondary/20 p-10 text-center">
                  <History className="size-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs font-bold text-muted-foreground">No bids have been placed on this vehicle yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-border">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-secondary/60 text-[10px] uppercase font-extrabold text-muted-foreground border-b border-border">
                      <tr>
                        <th className="p-3.5">Rank</th>
                        <th className="p-3.5">Dealer / Dealership</th>
                        <th className="p-3.5">Bid Amount</th>
                        <th className="p-3.5 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {bidHistory.map((bid: any, idx: number) => {
                        const isTop = idx === 0;
                        const dealerName = bid.dealerName || bid.dealershipName || bid.dealer || "Dealer";
                        const amountVal = bid.amount || bid.bidAmount || 0;

                        return (
                          <tr key={idx} className={cn("hover:bg-secondary/30 transition-colors", isTop && "bg-[#FFC700]/5 font-bold")}>
                            <td className="p-3.5">
                              {isTop ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-[#FFC700] text-[#0D0E12] px-2.5 py-0.5 text-[10px] font-black">
                                  #1 Highest
                                </span>
                              ) : (
                                <span className="font-extrabold text-muted-foreground">#{idx + 1}</span>
                              )}
                            </td>
                            <td className="p-3.5 font-bold text-foreground">
                              {dealerName}
                            </td>
                            <td className="p-3.5 font-black text-emerald-500 text-sm">
                              {inr(amountVal)}
                            </td>
                            <td className="p-3.5 text-right">
                              {isTop ? (
                                <span className="inline-block rounded-full bg-emerald-500/10 text-emerald-500 px-2.5 py-0.5 text-[10px] font-black border border-emerald-500/20">
                                  Winning Bid
                                </span>
                              ) : (
                                <span className="inline-block rounded-full bg-secondary text-muted-foreground px-2.5 py-0.5 text-[10px] font-extrabold">
                                  Outbid
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>
          </div>
        )}

        {/* Bottom Stepper Navigation Bar */}
        <div className="flex items-center justify-between rounded-3xl border border-border bg-card p-6 shadow-soft">
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
              previewData.status === "SUBMITTED" && (
                <button
                  type="button"
                  onClick={() => setModalAction("approve")}
                  className="flex items-center gap-2 rounded-2xl bg-[#FFC700] hover:bg-[#FFD633] px-6 py-3 text-xs font-black text-[#0D0E12] shadow-[0_4px_18px_rgba(255,199,0,0.4)] transition-all cursor-pointer"
                >
                  <CheckCircle2 className="size-4" /> Confirm Approval
                </button>
              )
            )}
          </div>
        </div>

        {/* Confirmation Modal Popup for Approve / Reject */}
        {modalAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-200">
              <div className={`flex items-start justify-between p-6 border-b border-border ${
                modalAction === "approve" ? "bg-emerald-500/10 border-emerald-500/20" : "bg-rose-500/10 border-rose-500/20"
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl ${
                    modalAction === "approve" ? "bg-emerald-500/20 text-emerald-600" : "bg-rose-500/20 text-rose-500"
                  }`}>
                    {modalAction === "approve" ? <CheckCircle2 className="size-6" /> : <AlertTriangle className="size-6" />}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-foreground">
                      {modalAction === "approve" ? "Approve Vehicle Inspection" : "Reject Vehicle Inspection"}
                    </h3>
                    <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                      Vehicle #{id} · {vDetails.brand} {vDetails.model} ({vDetails.vehicleNumber})
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalAction(null)}
                  className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {modalAction === "approve" ? (
                  <div className="rounded-2xl border border-border bg-secondary/50 p-4 text-xs font-semibold text-foreground space-y-2">
                    <p>Are you sure you want to approve this vehicle inspection report?</p>
                    <p className="text-muted-foreground">
                      Approving this report will mark the vehicle as <span className="font-extrabold text-foreground underline">READY_FOR_AUCTION</span>, allowing it to be scheduled for live bidding.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="block text-xs font-extrabold text-foreground">
                      Reason for Rejection <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={4}
                      value={rejectionReason}
                      onChange={(e) => {
                        setRejectionReason(e.target.value);
                        if (e.target.value.trim()) setReasonError("");
                      }}
                      placeholder="Enter detailed reason for rejecting this inspection report..."
                      className="w-full rounded-2xl border border-border bg-background p-3.5 text-xs font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#FFC700]"
                    />
                    {reasonError && <p className="text-xs font-bold text-rose-500">{reasonError}</p>}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 p-6 border-t border-border bg-secondary/30">
                <button
                  type="button"
                  onClick={() => setModalAction(null)}
                  disabled={actionLoading}
                  className="rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-extrabold text-foreground hover:bg-secondary transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAction}
                  disabled={actionLoading}
                  className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-black shadow-md transition-all cursor-pointer disabled:opacity-50 ${
                    modalAction === "approve"
                      ? "bg-[#FFC700] hover:bg-[#FFD633] text-[#0D0E12]"
                      : "bg-rose-500 hover:bg-rose-600 text-white"
                  }`}
                >
                  {actionLoading && <Loader2 className="size-4 animate-spin" />}
                  {modalAction === "approve" ? "Confirm Approval" : "Confirm Rejection"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
