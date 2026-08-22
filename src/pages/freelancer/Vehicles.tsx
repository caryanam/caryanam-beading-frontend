import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AppShell } from "@/components/app-shell";
import { freelancerNav } from "@/components/nav-config";
import { DataTable, type Column } from "@/components/data-table";
import { StatusChip, Panel } from "@/components/premium";
import { ConfirmModal } from "@/components/confirm-modal";
import { formatIndianDateTime } from "@/lib/utils";
import { inr } from "@/lib/mock-data";
import { toast } from "sonner";
import {
  Trash2,
  Edit3,
  Eye,
  ArrowLeft,
  Car,
  ShieldCheck,
  PlusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  AlertCircle,
  FileText,
  DollarSign,
  Camera,
  Video,
  User,
  Phone,
  MapPin,
  Info,
} from "lucide-react";
import {
  getFreelancerInspections,
  getFreelancerInspectionDetails,
  deleteFreelancerInspectionDraft,
} from "@/lib/api/freelancer-api";

export interface FreelancerVehicle {
  id: string | number;
  inspectionId?: number;
  registrationNumber?: string;
  regNo?: string;
  vehicleNumber?: string;
  customerName?: string;
  customerMobileNumber?: string;
  brand?: string;
  model?: string;
  variant?: string;
  year?: number;
  manufacturingYear?: number;
  registrationYear?: number;
  fuel?: string;
  fuelType?: string;
  transmission?: string;
  odometer?: number;
  odometerReading?: number;
  ownerProfileStatus?: string;
  ownerName?: string;
  insuranceValidity?: string;
  insuranceStatus?: string;
  price?: number;
  suggestedPrice?: number;
  location?: string;
  underHypothecation?: string;
  accidental?: string;
  rtoInformation?: string;
  status?: string;
  vehicleStatus?: string;
  rejectionReason?: string;
  createdAt?: string;
  submittedAt?: string;
  photosCount?: number;
  hasVideo?: boolean;
  photos?: string[];
  photoList?: { name: string; url: string }[];
  videoUrl?: string;
}

