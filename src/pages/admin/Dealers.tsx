import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { Upload, X, Shield, Building2, User, Phone, Mail, MapPin, Gavel, Trash2, Crown, Trophy, Store } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { adminNav } from "@/components/nav-config";
import { DataTable, type Column } from "@/components/data-table";
import {
  getRegisteredDealers,
  importDealersExcel,
  deleteAdminDealer,
  type AdminDealer,
} from "@/lib/api/admin-api";
import { inr } from "@/lib/mock-data";

export function AdminDealers() {
  const [dealers, setDealers] = useState<AdminDealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);

  // Selected dealer modal state
  const [selectedDealer, setSelectedDealer] = useState<AdminDealer | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  const openManageModal = (dealer: AdminDealer) => {
    setSelectedDealer(dealer);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const res = await importDealersExcel(file);
      if (res.success) {
        toast.success(res.message || "Dealers imported successfully!");
        fetchDealers();
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

  const handleDeleteDealer = async () => {
    if (!selectedDealer) return;
    if (!window.confirm(`Are you sure you want to permanently delete dealership "${selectedDealer.dealershipName}"?`)) {
      return;
    }

    setDeleting(true);
    try {
      const res = await deleteAdminDealer(selectedDealer.id);
      if (res.success) {
        toast.success("Dealer account removed.");
        setSelectedDealer(null);
        fetchDealers();
      } else {
        toast.error(res.message || "Failed to delete dealer.");
      }
    } catch (err: any) {
      console.error("Error deleting dealer", err);
      toast.error("Could not delete dealer.");
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<AdminDealer>[] = [
    {
      key: "dealershipName",
      header: "Shop Name",
      cell: (r) => (
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-[#FFC700]/15 border border-[#FFC700]/30 text-[#FFC700] shrink-0">
            <Store className="size-4.5" />
          </div>
          <span className="font-bold text-sm text-foreground">
            {r.dealershipName}
          </span>
        </div>
      ),
    },
    {
      key: "ownerName",
      header: "Owner",
      cell: (r) => (
        <div className="flex items-center gap-1.5 font-bold text-foreground">
          <User className="size-3.5 text-muted-foreground shrink-0" />
          <span>{r.ownerName}</span>
        </div>
      ),
    },
    {
      key: "email",
      header: "Email",
      cell: (r) => (
        <span className="font-semibold text-muted-foreground text-xs">
          {r.email}
        </span>
      ),
    },
    {
      key: "mobileNumber",
      header: "Mobile",
      cell: (r) => (
        <span className="font-mono font-bold text-foreground text-xs">
          {r.mobileNumber}
        </span>
      ),
    },
    {
      key: "city",
      header: "City",
      cell: (r) => (
        <span className="font-bold text-xs text-foreground">
          {r.city || "N/A"}
        </span>
      ),
    },
    {
      key: "area",
      header: "Area",
      cell: (r) => (
        <span className="font-semibold text-xs text-muted-foreground">
          {r.area || "N/A"}
        </span>
      ),
    },
    {
      key: "address",
      header: "Address",
      cell: (r) => (
        <span className="truncate max-w-[200px] block font-medium text-xs text-muted-foreground" title={r.address}>
          {r.address || "N/A"}
        </span>
      ),
    },
    {
      key: "bids",
      header: "Total Bids Placed",
      cell: (r) => {
        const bidsCount = r.totalBids ?? 0;
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#FFC700]/30 bg-[#FFC700]/10 text-xs font-black text-[#FFC700]">
            <Gavel className="size-3" /> {bidsCount} Bids
          </span>
        );
      },
    },
    {
      key: "wonBidsCount",
      header: "Auctions Won",
      cell: (r) => {
        const wonCount = r.wonBidsCount ?? r.wonBids?.length ?? 0;
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-xs font-black text-emerald-600 dark:text-emerald-400">
            <Trophy className="size-3 text-emerald-500" /> {wonCount} Won
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      cell: (r) => (
        <button
          onClick={() => openManageModal(r)}
          className="rounded-xl border border-border px-3.5 py-2 text-xs font-extrabold text-foreground hover:bg-secondary hover:border-[#FFC700] transition-all cursor-pointer shadow-sm"
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
      title="Registered Dealers Management"
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
          searchKeys={["dealershipName", "ownerName", "email", "mobileNumber", "city"]}
          placeholder="Search dealers by shop name, owner, city..."
          actions={actionsNode}
        />
      )}

      {/* Dealer Management Details Modal via React Portal */}
      {selectedDealer &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 sm:p-6 overflow-y-auto animate-in fade-in">
            <div className="relative w-full max-w-2xl max-h-[85vh] my-auto rounded-3xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
              
              {/* Sticky Header */}
              <div className="flex items-center justify-between border-b border-border bg-card/95 backdrop-blur-sm px-6 py-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-[#FFC700]/15 border border-[#FFC700]/30 text-[#FFC700] shrink-0">
                    <Building2 className="size-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-foreground tracking-tight">
                      {selectedDealer.dealershipName}
                    </h3>
                    <p className="text-xs font-semibold text-muted-foreground">
                      ID #{selectedDealer.id} · Registered Partner Dealer
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDealer(null)}
                  className="inline-flex size-9 items-center justify-center rounded-xl border border-border bg-secondary hover:bg-muted text-foreground transition-all cursor-pointer shrink-0"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                {/* 3 Summary Stat Cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-border bg-secondary/40 p-4">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">
                      Total Active Bids
                    </span>
                    <span className="text-lg font-black text-[#FFC700] mt-0.5 block flex items-center gap-1.5">
                      <Gavel className="size-4" /> {selectedDealer.totalBids ?? 0} Bids
                    </span>
                  </div>

                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block">
                      Auctions Won
                    </span>
                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block flex items-center gap-1.5">
                      <Trophy className="size-4" /> {selectedDealer.wonBidsCount ?? selectedDealer.wonBids?.length ?? 0} Won
                    </span>
                  </div>

                  <div className="rounded-2xl border border-border bg-secondary/40 p-4">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">
                      Account Status
                    </span>
                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block flex items-center gap-1.5">
                      <Shield className="size-4" /> Verified
                    </span>
                  </div>
                </div>

                {/* Dealer Details Card */}
                <div className="space-y-6">
                  <div className="rounded-2xl border border-border bg-secondary/30 p-4 space-y-3 text-xs">
                    <h4 className="text-xs font-black text-foreground uppercase tracking-wider border-b border-border/60 pb-2 flex items-center gap-2">
                      <User className="size-4 text-[#FFC700]" /> Dealer Information Overview
                    </h4>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground block">Owner Full Name</span>
                        <span className="font-black text-foreground text-sm">{selectedDealer.ownerName}</span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground block">Email Address</span>
                        <span className="font-bold text-foreground">{selectedDealer.email}</span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground block">Mobile Contact</span>
                        <span className="font-mono font-bold text-foreground">{selectedDealer.mobileNumber}</span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground block">City & Area</span>
                        <span className="font-bold text-foreground">
                          {selectedDealer.city || "N/A"} {selectedDealer.area ? `(${selectedDealer.area})` : ""}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border/50">
                      <span className="text-[10px] font-bold text-muted-foreground block">Full Address</span>
                      <span className="font-bold text-foreground block mt-0.5">
                        {selectedDealer.address || "No address details provided."}
                      </span>
                    </div>
                  </div>

                  {/* Won Bids History & Details Section */}
                  <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-border/60 pb-2">
                      <h4 className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-2">
                        <Crown className="size-4 text-[#FFC700]" /> Won Auctions & Bids Log ({selectedDealer.wonBids?.length || 0})
                      </h4>
                    </div>

                    {!selectedDealer.wonBids || selectedDealer.wonBids.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs font-semibold text-muted-foreground">
                        No won auction records for this dealer yet.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                        {selectedDealer.wonBids.map((won, idx) => (
                          <div
                            key={won.vehicleId || idx}
                            className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs"
                          >
                            <div className="flex items-center gap-3">
                              <span className="flex size-7 items-center justify-center rounded-lg bg-[#FFC700] text-[#0D0E12] font-black text-xs shrink-0">
                                <Crown className="size-3.5 fill-current" />
                              </span>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-black text-xs text-foreground px-1.5 py-0.5 rounded bg-card border border-border">
                                    {won.vehicleNumber}
                                  </span>
                                  <p className="font-black text-foreground">
                                    {won.brand} {won.model} {won.variant}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm block">
                                {inr(won.winningBidAmount || 0)}
                              </span>
                              <span className="text-[10px] font-bold text-muted-foreground block">Winning Bid</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sticky Footer Controls */}
              <div className="flex items-center justify-between border-t border-border bg-card/95 backdrop-blur-sm px-6 py-4 shrink-0">
                <button
                  onClick={handleDeleteDealer}
                  disabled={deleting}
                  className="inline-flex items-center gap-1.5 rounded-2xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 px-4 py-2.5 text-xs font-black text-rose-600 dark:text-rose-400 transition-all cursor-pointer"
                >
                  <Trash2 className="size-4" /> Delete Dealer
                </button>

                <button
                  onClick={() => setSelectedDealer(null)}
                  className="rounded-2xl border border-border bg-secondary hover:bg-muted px-5 py-2.5 text-xs font-bold text-foreground cursor-pointer transition-all"
                >
                  Close Window
                </button>
              </div>

            </div>
          </div>,
          document.body,
        )}
    </AppShell>
  );
}
