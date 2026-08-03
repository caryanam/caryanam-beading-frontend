import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { adminNav } from "@/components/nav-config";
import { DataTable, type Column } from "@/components/data-table";
import {
  getRegisteredDealers,
  importDealersExcel,
  type AdminDealer,
} from "@/lib/api/admin-api";

export function AdminDealers() {
  const [dealers, setDealers] = useState<AdminDealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);

  const fetchDealers = async () => {
    setLoading(true);
    try {
      const res = await getRegisteredDealers();
      if (res.success && res.data) {
        setDealers(res.data);
      }
    } catch (err: any) {
      console.error("Failed to load dealers list", err);
      toast.error("Could not load dealers list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDealers();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const res = await importDealersExcel(file);
      if (res.success) {
        toast.success(res.message || "Dealers imported successfully!");
        const updated = await getRegisteredDealers();
        if (updated.success && updated.data) {
          setDealers(updated.data);
        }
      } else {
        toast.error(res.message || "Failed to import dealers.");
      }
    } catch (err: any) {
      console.error("Failed to import dealers", err);
      toast.error(err.response?.data?.message || "Failed to parse Excel file.");
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  const columns: Column<AdminDealer>[] = [
    {
      key: "dealershipName",
      header: "Shop name",
      cell: (r) => (
        <span className="font-bold text-sm text-foreground">
          {r.dealershipName}
        </span>
      ),
    },
    { key: "ownerName", header: "Owner", cell: (r) => r.ownerName },
    { key: "email", header: "Email", cell: (r) => r.email },
    { key: "mobileNumber", header: "Mobile", cell: (r) => r.mobileNumber },
    { key: "city", header: "City", cell: (r) => r.city || "N/A" },
    { key: "area", header: "Area", cell: (r) => r.area || "N/A" },
    {
      key: "address",
      header: "Address",
      cell: (r) => (
        <span className="truncate max-w-[200px] block" title={r.address}>
          {r.address || "N/A"}
        </span>
      ),
    },
    {
      key: "bids",
      header: "Total bids",
      cell: (r) => {
        const mockBids = (r.id * 47) % 250;
        return <span>{mockBids}</span>;
      },
    },
    {
      key: "actions",
      header: "Actions",
      cell: (r) => (
        <button
          onClick={() => toast.info(`Viewing ${r.dealershipName}`)}
          className="rounded-xl border border-border px-3.5 py-2 text-xs font-extrabold text-foreground hover:bg-secondary transition-all cursor-pointer shadow-sm"
        >
          Manage
        </button>
      ),
    },
  ];

  const actionsNode = (
    <label className="flex items-center gap-2 rounded-2xl bg-[#FFC700] hover:bg-[#FFD633] text-[#0D0E12] px-4 py-2.5 text-xs font-extrabold transition-all cursor-pointer shadow-[0_4px_16px_rgba(255,199,0,0.3)] hover:shadow-[0_6px_20px_rgba(255,199,0,0.45)]">
      <Upload className="size-4 shrink-0" />
      <span>{importing ? "Importing..." : "Import Excel"}</span>
      <input
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={handleFileUpload}
        disabled={importing}
      />
    </label>
  );

  return (
    <AppShell
      role="admin"
      nav={adminNav}
      title="Dealers"
      breadcrumb={["Admin", "Dealers"]}
    >
      {loading ? (
        <div className="flex h-60 items-center justify-center bg-card border border-border rounded-3xl shadow-soft">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <DataTable
          rows={dealers}
          columns={columns}
          searchKeys={["dealershipName", "ownerName"]}
          placeholder="Search by shop name, owner..."
          actions={actionsNode}
        />
      )}
    </AppShell>
  );
}
