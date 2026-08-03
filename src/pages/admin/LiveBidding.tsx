import { useEffect, useState, useRef } from "react";
import { AppShell } from "@/components/app-shell";
import { adminNav } from "@/components/nav-config";
import { Panel, StatusChip } from "@/components/premium";
import {
  getSubmittedInspections,
  getAdminBidHistory,
  type AdminInspectionSummary,
} from "@/lib/api/admin-api";
import { inr, timeLeft } from "@/lib/mock-data";
import { toast } from "sonner";
import { Clock, Gavel, User, Car, CheckCircle, AlertTriangle } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

interface LiveBidRecord {
  dealer: string;
  amount: number;
  time: string;
}

export function AdminLiveBidding() {
  const [inspections, setInspections] = useState<AdminInspectionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Real-time tracking states for selected room
  const [highestBid, setHighestBid] = useState<number>(0);
  const [highestBidder, setHighestBidder] = useState<string>("No bids placed");
  const [totalBids, setTotalBids] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(Date.now() + 600 * 1000);
  const [status, setStatus] = useState<string>("LIVE");
  const [bidHistory, setBidHistory] = useState<LiveBidRecord[]>([]);
  const [remaining, setRemaining] = useState<string>("");

  const wsRef = useRef<WebSocket | null>(null);

  const fetchRooms = async () => {
    try {
      const res = await getSubmittedInspections();
      if (res.success && res.data) {
        // filter for LIVE auctions
        const liveOnly = res.data.filter(
          (ins: AdminInspectionSummary) =>
            ins.status === "APPROVED" && ins.vehicleStatus === "LIVE",
        );
        setInspections(liveOnly);
        if (liveOnly.length > 0 && selectedId === null) {
          setSelectedId(liveOnly[0].inspectionId);
        }
      }
    } catch (err) {
      console.error("Failed to load active bidding list", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedRoom = inspections.find((r) => r.inspectionId === selectedId);

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

  // Connect websocket for selected auction room
  useEffect(() => {
    if (!selectedId) return;

    if (wsRef.current) {
      wsRef.current.close(1000);
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
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
          setStatus("SOLD OUT");
          setHighestBid(data.winningBid);
          setHighestBidder(data.winner || "No winner");
          toast.info(`Auction ended: Winner is ${data.winner}`);
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
      title="Live Bidding Monitor"
      breadcrumb={["Admin", "Live Monitor"]}
    >
      {loading ? (
        <div className="flex h-60 items-center justify-center bg-card border border-border rounded-3xl shadow-soft">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : inspections.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-16 text-center shadow-soft">
          <Gavel className="size-10 text-[#FFC700] mx-auto mb-3" />
          <p className="font-extrabold text-foreground text-lg">
            No active live bidding sessions
          </p>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">
            Activate pending vehicles in the Auctions dashboard to monitor them
            here.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-3">
          {/* Left Room Card List */}
          <div className="space-y-4 xl:col-span-1">
            <h3 className="text-sm font-extrabold text-muted-foreground uppercase tracking-wider mb-2">
              Active Rooms ({inspections.length})
            </h3>
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {inspections.map((v) => {
                const isActive = v.inspectionId === selectedId;
                return (
                  <div
                    key={v.inspectionId}
                    onClick={() => setSelectedId(v.inspectionId)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer text-left ${
                      isActive
                        ? "border-[#FFC700] bg-secondary shadow-[0_4px_16px_rgba(255,199,0,0.1)]"
                        : "border-border bg-card hover:bg-secondary/40 shadow-sm"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-black uppercase text-[#FFC700] tracking-widest flex items-center gap-1">
                        <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />{" "}
                        Live Room
                      </span>
                      <span className="text-[10px] font-bold text-muted-foreground">
                        {v.vehicleNumber}
                      </span>
                    </div>
                    <p className="mt-2 font-extrabold text-foreground text-sm">
                      {v.brand} {v.model}
                    </p>
                    <p className="text-[11px] font-semibold text-muted-foreground">
                      Variant: {v.variant || "Standard"}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Monitor Panel */}
          {selectedRoom && (
            <div className="xl:col-span-2 space-y-4">
              <Panel
                title={`${selectedRoom.brand} ${selectedRoom.model}`}
                description={`Bidding telemetry dashboard for ${selectedRoom.vehicleNumber}`}
                action={
                  <div className="flex items-center gap-2">
                    <StatusChip
                      status={status === "LIVE" ? "live" : "sold out"}
                    />
                    {status === "LIVE" && (
                      <span className="flex items-center gap-1.5 rounded-xl border border-border bg-secondary px-3 py-1.5 text-xs font-bold">
                        <Clock className="size-3.5 text-[#FFC700]" />
                        {remaining}
                      </span>
                    )}
                  </div>
                }
              >
                {/* Stats row */}
                <div className="grid gap-3 sm:grid-cols-3 mb-6 mt-4">
                  <div className="rounded-2xl border border-border bg-secondary/35 p-4">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Valuation Price
                    </span>
                    <span className="truncate text-base font-extrabold text-foreground block mt-1">
                      {selectedRoom.suggestedPrice
                        ? inr(selectedRoom.suggestedPrice)
                        : "N/A"}
                    </span>
                  </div>
                  <div className="rounded-2xl border border-[#FFC700]/30 bg-[#FFC700]/5 p-4">
                    <span className="text-[9px] font-bold text-[#FFC700] uppercase tracking-wider block">
                      Current Bid
                    </span>
                    <span className="truncate text-base font-black text-foreground block mt-1">
                      {inr(highestBid)}
                    </span>
                  </div>
                  <div className="rounded-2xl border border-border bg-secondary/35 p-4">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Total Activity
                    </span>
                    <span className="truncate text-base font-extrabold text-foreground block mt-1">
                      {totalBids} Bids Placed
                    </span>
                  </div>
                </div>

                {/* Bidding Outcome Banner */}
                {(status === "SOLD OUT" || status === "ENDED") && (
                  <div className={`rounded-2xl border p-4 mb-6 text-left relative overflow-hidden ${
                    totalBids === 0
                      ? "border-amber-500/20 bg-amber-500/5 text-amber-800 dark:text-amber-300"
                      : "border-red-500/20 bg-red-500/5 text-red-800 dark:text-red-300"
                  }`}>
                    <h4 className="text-sm font-extrabold flex items-center gap-1.5 uppercase tracking-wide">
                      {totalBids === 0 ? (
                        <>
                          <AlertTriangle className="size-4 text-amber-500" /> Bidding Ended - Unsold
                        </>
                      ) : (
                        <>
                          <CheckCircle className="size-4 text-red-500" /> Bidding Ended - SOLD OUT
                        </>
                      )}
                    </h4>
                    <p className="text-xs font-semibold text-muted-foreground mt-1.5 leading-relaxed">
                      {totalBids === 0
                        ? "The 10-minute bidding window elapsed without any bids. The vehicle remains unsold."
                        : `The auction has concluded successfully. The vehicle is marked as SOLD OUT to dealer '${highestBidder}' for ${inr(highestBid)}.`}
                    </p>
                  </div>
                )}

                {/* Bidders History List */}
                <div className="border-t border-border pt-5">
                  <h4 className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider mb-3">
                    Live Bidding Log
                  </h4>
                  {bidHistory.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border p-12 text-center text-xs font-semibold text-muted-foreground">
                      No bids received yet. Awaiting first bid from connected
                      dealers.
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-2xl border border-border">
                      <table className="w-full border-collapse text-left text-xs">
                        <thead>
                          <tr className="bg-secondary/70 font-extrabold text-muted-foreground uppercase tracking-wider border-b border-border">
                            <th className="px-4 py-3">Dealer</th>
                            <th className="px-4 py-3">Bid Amount</th>
                            <th className="px-4 py-3 text-right">Timestamp</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bidHistory.map((b, idx) => {
                            const isWinner = idx === 0;
                            return (
                              <tr
                                key={idx}
                                className="border-b border-border/80 last:border-0 hover:bg-secondary/25 transition-colors font-medium"
                              >
                                <td className="px-4 py-3.5 flex items-center gap-2">
                                  <div
                                    className={`grid size-7 place-items-center rounded-lg ${isWinner ? "bg-emerald-500/10 text-emerald-500" : "bg-secondary text-muted-foreground"}`}
                                  >
                                    {isWinner ? (
                                      <CheckCircle className="size-4" />
                                    ) : (
                                      <User className="size-3.5" />
                                    )}
                                  </div>
                                  <span
                                    className={
                                      isWinner
                                        ? "font-extrabold text-foreground"
                                        : "text-muted-foreground"
                                    }
                                  >
                                    {b.dealer}
                                  </span>
                                  {isWinner && (
                                    <span className="rounded-md bg-emerald-500/15 text-[8px] font-black uppercase text-emerald-600 px-1.5 py-0.5 tracking-wider">
                                      Highest
                                    </span>
                                  )}
                                </td>
                                <td
                                  className={`px-4 py-3.5 font-bold ${isWinner ? "text-foreground text-sm" : "text-muted-foreground"}`}
                                >
                                  {inr(b.amount)}
                                </td>
                                <td className="px-4 py-3.5 text-right text-muted-foreground/80">
                                  {b.time}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </Panel>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
