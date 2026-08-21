import { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/app-shell";
import { adminNav } from "@/components/nav-config";
import { StatusChip } from "@/components/premium";
import {
  getSubmittedInspections,
  getAdminBidHistory,
  updateInspectionVehicleStatus,
  sendAdminDealerMessage,
  type AdminInspectionSummary,
} from "@/lib/api/admin-api";
import { getFreelancerInspections } from "@/lib/api/freelancer-api";
import { inr, timeLeft } from "@/lib/mock-data";
import { toast } from "sonner";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Award,
  Calendar,
  Car,
  CheckCircle2,
  Clock,
  Copy,
  DollarSign,
  Eye,
  Flame,
  Gavel,
  History,
  Info,
  Layers,
  Radio,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Tag,
  TrendingUp,
  User,
  UserCheck,
  Users,
  Zap,
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import { cn, formatIndianDateTime } from "@/lib/utils";

interface LiveBidRecord {
  dealer: string;
  amount: number;
  time: string;
}

export function AdminLiveBidding() {
  const navigate = useNavigate();
  const [inspections, setInspections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "inspector" | "freelancer">("all");

  // Real-time tracking states for selected room
  const [highestBid, setHighestBid] = useState<number>(0);
  const [highestBidder, setHighestBidder] = useState<string>("No bids placed");
  const [totalBids, setTotalBids] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(Date.now() + 600 * 1000);
  const [status, setStatus] = useState<string>("LIVE");
  const [bidHistory, setBidHistory] = useState<LiveBidRecord[]>([]);
  const [remaining, setRemaining] = useState<string>("");

  const [adminDealerMsgText, setAdminDealerMsgText] = useState("");
  const [sellerResp, setSellerResp] = useState<any>(null);
  const [dealerReply, setDealerReply] = useState<any>(null);

  const wsRef = useRef<WebSocket | null>(null);

  const selectedRoom = inspections.find((r) => r.inspectionId === selectedId);

  useEffect(() => {
    if (!selectedRoom) return;
    if (selectedRoom.sellerAgreed !== undefined && selectedRoom.sellerAgreed !== null) {
      setSellerResp({ agreed: selectedRoom.sellerAgreed, counterPrice: selectedRoom.sellerCounterPrice, message: selectedRoom.sellerMessage });
    } else {
      setSellerResp(null);
    }
    if (selectedRoom.dealerReplyMessage) {
      setDealerReply({ reply: selectedRoom.dealerReplyMessage });
    } else {
      setDealerReply(null);
    }
  }, [selectedRoom]);

  const handleSendDealerMsg = async () => {
    if (!selectedId || !adminDealerMsgText.trim()) {
      toast.error("Please enter a message for the dealer.");
      return;
    }
    try {
      const res = await sendAdminDealerMessage(selectedId, adminDealerMsgText);
      if (res.success) {
        toast.success("Message sent to winning dealer!");
        setAdminDealerMsgText("");
      } else {
        toast.error("Failed to send message.");
      }
    } catch (err) {
      toast.error("Error sending message to dealer.");
    }
  };

  const handleMarkAsSoldOutManual = async () => {
    if (!selectedId) return;
    const res = await updateInspectionVehicleStatus(selectedId, "SOLD OUT");
    if (res.success) {
      setStatus("SOLD OUT");
      toast.success(`Vehicle #${selectedId} status manually updated to SOLD OUT!`);
    } else {
      toast.error("Failed to update status.");
    }
  };



  const fetchRooms = async (showToast = false) => {
    if (showToast) setRefreshing(true);
    try {
      const [insRes, freeRes] = await Promise.allSettled([
        getSubmittedInspections(),
        getFreelancerInspections(),
      ]);

      let inspectorList: any[] = [];
      if (insRes.status === "fulfilled" && insRes.value?.success && insRes.value?.data) {
        inspectorList = insRes.value.data.map((ins: any) => ({
          ...ins,
          inspectionId: ins.inspectionId || ins.id,
          sourceType: "INSPECTOR",
        }));
      }

      let freelancerList: any[] = [];
      if (freeRes.status === "fulfilled" && freeRes.value?.success && freeRes.value?.data) {
        freelancerList = freeRes.value.data.map((item: any) => {
          const insId = item.inspectionId || item.id;
          return {
            ...item,
            inspectionId: insId,
            vehicleNumber:
              item.vehicleNumber ||
              item.registrationNumber ||
              item.regNo ||
              `INS-${insId}`,
            brand: item.brand || "",
            model: item.model || "",
            variant: item.variant || "",
            ownerName: item.ownerName || "1st Owner",
            suggestedPrice: item.suggestedPrice || item.price || 0,
            submittedAt: item.submittedAt || item.createdAt || null,
            inspectorName:
              item.freelancerName ||
              item.inspectorName ||
              item.inspector?.fullName ||
              (item.inspectorId ? `Freelancer #${item.inspectorId}` : "Freelancer"),
            status: item.status || "APPROVED",
            vehicleStatus: item.vehicleStatus || item.status || "LIVE",
            sourceType: "FREELANCER",
          };
        });
      }

      const combined = [...inspectorList, ...freelancerList];
      const liveOnly = combined.filter((ins: any) => {
        const vStat = String(ins.vehicleStatus || ins.status || "").toUpperCase();
        return vStat === "LIVE";
      });

      setInspections(liveOnly);
      if (
        liveOnly.length > 0 &&
        (selectedId === null || !liveOnly.some((i: any) => i.inspectionId === selectedId))
      ) {
        setSelectedId(liveOnly[0].inspectionId);
      }
      if (showToast) {
        toast.success("Active live bidding rooms refreshed");
      }
    } catch (err) {
      console.error("Failed to load active bidding list", err);
      if (showToast) toast.error("Failed to refresh live rooms");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filtered rooms based on activeTab and search query
  const filteredInspections = useMemo(() => {
    let list = inspections;
    if (activeTab === "inspector") {
      list = list.filter((i) => i.sourceType === "INSPECTOR");
    } else if (activeTab === "freelancer") {
      list = list.filter((i) => i.sourceType === "FREELANCER");
    }

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (i) =>
        i.brand?.toLowerCase().includes(q) ||
        i.model?.toLowerCase().includes(q) ||
        i.variant?.toLowerCase().includes(q) ||
        i.vehicleNumber?.toLowerCase().includes(q),
    );
  }, [inspections, activeTab, searchQuery]);

  // Initialize selected card details
  useEffect(() => {
    if (!selectedRoom) return;
    setHighestBid(
      selectedRoom.currentHighestBid || selectedRoom.suggestedPrice || 0,
    );
    setHighestBidder(selectedRoom.currentHighestBidder || "No bids placed");
    setTotalBids(selectedRoom.totalBids || 0);
    setEndTime(selectedRoom.auctionEndTime || Date.now() + 600 * 1000);
    setStatus(selectedRoom.vehicleStatus || "LIVE");

    const fetchHistory = async () => {
      try {
        const res = await getAdminBidHistory(selectedRoom.inspectionId);
        if (res.success && res.data) {
          setBidHistory(res.data);
        }
      } catch (err) {
        console.error("Failed to load historical bids", err);
      }
    };
    fetchHistory();
  }, [selectedId, selectedRoom]);

  // Ticking remaining countdown
  useEffect(() => {
    setRemaining(timeLeft(endTime));
    const timer = setInterval(() => {
      setRemaining(timeLeft(endTime));
    }, 1000);
    return () => clearInterval(timer);
  }, [endTime]);

  // Check if time remaining is under 2 minutes for warning highlight
  const isTimeLow = useMemo(() => {
    const diff = endTime - Date.now();
    return diff > 0 && diff <= 120000;
  }, [endTime]);

  // Connect websocket for selected auction room
  useEffect(() => {
    if (!selectedId) return;

    if (wsRef.current) {
      wsRef.current.close(1000);
    }

    const protocol = API_BASE_URL.startsWith("https") || window.location.protocol === "https:" ? "wss:" : "ws:";
    let host = "localhost:8080";
    if (API_BASE_URL && API_BASE_URL.includes("://")) {
      host = API_BASE_URL.split("://")[1];
    } else if (API_BASE_URL) {
      host = API_BASE_URL;
    }

    const wsUrl = `${protocol}//${host}/ws/auction?inspectionId=${selectedId}`;
    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (
          (data.type === "BID_UPDATE" || data.type === "GO_LIVE") &&
          Number(data.inspectionId) === Number(selectedId)
        ) {
          setHighestBid(data.currentHighestBid);
          setHighestBidder(data.currentHighestBidder || "Anonymous");
          setTotalBids(data.totalBids);
          if (data.auctionEndTime) {
            setEndTime(data.auctionEndTime);
          }
          if (data.bidHistory) {
            setBidHistory(data.bidHistory);
          }
          setStatus("LIVE");
        } else if (
          data.type === "AUCTION_ENDED" &&
          Number(data.inspectionId) === Number(selectedId)
        ) {
          setStatus("ENDED");
          setHighestBid(data.winningBid);
          setHighestBidder(data.winner || "No winner");
          toast.info(`Auction ended: Winner is ${data.winner}`);
        } else if (data.type === "SELLER_RESPONSE" && Number(data.inspectionId) === Number(selectedId)) {
          setSellerResp({ agreed: data.sellerAgreed, counterPrice: data.sellerCounterPrice, message: data.sellerMessage });
          toast.success("Seller response received!");
        } else if (data.type === "DEALER_REPLY" && Number(data.inspectionId) === Number(selectedId)) {
          setDealerReply({ reply: data.dealerReplyMessage || data.reply });
          toast.success("Dealer reply received!");
        } else if (data.type === "VEHICLE_STATUS_UPDATE" && Number(data.inspectionId) === Number(selectedId)) {
          setStatus(data.vehicleStatus);
          toast.info(`Status updated to ${data.vehicleStatus}`);
        }
      } catch (err) {
        console.error("Error parsing websocket message in Admin Monitor", err);
      }
    };

    return () => {
      socket.close(1000);
    };
  }, [selectedId]);

  return (
    <AppShell
      role="admin"
      nav={adminNav}
      title="Live Bidding Telemetry Center"
      breadcrumb={["Admin", "Live Bidding"]}
    >
      {/* Header Bar */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-soft transition-all">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 size-56 rounded-full bg-[#FFC700]/5 blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-foreground tracking-tight">
                Live Auction Telemetry
              </h2>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFC700]/15 border border-[#FFC700]/30 text-[#FFC700] text-xs font-extrabold shadow-sm">
                <Radio className="size-3.5 animate-pulse text-[#FFC700]" />
                {inspections.length} Active {inspections.length === 1 ? "Room" : "Rooms"}
              </span>
            </div>
            <p className="mt-1 text-xs font-semibold text-muted-foreground">
              Real-time WebSocket monitoring, active room stats & live dealer bidding logs
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => fetchRooms(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2.5 text-xs font-extrabold text-foreground shadow-soft transition-all hover:border-[#FFC700]/60 hover:bg-secondary disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={cn("size-3.5 text-[#FFC700]", refreshing && "animate-spin")} />
              <span>{refreshing ? "Refreshing..." : "Refresh Rooms"}</span>
            </button>
            <button
              onClick={() => navigate("/admin/auctions")}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#FFC700] hover:bg-[#FFD633] px-4 py-2.5 text-xs font-extrabold text-[#0D0E12] shadow-[0_4px_16px_rgba(255,199,0,0.3)] transition-all cursor-pointer"
            >
              <Gavel className="size-3.5" />
              <span>Manage Auctions</span>
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-5 xl:grid-cols-3">
          <div className="space-y-3 xl:col-span-1">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-28 rounded-2xl border border-border bg-card p-4 animate-pulse"
              />
            ))}
          </div>
          <div className="xl:col-span-2">
            <div className="h-96 rounded-3xl border border-border bg-card p-6 animate-pulse" />
          </div>
        </div>
      ) : inspections.length === 0 ? (
        <div className="relative overflow-hidden rounded-3xl border border-dashed border-border bg-card p-16 text-center shadow-soft">
          <div className="absolute inset-0 bg-gradient-to-b from-[#FFC700]/5 to-transparent pointer-events-none" />
          <div className="relative z-10 flex flex-col items-center max-w-md mx-auto">
            <div className="grid size-16 place-items-center rounded-3xl bg-[#FFC700]/10 text-[#FFC700] border border-[#FFC700]/25 shadow-[0_0_30px_rgba(255,199,0,0.15)] mb-4">
              <Gavel className="size-8" />
            </div>
            <h3 className="text-xl font-black text-foreground tracking-tight">
              No Active Bidding Sessions
            </h3>
            <p className="mt-2 text-xs font-semibold text-muted-foreground leading-relaxed">
              There are currently no live vehicle auctions running in the system. Approve pending evaluation reports in the Auctions section to start live bidding.
            </p>
            <button
              onClick={() => navigate("/admin/auctions")}
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#FFC700] hover:bg-[#FFD633] px-6 py-3 text-xs font-extrabold text-[#0D0E12] shadow-[0_4px_20px_rgba(255,199,0,0.35)] transition-all cursor-pointer"
            >
              <span>Go to Auctions Dashboard</span>
              <ArrowUpRight className="size-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-3 items-start">
          {/* Left Column: Active Auction Rooms List */}
          <div className="space-y-4 xl:col-span-1">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <Flame className="size-4 text-[#FFC700]" />
                Live Rooms ({filteredInspections.length})
              </h3>
            </div>

            {/* Tab Filter Buttons */}
            <div className="flex items-center gap-1.5 rounded-2xl bg-secondary/50 p-1 border border-border">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={cn(
                  "flex-1 rounded-xl py-1.5 text-[11px] font-black transition-all cursor-pointer",
                  activeTab === "all"
                    ? "bg-[#FFC700] text-[#0D0E12] shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                All ({inspections.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("inspector")}
                className={cn(
                  "flex-1 rounded-xl py-1.5 text-[11px] font-black transition-all cursor-pointer flex items-center justify-center gap-1",
                  activeTab === "inspector"
                    ? "bg-[#FFC700] text-[#0D0E12] shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <UserCheck className="size-3" /> Inspector
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("freelancer")}
                className={cn(
                  "flex-1 rounded-xl py-1.5 text-[11px] font-black transition-all cursor-pointer flex items-center justify-center gap-1",
                  activeTab === "freelancer"
                    ? "bg-[#FFC700] text-[#0D0E12] shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <User className="size-3" /> Freelancer
              </button>
            </div>

            {/* Room Search Bar */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search brand, model, or reg..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-border bg-card pl-10 pr-4 py-2.5 text-xs font-extrabold text-foreground outline-none transition-all focus:border-[#FFC700] focus:ring-2 focus:ring-[#FFC700]/20 shadow-soft"
              />
            </div>

            <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
              {filteredInspections.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-xs font-bold text-muted-foreground">
                  No live room matches filter
                </div>
              ) : (
                filteredInspections.map((v) => {
                  const isActive = v.inspectionId === selectedId;
                  const isFreelancer = v.sourceType === "FREELANCER";
                  return (
                    <div
                      key={v.inspectionId}
                      onClick={() => setSelectedId(v.inspectionId)}
                      className={cn(
                        "group relative rounded-2xl border p-4 transition-all duration-200 cursor-pointer text-left overflow-hidden shadow-soft",
                        isActive
                          ? "border-[#FFC700] bg-card shadow-[0_4px_24px_rgba(255,199,0,0.18)] ring-1 ring-[#FFC700]/30"
                          : "border-border bg-card hover:border-[#FFC700]/50 hover:bg-secondary/40",
                      )}
                    >
                      {/* Active indicator accent bar */}
                      {isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FFC700] rounded-r-full" />
                      )}

                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 tracking-wider">
                            <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
                            Live
                          </span>
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider border",
                            isFreelancer
                              ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                              : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                          )}>
                            {isFreelancer ? "Freelancer" : "Inspector"}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-lg border border-border bg-muted/60 font-mono font-extrabold text-[10px] text-foreground tracking-wider uppercase">
                          {v.vehicleNumber}
                        </span>
                      </div>

                      <h4 className="font-black text-foreground text-sm tracking-tight truncate group-hover:text-[#FFC700] transition-colors">
                        {v.brand} {v.model}
                      </h4>
                      <p className="text-[11px] font-semibold text-muted-foreground truncate mt-0.5">
                        Variant: {v.variant || "Standard"}
                      </p>

                      <div className="mt-3.5 flex items-center justify-between border-t border-border/60 pt-3 text-xs">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                            Current Highest
                          </span>
                          <span className="font-black text-foreground text-xs text-[#FFC700]">
                            {inr(v.currentHighestBid || v.suggestedPrice || 0)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 rounded-xl bg-secondary px-2.5 py-1 text-[11px] font-extrabold text-foreground border border-border">
                          <Clock className="size-3 text-[#FFC700]" />
                          <span>{timeLeft(v.auctionEndTime || Date.now() + 600 * 1000)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Main Telemetry Monitor Dashboard */}
          {selectedRoom && (
            <div className="xl:col-span-2 space-y-5">
              {/* Telemetry Card Container */}
              <div className="rounded-3xl border border-border bg-card p-6 shadow-soft transition-all space-y-6">
                {/* Dashboard Top Room Header */}
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg border border-border bg-muted font-mono font-black text-xs text-foreground tracking-widest uppercase">
                        {selectedRoom.vehicleNumber}
                      </span>
                      <StatusChip
                        status={status === "LIVE" ? "live" : "sold out"}
                      />
                    </div>
                    <h3 className="text-2xl font-black text-foreground tracking-tight pt-1">
                      {selectedRoom.brand} {selectedRoom.model}
                    </h3>
                    <p className="text-xs font-extrabold text-muted-foreground">
                      Variant: {selectedRoom.variant || "Standard"} • Evaluated by {selectedRoom.inspectorName || "Inspector"}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {status === "LIVE" && (
                      <button
                        type="button"
                        onClick={() => {
                          const link = `${window.location.origin}/public-bid/${selectedRoom.inspectionId}`;
                          navigator.clipboard.writeText(link);
                          toast.success(`Public Bidding Link copied for ${selectedRoom.brand} ${selectedRoom.model}!`);
                        }}
                        className="rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 px-3.5 py-2.5 text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                      >
                        <Copy className="size-3.5" />
                        Copy Public Link
                      </button>
                    )}

                    {/* Real-time Countdown Digital Pill */}
                    {status === "LIVE" && (
                      <div
                        className={cn(
                          "flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all shadow-sm",
                          isTimeLow
                            ? "border-rose-500/50 bg-rose-500/10 text-rose-500 animate-pulse"
                            : "border-[#FFC700]/30 bg-[#FFC700]/10 text-[#FFC700]",
                        )}
                      >
                        <div className="grid size-9 place-items-center rounded-xl bg-card border border-border shadow-inner">
                          <Clock className={cn("size-5", isTimeLow ? "text-rose-500" : "text-[#FFC700]")} />
                        </div>
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-widest block opacity-80">
                            Time Remaining
                          </span>
                          <span className="font-mono text-lg font-black tracking-wider block">
                            {remaining}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 4 Metric Cards */}
                <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
                  {/* Metric 1: Valuation */}
                  <div className="rounded-2xl border border-border bg-secondary/40 p-4 transition-all hover:border-[#FFC700]/50 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        Valuation Price
                      </span>
                      <div className="grid size-7 place-items-center rounded-lg bg-card border border-border text-muted-foreground">
                        <Tag className="size-3.5" />
                      </div>
                    </div>
                    <span className="truncate text-base font-black text-foreground block">
                      {selectedRoom.suggestedPrice
                        ? inr(selectedRoom.suggestedPrice)
                        : "N/A"}
                    </span>
                    <span className="text-[10px] font-semibold text-muted-foreground block mt-1">
                      Base Valuation
                    </span>
                  </div>

                  {/* Metric 2: Current Highest Bid */}
                  <div className="rounded-2xl border border-[#FFC700]/40 bg-[#FFC700]/5 p-4 transition-all shadow-[0_4px_16px_rgba(255,199,0,0.12)]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black text-[#FFC700] uppercase tracking-widest">
                        Current Bid
                      </span>
                      <div className="grid size-7 place-items-center rounded-lg bg-[#FFC700]/20 text-[#FFC700]">
                        <Flame className="size-3.5" />
                      </div>
                    </div>
                    <span className="truncate text-base font-black text-foreground block text-[#FFC700]">
                      {inr(highestBid)}
                    </span>
                    <span className="text-[10px] font-bold text-foreground/80 block mt-1">
                      Highest Leader Amount
                    </span>
                  </div>

                  {/* Metric 3: Leading Bidder */}
                  <div className="rounded-2xl border border-border bg-secondary/40 p-4 transition-all hover:border-[#FFC700]/50 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        Leading Bidder
                      </span>
                      <div className="grid size-7 place-items-center rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        <Award className="size-3.5" />
                      </div>
                    </div>
                    <span className="truncate text-sm font-extrabold text-foreground block">
                      {highestBidder}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-600 block mt-1 flex items-center gap-1">
                      <CheckCircle2 className="size-3" /> Top Rank Leader
                    </span>
                  </div>

                  {/* Metric 4: Total Bids */}
                  <div className="rounded-2xl border border-border bg-secondary/40 p-4 transition-all hover:border-[#FFC700]/50 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        Total Bids
                      </span>
                      <div className="grid size-7 place-items-center rounded-lg bg-card border border-border text-muted-foreground">
                        <Activity className="size-3.5" />
                      </div>
                    </div>
                    <span className="truncate text-base font-black text-foreground block">
                      {totalBids} Placed
                    </span>
                    <span className="text-[10px] font-semibold text-muted-foreground block mt-1">
                      Live Telemetry Stream
                    </span>
                  </div>
                </div>

                {/* Bidding Outcome Banner & Post-Auction Control Panel */}
                {(status === "SOLD OUT" || status === "ENDED" || status === "AUCTION ENDED") && (
                  <div className="space-y-4">
                    <div
                      className={cn(
                        "rounded-2xl border p-5 relative overflow-hidden transition-all shadow-soft",
                        totalBids === 0
                          ? "border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200"
                          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200",
                      )}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "grid size-10 place-items-center rounded-xl shrink-0",
                              totalBids === 0
                                ? "bg-amber-500/20 text-amber-600"
                                : "bg-emerald-500/20 text-emerald-600",
                            )}
                          >
                            {totalBids === 0 ? (
                              <AlertTriangle className="size-5" />
                            ) : (
                              <CheckCircle2 className="size-5" />
                            )}
                          </div>
                          <div>
                            <h4 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                              {totalBids === 0
                                ? "Bidding Concluded - Unsold"
                                : `Bidding Concluded - Status: ${status}`}
                            </h4>
                            <p className="text-xs font-semibold mt-1 leading-relaxed opacity-90">
                              {totalBids === 0
                                ? "The bidding timer expired without receiving any bids from dealers."
                                : `Top winning dealer: '${highestBidder}' with highest bid of ${inr(highestBid)}.`}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleMarkAsSoldOutManual}
                          className="rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black px-4 py-2 text-xs shadow-md transition-all cursor-pointer shrink-0"
                        >
                          Mark Status as SOLD OUT
                        </button>
                      </div>
                    </div>

                    {/* Seller Response Box */}
                    <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                      <div className="flex items-center justify-between font-black text-amber-700 dark:text-amber-400">
                        <span>Seller Price Confirmation Response:</span>
                        <span>{sellerResp ? "Response Submitted" : "Pending Seller Response"}</span>
                      </div>
                      {sellerResp ? (
                        <p className="font-semibold mt-1">
                          Question: "Are you agree for this price for sell?" ➔{" "}
                          <strong className="text-amber-600 dark:text-amber-300">
                            {sellerResp.agreed ? "YES (Agreed to sell)" : `NO (Wants counter ₹${sellerResp.counterPrice?.toLocaleString("en-IN") || 'N/A'})`}
                          </strong>
                          {sellerResp.message && <span className="block italic opacity-90 mt-0.5">Message: "{sellerResp.message}"</span>}
                        </p>
                      ) : (
                        <p className="italic opacity-80 mt-1">Awaiting seller response from public link or vehicle detail page.</p>
                      )}
                    </div>

                    {/* Send Message to Winning Dealer */}
                    <div className="rounded-2xl bg-card border border-border p-4 space-y-2">
                      <label className="block text-xs font-extrabold text-foreground">
                        Send Message to Winning Dealer ({highestBidder}):
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. Seller agreed to sell at ₹4.25L. Please confirm payment..."
                          value={adminDealerMsgText}
                          onChange={(e) => setAdminDealerMsgText(e.target.value)}
                          className="flex-1 rounded-xl border border-border bg-secondary px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:border-amber-400"
                        />
                        <button
                          type="button"
                          onClick={handleSendDealerMsg}
                          className="rounded-xl bg-[#FFC700] hover:bg-[#FFD633] text-[#0D0E12] font-black px-4 py-2 text-xs shadow-sm cursor-pointer flex items-center gap-1 shrink-0"
                        >
                          <Send className="size-3.5" /> Send Message
                        </button>
                      </div>

                      {dealerReply && (
                        <div className="mt-3 rounded-xl bg-blue-500/10 border border-blue-500/30 p-3 text-xs text-blue-900 dark:text-blue-200">
                          <span className="font-black text-blue-600 dark:text-blue-400 block mb-1">
                            Dealer Reply Received:
                          </span>
                          <p className="font-semibold">"{dealerReply.reply}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Real-time Bidding Feed / Activity Log */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-3.5">
                    <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                      <Activity className="size-4 text-[#FFC700]" />
                      Live Bidding Stream Log ({bidHistory.length})
                    </h4>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-muted-foreground bg-secondary px-2.5 py-1 rounded-lg border border-border">
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Telemetry
                    </span>
                  </div>

                  {bidHistory.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border p-12 text-center bg-secondary/20">
                      <History className="size-8 text-muted-foreground/50 mx-auto mb-2" />
                      <p className="text-xs font-extrabold text-foreground">
                        No bids recorded in this room yet
                      </p>
                      <p className="mt-1 text-[11px] font-semibold text-muted-foreground">
                        Awaiting initial bid placement from connected registered dealers.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-2xl border border-border shadow-soft">
                      <div className="max-h-[380px] overflow-y-auto">
                        <table className="w-full border-collapse text-left text-xs">
                          <thead className="sticky top-0 z-10">
                            <tr className="bg-secondary/90 backdrop-blur-md font-black text-muted-foreground uppercase tracking-widest text-[9px] border-b border-border">
                              <th className="px-4 py-3">Rank & Dealer</th>
                              <th className="px-4 py-3">Bid Amount</th>
                              <th className="px-4 py-3 text-right">Time Placed</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/60">
                            {bidHistory.map((b, idx) => {
                              const isWinner = idx === 0;
                              const prevAmount =
                                idx < bidHistory.length - 1
                                  ? bidHistory[idx + 1].amount
                                  : selectedRoom.suggestedPrice || 0;
                              const diff = b.amount - prevAmount;

                              return (
                                <tr
                                  key={idx}
                                  className={cn(
                                    "transition-colors duration-150 font-medium",
                                    isWinner
                                      ? "bg-[#FFC700]/5 hover:bg-[#FFC700]/10 font-bold"
                                      : "hover:bg-secondary/30",
                                  )}
                                >
                                  <td className="px-4 py-3.5 flex items-center gap-3">
                                    <div
                                      className={cn(
                                        "grid size-7 place-items-center rounded-xl text-xs font-black shrink-0 shadow-inner",
                                        isWinner
                                          ? "bg-[#FFC700] text-[#0D0E12] shadow-[0_2px_8px_rgba(255,199,0,0.4)]"
                                          : "bg-secondary text-muted-foreground border border-border",
                                      )}
                                    >
                                      {idx + 1}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                      <div className="flex items-center gap-1.5">
                                        <span
                                          className={cn(
                                            "truncate font-black",
                                            isWinner
                                              ? "text-foreground"
                                              : "text-foreground/80",
                                          )}
                                        >
                                          {b.dealer}
                                        </span>
                                        {isWinner && (
                                          <span className="rounded-md bg-emerald-500/15 text-[8px] font-black uppercase text-emerald-600 px-1.5 py-0.5 tracking-wider border border-emerald-500/20">
                                            Leading
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </td>

                                  <td className="px-4 py-3.5">
                                    <div className="flex flex-col">
                                      <span
                                        className={cn(
                                          "font-black text-sm",
                                          isWinner
                                            ? "text-[#FFC700]"
                                            : "text-foreground",
                                        )}
                                      >
                                        {inr(b.amount)}
                                      </span>
                                      {diff > 0 && (
                                        <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-0.5">
                                          <TrendingUp className="size-2.5" /> +{inr(diff)}
                                        </span>
                                      )}
                                    </div>
                                  </td>

                                  <td className="px-4 py-3.5 text-right font-semibold text-muted-foreground text-xs">
                                    {formatIndianDateTime(b.time)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
