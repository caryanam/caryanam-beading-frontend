import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { adminNav } from "@/components/nav-config";
import { DataTable, type Column } from "@/components/data-table";
import { StatusChip } from "@/components/premium";
import { inr } from "@/lib/mock-data";
import { Download, CheckCircle2, AlertTriangle, X, Loader2 } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import {
  getSubmittedInspections,
  approveInspection,
  rejectInspection,
  downloadAdminInspectionPdf,
  type AdminInspectionSummary,
} from "@/lib/api/admin-api";

export function AdminVehicles() {
  const [inspections, setInspections] = useState<AdminInspectionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInspector, setSelectedInspector] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("All");

  // Modal State for Approve / Reject actions
  const [modalAction, setModalAction] = useState<{
    type: "approve" | "reject";
    item: AdminInspectionSummary;
  } | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [reasonError, setReasonError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inspectorParam = params.get("inspector");
    if (inspectorParam) {
      setSelectedInspector(decodeURIComponent(inspectorParam));
    }
  }, []);

  const fetchInspections = async () => {
    setLoading(true);
    try {
      const res = await getSubmittedInspections();
      if (res.success && res.data) {
        // Preprocess list to support search queries and fallback owner names
        const processed = res.data.map((item: any) => ({
          ...item,
          ownerName: item.ownerName || "1st Owner",
          vehicleName: `${item.brand || ""} ${item.model || ""} ${item.variant || ""}`.trim(),
        }));
        setInspections(processed);
      }
    } catch (err: any) {
      console.error("Failed to load admin inspections list", err);
      toast.error("Could not load vehicle inspections list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInspections();
  }, []);

  const openApproveModal = (item: AdminInspectionSummary) => {
    setModalAction({ type: "approve", item });
  };

  const openRejectModal = (item: AdminInspectionSummary) => {
    setRejectionReason("");
    setReasonError("");
    setModalAction({ type: "reject", item });
  };

  const handleConfirmAction = async () => {
    if (!modalAction) return;

    if (modalAction.type === "reject") {
      if (!rejectionReason.trim()) {
        setReasonError("Please enter a rejection reason before confirming.");
        return;
      }
    }

    setActionLoading(true);
    try {
      if (modalAction.type === "approve") {
        const res = await approveInspection(modalAction.item.inspectionId);
        if (res.success) {
          toast.success("Inspection approved successfully. Vehicle set to READY_FOR_AUCTION.");
          setModalAction(null);
          fetchInspections();
        }
      } else {
        const res = await rejectInspection(modalAction.item.inspectionId, rejectionReason.trim());
        if (res.success) {
          toast.success("Inspection rejected successfully.");
          setModalAction(null);
          fetchInspections();
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Failed to ${modalAction.type} inspection.`);
    } finally {
      setActionLoading(false);
    }
  };

  const columns: Column<AdminInspectionSummary>[] = [
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
    { key: "ownerName", header: "Owner", cell: (v) => v.ownerName },
    {
      key: "suggestedPrice",
      header: "Suggested Price",
      cell: (v) => (v.suggestedPrice ? inr(v.suggestedPrice) : "N/A"),
    },
    { key: "inspectorName", header: "Inspector", cell: (v) => v.inspectorName },
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
      key: "actions",
      header: "Actions",
      cell: (v) => {
        const isActionable = v.status === "SUBMITTED";
        return (
          <div className="flex items-center gap-2">
            {isActionable && (
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
            {v.status !== "DRAFT" && (
              <a
                href={`${API_BASE_URL}/api/admin/inspection/${v.inspectionId}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-extrabold text-foreground hover:border-[#FFC700] hover:text-[#FFC700] transition-colors shadow-soft"
                title="Download Report PDF"
              >
                <Download className="size-3.5" /> PDF
              </a>
            )}
          </div>
        );
      },
    },
  ];

  const filteredInspections = inspections.filter((ins) => {
    if (selectedInspector && ins.inspectorName !== selectedInspector) {
      return false;
    }
    if (statusFilter === "All") return true;
    return ins.status.toUpperCase() === statusFilter.toUpperCase();
  });

  const getStatusCount = (status: string) => {
    if (status === "All") return inspections.length;
    return inspections.filter((v) => v.status.toUpperCase() === status.toUpperCase()).length;
  };

  const actionButtons = (
    <div className="flex flex-wrap items-center gap-2">
      {["All", "Submitted", "Approved", "Rejected"].map((status) => {
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
                active
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
    <AppShell role="admin" nav={adminNav} title="Vehicles" breadcrumb={["Admin", "Vehicles"]}>
      {selectedInspector && (
        <div className="mb-5 flex items-center justify-between rounded-2xl bg-[#FFC700]/10 border border-[#FFC700]/30 p-4 shadow-soft">
          <p className="text-xs font-bold text-foreground">
            Showing evaluations submitted by inspector: <span className="underline font-extrabold">{selectedInspector}</span>
          </p>
          <button
            onClick={() => {
              setSelectedInspector(null);
              // Clear URL parameter without reloading
              window.history.pushState({}, "", "/admin/vehicles");
            }}
            className="rounded-xl bg-card border border-border px-3.5 py-2 text-xs font-extrabold text-foreground hover:bg-secondary transition-all cursor-pointer shadow-sm"
          >
            Clear Filter
          </button>
        </div>
      )}
      {loading ? (
        <div className="flex h-60 items-center justify-center bg-card border border-border rounded-3xl shadow-soft">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <DataTable
          rows={filteredInspections}
          columns={columns}
          searchKeys={["brand", "model", "variant", "vehicleNumber", "ownerName", "inspectorName"]}
          placeholder="Search by vehicle name, owner, inspector..."
          actions={actionButtons}
        />
      )}

      {/* Modern Confirmation Modal Popup for Approve / Reject */}
      {modalAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className={`flex items-start justify-between p-6 border-b border-border ${
              modalAction.type === "approve" ? "bg-emerald-500/10 border-emerald-500/20" : "bg-rose-500/10 border-rose-500/20"
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl ${
                  modalAction.type === "approve" ? "bg-emerald-500/20 text-emerald-600" : "bg-rose-500/20 text-rose-500"
                }`}>
                  {modalAction.type === "approve" ? (
                    <CheckCircle2 className="size-6" />
                  ) : (
                    <AlertTriangle className="size-6" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-black text-foreground">
                    {modalAction.type === "approve" ? "Approve Vehicle Inspection" : "Reject Vehicle Inspection"}
                  </h3>
                  <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                    Vehicle #{modalAction.item.inspectionId} · {modalAction.item.brand} {modalAction.item.model} ({modalAction.item.vehicleNumber})
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
                  <p>
                    Are you sure you want to approve this vehicle inspection report?
                  </p>
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
                    placeholder="Enter detailed reason for rejecting this inspection report (e.g. Engine oil photo missing, odometer reading mismatch)..."
                    className="w-full rounded-2xl border border-border bg-background p-3.5 text-xs font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#FFC700]"
                  />
                  {reasonError && (
                    <p className="text-xs font-bold text-rose-500">{reasonError}</p>
                  )}
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
                className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-black shadow-md transition-all cursor-pointer disabled:opacity-50 ${
                  modalAction.type === "approve"
                    ? "bg-[#FFC700] hover:bg-[#FFD633] text-[#0D0E12]"
                    : "bg-rose-500 hover:bg-rose-600 text-white"
                }`}
              >
                {actionLoading && <Loader2 className="size-4 animate-spin" />}
                {modalAction.type === "approve" ? "Confirm Approval" : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

