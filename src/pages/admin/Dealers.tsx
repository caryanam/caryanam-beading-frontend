import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { Upload, X, Shield, Building2, User, Phone, Mail, MapPin, Gavel, Trash2, Crown, Trophy, Store, Car, CheckCircle2, AlertCircle, FileSpreadsheet, AlertTriangle } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { adminNav } from "@/components/nav-config";
import { DataTable, type Column } from "@/components/data-table";
import { ConfirmModal } from "@/components/confirm-modal";
import {
  getRegisteredDealers,
  importDealersExcel,
  deleteAdminDealer,
  deleteMultipleAdminDealers,
  makeDealerFreelancer,
  type AdminDealer,
} from "@/lib/api/admin-api";
import { inr } from "@/lib/mock-data";

export function AdminDealers() {
  const [dealers, setDealers] = useState<AdminDealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [makingFreelancerId, setMakingFreelancerId] = useState<number | null>(null);
  const [importSummary, setImportSummary] = useState<{
    totalRows: number;
    importedCount: number;
    skippedCount: number;
    issues: string[];
  } | null>(null);
  const [showImportSummaryModal, setShowImportSummaryModal] = useState(false);

  // Selected dealer modal state
  const [selectedDealer, setSelectedDealer] = useState<AdminDealer | null>(null);
  const [dealerToDelete, setDealerToDelete] = useState<AdminDealer | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Multi-selection state
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Business rule: Delete dealer ONLY if 0 bids placed and 0 auctions won
  const canDeleteDealer = (d: AdminDealer | null | undefined): boolean => {
    if (!d) return false;
    const bids = d.totalBids ?? 0;
    const won = d.wonBidsCount ?? d.wonBids?.length ?? 0;
    return bids === 0 && won === 0;
  };

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
      if (res.data) {
        setImportSummary(res.data);
        setShowImportSummaryModal(true);
      }
      if (res.success && (!res.data || res.data.importedCount > 0)) {
        toast.success(res.message || "Dealers imported successfully!");
        fetchDealers();
      } else if (res.data && res.data.importedCount === 0) {
        toast.warning(res.message || "No dealers were imported. Check issue details.");
      } else {
        toast.error(res.message || "Failed to import dealers.");
      }
    } catch (err: any) {
      console.error("Failed to import dealers", err);
      toast.error(err.response?.data?.message || err.message || "Failed to parse Excel file.");
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  const handleDeleteDealer = async () => {
    const targetDealer = dealerToDelete || selectedDealer;
    if (!targetDealer) return;

    if (!canDeleteDealer(targetDealer)) {
      toast.error(
        `Cannot delete dealer '${targetDealer.dealershipName}'. Dealer has ${targetDealer.totalBids ?? 0} bid(s) and ${targetDealer.wonBidsCount ?? targetDealer.wonBids?.length ?? 0} won auction(s). Only dealers with 0 bids and 0 won auctions can be deleted.`
      );
      setShowDeleteConfirm(false);
      setDealerToDelete(null);
      return;
    }

    setDeleting(true);
    try {
      const res = await deleteAdminDealer(targetDealer.id);
      if (res.success) {
        toast.success("Dealer account removed.");
        setSelectedDealer(null);
        setDealerToDelete(null);
        setShowDeleteConfirm(false);
        setSelectedIds((prev) => prev.filter((id) => id !== targetDealer.id));
        fetchDealers();
      } else {
        toast.error(res.message || "Failed to delete dealer.");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete dealer.");
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setBulkDeleting(true);
    try {
      const res = await deleteMultipleAdminDealers(selectedIds);
      if (res.success && res.data) {
        const { deletedCount, skippedCount, skippedReasons } = res.data;
        if (deletedCount > 0) {
          toast.success(`${deletedCount} dealer(s) deleted successfully.`);
        }
        if (skippedCount > 0) {
          toast.warning(
            `${skippedCount} dealer(s) were protected and skipped (have active bids or won auctions).`
          );
        }
        if (deletedCount === 0 && skippedCount > 0) {
          toast.error("No dealers were deleted. All selected dealers have active bids or won auctions.");
        }
        setSelectedIds([]);
        setShowBulkDeleteConfirm(false);
        fetchDealers();
      } else {
        toast.error(res.message || "Failed to delete dealers.");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Failed to delete dealers.");
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleMakeFreelancer = async (dealer: AdminDealer) => {
    setMakingFreelancerId(dealer.id);
    try {
      const res = await makeDealerFreelancer(dealer.id);
      if (res.success) {
        toast.success(res.message || `${dealer.dealershipName} is now granted Freelancer access!`);
        if (selectedDealer && selectedDealer.id === dealer.id) {
          setSelectedDealer((prev) => (prev ? { ...prev, isFreelancer: true } : null));
        }
        fetchDealers();
      } else {
        toast.error(res.message || "Failed to make freelancer.");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to grant freelancer access.");
    } finally {
      setMakingFreelancerId(null);
    }
  };

  const isAllSelected = dealers.length > 0 && selectedIds.length === dealers.length;
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < dealers.length;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(dealers.map((d) => d.id));
    }
  };

  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectedDealers = dealers.filter((d) => selectedIds.includes(d.id));
  const eligibleSelectedDealers = selectedDealers.filter(canDeleteDealer);
  const ineligibleSelectedDealers = selectedDealers.filter((d) => !canDeleteDealer(d));

  const columns: Column<AdminDealer>[] = [
    {
      key: "select",
      header: (
        <div className="flex items-center justify-center pl-1">
          <input
            type="checkbox"
            checked={isAllSelected}
            ref={(input) => {
              if (input) input.indeterminate = isIndeterminate;
            }}
            onChange={handleToggleSelectAll}
            className="size-4 rounded border-border text-[#FFC700] focus:ring-[#FFC700] cursor-pointer accent-[#FFC700]"
            title={isAllSelected ? "Deselect All" : "Select All"}
          />
        </div>
      ),
      cell: (r) => {
        const isSelected = selectedIds.includes(r.id);
        const eligible = canDeleteDealer(r);
        return (
          <div className="flex items-center justify-center pl-1" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => handleToggleSelect(r.id)}
              className="size-4 rounded border-border text-[#FFC700] focus:ring-[#FFC700] cursor-pointer accent-[#FFC700]"
              title={
                eligible
                  ? `Select ${r.dealershipName} (Eligible for deletion: 0 bids, 0 won)`
                  : `Select ${r.dealershipName} (Protected: has bids or won auctions)`
              }
            />
          </div>
        );
      },
      className: "w-10 px-2",
    },
    {
      key: "dealershipName",
      header: "Shop Name",
      cell: (r) => (
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-[#FFC700]/15 border border-[#FFC700]/30 text-[#FFC700] shrink-0">
            <Store className="size-4.5" />
          </div>
          <div>
            <span className="font-bold text-sm text-foreground block">
              {r.dealershipName}
            </span>
            {r.isFreelancer && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-sky-500/15 text-sky-500 border border-sky-500/30 mt-0.5">
                <Car className="size-2.5" /> Also Freelancer
              </span>
            )}
          </div>
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
          {r.email || "N/A"}
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
        <div className="flex items-center gap-2">
          {!r.isFreelancer ? (
            <button
              onClick={() => handleMakeFreelancer(r)}
              disabled={makingFreelancerId === r.id}
              className="rounded-xl border border-sky-500/40 bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 px-3 py-1.5 text-xs font-black transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
              title="Grant freelancer role to this dealer"
            >
              {makingFreelancerId === r.id ? (
                <span className="size-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Car className="size-3.5" />
              )}
              Make Freelancer
            </button>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-600 dark:text-sky-400 px-2 py-1 rounded-lg bg-sky-500/10 border border-sky-500/20">
              <CheckCircle2 className="size-3" /> Freelancer
            </span>
          )}
          <button
            onClick={() => openManageModal(r)}
            className="rounded-xl border border-border px-3.5 py-1.5 text-xs font-extrabold text-foreground hover:bg-secondary hover:border-[#FFC700] transition-all cursor-pointer shadow-sm"
          >
            Manage
          </button>
        </div>
      ),
    },
  ];

  const actionsNode = (
    <div className="flex items-center gap-2">
      {selectedIds.length > 0 && (
        <>
          <button
            onClick={() => setSelectedIds([])}
            className="flex items-center gap-1.5 rounded-2xl border border-border px-3.5 py-2.5 text-xs font-bold text-muted-foreground hover:bg-secondary hover:text-foreground transition-all cursor-pointer shadow-sm"
          >
            <span>Deselect ({selectedIds.length})</span>
          </button>
          <button
            onClick={() => setShowBulkDeleteConfirm(true)}
            className="flex items-center gap-2 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white px-4 py-2.5 text-xs font-extrabold transition-all cursor-pointer shadow-[0_4px_16px_rgba(244,63,94,0.3)] hover:shadow-[0_6px_20px_rgba(244,63,94,0.45)] animate-in fade-in"
          >
            <Trash2 className="size-4 shrink-0" />
            <span>Delete Selected ({selectedIds.length})</span>
          </button>
        </>
      )}
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
    </div>
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
                  {/* Freelancer Integration Card */}
                  <div className="rounded-2xl border border-sky-500/30 bg-sky-500/5 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-xl bg-sky-500/15 text-sky-500 border border-sky-500/30 shrink-0">
                          <Car className="size-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-foreground uppercase tracking-wider">
                            Freelancer Role Access
                          </h4>
                          <p className="text-[11px] font-medium text-muted-foreground mt-0.5">
                            {selectedDealer.isFreelancer
                              ? "Active: This dealer can log in as Freelancer & upload vehicle inspections."
                              : "Grant Freelancer access to allow vehicle inspections and car uploads."}
                          </p>
                        </div>
                      </div>
                      {selectedDealer.isFreelancer ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-sky-500/30 bg-sky-500/15 text-xs font-black text-sky-600 dark:text-sky-400">
                          <CheckCircle2 className="size-4" /> Freelancer Active
                        </span>
                      ) : (
                        <button
                          onClick={() => handleMakeFreelancer(selectedDealer)}
                          disabled={makingFreelancerId === selectedDealer.id}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white px-3.5 py-1.5 text-xs font-black transition-all cursor-pointer shadow-md"
                        >
                          {makingFreelancerId === selectedDealer.id ? (
                            <span className="size-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          ) : (
                            <Car className="size-3.5" />
                          )}
                          Make Freelancer
                        </button>
                      )}
                    </div>
                  </div>

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
                        <span className="font-bold text-foreground">{selectedDealer.email || "N/A"}</span>
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
                {canDeleteDealer(selectedDealer) ? (
                  <button
                    onClick={() => {
                      setDealerToDelete(selectedDealer);
                      setShowDeleteConfirm(true);
                    }}
                    disabled={deleting}
                    className="inline-flex items-center gap-1.5 rounded-2xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 px-4 py-2.5 text-xs font-black text-rose-600 dark:text-rose-400 transition-all cursor-pointer"
                  >
                    <Trash2 className="size-4" /> Delete Dealer
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      disabled
                      className="inline-flex items-center gap-1.5 rounded-2xl border border-border bg-secondary/60 px-4 py-2.5 text-xs font-bold text-muted-foreground opacity-50 cursor-not-allowed"
                      title="Dealers with active bids or won auctions cannot be deleted"
                    >
                      <Trash2 className="size-4" /> Delete (Locked)
                    </button>
                    <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <AlertCircle className="size-3.5" /> Has {selectedDealer.totalBids ?? 0} bid(s) & {selectedDealer.wonBidsCount ?? selectedDealer.wonBids?.length ?? 0} won
                    </span>
                  </div>
                )}

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

      {showImportSummaryModal && importSummary && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl border border-border bg-card shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="size-5 text-primary" />
                <h3 className="text-lg font-bold text-foreground">Excel Import Results</h3>
              </div>
              <button
                onClick={() => setShowImportSummaryModal(false)}
                className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl border border-border bg-secondary/50 p-3">
                <p className="text-xs text-muted-foreground font-semibold">Total Rows</p>
                <p className="text-2xl font-black text-foreground">{importSummary.totalRows}</p>
              </div>
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3">
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Imported</p>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{importSummary.importedCount}</p>
              </div>
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3">
                <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">Skipped</p>
                <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{importSummary.skippedCount}</p>
              </div>
            </div>

            {importSummary.issues && importSummary.issues.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Skipped / Warning Details ({importSummary.issues.length})
                </p>
                <div className="max-h-48 overflow-y-auto space-y-1.5 rounded-2xl border border-border bg-muted/40 p-3 text-xs">
                  {importSummary.issues.map((iss, i) => (
                    <div key={i} className="flex items-start gap-2 text-muted-foreground">
                      <AlertCircle className="size-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span>{iss}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowImportSummaryModal(false)}
                className="rounded-2xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground hover:opacity-90 cursor-pointer transition-opacity"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteConfirm &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 sm:p-6 overflow-y-auto animate-in fade-in">
            <div className="relative w-full max-w-lg rounded-3xl border border-border bg-card shadow-2xl p-6 space-y-5 animate-in zoom-in-95">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-500 shrink-0">
                    <Trash2 className="size-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-foreground">
                      Delete Selected Dealers
                    </h3>
                    <p className="text-xs font-semibold text-muted-foreground">
                      Rule: Only dealers with 0 bids and 0 won auctions can be deleted
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowBulkDeleteConfirm(false)}
                  className="inline-flex size-9 items-center justify-center rounded-xl border border-border bg-secondary hover:bg-muted text-foreground transition-all cursor-pointer"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* Summary stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-border bg-secondary/50 p-3 text-center">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block">
                    Selected
                  </span>
                  <span className="text-xl font-black text-foreground mt-0.5 block">
                    {selectedIds.length}
                  </span>
                </div>
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-center">
                  <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                    Eligible (0 bids, 0 won)
                  </span>
                  <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                    {eligibleSelectedDealers.length}
                  </span>
                </div>
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-center">
                  <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                    Protected (Has bids/won)
                  </span>
                  <span className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5 block">
                    {ineligibleSelectedDealers.length}
                  </span>
                </div>
              </div>

              {/* Ineligible warning list if any */}
              {ineligibleSelectedDealers.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="size-4 shrink-0" />
                    <span>Protected Dealers ({ineligibleSelectedDealers.length}) — Will NOT be deleted:</span>
                  </div>
                  <div className="max-h-36 overflow-y-auto space-y-1.5 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs">
                    {ineligibleSelectedDealers.map((d) => (
                      <div key={d.id} className="flex items-center justify-between text-muted-foreground">
                        <span className="font-bold text-foreground">
                          {d.dealershipName} (ID #{d.id})
                        </span>
                        <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                          {d.totalBids ?? 0} bid(s) · {d.wonBidsCount ?? d.wonBids?.length ?? 0} won
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground italic">
                    * Dealers with active bidding activity or won auctions cannot be deleted to maintain auction integrity.
                  </p>
                </div>
              )}

              {/* Action notice */}
              {eligibleSelectedDealers.length === 0 ? (
                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-bold text-rose-600 dark:text-rose-400 text-center">
                  None of the selected dealers have 0 bids and 0 won auctions. No dealers can be deleted.
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Are you sure you want to permanently delete the <span className="font-bold text-foreground">{eligibleSelectedDealers.length} eligible dealer(s)</span>? This action cannot be undone.
                </p>
              )}

              {/* Footer buttons */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowBulkDeleteConfirm(false)}
                  disabled={bulkDeleting}
                  className="rounded-2xl border border-border bg-secondary hover:bg-muted px-5 py-2.5 text-xs font-bold text-foreground transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBulkDelete}
                  disabled={bulkDeleting || eligibleSelectedDealers.length === 0}
                  className="inline-flex items-center gap-2 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white px-5 py-2.5 text-xs font-extrabold transition-all cursor-pointer shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bulkDeleting ? (
                    <>
                      <span className="size-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="size-4" />
                      <span>Delete {eligibleSelectedDealers.length} Dealer(s)</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>,
          document.body
        )}

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDealerToDelete(null);
        }}
        onConfirm={handleDeleteDealer}
        title="Delete Dealer Account"
        description={`Are you sure you want to permanently delete dealership "${dealerToDelete?.dealershipName || selectedDealer?.dealershipName || ""}"? This action cannot be undone.`}
        confirmText="Delete Dealer"
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
      />
    </AppShell>
  );
}
