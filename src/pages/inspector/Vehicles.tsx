import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/app-shell";
import { inspectorNav } from "@/components/nav-config";
import { DataTable, type Column } from "@/components/data-table";
import { StatusChip } from "@/components/premium";
import {
  getMyInspections,
  deleteInspectionDraft,
  type InspectionSummary,
} from "@/lib/api/inspector-api";
import { toast } from "sonner";
import { Trash2, Edit3, Download } from "lucide-react";
import { inr } from "@/lib/mock-data";

export function InspectorVehicles() {
  const [inspections, setInspections] = useState<InspectionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("All");

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

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this inspection draft? This action is permanent.")) {
      return;
    }
    try {
      const res = await deleteInspectionDraft(id);
      if (res.success) {
        toast.success("Inspection draft deleted successfully.");
        // Refresh the list
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
        const isEditable = v.status === "DRAFT" || v.status === "IN_PROGRESS";
        return (
          <div className="flex items-center gap-2">
            {isEditable ? (
              <>
                <Link
                  to={`/inspector/add-vehicle?id=${v.inspectionId}`}
                  className="grid size-8 place-items-center rounded-xl bg-card border border-border text-foreground hover:border-[#FFC700] hover:text-[#FFC700] transition-colors shadow-soft"
                  title="Edit Draft"
                >
                  <Edit3 className="size-3.5" />
                </Link>
                <button
                  onClick={() => handleDelete(v.inspectionId)}
                  className="grid size-8 place-items-center rounded-xl bg-card border border-border text-rose-500 hover:border-rose-500/50 hover:bg-rose-500/10 transition-colors shadow-soft cursor-pointer"
                  title="Delete Draft"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </>
            ) : (
              <a
                href={`http://localhost:8080/api/inspector/inspection/${v.inspectionId}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-extrabold text-foreground hover:border-[#FFC700] hover:text-[#FFC700] transition-colors shadow-soft"
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
    </AppShell>
  );
}
