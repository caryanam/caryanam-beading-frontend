import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { adminNav } from "@/components/nav-config";
import { DataTable, type Column } from "@/components/data-table";
import { StatusChip } from "@/components/premium";
import { inr } from "@/lib/mock-data";
import { Download } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import {
  getSubmittedInspections,
  approveInspection,
  rejectInspection,
  type AdminInspectionSummary,
} from "@/lib/api/admin-api";

export function AdminVehicles() {
  const [inspections, setInspections] = useState<AdminInspectionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInspector, setSelectedInspector] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("All");

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

  const handleApprove = async (id: number) => {
    if (!window.confirm("Are you sure you want to approve this vehicle inspection? This will mark the vehicle READY_FOR_AUCTION.")) {
      return;
    }
    try {
      const res = await approveInspection(id);
      if (res.success) {
        toast.success("Inspection approved successfully. Vehicle set to READY_FOR_AUCTION.");
        fetchInspections();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to approve inspection.");
    }
  };

  const handleReject = async (id: number) => {
    const reason = window.prompt("Enter rejection reason:");
    if (reason === null) return;
    if (!reason.trim()) {
      toast.error("Rejection reason is required.");
      return;
    }
    try {
      const res = await rejectInspection(id, reason.trim());
      if (res.success) {
        toast.success("Inspection rejected successfully.");
        fetchInspections();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to reject inspection.");
    }
  };

  const columns: Column<AdminInspectionSummary>[] = [
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
      key: "actions",
      header: "Actions",
      cell: (v) => {
        const isActionable = v.status === "SUBMITTED";
        return (
          <div className="flex items-center gap-2">
            {isActionable && (
              <>
                <button
                  onClick={() => handleApprove(v.inspectionId)}
                  className="rounded-xl bg-[#FFC700] hover:bg-[#FFD633] text-[#0D0E12] px-3.5 py-2 text-xs font-extrabold shadow-sm transition-all cursor-pointer"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleReject(v.inspectionId)}
                  className="rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-extrabold text-foreground hover:bg-secondary transition-all cursor-pointer"
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

  const actionButtons = (
    <div className="flex items-center gap-2">
      {["All", "Approved", "Rejected"].map((status) => {
        const active = statusFilter === status;
        return (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`rounded-2xl border px-3.5 py-2 text-xs font-extrabold transition-all cursor-pointer ${active
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
    </AppShell>
  );
}
