import { useState, useEffect } from "react";
import { toast } from "sonner";
import { adminApiClient } from "@/lib/api/admin-api";
import { AppShell } from "@/components/app-shell";
import { adminNav } from "@/components/nav-config";
import { DataTable, type Column } from "@/components/data-table";

interface Enquiry {
  id: number;
  name: string;
  email: string;
  phone: string;
  message: string;
  createdAt: string;
}

export function AdminEnquiries() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEnquiries = async () => {
    try {
      const res = await adminApiClient.get('/api/admin/enquiry');
      if (res.data.success) {
        setEnquiries(res.data.data || []);
      } else {
        toast.error(res.data.message || 'Failed to load enquiries');
      }
    } catch (err) {
      toast.error('Network error loading enquiries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const columns: Column<Enquiry>[] = [
    {
      key: "name",
      header: "User Details",
      cell: (r) => (
        <div>
          <span className="font-semibold text-foreground">{r.name}</span>
        </div>
      )
    },
    {
      key: "contact",
      header: "Contact Info",
      cell: (r) => (
        <div className="flex flex-col text-xs text-muted-foreground gap-0.5">
          <span>{r.email}</span>
          <span>{r.phone}</span>
        </div>
      )
    },
    {
      key: "message",
      header: "Message",
      cell: (r) => (
        <div className="max-w-xs md:max-w-md lg:max-w-lg whitespace-normal leading-relaxed text-xs">
          {r.message}
        </div>
      )
    },
    {
      key: "createdAt",
      header: "Date",
      cell: (r) => (
        <div className="text-xs text-muted-foreground">
          {(() => { const d = new Date(r.createdAt); return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`; })()}
        </div>
      )
    }
  ];

  return (
    <AppShell
      role="admin"
      nav={adminNav}
      title="User Enquiries"
      breadcrumb={["Admin", "Enquiries"]}
    >
      {loading ? (
        <div className="flex h-60 items-center justify-center bg-card border border-border rounded-3xl shadow-soft">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <DataTable
          rows={enquiries}
          columns={columns}
          searchKeys={["name", "email", "phone"]}
          placeholder="Search enquiries by name, email or phone..."
          actions={null}
        />
      )}
    </AppShell>
  );
}
