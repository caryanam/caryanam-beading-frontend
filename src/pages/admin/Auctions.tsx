import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { adminNav } from "@/components/nav-config";
import { DataTable, type Column } from "@/components/data-table";
import {
  getSubmittedInspections,
  startLiveAuction,
  type AdminInspectionSummary,
} from "@/lib/api/admin-api";
import { inr } from "@/lib/mock-data";

export function AdminAuctions() {
  const [inspections, setInspections] = useState<AdminInspectionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAuctions = async () => {
    setLoading(true);
    try {
      const res = await getSubmittedInspections();
      if (res.success && res.data) {
        // Only show inspections that are APPROVED
        const approvedOnly = res.data.filter(
          (ins: any) => ins.status === "APPROVED",
        );
        setInspections(approvedOnly);
      }
    } catch (err: any) {
      console.error("Failed to load approved auctions list", err);
      toast.error("Could not load auctions list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuctions();
  }, []);

  const handleGoLive = async (id: number) => {
    try {
      const res = await startLiveAuction(id);
      if (res.success) {
        toast.success("Auction is now LIVE!");
        fetchAuctions(); // Reload list
      } else {
        toast.error("Failed to start auction.");
      }
    } catch (err: any) {
      console.error("Error setting auction to live", err);
      toast.error("Error setting auction to live.");
    }
  };

  const columns: Column<AdminInspectionSummary>[] = [
    {
      key: "vehicle",
      header: "Vehicle",
      cell: (v) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-foreground">
            {v.brand} {v.model} {v.variant}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {v.vehicleNumber}
          </p>
        </div>
      ),
    },
    {
      key: "suggestedPrice",
      header: "Suggested price",
      cell: (v) => (v.suggestedPrice ? inr(v.suggestedPrice) : "N/A"),
    },
    { key: "inspectorName", header: "Inspector", cell: (v) => v.inspectorName },
    {
      key: "vehicleStatus",
      header: "Auction Status",
      cell: (v) => {
        const isLive = v.vehicleStatus === "LIVE";
        const isSold =
          v.vehicleStatus === "SOLD OUT" ||
          v.vehicleStatus === "SOLD" ||
          v.vehicleStatus === "ENDED";
        if (isLive) {
          return (
            <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold capitalize tracking-wide bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400">
              <span className="size-1.5 animate-pulse rounded-full bg-green-500" />
              Live
            </span>
          );
        }
        if (isSold) {
          return (
            <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold capitalize tracking-wide bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400">
              Sold Out
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold capitalize tracking-wide bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400">
            Ready
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      cell: (v) => {
        const isLive = v.vehicleStatus === "LIVE";
        const isSold =
          v.vehicleStatus === "SOLD OUT" ||
          v.vehicleStatus === "SOLD" ||
          v.vehicleStatus === "ENDED";
        if (isLive) {
          return (
            <span className="text-xs font-bold text-muted-foreground">
              Active Bidding
            </span>
          );
        }
        if (isSold) {
          return (
            <span className="text-xs font-bold text-red-500 uppercase">
              Sold Out
            </span>
          );
        }
        return (
          <button
            onClick={() => handleGoLive(v.inspectionId)}
            className="rounded-xl bg-[#FFC700] hover:bg-[#FFD633] px-3.5 py-2 text-xs font-extrabold text-[#0D0E12] transition-all cursor-pointer shadow-sm"
          >
            Go Live
          </button>
        );
      },
    },
  ];

  return (
    <AppShell
      role="admin"
      nav={adminNav}
      title="Auctions"
      breadcrumb={["Admin", "Auctions"]}
    >
      {loading ? (
        <div className="flex h-60 items-center justify-center bg-card border border-border rounded-3xl shadow-soft">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <DataTable
          rows={inspections}
          columns={columns}
          searchKeys={["brand", "model", "vehicleNumber"]}
          placeholder="Search by brand, model, vehicle no..."
          actions={null}
        />
      )}
    </AppShell>
  );
}
