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
              onClick={() => navigate("/admin/vehicles")}
              className="inline-flex items-center justify-center size-10 rounded-2xl border border-border bg-secondary/50 text-foreground hover:bg-secondary hover:border-[#FFC700] transition-all cursor-pointer shadow-sm shrink-0"
              title="Back to Vehicles List"
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
                  const cond = p.condition || "OK";
                  let colorClass = "text-emerald-500 bg-emerald-500/10 border-emerald-500/30";
                  if (cond === "REPAINTED" || cond === "CHANGED" || cond === "SCRATCH" || cond === "DENT") {
                    colorClass = "text-amber-500 bg-amber-500/10 border-amber-500/30";
                  } else if (cond === "DAMAGED" || cond === "RUST") {
                    colorClass = "text-rose-500 bg-rose-500/10 border-rose-500/30";
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

                      {imgUrl ? (
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
                            <img src={imgUrl} alt={slot.label} className="size-full object-cover" />
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
              title="Step 3: Engine Room & Mechanical Diagnostics"
              description="Under-bonnet fluid levels, brake booster, suspension, and apron condition."
              action={
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        "size-5 transition-colors",
                        star <= Math.round(previewData.ratings?.mechanical || 4)
                          ? "fill-[#FFC700] text-[#FFC700]"
                          : "text-border fill-transparent"
                      )}
                    />
                  ))}
                  <span className="ml-2 text-xs font-bold text-foreground">
                    {previewData.ratings?.mechanical ? `${previewData.ratings.mechanical} / 5 Stars` : "4.5 / 5 Stars"}
                  </span>
                </div>
              }
            >
              <div className="grid gap-4.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {[
                  { label: "Engine Status", val: previewData.mechanicalDetails?.engineStatus },
                  { label: "Engine Oil Level", val: previewData.mechanicalDetails?.engineOil },
                  { label: "Brake Oil Level", val: previewData.mechanicalDetails?.brakeOil },
                  { label: "Coolant Level", val: previewData.mechanicalDetails?.coolant },
                  { label: "Steering Oil Level", val: previewData.mechanicalDetails?.steeringOil },
                  { label: "Suspension Working", val: previewData.mechanicalDetails?.suspension },
                  { label: "Brake Booster", val: previewData.mechanicalDetails?.brakeBooster },
                  { label: "Chassis Alignment", val: previewData.mechanicalDetails?.chassis },
                  { label: "Apron Condition", val: previewData.mechanicalDetails?.apron },
                  { label: "Transmission Fluid Level", val: previewData.mechanicalDetails?.transmission },
                  { label: "Fluid Leakages", val: previewData.mechanicalDetails?.fluidLeakage },
                  { label: "Engine Motor Noise", val: previewData.mechanicalDetails?.engineNoise },
                ].map((item, idx) => (
                  <div key={idx} className="rounded-2xl border border-border bg-secondary/30 p-4">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">{item.label}</span>
                    <span className="font-extrabold text-foreground text-sm">{item.val || "OK / Normal"}</span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        )}

        {/* STEP 4: Tyres Specifications */}
        {activeDetailStep === 3 && (
          <div className="space-y-8">
            <Panel
              title="Step 4: Tyres Condition & Emergency Equipment"
              description="Brand name, remaining tread depth percentage, and emergency toolkit checklist."
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
              <div className="grid gap-4.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                {[
                  { label: "Front Right Tyre", brand: previewData.tyreDetails?.frontRightBrand, tread: previewData.tyreDetails?.frontRightTread },
                  { label: "Front Left Tyre", brand: previewData.tyreDetails?.frontLeftBrand, tread: previewData.tyreDetails?.frontLeftTread },
                  { label: "Rear Right Tyre", brand: previewData.tyreDetails?.rearRightBrand, tread: previewData.tyreDetails?.rearRightTread },
                  { label: "Rear Left Tyre", brand: previewData.tyreDetails?.rearLeftBrand, tread: previewData.tyreDetails?.rearLeftTread },
                  { label: "Spare Wheel", brand: previewData.tyreDetails?.spareBrand, tread: previewData.tyreDetails?.spareTread },
                ].map((t, idx) => (
                  <div key={idx} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
                    <span className="text-xs font-extrabold text-foreground block mb-1">{t.label}</span>
                    <span className="text-[11px] font-bold text-muted-foreground block">Brand: {t.brand || "Standard"}</span>
                    <span className="text-xs font-black text-[#10B981] block mt-1">Tread: {t.tread || 75}% remaining</span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        )}

        {/* STEP 5: Interior & Electrical */}
        {activeDetailStep === 4 && (
          <div className="space-y-8">
            <Panel
              title="Step 5: Interior & Electrical Checklist"
              description="Dashboard condition, AC performance, infotainment, and cabin features."
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
                    {previewData.ratings?.interior ? `${previewData.ratings.interior} / 5 Stars` : "4.4 / 5 Stars"}
                  </span>
                </div>
              }
            >
              <div className="grid gap-4.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {[
                  { label: "Battery Brand", val: previewData.interiorDetails?.batteryBrand },
                  { label: "AC Cooling Performance", val: previewData.interiorDetails?.acCooling },
                  { label: "Dashboard Condition", val: previewData.interiorDetails?.dashboard },
                  { label: "Infotainment System", val: previewData.interiorDetails?.infotainment },
                  { label: "Music System", val: previewData.interiorDetails?.musicSystem },
                  { label: "Power Windows", val: previewData.interiorDetails?.powerWindows },
                  { label: "Central Locking", val: previewData.interiorDetails?.centralLock },
                  { label: "Sunroof", val: previewData.interiorDetails?.sunroof },
                  { label: "Instrument Cluster", val: previewData.interiorDetails?.instrumentCluster },
                ].map((item, idx) => (
                  <div key={idx} className="rounded-2xl border border-border bg-secondary/30 p-4">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">{item.label}</span>
                    <span className="font-extrabold text-foreground text-sm">{item.val || "OK / Working"}</span>
                  </div>
                ))}
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
