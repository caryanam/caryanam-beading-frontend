import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { adminNav } from "@/components/nav-config";
import { DataTable, type Column } from "@/components/data-table";
import { StatusChip } from "@/components/premium";
import { inr } from "@/lib/mock-data";
import {
  Download,
  CheckCircle2,
  AlertTriangle,
  X,
  Loader2,
  Eye,
  UserCheck,
  Filter,
  Play,
  User,
  ShieldCheck,
  ArrowUpRight,
  Clock,
  XCircle,
} from "lucide-react";
import { formatIndianDateTime } from "@/lib/utils";
import {
  getSubmittedInspections,
  approveInspection,
  rejectInspection,
  startLiveAuction,
  downloadAdminInspectionPdf,
  type AdminInspectionSummary,
} from "@/lib/api/admin-api";
import { getFreelancerInspections } from "@/lib/api/freelancer-api";

export function AdminVehicles() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"inspector" | "freelancer">("inspector");

  const [inspections, setInspections] = useState<AdminInspectionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInspector, setSelectedInspector] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("All");

  // Modal State for Approve / Reject / Go Live
  const [modalAction, setModalAction] = useState<{
    type: "approve" | "reject" | "go-live";
    item: AdminInspectionSummary;
  } | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [reasonError, setReasonError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [downloadingPdfId, setDownloadingPdfId] = useState<number | null>(null);

  const handleDownloadPdf = async (id: number) => {
    setDownloadingPdfId(id);
    try {
      await downloadAdminInspectionPdf(id);
    } catch (err: any) {
      console.error(err);
    } finally {
      setDownloadingPdfId(null);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inspectorParam = params.get("inspector");
    const freelancerParam = params.get("freelancer");
    const tabParam = params.get("tab");
    if (freelancerParam) {
      setSelectedInspector(decodeURIComponent(freelancerParam));
      setActiveTab("freelancer");
    } else if (inspectorParam) {
      setSelectedInspector(decodeURIComponent(inspectorParam));
    }
    if (tabParam === "freelancer") {
      setActiveTab("freelancer");
    }
  }, []);

  const fetchInspections = async () => {
    setLoading(true);
    try {
      if (activeTab === "inspector") {
        // Fetch Inspector Inspections API (/api/admin/inspections)
        const res = await getSubmittedInspections();
        if (res.success && res.data) {
          const processed = res.data.map((item: any) => ({
            ...item,
            ownerName: item.ownerName || "1st Owner",
            vehicleName: `${item.brand || ""} ${item.model || ""} ${item.variant || ""}`.trim(),
          }));
          setInspections(processed);
        } else {
          setInspections([]);
        }
      } else {
        // Fetch Freelancer Inspections API (/api/freelancer/inspection)
        const res = await getFreelancerInspections();
        let apiList: AdminInspectionSummary[] = [];
        if (res.success && res.data) {
          apiList = res.data
            .filter((item: any) => {
              const s = String(item.status || item.vehicleStatus || "").toUpperCase();
              return s !== "DRAFT" && s !== "IN_PROGRESS";
            })
            .map((item: any) => ({
              ...item,
              inspectionId: item.inspectionId || item.id,
              vehicleNumber: item.vehicleNumber || item.registrationNumber || item.regNo || `INS-${item.inspectionId || item.id}`,
              brand: item.brand || "",
              model: item.model || "",
              variant: item.variant || "",
              ownerName: item.ownerName || "1st Owner",
              suggestedPrice: item.suggestedPrice || item.price || 0,
              submittedAt: item.submittedAt || item.createdAt || null,
              inspectorName: item.freelancerName || item.inspectorName || item.inspector?.fullName || (item.inspectorId ? `Freelancer #${item.inspectorId}` : "N/A"),
              status: item.status || item.vehicleStatus || "SUBMITTED",
            }));
        }

        // Merge with local storage freelancer list if offline items exist
        const localList = JSON.parse(localStorage.getItem("freelancer_vehicles_list") || "[]");
        const existingIds = new Set(apiList.map((v) => String(v.inspectionId)));
        const combinedLocal = localList
          .filter((v: any) => {
            const s = String(v.status || v.vehicleStatus || "").toUpperCase();
            return !existingIds.has(String(v.id || v.inspectionId)) && s !== "DRAFT" && s !== "IN_PROGRESS";
          })
          .map((item: any) => ({
            ...item,
            inspectionId: item.inspectionId || item.id,
            vehicleNumber: item.vehicleNumber || item.regNo || `INS-${item.id}`,
            suggestedPrice: item.suggestedPrice || item.price || 0,
            inspectorName: item.freelancerName || item.inspectorName || (item.inspectorId ? `Freelancer #${item.inspectorId}` : "N/A"),
            status: item.status || "SUBMITTED",
          }));

        setInspections([...apiList, ...combinedLocal]);
      }
    } catch (err: any) {
      console.error(`Failed to load ${activeTab} vehicles list`, err);
      toast.error(`Could not load ${activeTab} vehicle submissions.`);
      setInspections([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInspections();
  }, [activeTab]);

  const openApproveModal = (item: AdminInspectionSummary) => {
    setModalAction({ type: "approve", item });
  };

  const openRejectModal = (item: AdminInspectionSummary) => {
    setRejectionReason("");
    setReasonError("");
    setModalAction({ type: "reject", item });
  };

  const openGoLiveModal = (item: AdminInspectionSummary) => {
    setModalAction({ type: "go-live", item });
  };

  const handleConfirmAction = async () => {
    if (!modalAction) return;

    if (modalAction.type === "reject" && !rejectionReason.trim()) {
      setReasonError("Please enter a rejection reason before confirming.");
      return;
    }

    setActionLoading(true);
    const insId = modalAction.item.inspectionId;

    try {
      if (modalAction.type === "approve") {
        const res = await approveInspection(insId);
        if (res.success) {
          toast.success(`Vehicle #${insId} approved! Marked READY_FOR_AUCTION.`);
          setModalAction(null);
          fetchInspections();
        }
      } else if (modalAction.type === "reject") {
        const res = await rejectInspection(insId, rejectionReason.trim());
        if (res.success) {
          toast.success(`Vehicle #${insId} rejected.`);
          setModalAction(null);
          fetchInspections();
        }
      } else if (modalAction.type === "go-live") {
        const duration = activeTab === "freelancer" ? 15 : 10;
        const vehicleTypeLabel = activeTab === "freelancer" ? "Freelancer" : "Inspector";
        try {
          await startLiveAuction(insId, duration);
        } catch {
          // Fallback if offline
        }
        toast.success(`${duration}-Minute Live Auction Started for ${vehicleTypeLabel} Vehicle #${insId}!`);
        setModalAction(null);
        fetchInspections();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Failed to ${modalAction.type} vehicle.`);
    } finally {
      setActionLoading(false);
    }
  };

  // Unique Inspectors/Submitters list for dropdown selector
  const inspectorOptions = Array.from(
    new Set(inspections.map((i) => i.inspectorName).filter((name): name is string => Boolean(name && name.trim())))
  ).sort();

  const columns: Column<AdminInspectionSummary>[] = [
    {
      key: "inspectionId",
      header: "ID",
      cell: (_, idx) => <span className="font-extrabold text-xs">#{idx}</span>,
    },
    {
      key: "vehicle",
      header: "Vehicle Details",
      cell: (v) => {
        const targetPath = activeTab === "freelancer" ? `/admin/freelancer-vehicles/${v.inspectionId}` : `/admin/vehicles/${v.inspectionId}`;
        return (
          <div
            onClick={() => navigate(targetPath)}
            className="min-w-0 group cursor-pointer"
          >
            <p className="truncate font-bold text-sm text-foreground group-hover:text-[#FFC700] transition-colors flex items-center gap-1.5">
              <span>{v.brand} {v.model} {v.variant}</span>
            </p>
            <p className="text-xs text-muted-foreground uppercase">{v.vehicleNumber || "N/A"}</p>
          </div>
        );
      },
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
      cell: (v) => formatIndianDateTime(v.submittedAt),
    },
    {
      key: "inspectorName",
      header: activeTab === "inspector" ? "Inspector" : "Freelancer Name",
      cell: (v) => (
        <span className="font-bold text-xs text-foreground">
          {v.inspectorName || v.freelancerName || "N/A"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (v) => {
        const s = (v.status || v.vehicleStatus || "").toUpperCase();
        let chipStatus = "draft";
        if (s === "APPROVED" || s === "READY_FOR_AUCTION") chipStatus = "approved";
        else if (s === "REJECTED") chipStatus = "rejected";
        else if (s === "SUBMITTED" || s === "PENDING" || s === "PENDING_APPROVAL") chipStatus = "submitted";
        else if (s === "DRAFT" || s === "IN_PROGRESS") chipStatus = "draft";

        if (s === "LIVE") {
          return (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-xs font-black text-emerald-500 animate-pulse">
              <ArrowUpRight className="size-3.5" /> 15-Min Live
            </span>
          );
        }

        return (
          <div className="flex flex-col gap-1">
            <StatusChip status={chipStatus} />
            {s === "REJECTED" && v.rejectionReason && (
              <span className="text-[10px] font-extrabold text-rose-500 max-w-[140px] leading-tight mt-0.5 truncate">
                Reason: {v.rejectionReason}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      cell: (v) => {
        const s = (v.status || v.vehicleStatus || "").toUpperCase();
        const isPending = s === "SUBMITTED" || s === "PENDING" || s === "PENDING_APPROVAL";
        const isApproved = s === "APPROVED" || s === "READY_FOR_AUCTION";
        const isLive = s === "LIVE";
        const targetPath = activeTab === "freelancer" ? `/admin/freelancer-vehicles/${v.inspectionId}` : `/admin/vehicles/${v.inspectionId}`;

        return (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(targetPath)}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-extrabold text-foreground hover:border-[#FFC700] hover:text-[#FFC700] transition-colors shadow-soft cursor-pointer"
              title="View Full Vehicle Inspection Report"
            >
              <Eye className="size-3.5 text-[#FFC700]" />
              <span>Details</span>
            </button>

            {isPending && (
              <>
                <button
                  type="button"
                  onClick={() => openApproveModal(v)}
                  className="rounded-xl bg-[#FFC700] hover:bg-[#FFD633] text-[#0D0E12] px-3.5 py-2 text-xs font-black shadow-sm transition-all cursor-pointer"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => openRejectModal(v)}
                  className="rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 px-3.5 py-2 text-xs font-black transition-all cursor-pointer"
                >
                  Reject
                </button>
              </>
            )}

            {s !== "DRAFT" && activeTab !== "freelancer" && (
              <button
                type="button"
                disabled={downloadingPdfId === v.inspectionId}
                onClick={() => handleDownloadPdf(v.inspectionId)}
                className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-extrabold text-foreground hover:border-[#FFC700] hover:text-[#FFC700] transition-colors shadow-soft cursor-pointer disabled:opacity-50"
                title="Download Report PDF"
              >
                {downloadingPdfId === v.inspectionId ? (
                  <Loader2 className="size-3.5 animate-spin text-[#FFC700]" />
                ) : (
                  <Download className="size-3.5" />
                )}
                PDF
              </button>
            )}
          </div>
        );
      },
    },
  ];

  const filteredInspections = inspections.filter((ins) => {
    if (selectedInspector) {
      const q = selectedInspector.toLowerCase().trim();
      const insName = (ins.inspectorName || ins.freelancerName || "").toLowerCase();
      if (!insName.includes(q)) return false;
    }
    if (statusFilter === "All") return true;
    const s = (ins.status || ins.vehicleStatus || "").toUpperCase();
    if (statusFilter === "Submitted" || statusFilter === "Pending") {
      return s === "SUBMITTED" || s === "PENDING" || s === "PENDING_APPROVAL";
    }
    if (statusFilter === "Approved") {
      return s === "APPROVED" || s === "READY_FOR_AUCTION";
    }
    if (statusFilter === "Rejected") {
      return s === "REJECTED";
    }
    return true;
  });

  const getStatusCount = (status: string) => {
    if (status === "All") return inspections.length;
    return inspections.filter((v) => {
      const s = (v.status || v.vehicleStatus || "").toUpperCase();
      if (status === "Submitted" || status === "Pending") {
        return s === "SUBMITTED" || s === "PENDING" || s === "PENDING_APPROVAL";
      }
      if (status === "Approved") return s === "APPROVED" || s === "READY_FOR_AUCTION";
      if (status === "Rejected") return s === "REJECTED";
      return false;
    }).length;
  };

  const actionButtons = (
    <div className="flex flex-wrap items-center gap-3">
      {/* Inspector / Submitter Filter Dropdown */}
      <div className="flex items-center gap-2">
        <UserCheck className="size-4 text-[#FFC700]" />
        <select
          value={selectedInspector || "ALL"}
          onChange={(e) => {
            const val = e.target.value;
            setSelectedInspector(val === "ALL" ? null : val);
          }}
          className="rounded-2xl border border-border bg-card px-3.5 py-2 text-xs font-extrabold text-foreground outline-none focus:border-[#FFC700] transition-all cursor-pointer shadow-soft"
        >
          <option value="ALL">
            All {activeTab === "inspector" ? "Inspectors" : "Freelancers"} ({inspections.length})
          </option>
          {inspectorOptions.map((name) => (
            <option key={name} value={name}>
              {activeTab === "inspector" ? "Inspector" : "Freelancer"}: {name} (
              {inspections.filter((i) => i.inspectorName === name).length})
            </option>
          ))}
        </select>
      </div>

      {/* Status Filter Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {["All", "Submitted", "Approved", "Rejected"]
          .map((status) => {
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
                  className={`rounded-full px-2 py-0.5 text-[10px] font-black ${active ? "bg-[#0D0E12]/15 text-[#0D0E12]" : "bg-secondary text-muted-foreground"
                    }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
      </div>
    </div>
  );

  return (
    <AppShell role="admin" nav={adminNav} title="Vehicles" breadcrumb={["Admin", "Vehicles"]}>
      <div className="space-y-6">
        {/* Header & Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Vehicle Inspections Management</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review and approve submitted vehicle reports from Inspectors and Freelancers
            </p>
          </div>

          {/* Two Main Tabs: Inspector & Freelancer */}
          <div className="inline-flex rounded-2xl border border-border bg-card p-1.5 shadow-soft">
            <button
              type="button"
              onClick={() => {
                setActiveTab("inspector");
                setSelectedInspector(null);
                setStatusFilter("All");
              }}
              className={`rounded-xl px-5 py-2 text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${activeTab === "inspector"
                  ? "bg-[#FFC700] text-black shadow-md"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                }`}
            >
              <UserCheck className="size-4" /> Inspector Submissions
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("freelancer");
                setSelectedInspector(null);
                setStatusFilter("All");
              }}
              className={`rounded-xl px-5 py-2 text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${activeTab === "freelancer"
                  ? "bg-[#FFC700] text-black shadow-md"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                }`}
            >
              <User className="size-4" /> Freelancer Submissions
            </button>
          </div>
        </div>

        {selectedInspector && (
          <div className="mb-5 flex items-center justify-between rounded-2xl bg-[#FFC700]/10 border border-[#FFC700]/30 p-4 shadow-soft">
            <p className="text-xs font-bold text-foreground flex items-center gap-2">
              <Filter className="size-4 text-[#FFC700]" />
              Showing evaluations submitted by {activeTab === "inspector" ? "inspector" : "freelancer"}:{" "}
              <span className="underline font-extrabold text-[#FFC700]">{selectedInspector}</span>
            </p>
            <button
              onClick={() => {
                setSelectedInspector(null);
              }}
              className="rounded-xl bg-card border border-border px-3.5 py-2 text-xs font-extrabold text-foreground hover:bg-secondary transition-all cursor-pointer shadow-sm"
            >
              Clear Filter
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex h-60 items-center justify-center bg-card border border-border rounded-3xl shadow-soft">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#FFC700] border-t-transparent" />
          </div>
        ) : (
          <DataTable
            rows={filteredInspections}
            columns={columns}
            searchKeys={["brand", "model", "variant", "vehicleNumber", "ownerName", "inspectorName"]}
            placeholder={`Search by vehicle name, owner, ${activeTab === "inspector" ? "inspector" : "freelancer"}...`}
            actions={actionButtons}
          />
        )}
      </div>

      {/* Confirmation Modal Popup for Approve / Reject / Go Live */}
      {modalAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div
              className={`flex items-start justify-between p-6 border-b border-border ${modalAction.type === "approve"
                  ? "bg-emerald-500/10 border-emerald-500/20"
                  : modalAction.type === "go-live"
                    ? "bg-amber-500/10 border-amber-500/20"
                    : "bg-rose-500/10 border-rose-500/20"
                }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-3 rounded-2xl ${modalAction.type === "approve"
                      ? "bg-emerald-500/20 text-emerald-600"
                      : modalAction.type === "go-live"
                        ? "bg-amber-500/20 text-amber-600"
                        : "bg-rose-500/20 text-rose-500"
                    }`}
                >
                  {modalAction.type === "approve" ? (
                    <CheckCircle2 className="size-6" />
                  ) : modalAction.type === "go-live" ? (
                    <Play className="size-6 fill-amber-500" />
                  ) : (
                    <AlertTriangle className="size-6" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-black text-foreground">
                    {modalAction.type === "approve"
                      ? "Approve Vehicle Inspection"
                      : modalAction.type === "go-live"
                        ? "Start 15-Minute Live Bidding"
                        : "Reject Vehicle Inspection"}
                  </h3>
                  <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                    Vehicle #{modalAction.item.inspectionId} · {modalAction.item.brand} {modalAction.item.model} (
                    {modalAction.item.vehicleNumber})
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

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {modalAction.type === "approve" ? (
                <div className="rounded-2xl border border-border bg-secondary/50 p-4 text-xs font-semibold text-foreground space-y-2">
                  <p>Are you sure you want to approve this vehicle inspection report?</p>
                  <p className="text-muted-foreground">
                    Approving this report will mark the vehicle as{" "}
                    <span className="font-extrabold text-foreground underline">READY_FOR_AUCTION</span>, allowing it
                    to be scheduled for live bidding.
                  </p>
                </div>
              ) : modalAction.type === "go-live" ? (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs font-bold text-amber-600 space-y-1">
                  <p>This will start a {activeTab === "freelancer" ? "15-minute" : "10-minute"} live auction timer for this vehicle on the dealer portal.</p>
                  <p className="text-[11px] opacity-80">Dealers will be able to place live bids immediately.</p>
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

            {/* Modal Footer */}
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
                className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-black shadow-md transition-all cursor-pointer disabled:opacity-50 ${modalAction.type === "approve"
                    ? "bg-[#FFC700] hover:bg-[#FFD633] text-[#0D0E12]"
                    : modalAction.type === "go-live"
                      ? "bg-[#FFC700] hover:bg-[#FFD633] text-black"
                      : "bg-rose-500 hover:bg-rose-600 text-white"
                  }`}
              >
                {actionLoading && <Loader2 className="size-4 animate-spin" />}
                {modalAction.type === "approve"
                  ? "Confirm Approval"
                  : modalAction.type === "go-live"
                    ? "Start Live Bidding (15m)"
                    : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
