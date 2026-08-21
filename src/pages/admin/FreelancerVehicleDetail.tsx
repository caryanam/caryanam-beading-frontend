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
  Eye,
  X,
  Loader2,
  User,
  ShieldCheck,
  Phone,
  MapPin,
  Camera,
  Video,
  Gavel,
  Trophy,
  History,
  TrendingUp,
} from "lucide-react";
import {
  approveInspection,
  rejectInspection,
  getInspectionById,
} from "@/lib/api/admin-api";
import { getFreelancerInspectionDetails } from "@/lib/api/freelancer-api";

export function AdminFreelancerVehicleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [previewData, setPreviewData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [bidHistory, setBidHistory] = useState<any[]>([]);

  // Modal State for Approve / Reject actions
  const [modalAction, setModalAction] = useState<"approve" | "reject" | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [reasonError, setReasonError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const formatMediaUrl = (url?: string | null) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:") || url.startsWith("blob:")) return url;
    const cleanBase = API_BASE_URL.replace(/\/+$/, "");
    const cleanPath = url.startsWith("/") ? url : `/${url}`;
    return `${cleanBase}${cleanPath}`;
  };

  const fetchDetails = async () => {
    if (!id) return;
    setLoading(true);
    try {
      let raw: any = null;

      // First try freelancer inspection details API
      try {
        const fRes = await getFreelancerInspectionDetails(id);
        if (fRes?.success && fRes?.data) {
          raw = fRes.data;
        } else if (fRes && ((fRes as any).id || (fRes as any).inspectionId || (fRes as any).vehicleDetails)) {
          raw = fRes;
        }
      } catch (e) {
        console.warn("Freelancer details API failed, trying admin fallback...", e);
      }

      // Fallback to getInspectionById if needed
      if (!raw) {
        try {
          const aRes = await getInspectionById(Number(id));
          raw = aRes?.data || aRes;
        } catch (e) {
          console.warn("Admin getInspectionById also failed", e);
        }
      }

      // Fallback to local storage freelancer list if offline/draft
      if (!raw) {
        const localList = JSON.parse(localStorage.getItem("freelancer_vehicles_list") || "[]");
        const found = localList.find((v: any) => String(v.id || v.inspectionId) === String(id));
        if (found) {
          raw = found;
        }
      }

      if (raw) {
        setPreviewData(raw);
        const history = raw.bidHistory || raw.bids || [];
        setBidHistory(history);
      } else {
        toast.error("Could not load freelancer vehicle inspection details.");
      }
    } catch (err: any) {
      console.error("Failed to load freelancer vehicle details", err);
      toast.error("Could not load freelancer vehicle inspection details.");
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

  const handleConfirmAction = async () => {
    if (!id || !modalAction) return;

    if (modalAction === "reject" && !rejectionReason.trim()) {
      setReasonError("Please enter a rejection reason before confirming.");
      return;
    }

    setActionLoading(true);
    try {
      if (modalAction === "approve") {
        const res = await approveInspection(Number(id));
        if (res.success) {
          toast.success("Freelancer inspection report approved! Vehicle set to READY_FOR_AUCTION.");
          setModalAction(null);
          fetchDetails();
        }
      } else {
        const res = await rejectInspection(Number(id), rejectionReason.trim());
        if (res.success) {
          toast.success("Freelancer inspection report rejected.");
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
      <AppShell role="admin" nav={adminNav} title="Loading Freelancer Vehicle..." breadcrumb={["Admin", "Vehicles", "Freelancer Submission"]}>
        <div className="flex h-96 flex-col items-center justify-center gap-4 bg-card border border-border rounded-3xl shadow-soft">
          <span className="h-12 w-12 animate-spin rounded-full border-4 border-[#FFC700] border-t-transparent" />
          <p className="text-sm font-extrabold text-muted-foreground animate-pulse">
            Fetching Freelancer Vehicle Inspection Details...
          </p>
        </div>
      </AppShell>
    );
  }

  if (!previewData) {
    return (
      <AppShell role="admin" nav={adminNav} title="Not Found" breadcrumb={["Admin", "Vehicles", "Freelancer Submission"]}>
        <div className="rounded-3xl border border-dashed border-border bg-card p-16 text-center shadow-soft">
          <p className="font-extrabold text-foreground text-lg">Freelancer vehicle details not found.</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-[#FFC700] px-5 py-2.5 text-xs font-extrabold text-[#0D0E12] shadow-sm hover:scale-105 transition-all cursor-pointer"
          >
            <ArrowLeft className="size-4" /> Go Back
          </button>
        </div>
      </AppShell>
    );
  }

  const vDetails = previewData.vehicleDetails || previewData;
  const status = previewData.status || previewData.vehicleStatus || "SUBMITTED";
  const isPending = status === "SUBMITTED" || status === "PENDING" || status === "PENDING_APPROVAL";

  const highestBid = previewData.currentHighestBid || previewData.highestBidAmount || (bidHistory.length > 0 ? (bidHistory[0].amount || bidHistory[0].bidAmount || 0) : 0);
  const highestBidder = previewData.currentHighestBidder || (bidHistory.length > 0 ? (bidHistory[0].dealerName || bidHistory[0].dealershipName || bidHistory[0].dealer) : "No Bids Placed");
  const totalBidsCount = previewData.totalBids || bidHistory.length || 0;

  // Parse photos and video
  let photoList: { name: string; url: string }[] = [];
  let videoUrl: string | null = previewData.videoUrl || null;

  if (previewData.inspectionPhotos && Array.isArray(previewData.inspectionPhotos)) {
    previewData.inspectionPhotos.forEach((p: any) => {
      const name = p.displayName || p.imageCategory || p.photoType || "Photo";
      const rawUrl = p.imageUrl || p.url;
      if (rawUrl) {
        photoList.push({ name, url: formatMediaUrl(rawUrl) });
      }
    });
  } else if (previewData.photos && Array.isArray(previewData.photos)) {
    previewData.photos.forEach((url: string, idx: number) => {
      if (url) {
        photoList.push({ name: `Photo #${idx + 1}`, url: formatMediaUrl(url) });
      }
    });
  }

  if (!videoUrl && previewData.inspectionVideos && Array.isArray(previewData.inspectionVideos)) {
    const vidItem = previewData.inspectionVideos.find((v: any) => v.videoUrl || v.url);
    if (vidItem) {
      videoUrl = vidItem.videoUrl || vidItem.url;
    }
  }

  if (videoUrl) {
    videoUrl = formatMediaUrl(videoUrl);
  }

  const freelancerName =
    previewData.freelancerName ||
    previewData.inspectorName ||
    previewData.inspector?.fullName ||
    (previewData.inspectorId ? `Freelancer #${previewData.inspectorId}` : "Freelancer");

  return (
    <AppShell
      role="admin"
      nav={adminNav}
      title={vDetails.brand ? `${vDetails.brand} ${vDetails.model}` : `Freelancer Inspection #${id}`}
      breadcrumb={["Admin", "Vehicles", `Freelancer #${id}`]}
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
                  {vDetails.brand || ""} {vDetails.model || ""} {vDetails.variant || ""}
                </h2>
                <span className="rounded-lg bg-secondary border border-border px-2.5 py-0.5 text-xs font-extrabold text-foreground">
                  {vDetails.vehicleNumber || vDetails.registrationNumber || vDetails.regNo || `#${id}`}
                </span>
                <StatusChip status={status} />
              </div>
              <p className="text-xs font-semibold text-muted-foreground mt-1 flex items-center gap-1.5 flex-wrap">
                <span>Submitted by Freelancer:</span>
                <span className="font-extrabold text-foreground underline">{freelancerName}</span>
                <span>•</span>
                <span>Submitted on {previewData.submittedAt || previewData.createdAt ? formatIndianDateTime(previewData.submittedAt || previewData.createdAt) : "Recently"}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto flex-wrap">
            {isPending && (
              <>
                <button
                  type="button"
                  onClick={() => setModalAction("approve")}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#FFC700] hover:bg-[#FFD633] text-[#0D0E12] px-4 py-2.5 text-xs font-black shadow-sm transition-all cursor-pointer"
                >
                  <CheckCircle2 className="size-4" /> Approve Submission
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
                  <AlertTriangle className="size-4" /> Reject Submission
                </button>
              </>
            )}
          </div>
        </div>

        {/* Status Alert Banner */}
        {status.toUpperCase() === "REJECTED" && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 text-rose-500 flex items-start gap-3">
            <AlertCircle className="size-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold text-sm">Submission Rejected by Admin</p>
              <p className="text-xs font-semibold mt-1">
                Reason: {previewData.rejectionReason || "Please verify vehicle details and photos."}
              </p>
            </div>
          </div>
        )}

        {/* Vehicle Specifications & Customer Info */}
        <Panel
          title="Vehicle Specifications & Customer Info"
          description="Key details captured during freelancer submission"
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
              <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Registration Number</span>
              <span className="font-black text-[#FFC700] text-sm">
                {vDetails.vehicleNumber || vDetails.registrationNumber || vDetails.regNo || "N/A"}
              </span>
            </div>
            <div className="rounded-2xl border border-border bg-secondary/30 p-4">
              <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Make & Model</span>
              <span className="font-extrabold text-foreground text-sm">
                {vDetails.brand} {vDetails.model} {vDetails.variant}
              </span>
            </div>
            <div className="rounded-2xl border border-border bg-secondary/30 p-4">
              <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Manufacturing Year</span>
              <span className="font-extrabold text-foreground text-sm">{vDetails.manufacturingYear || vDetails.year || "N/A"}</span>
            </div>
            <div className="rounded-2xl border border-border bg-secondary/30 p-4">
              <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Registration Year</span>
              <span className="font-extrabold text-foreground text-sm">{vDetails.registrationYear || vDetails.year || "N/A"}</span>
            </div>
            <div className="rounded-2xl border border-border bg-secondary/30 p-4">
              <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Fuel Type & Transmission</span>
              <span className="font-extrabold text-foreground text-sm">
                {vDetails.fuelType || vDetails.fuel || "Petrol"} / {vDetails.transmission || "Manual"}
              </span>
            </div>
            <div className="rounded-2xl border border-border bg-secondary/30 p-4">
              <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Odometer Reading</span>
              <span className="font-extrabold text-foreground text-sm">
                {vDetails.odometerReading || vDetails.odometer ? `${vDetails.odometerReading || vDetails.odometer} km` : "N/A"}
              </span>
            </div>
            <div className="rounded-2xl border border-border bg-secondary/30 p-4">
              <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Owner Profile Status</span>
              <span className="font-extrabold text-foreground text-sm">{vDetails.ownerProfileStatus || vDetails.ownerName || "1st Owner"}</span>
            </div>
            <div className="rounded-2xl border border-border bg-secondary/30 p-4">
              <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Insurance Status</span>
              <span className="font-extrabold text-foreground text-sm">{vDetails.insuranceStatus || vDetails.insuranceValidity || "Valid"}</span>
            </div>
            <div className="rounded-2xl border border-border bg-secondary/30 p-4">
              <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Suggested / Expected Price</span>
              <span className="font-black text-[#FFC700] text-sm">
                {vDetails.suggestedPrice || vDetails.price ? inr(vDetails.suggestedPrice || vDetails.price) : "N/A"}
              </span>
            </div>
            <div className="rounded-2xl border border-border bg-secondary/30 p-4">
              <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Location</span>
              <span className="font-extrabold text-foreground text-sm">{vDetails.location || "N/A"}</span>
            </div>
            <div className="rounded-2xl border border-border bg-secondary/30 p-4">
              <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Under Hypothecation</span>
              <span className="font-extrabold text-foreground text-sm">{vDetails.underHypothecation || "No"}</span>
            </div>
            <div className="rounded-2xl border border-border bg-secondary/30 p-4">
              <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Accidental History</span>
              <span className="font-extrabold text-foreground text-sm">{vDetails.accidental || "No"}</span>
            </div>
            <div className="rounded-2xl border border-border bg-secondary/30 p-4 sm:col-span-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">RTO Information</span>
              <span className="font-extrabold text-foreground text-sm">{vDetails.rtoInformation || vDetails.rto || "N/A"}</span>
            </div>
          </div>
        </Panel>

        {/* Uploaded Basic Photos Gallery */}
        <Panel title="Uploaded Photos Gallery" description="Photos submitted by freelancer">
          {photoList.length === 0 ? (
            <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-border bg-secondary/20 text-xs font-bold text-muted-foreground">
              No photos uploaded for this vehicle.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
              {photoList.map((item, idx) => (
                <div key={idx} className="relative group rounded-2xl overflow-hidden border border-border bg-secondary aspect-[4/3] shadow-soft">
                  <img src={item.url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => window.open(item.url, "_blank")}
                      className="inline-flex items-center gap-1 rounded-xl bg-[#FFC700] text-black px-3 py-1.5 text-[11px] font-black shadow-md cursor-pointer"
                    >
                      <Eye className="size-3.5" /> View Photo
                    </button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/75 backdrop-blur-xs text-white text-[11px] font-extrabold p-1.5 text-center truncate">
                    {item.name}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        {/* Walkaround Video Panel */}
        {videoUrl && (
          <Panel title="Walkaround Video" description="Short vehicle walkaround video submitted by freelancer">
            <div className="max-w-xl mx-auto rounded-2xl overflow-hidden border border-border bg-black shadow-soft">
              <video key={videoUrl} src={videoUrl} controls preload="metadata" playsInline className="w-full h-auto max-h-[360px] rounded-2xl" />
            </div>
          </Panel>
        )}

        {/* Live Auction & Bid History Telemetry Panel */}
        <Panel
          title="Live Auction & Bid History Telemetry"
          description="Complete list of all bids placed by registered dealers on this freelancer vehicle."
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
                <span className="text-sm font-black text-foreground block">{vDetails.suggestedPrice || vDetails.price ? inr(vDetails.suggestedPrice || vDetails.price) : "N/A"}</span>
              </div>
            </div>
          </div>

          {/* Bid History Table */}
          {bidHistory.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-secondary/20 p-10 text-center">
              <History className="size-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs font-bold text-muted-foreground">No bids have been placed on this freelancer vehicle yet.</p>
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
                      {modalAction === "approve" ? "Approve Freelancer Vehicle" : "Reject Freelancer Vehicle"}
                    </h3>
                    <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                      Vehicle #{id} · {vDetails.brand} {vDetails.model} ({vDetails.vehicleNumber || vDetails.registrationNumber})
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
                    <p>Are you sure you want to approve this freelancer vehicle submission?</p>
                    <p className="text-muted-foreground">
                      Approving this submission will mark the vehicle as <span className="font-extrabold text-foreground underline">READY_FOR_AUCTION</span>, allowing it to be scheduled for live bidding.
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
                      placeholder="Enter detailed reason for rejecting this freelancer vehicle..."
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
