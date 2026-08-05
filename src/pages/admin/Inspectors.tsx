import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { adminNav } from "@/components/nav-config";
import { DataTable, type Column } from "@/components/data-table";
import { StatusChip } from "@/components/premium";
import { getRegisteredInspectors } from "@/lib/api/admin-api";

interface Inspector {
  id: number;
  name: string;
  email: string;
  mobile: string;
  uploads: number;
  status: string;
}

export function AdminInspectors() {
  const [inspectors, setInspectors] = useState<Inspector[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInspectors = async () => {
      setLoading(true);
      try {
        const res = await getRegisteredInspectors();
        if (res.success && res.data) {
          const list = res.data.map((item) => ({
            id: item.id,
            name: item.fullName || "N/A",
            email: item.email || "N/A",
            mobile: item.mobileNumber || "N/A",
            uploads: item.uploads ?? 0,
            status: "active",
          }));
          setInspectors(list);
        }
      } catch (err) {
        console.error("Failed to load inspectors", err);
        toast.error("Could not fetch inspectors list.");
      } finally {
        setLoading(false);
      }
    };
    fetchInspectors();
  }, []);

  const columns: Column<Inspector>[] = [
    {
      key: "name",
      header: "Inspector",
      cell: (r) => (
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-foreground text-xs font-semibold text-background">
            {r.name.slice(0, 2).toUpperCase()}
          </span>
          <span className="font-medium">{r.name}</span>
        </div>
      ),
    },
    { key: "email", header: "Email", cell: (r) => r.email },
    { key: "mobile", header: "Mobile", cell: (r) => r.mobile },
    { key: "uploads", header: "Vehicles uploaded", cell: (r) => r.uploads },
    {
      key: "actions",
      header: "Actions",
      cell: (r) => (
        <Link
          to={`/admin/vehicles?inspector=${encodeURIComponent(r.name)}`}
          className="rounded-xl border border-border px-3 py-1.5 text-xs font-medium hover:bg-secondary cursor-pointer inline-block"
        >
          Manage
        </Link>
      ),
    },
  ];

  return (
    <AppShell role="admin" nav={adminNav} title="Inspectors" breadcrumb={["Admin", "Inspectors"]}>
      {loading ? (
        <div className="flex h-60 items-center justify-center bg-card border border-border rounded-3xl shadow-soft">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <DataTable
          rows={inspectors}
          columns={columns}
          searchKeys={["name", "email", "mobile"]}
          placeholder="Search by inspector name, email, mobile..."
          actions={null}
        />
      )}
    </AppShell>
  );
}