export function FreelancerVehicles() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [vehicles, setVehicles] = useState<FreelancerVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("All");

  const [previewId, setPreviewId] = useState<string | number | null>(null);
  const [previewData, setPreviewData] = useState<FreelancerVehicle | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const res = await getFreelancerInspections();
      let list: FreelancerVehicle[] = [];
      if (res.success && res.data) {
        list = res.data.map((item: any) => ({
          ...item,
          id: item.inspectionId || item.id,
          registrationNumber: item.vehicleNumber || item.registrationNumber,
        }));
      }
      setVehicles(list);
    } catch (err: any) {
      console.error("Failed to load freelancer vehicles", err);
      toast.error("Could not load vehicles list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const previewParam = searchParams.get("id") || searchParams.get("preview");

  useEffect(() => {
    if (previewParam) {
      const match = vehicles.find(
        (v) => String(v.id) === previewParam || String(v.inspectionId) === previewParam
      );
      if (match) {
        openPreview(match, false);
      }
    }
  }, [previewParam, vehicles]);

  const openPreview = async (v: FreelancerVehicle, updateUrl = true) => {
    const idVal = v.id || v.inspectionId || "1";
    setPreviewId(idVal);
    setPreviewData(v);
    if (updateUrl) {
      setSearchParams({ id: String(idVal) });
    }

    try {
      const detailRes = await getFreelancerInspectionDetails(idVal);
      if (detailRes.success && detailRes.data) {
        const d = detailRes.data;
        const veh = d.vehicleDetails || {};

        let photoUrls: string[] = [];
        let photoList: { name: string; url: string }[] = [];
        let videoUrl: string | undefined = d.videoUrl || undefined;

        if (!videoUrl && d.inspectionVideos && Array.isArray(d.inspectionVideos)) {
          const vidItem = d.inspectionVideos.find((v: any) => v.videoUrl && v.captured);
          if (vidItem) {
            videoUrl = vidItem.videoUrl;
          }
        }

        const rawPhotos = d.inspectionPhotos || d.photos || [];
        if (Array.isArray(rawPhotos)) {
          rawPhotos.forEach((item: any) => {
            const cat = item.imageCategory || item.displayName || item.photoType || "";
            const url = item.imageUrl || (typeof item === "string" ? item : "");
            if (!url) return;

            const lowerUrl = url.toLowerCase();
            const isVid =
              cat === "Engine / Motor Noise" ||
              cat.toLowerCase().includes("video") ||
              /\.(mp4|webm|mov|avi|mkv|3gp|flv|wmv)($|\?)/i.test(lowerUrl);

            if (isVid) {
              if (!videoUrl) videoUrl = url;
            } else {
              photoUrls.push(url);
              photoList.push({
                name: cat || `Photo #${photoList.length + 1}`,
                url,
              });
            }
          });
        }

        setPreviewData((prev) =>
          prev
            ? {
                ...prev,
                customerName: veh.customerName || prev.customerName,
                customerMobileNumber: veh.customerMobileNumber || prev.customerMobileNumber,
                registrationNumber: veh.vehicleNumber || prev.registrationNumber,
                brand: veh.brand || prev.brand,
                model: veh.model || prev.model,
                variant: veh.variant || prev.variant,
                manufacturingYear: veh.manufacturingYear || prev.manufacturingYear,
                registrationYear: veh.registrationYear || prev.registrationYear,
                fuelType: veh.fuelType || prev.fuelType,
                transmission: veh.transmission || prev.transmission,
                odometerReading: veh.odometerReading || prev.odometerReading,
                ownerProfileStatus: veh.ownerName || prev.ownerProfileStatus,
                insuranceValidity: veh.insuranceStatus || prev.insuranceValidity,
                price: veh.suggestedPrice || prev.price,
                location: veh.location || prev.location,
                underHypothecation: veh.underHypothecation || prev.underHypothecation,
                accidental: veh.accidental || prev.accidental,
                rtoInformation: veh.rtoInformation || prev.rtoInformation,
                photos: photoUrls.length > 0 ? photoUrls : prev.photos,
                photoList: photoList.length > 0 ? photoList : prev.photoList,
                videoUrl: videoUrl || prev.videoUrl,
              }
            : null
        );
      }
    } catch (err) {
      // Keep existing state
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
      await deleteFreelancerInspectionDraft(deleteTargetId);
      setVehicles((prev) =>
        prev.filter(
          (v) => String(v.id) !== String(deleteTargetId) && String(v.inspectionId) !== String(deleteTargetId)
        )
      );
      toast.success("Vehicle deleted successfully.");
      if (previewId === deleteTargetId) {
        closeDetailView();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete vehicle.");
    } finally {
      setDeleting(false);
      setDeleteTargetId(null);
    }
  };

  const columns: Column<FreelancerVehicle>[] = [
    {
      key: "id" as any,
      header: "ID",
      cell: (_, idx) => <span className="font-extrabold text-xs">{idx + 1}</span>,
    },
    {
      key: "vehicle" as any,
      header: "Vehicle Details",
      cell: (r) => (
        <div className="min-w-0">
          <p className="truncate font-bold text-sm text-foreground">
            {r.brand} {r.model} {r.variant}
          </p>
          <p className="text-xs text-muted-foreground font-semibold">
            {r.registrationNumber || r.regNo || r.vehicleNumber || "N/A"}
          </p>
        </div>
      ),
    },
    {
      key: "owner" as any,
      header: "Owner",
      cell: (r) => <span className="text-xs font-extrabold text-foreground">{r.ownerProfileStatus || r.ownerName || "1st Owner"}</span>,
    },
    {
      key: "suggestedPrice" as any,
      header: "Suggested Price",
      cell: (r) => {
        const val = r.price || r.suggestedPrice || 0;
        return <span className="font-black text-sm text-[#FFC700]">{val ? inr(val) : "N/A"}</span>;
      },
    },
    {
      key: "submittedAt" as any,
      header: "Submitted On",
      cell: (r) =>
        r.createdAt || r.submittedAt
          ? formatIndianDateTime(r.createdAt || r.submittedAt || "")
          : "Recently",
    },
    {
      key: "status" as any,
      header: "Status",
      cell: (r) => {
        const s = String(r.status || r.vehicleStatus || "").toLowerCase();
        let chipStatus = "draft";
        if (s === "approved" || s === "live") chipStatus = "approved";
        else if (s === "rejected") chipStatus = "rejected";
        else if (s === "pending" || s === "submitted" || s === "pending_approval") chipStatus = "submitted";
        else if (s === "draft") chipStatus = "draft";

        return (
          <div className="flex flex-col gap-1">
            <StatusChip status={chipStatus} />
            {s === "rejected" && r.rejectionReason && (
              <span className="text-[10px] font-extrabold text-rose-500 max-w-[140px] leading-tight mt-0.5">
                Reason: {r.rejectionReason}
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
        const s = String(v.status || "").toLowerCase();
        const canDelete = s === "draft";
        const vId = v.id || v.inspectionId || "1";

        return (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => openPreview(v)}
              className="grid size-8 place-items-center rounded-xl bg-card border border-border text-foreground hover:border-[#FFC700] hover:text-[#FFC700] transition-colors shadow-soft cursor-pointer"
              title="Preview Vehicle Specs & Photos"
            >
              <Eye className="size-3.5" />
            </button>

            <Link
              to={`/freelancer/add-vehicle?id=${vId}`}
              className="grid size-8 place-items-center rounded-xl bg-card border border-border text-foreground hover:border-[#FFC700] hover:text-[#FFC700] transition-colors shadow-soft"
              title={s === "draft" ? "Edit Draft" : "Edit & Resubmit"}
            >
              <Edit3 className="size-3.5 text-[#FFC700]" />
            </Link>

            {canDelete && (
              <button
                onClick={() => setDeleteTargetId(vId)}
                className="grid size-8 place-items-center rounded-xl bg-card border border-border text-rose-500 hover:border-rose-500/50 hover:bg-rose-500/10 transition-colors shadow-soft cursor-pointer"
                title="Delete Submission"
              >
                <Trash2 className="size-3.5" />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  const filteredVehicles = vehicles.filter((v) => {
    const s = String(v.status || v.vehicleStatus || "").toLowerCase();
    if (statusFilter === "All") return true;
    if (statusFilter === "Draft") return s === "draft";
    if (statusFilter === "Pending") return s === "pending" || s === "submitted" || s === "pending_approval";
    if (statusFilter === "Approved") return s === "approved" || s === "live";
    if (statusFilter === "Rejected") return s === "rejected";
    return true;
  });

  const getStatusCount = (status: string) => {
    if (status === "All") return vehicles.length;
    if (status === "Draft") {
      return vehicles.filter((v) => String(v.status || "").toLowerCase() === "draft").length;
    }
    if (status === "Pending") {
      return vehicles.filter((v) => {
        const s = String(v.status || "").toLowerCase();
        return s === "pending" || s === "submitted" || s === "pending_approval";
      }).length;
    }
    if (status === "Approved") {
      return vehicles.filter((v) => {
        const s = String(v.status || "").toLowerCase();
        return s === "approved" || s === "live";
      }).length;
    }
    if (status === "Rejected") {
      return vehicles.filter((v) => String(v.status || "").toLowerCase() === "rejected").length;
    }
    return 0;
  };

  const actionButtons = (
    <div className="flex flex-wrap items-center gap-2">
      {["All", "Draft", "Pending", "Approved", "Rejected"].map((status) => {
        const active = statusFilter === status;
        const count = getStatusCount(status);
        return (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`rounded-2xl border px-3.5 py-2 text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              active
                ? "bg-[#FFC700] border-[#FFC700] text-[#0D0E12] shadow-sm"
                : "border-border bg-card text-foreground hover:bg-secondary"
            }`}
          >
            <span>{status}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                active ? "bg-[#0D0E12]/15 text-[#0D0E12]" : "bg-secondary text-muted-foreground"
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
      role="freelancer"
      nav={freelancerNav}
      title={
        previewId !== null
          ? previewData
            ? `${previewData.brand || ""} ${previewData.model || ""} Vehicle Detail`
            : "Vehicle Detail"
          : "My Vehicles"
      }
      breadcrumb={
        previewId !== null
          ? ["Freelancer", "My Vehicles", `Vehicle #${previewId}`]
          : ["Freelancer", "My Vehicles"]
      }
    >
      {previewId === null ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">My Uploaded Vehicles</h1>
              <p className="text-xs text-muted-foreground">
                Manage your submitted vehicles and track approval status
              </p>
            </div>
            <Link
              to="/freelancer/add-vehicle"
              className="inline-flex items-center gap-2 rounded-2xl bg-[#FFC700] hover:bg-[#FFD633] px-5 py-3 text-xs font-black text-black transition-all shadow-md cursor-pointer self-start sm:self-auto"
            >
              <PlusCircle className="size-4" /> Add New Vehicle
            </Link>
          </div>

          {loading ? (
            <div className="flex h-60 items-center justify-center bg-card border border-border rounded-3xl shadow-soft">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
            </div>
          ) : (
            <DataTable
              rows={filteredVehicles}
              columns={columns}
              searchKeys={["registrationNumber", "regNo", "brand", "model", "customerName"]}
              placeholder="Search by registration number, brand, model, customer name..."
              actions={actionButtons}
            />
          )}
        </div>
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
                    {previewData?.brand} {previewData?.model} {previewData?.variant}
                  </h2>
                  <span className="rounded-lg bg-secondary border border-border px-2.5 py-0.5 text-xs font-extrabold text-foreground">
                    {previewData?.registrationNumber || previewData?.regNo || `#${previewId}`}
                  </span>
                  {previewData?.status && <StatusChip status={previewData.status} />}
                </div>
                <p className="text-xs font-semibold text-muted-foreground mt-1">
                  Submitted by Freelancer • {previewData?.createdAt ? formatIndianDateTime(previewData.createdAt) : "Recently"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
              <Link
                to={`/freelancer/add-vehicle?id=${previewId}`}
                className="inline-flex items-center gap-2 rounded-2xl border border-border bg-secondary/60 hover:bg-secondary text-foreground px-4 py-2.5 text-xs font-black shadow-sm transition-all"
              >
                <Edit3 className="size-4 text-[#FFC700]" /> Edit & Update
              </Link>
            </div>
          </div>

          {/* Details Content */}
          <div className="space-y-6">
            {/* Status Rejection Banner */}
            {previewData?.status?.toLowerCase() === "rejected" && (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 text-rose-500 flex items-start gap-3">
                <AlertCircle className="size-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-extrabold text-sm">Submission Rejected by Admin</p>
                  <p className="text-xs font-semibold mt-1">
                    Reason: {previewData.rejectionReason || "Please verify submitted vehicle specifications and photo quality."}
                  </p>
                </div>
              </div>
            )}

            {/* Customer & Basic Specifications Panel */}
            <Panel title="Vehicle Specifications & Customer Info" description="Basic specifications captured by freelancer">
              <div className="grid gap-4.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                <div className="rounded-2xl border border-border bg-secondary/30 p-4">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Customer Name</span>
                  <span className="font-extrabold text-foreground text-sm">{previewData?.customerName || "N/A"}</span>
                </div>
                <div className="rounded-2xl border border-border bg-secondary/30 p-4">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Customer Mobile</span>
                  <span className="font-extrabold text-foreground text-sm">{previewData?.customerMobileNumber || "N/A"}</span>
                </div>
                <div className="rounded-2xl border border-border bg-secondary/30 p-4">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Registration Number</span>
                  <span className="font-black text-[#FFC700] text-sm">
                    {previewData?.registrationNumber || previewData?.regNo || "N/A"}
                  </span>
                </div>
                <div className="rounded-2xl border border-border bg-secondary/30 p-4">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Make & Model</span>
                  <span className="font-extrabold text-foreground text-sm">
                    {previewData?.brand} {previewData?.model} {previewData?.variant}
                  </span>
                </div>
                <div className="rounded-2xl border border-border bg-secondary/30 p-4">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Manufacturing Year</span>
                  <span className="font-extrabold text-foreground text-sm">{previewData?.manufacturingYear || previewData?.year || "N/A"}</span>
                </div>
                <div className="rounded-2xl border border-border bg-secondary/30 p-4">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Registration Year</span>
                  <span className="font-extrabold text-foreground text-sm">{previewData?.registrationYear || previewData?.year || "N/A"}</span>
                </div>
                <div className="rounded-2xl border border-border bg-secondary/30 p-4">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Fuel Type & Transmission</span>
                  <span className="font-extrabold text-foreground text-sm">
                    {previewData?.fuelType || previewData?.fuel || "Petrol"} / {previewData?.transmission || "Manual"}
                  </span>
                </div>
                <div className="rounded-2xl border border-border bg-secondary/30 p-4">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Odometer Reading</span>
                  <span className="font-extrabold text-foreground text-sm">
                    {previewData?.odometerReading || previewData?.odometer ? `${previewData.odometerReading || previewData.odometer} km` : "N/A"}
                  </span>
                </div>
                <div className="rounded-2xl border border-border bg-secondary/30 p-4">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Owner Profile Status</span>
                  <span className="font-extrabold text-foreground text-sm">{previewData?.ownerProfileStatus || "1st Owner"}</span>
                </div>
                <div className="rounded-2xl border border-border bg-secondary/30 p-4">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Insurance Validity</span>
                  <span className="font-extrabold text-foreground text-sm">{previewData?.insuranceValidity || "Valid"}</span>
                </div>
                <div className="rounded-2xl border border-border bg-secondary/30 p-4">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Expected Price</span>
                  <span className="font-black text-[#FFC700] text-sm">
                    {previewData?.price || previewData?.suggestedPrice ? inr(previewData.price || previewData.suggestedPrice || 0) : "N/A"}
                  </span>
                </div>
                <div className="rounded-2xl border border-border bg-secondary/30 p-4">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Location</span>
                  <span className="font-extrabold text-foreground text-sm">{previewData?.location || "N/A"}</span>
                </div>
                <div className="rounded-2xl border border-border bg-secondary/30 p-4">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Under Hypothecation</span>
                  <span className="font-extrabold text-foreground text-sm">{previewData?.underHypothecation || "No"}</span>
                </div>
                <div className="rounded-2xl border border-border bg-secondary/30 p-4">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Accidental History</span>
                  <span className="font-extrabold text-foreground text-sm">{previewData?.accidental || "No"}</span>
                </div>
                <div className="rounded-2xl border border-border bg-secondary/30 p-4 sm:col-span-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">RTO Information</span>
                  <span className="font-extrabold text-foreground text-sm">{previewData?.rtoInformation || "N/A"}</span>
                </div>
              </div>
            </Panel>

            {/* Photos Gallery Panel */}
            <Panel title="Uploaded Basic Photos" description="Up to 10 photos submitted by freelancer">
              {(!previewData?.photoList || previewData.photoList.length === 0) && (!previewData?.photos || previewData.photos.length === 0) ? (
                <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-border bg-secondary/20 text-xs font-bold text-muted-foreground">
                  No photos uploaded for this vehicle.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  {(previewData.photoList && previewData.photoList.length > 0
                    ? previewData.photoList
                    : (previewData.photos || []).map((url, idx) => ({ name: `Photo #${idx + 1}`, url }))
                  ).map((item, idx) => (
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
            {previewData?.videoUrl && (
              <Panel title="Walkaround Video" description="1 short video submitted by freelancer">
                <div className="max-w-xl mx-auto rounded-2xl overflow-hidden border border-border bg-black shadow-soft">
                  <video src={previewData.videoUrl} controls className="w-full h-auto max-h-[360px]" />
                </div>
              </Panel>
            )}
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDelete}
        title="Delete Vehicle Submission"
        description="Are you sure you want to delete this vehicle submission? This action cannot be undone."
        confirmText="Delete Vehicle"
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
      />
    </AppShell>
  );
}
