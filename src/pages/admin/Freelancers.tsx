import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { adminNav } from "@/components/nav-config";
import { DataTable, type Column } from "@/components/data-table";
import { getRegisteredFreelancers } from "@/lib/api/admin-api";

interface FreelancerItem {
  id: number;
  name: string;
  email: string;
  mobile: string;
  uploads: number;
  status: string;
}

export function AdminFreelancers() {
  const [freelancers, setFreelancers] = useState<FreelancerItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFreelancers = async () => {
      setLoading(true);
      try {
        const res = await getRegisteredFreelancers();
        if (res.success && res.data) {
          const list = res.data.map((item) => ({
            id: item.id,
            name: item.fullName || "N/A",
            email: item.email || "N/A",
            mobile: item.mobileNumber || "N/A",
            uploads: item.uploads ?? 0,
            status: "active",
          }));
          setFreelancers(list);
        }
      } catch (err) {
        console.error("Failed to load freelancers", err);
        // Fallback to local storage if API returns empty
        const list = JSON.parse(localStorage.getItem("freelancer_users_list") || "[]");
        setFreelancers(list);
      } finally {
        setLoading(false);
      }
    };
    fetchFreelancers();
  }, []);

  const columns: Column<FreelancerItem>[] = [
    {
      key: "name",
      header: "Freelancer",
      cell: (r) => (
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-500 text-xs font-black text-black">
            {r.name.slice(0, 2).toUpperCase()}
          </span>
          <span className="font-bold">{r.name}</span>
        </div>
      ),
    },
    { key: "email", header: "Email", cell: (r) => r.email },
    { key: "mobile", header: "Mobile", cell: (r) => r.mobile },
    { key: "uploads", header: "Vehicles Uploaded", cell: (r) => <span className="font-bold">{r.uploads}</span> },
    {
      key: "actions",
      header: "Actions",
      cell: (r) => (
        <Link
          to={`/admin/vehicles?tab=freelancer&freelancer=${encodeURIComponent(r.name)}`}
          className="rounded-xl border border-border px-3 py-1.5 text-xs font-bold hover:bg-secondary cursor-pointer inline-block"
        >
          View Vehicles
        </Link>
      ),
    },
  ];

  return (
    <AppShell role="admin" nav={adminNav} title="Freelancers" breadcrumb={["Admin", "Freelancers"]}>
      {loading ? (
        <div className="flex h-60 items-center justify-center bg-card border border-border rounded-3xl shadow-soft">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
        </div>
      ) : (
        <DataTable
          rows={freelancers}
          columns={columns}
          searchKeys={["name", "email", "mobile"]}
          placeholder="Search by freelancer name, email, mobile..."
          actions={null}
        />
      )}
    </AppShell>
  );
}
