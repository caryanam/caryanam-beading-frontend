import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useParams } from "react-router-dom";
import {
  Car,
  AlertTriangle,
  Eye,
  Clock,
  Gauge,
  Fuel,
  Settings2,
  TrendingUp,
  X as CloseIcon,
  Copy,
  Zap,
  Send,
  Award,
  CheckCircle2,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/api";
import { getPublicInspectionDetails, submitSellerResponse } from "@/lib/api/dealer-api";
import { inr, timeLeft } from "@/lib/mock-data";
import { cn, maskDealerName, formatIndianDateTime } from "@/lib/utils";
import { StatusChip } from "@/components/premium";

export function PublicBiddingPage() {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const [vehicle, setVehicle] = useState<any>(null);
  const [rawDetails, setRawDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [remaining, setRemaining] = useState("");
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [bidHistory, setBidHistory] = useState<any[]>([]);

  // Seller response form state
  const [sellerAgreed, setSellerAgreed] = useState<boolean>(true);
  const [sellerCounterPrice, setSellerCounterPrice] = useState<number | null>(null);
  const [sellerMessage, setSellerMessage] = useState("");
  const [submittingSeller, setSubmittingSeller] = useState(false);

  useEffect(() => {
    if (vehicle) {
      if (vehicle.sellerAgreed !== undefined && vehicle.sellerAgreed !== null) {
        setSellerAgreed(vehicle.sellerAgreed);
      }
      if (vehicle.sellerCounterPrice) setSellerCounterPrice(vehicle.sellerCounterPrice);
      if (vehicle.sellerMessage) setSellerMessage(vehicle.sellerMessage);
    }
  }, [vehicle]);

  // Load public inspection details
  const loadDetails = async () => {
    if (!vehicleId) return;
    setLoading(true);
    try {
      const res = await getPublicInspectionDetails(Number(vehicleId));
      if (res.success && res.data) {
        const raw = res.data;
        setRawDetails(raw);
        const v = raw.vehicleDetails || {};
        const inspectionId = raw.inspectionId || Number(vehicleId);

        const basePrice = v.suggestedPrice || 0;
        const history = raw.bidHistory || [];
        const topBidInHistory = history.length > 0 ? (history[0].amount || history[0].bidAmount || 0) : 0;
        const topBidderInHistory = history.length > 0 ? (history[0].dealerName || history[0].dealer || history[0].dealershipName) : null;

        const highestBid = Math.max(
          v.currentHighestBid && v.currentHighestBid > 0 ? v.currentHighestBid : 0,
          topBidInHistory
        );
        const bidCount = Math.max(v.totalBids || 0, history.length);
        const highestBidder = topBidderInHistory || (v.currentHighestBidder
          ? v.currentHighestBidder.dealershipName || v.currentHighestBidder
          : null);

        let fuelType = "Petrol";
        const f = (v.fuelType || "").toLowerCase();
        if (f.includes("diesel")) fuelType = "Diesel";
        else if (f.includes("cng")) fuelType = "CNG";
        else if (f.includes("lpg")) fuelType = "LPG";
        else if (f.includes("hybrid")) fuelType = "Hybrid";
        else if (f.includes("electric") || f.includes("ev")) fuelType = "Electric";
        else if (v.fuelType) fuelType = v.fuelType;

        let transmissionType = "Manual";
        const t = (v.transmission || "").toLowerCase();
        if (t.includes("auto")) transmissionType = "Automatic";

        const endsAtTime = v.auctionEndTime || Date.now() + 1000 * 60 * 60 * 24;

        const r = raw.ratings || {};
        const extR = r.exterior || r.exteriorRating || 0;
        const mechR = r.mechanical || r.mechanicalRating || 0;
        const tyreR = r.tyre || r.tyreRating || 0;
        const intR = r.interior || r.interiorRating || 0;
        const hasRatings = extR > 0 || mechR > 0 || tyreR > 0 || intR > 0;
        const calculatedScore = hasRatings
          ? Math.round(((extR + mechR + tyreR + intR) / 4) * 20)
          : 88 + (inspectionId % 10);

        const imageList = raw.inspectionPhotos || [];
        const validPhotos = imageList
          .filter((img: any) => img.imageUrl)
          .map((img: any) => ({
            url: img.imageUrl,
            name: img.displayName || img.imageCategory || "Inspection View",
            photoType: img.photoType,
            category: img.imageCategory,
          }));
        const finalImages =
          validPhotos.length > 0
            ? validPhotos
            : [
              {
                url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80",
                name: "Front View",
              },
            ];
        const primaryImage = finalImages[0].url;

        const mapped = {
          id: String(inspectionId),
          brand: v.brand || "Vehicle",
          model: v.model || "Details",
          variant: v.variant || "",
          year: v.manufacturingYear || 2020,
          fuel: fuelType,
          transmission: transmissionType,
          odometer: v.odometerReading || 45000,
          insuranceStatus: v.insuranceStatus || "Expired / N/A",
          score: calculatedScore,
          basePrice,
          highestBid,
          highestBidder,
          bids: bidCount,
          status: "approved",
          auction:
            v.vehicleStatus === "LIVE"
              ? "live"
              : v.vehicleStatus === "SOLD OUT" ||
                v.vehicleStatus === "SOLD_OUT" ||
                v.vehicleStatus === "SOLD"
                ? "sold out"
                : v.vehicleStatus === "ENDED" ||
                  v.vehicleStatus === "AUCTION ENDED" ||
                  v.vehicleStatus === "AUCTION_ENDED"
                  ? "ended"
                  : "scheduled",
          image: primaryImage,
          images: finalImages,
          endsAt: endsAtTime,
          inspector: raw.inspectorName || "Certified Inspector",
          vehicleStatus: v.vehicleStatus,
          sellerAgreed: v.sellerAgreed,
          sellerCounterPrice: v.sellerCounterPrice,
          sellerMessage: v.sellerMessage,
          adminDealerMessage: v.adminDealerMessage,
          dealerReplyMessage: v.dealerReplyMessage,
        };
        setVehicle(mapped);
        setBidHistory(raw.bidHistory || []);
        setRemaining(timeLeft(endsAtTime));
      }
    } catch (err) {
      console.error("Failed to load public inspection details", err);
      toast.error("Could not retrieve public inspection details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [vehicleId]);

  // WebSocket real-time listener for live auction updates
  useEffect(() => {
    if (!vehicleId) return;
    const wsProtocol = API_BASE_URL.startsWith("https") || window.location.protocol === "https:" ? "wss:" : "ws:";
    let host = "localhost:8080";
    if (API_BASE_URL && API_BASE_URL.includes("://")) {
      host = API_BASE_URL.split("://")[1];
    } else if (API_BASE_URL) {
      host = API_BASE_URL;
    }

    const wsUrl = `${wsProtocol}//${host}/ws/auction?inspectionId=${vehicleId}`;
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(wsUrl);
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (
            (data.type === "BID_UPDATE" || data.type === "GO_LIVE") &&
            Number(data.inspectionId) === Number(vehicleId)
          ) {
            setVehicle((prev: any) =>
              prev
                ? {
                  ...prev,
                  highestBid: data.currentHighestBid,
                  highestBidder: data.currentHighestBidder,
                  bids: data.totalBids,
                  endsAt: data.auctionEndTime,
                  auction: "live",
                  vehicleStatus: "LIVE",
                }
                : prev
            );
            if (data.bidHistory) setBidHistory(data.bidHistory);
          } else if (data.type === "SELLER_RESPONSE") {
            setVehicle((prev: any) =>
              prev
                ? {
                  ...prev,
                  sellerAgreed: data.sellerAgreed,
                  sellerCounterPrice: data.sellerCounterPrice,
                  sellerMessage: data.sellerMessage,
                }
                : prev
            );
          } else if (data.type === "VEHICLE_STATUS_UPDATE" || data.type === "AUCTION_ENDED") {
            setVehicle((prev: any) =>
              prev ? { ...prev, vehicleStatus: data.vehicleStatus || "ENDED", auction: "ended" } : prev
            );
          }
        } catch (e) { }
      };
    } catch (e) { }

    return () => {
      if (ws) ws.close();
    };
  }, [vehicleId]);

  useEffect(() => {
    if (!vehicle?.endsAt) return;
    const id = setInterval(() => setRemaining(timeLeft(vehicle.endsAt)), 1000);
    return () => clearInterval(id);
  }, [vehicle?.endsAt]);

  const handleSendSellerResponse = async () => {
    if (!vehicleId) return;
    setSubmittingSeller(true);
    try {
      const res = await submitSellerResponse(Number(vehicleId), {
        agreed: sellerAgreed,
        counterPrice: sellerCounterPrice || undefined,
        message: sellerMessage,
      });
      if (res.success) {
        toast.success("Seller decision submitted successfully!");
        setVehicle((prev: any) => ({
          ...prev,
          sellerAgreed,
          sellerCounterPrice,
          sellerMessage,
        }));
      } else {
        toast.error("Failed to submit seller decision.");
      }
    } catch (err) {
      toast.error("Error submitting seller decision.");
    } finally {
      setSubmittingSeller(false);
    }
  };

  const copyPublicLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Public Bidding Room link copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background font-sans antialiased text-foreground flex flex-col items-center justify-center p-6">
        <div className="flex h-96 flex-col items-center justify-center gap-4 bg-card border border-border rounded-3xl shadow-soft px-12">
          <span className="h-12 w-12 animate-spin rounded-full border-4 border-[#FFC700] border-t-transparent" />
          <p className="text-sm font-extrabold text-muted-foreground animate-pulse">
            Loading Live Bidding Room...
          </p>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-background font-sans antialiased text-foreground flex flex-col items-center justify-center p-6">
        <div className="rounded-3xl border border-dashed border-border bg-card p-16 text-center shadow-soft max-w-md w-full">
          <AlertTriangle className="size-10 text-amber-500 mx-auto mb-3" />
          <p className="font-extrabold text-foreground text-lg">
            Public Bidding Room Not Found
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            The requested vehicle inspection or bidding session could not be retrieved.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans antialiased text-foreground p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner Header with Vehicle Name & Branding */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border bg-card p-5 shadow-soft">
        <div className="flex items-center gap-3">
          <div className="relative grid size-11 place-items-center rounded-2xl overflow-hidden shadow-[0_4px_16px_rgba(255,199,0,0.35)] bg-[#0D0E12] border border-[#FFC700]/50 shrink-0">
            <img src="/logo.png" alt="Caryanam" className="size-full object-cover" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-black tracking-tight text-foreground sm:text-2xl uppercase">
                {vehicle.brand} {vehicle.model}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-secondary text-foreground border border-border">
                {vehicle.variant}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-[#FFC700]/15 text-[#FFC700] border border-[#FFC700]/30">
                {vehicle.year} Model
              </span>
              <StatusChip status={vehicle.auction} />
            </div>
            <p className="mt-0.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Verified Public Bidding & Auction Room
            </p>
          </div>
        </div>
      </div>

      {/* Expired Auction Notice */}
      {vehicle?.vehicleStatus !== "LIVE" && (
        <div className="rounded-3xl border border-rose-500/40 bg-gradient-to-r from-rose-500/15 via-rose-500/10 to-transparent p-5 text-rose-500 space-y-1.5 shadow-soft">
          <div className="flex items-center gap-2.5 font-black text-sm text-rose-600 dark:text-rose-400">
            <AlertTriangle className="size-5 shrink-0 text-rose-500" />
            <span>PUBLIC BIDDING LINK EXPIRED — AUCTION ENDED</span>
          </div>
          <p className="text-xs font-bold text-rose-700 dark:text-rose-300 leading-relaxed">
            This public live bidding session is closed. Bidding has ended. Please review the highest bid offer and submit your selling decision below.
          </p>
        </div>
      )}

      {/* TOP HERO GRID: Compact Vehicle Showcase (Left) + Massive Live Bidding Arena (Right) */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Card (5 Cols): Compact Vehicle Card with Small Image */}
        <div className="lg:col-span-5 rounded-3xl border border-border bg-card p-4 space-y-4 shadow-soft flex flex-col justify-between">
          <div className="space-y-3">
            {/* Small Compact Image Container */}
            <div
              onClick={() => setPreviewIndex(0)}
              className="relative aspect-[16/8] w-full overflow-hidden rounded-2xl bg-secondary cursor-pointer group border border-border"
            >
              <img
                src={vehicle.image}
                alt={`${vehicle.brand} ${vehicle.model}`}
                className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

              <div className="absolute left-3 top-3 z-10">
                <span className="rounded-full bg-[#FFC700] px-3 py-1 text-[11px] font-black text-[#0D0E12] shadow-sm">
                  Score {vehicle.score}/100
                </span>
              </div>

              <div className="absolute right-3 top-3 z-10">
                <span className="rounded-full bg-black/60 backdrop-blur-md px-3 py-1 text-[10px] font-bold text-white border border-white/20 flex items-center gap-1">
                  <Eye className="size-3 text-[#FFC700]" /> Zoom
                </span>
              </div>

              <div className="absolute bottom-2.5 left-3 right-3 z-10 flex items-center justify-between text-white text-xs">
                <span className="font-extrabold truncate">
                  {vehicle.brand} {vehicle.model}
                </span>
                <span className="font-semibold text-[10px] text-white/80">
                  📷 {vehicle.images?.length || 1} Photos
                </span>
              </div>
            </div>

            {/* Compact Specs Grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2.5 rounded-xl border border-border bg-secondary/40 p-2.5">
                <div className="grid size-7 place-items-center rounded-lg bg-[#FFC700]/15 text-[#FFC700] shrink-0">
                  <Car className="size-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[8.5px] font-extrabold uppercase text-muted-foreground">Year</p>
                  <p className="text-xs font-black text-foreground truncate">{vehicle.year}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 rounded-xl border border-border bg-secondary/40 p-2.5">
                <div className="grid size-7 place-items-center rounded-lg bg-blue-500/15 text-blue-500 shrink-0">
                  <Gauge className="size-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[8.5px] font-extrabold uppercase text-muted-foreground">Odometer</p>
                  <p className="text-xs font-black text-foreground truncate">{vehicle.odometer.toLocaleString("en-IN")} km</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 rounded-xl border border-border bg-secondary/40 p-2.5">
                <div className="grid size-7 place-items-center rounded-lg bg-emerald-500/15 text-emerald-500 shrink-0">
                  <Fuel className="size-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[8.5px] font-extrabold uppercase text-muted-foreground">Fuel</p>
                  <p className="text-xs font-black text-foreground truncate">{vehicle.fuel}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 rounded-xl border border-border bg-secondary/40 p-2.5">
                <div className="grid size-7 place-items-center rounded-lg bg-purple-500/15 text-purple-500 shrink-0">
                  <Settings2 className="size-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[8.5px] font-extrabold uppercase text-muted-foreground">Transmission</p>
                  <p className="text-xs font-black text-foreground truncate">{vehicle.transmission}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Card (7 Cols): Massive Hero Live Bidding Arena Box */}
        <div className="lg:col-span-7 surface-dark rounded-3xl p-6 text-white border border-[#FFC700]/40 shadow-lift relative overflow-hidden flex flex-col justify-between before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_right,rgba(255,199,0,0.25),transparent_65%)]">
          <div className="relative z-10 flex items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              {vehicle.auction === "live" ? (
                <span className="text-xs font-black text-[#FFC700] uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="size-4 fill-current animate-pulse text-[#FFC700]" />
                  Live Auction Room
                </span>
              ) : (
                <span className="text-xs font-black text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="size-4 text-rose-400" />
                  Auction Bidding Room (Ended)
                </span>
              )}
              <StatusChip status={vehicle.auction} />
            </div>

            <span className="text-xs font-bold text-white/80 bg-white/10 px-3 py-1 rounded-full border border-white/20">
              {vehicle.bids || 0} Total Bids Placed
            </span>
          </div>

          <div className="relative z-10 my-4 space-y-4">
            {/* Top Bid Highlight Box */}
            <div className="flex flex-wrap items-baseline justify-between gap-4 bg-white/5 border border-white/10 p-5 rounded-2xl">
              <div>
                <span className="text-[10px] font-black tracking-widest text-[#FFC700] uppercase block mb-1">
                  CURRENT HIGHEST BID
                </span>
                <span className="text-4xl sm:text-5xl font-black text-white tracking-tight block">
                  {!vehicle.highestBid || vehicle.bids === 0
                    ? "No Bids Yet"
                    : inr(vehicle.highestBid)}
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold text-white/50 uppercase block">
                  Valuation Price
                </span>
                <span className="text-sm font-extrabold text-white/80 block mt-1">
                  {inr(vehicle.basePrice)}
                </span>
              </div>
            </div>

            {/* Leading Bidder Bar */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="grid size-9 place-items-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0 font-bold text-sm">
                  👑
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-extrabold text-white/60 uppercase block">
                    Leading Highest Bidder
                  </span>
                  <span className="text-sm font-black text-white truncate block">
                    {vehicle.highestBidder ? maskDealerName(vehicle.highestBidder) : "No Bids Placed Yet"}
                  </span>
                </div>
              </div>

              {vehicle.highestBidder && (
                <span className="shrink-0 rounded-full bg-emerald-500/20 text-emerald-400 px-3 py-1 text-xs font-black border border-emerald-500/30">
                  Rank #1 Leader
                </span>
              )}
            </div>

            {/* Live Timer Bar */}
            {vehicle.auction === "live" && (
              <div className="flex items-center justify-between rounded-2xl bg-[#FFC700]/10 border border-[#FFC700]/30 px-4 py-3">
                <span className="text-xs font-bold text-white/90 flex items-center gap-2">
                  <Clock className="size-4 text-[#FFC700] animate-pulse" /> Auction Closing Countdown
                </span>
                <span className="text-lg font-black text-[#FFC700] font-mono tracking-wider">
                  {remaining}
                </span>
              </div>
            )}
          </div>

          {/* Live Status Message */}
          {vehicle.auction === "live" ? (
            <div className="relative z-10 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-center text-emerald-400 text-xs font-semibold">
              <span className="font-black text-sm block">Auction Is Currently LIVE</span>
              <span>Registered dealers are submitting real-time live bids.</span>
            </div>
          ) : (
            <div className="relative z-10 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-center text-amber-400 text-xs font-semibold">
              <span className="font-black text-sm block">Auction Bidding Ended</span>
              <span>Live bidding timer is closed. Submit seller response below.</span>
            </div>
          )}
        </div>
      </div>

      {/* LOWER GRID: Live Bids Stream (Left) + Seller Price Confirmation Form (Right) */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Real-Time Live Bidding Feed Stream (6 Cols) */}
        <div className="lg:col-span-6 rounded-3xl border border-border bg-card p-5 space-y-4 shadow-soft">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-foreground flex items-center gap-2">
              <TrendingUp className="size-4 text-[#FFC700]" />
              Live Bidding Stream ({bidHistory.length})
            </h3>
            {vehicle.auction === "live" && (
              <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
                <span className="relative flex size-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full size-2 bg-emerald-500"></span>
                </span>
                LIVE STREAMING
              </span>
            )}
          </div>

          {bidHistory.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-secondary/30 p-8 text-center text-muted-foreground">
              <Clock className="size-8 text-muted-foreground/60 mx-auto mb-2" />
              <p className="text-xs font-extrabold text-foreground">No bids recorded yet</p>
              <p className="text-[11px] font-semibold mt-0.5">Dealer bids will stream here live as they are placed.</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
              {bidHistory.map((bid: any, index: number) => {
                const isTopBid = index === 0;
                const bAmount = bid.amount || bid.bidAmount || 0;
                const nextLowerBid = bidHistory[index + 1];
                const lowerAmount = nextLowerBid
                  ? nextLowerBid.amount || nextLowerBid.bidAmount || 0
                  : vehicle?.basePrice || 0;
                const diff = bAmount > lowerAmount ? bAmount - lowerAmount : 0;

                return (
                  <div
                    key={bid.id || index}
                    className={cn(
                      "flex items-center justify-between rounded-2xl p-3.5 transition-all text-xs border",
                      isTopBid
                        ? "border-[#FFC700]/50 bg-[#FFC700]/10 text-foreground font-extrabold shadow-sm ring-1 ring-[#FFC700]/20"
                        : "border-border/60 bg-secondary/40 text-muted-foreground font-semibold",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "grid size-8 place-items-center rounded-xl font-extrabold text-xs shrink-0",
                          isTopBid
                            ? "bg-[#FFC700] text-[#0D0E12]"
                            : "bg-secondary text-muted-foreground border border-border",
                        )}
                      >
                        {isTopBid ? "👑" : `#${bidHistory.length - index}`}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-foreground text-xs">
                            {maskDealerName(bid.dealer || bid.dealerName || bid.dealershipName || "Dealer Bidder")}
                          </span>
                          {isTopBid && (
                            <span className="rounded-md bg-[#FFC700]/20 text-[#FFC700] px-1.5 py-0.5 text-[9px] font-black uppercase">
                              Leading Top Bid
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-medium text-muted-foreground">
                          {formatIndianDateTime(bid.createdAt || bid.time || bid.bidTime)}
                        </span>
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end">
                      <span
                        className={cn(
                          "font-mono text-sm font-black",
                          isTopBid ? "text-[#FFC700]" : "text-foreground",
                        )}
                      >
                        {inr(bAmount)}
                      </span>
                      {diff > 0 && (
                        <p className="flex items-center gap-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                          <TrendingUp className="size-3.5" /> +{inr(diff)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Seller Price Confirmation Form (6 Cols) */}
        <div className="lg:col-span-6 rounded-3xl border border-amber-500/40 bg-card p-5 shadow-soft space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
            <div className="flex items-center gap-2 font-black text-sm text-foreground">
              <Shield className="size-5 text-amber-500 shrink-0" />
              <span>Are you agree for this price for sell?</span>
            </div>
            {vehicle?.vehicleStatus === "LIVE" ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/15 text-amber-500 border border-amber-500/30">
                Form Locked (Auction Live)
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                Form Enabled (Auction Ended)
              </span>
            )}
          </div>

          {vehicle?.vehicleStatus === "LIVE" ? (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-600 dark:text-amber-300 font-semibold flex items-center gap-2">
              <Clock className="size-4 text-amber-500 shrink-0 animate-pulse" />
              <span>
                Live bidding is currently in progress. This seller confirmation form will be enabled once the auction ends.
              </span>
            </div>
          ) : (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
              <span>
                Auction bidding has ended. Please review the highest bid of {inr(vehicle.highestBid)} and submit your selling decision below.
              </span>
            </div>
          )}

          <fieldset disabled={vehicle?.vehicleStatus === "LIVE"} className={cn("space-y-4", vehicle?.vehicleStatus === "LIVE" && "opacity-50 pointer-events-none cursor-not-allowed")}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 text-xs font-bold pt-1">
              <label className="flex items-center gap-2 cursor-pointer rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 w-full sm:w-auto flex-1 hover:border-emerald-500 transition-all">
                <input
                  type="radio"
                  name="sellerAgreedPublic"
                  checked={sellerAgreed === true}
                  onChange={() => setSellerAgreed(true)}
                  disabled={vehicle?.vehicleStatus === "LIVE"}
                  className="accent-emerald-500 size-4 cursor-pointer"
                />
                <span className="text-emerald-600 dark:text-emerald-400 font-black">
                  YES (Agreed to sell at top bid)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 w-full sm:w-auto flex-1 hover:border-rose-500 transition-all">
                <input
                  type="radio"
                  name="sellerAgreedPublic"
                  checked={sellerAgreed === false}
                  onChange={() => setSellerAgreed(false)}
                  disabled={vehicle?.vehicleStatus === "LIVE"}
                  className="accent-rose-500 size-4 cursor-pointer"
                />
                <span className="text-rose-600 dark:text-rose-400 font-black">
                  NO (Want higher price)
                </span>
              </label>
            </div>

            {!sellerAgreed && (
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-foreground">
                  Your Expected Sell Price (₹):
                </label>
                <input
                  type="number"
                  placeholder="e.g. 450000"
                  value={sellerCounterPrice || ""}
                  onChange={(e) => setSellerCounterPrice(Number(e.target.value))}
                  disabled={vehicle?.vehicleStatus === "LIVE"}
                  className="w-full rounded-xl border border-border bg-secondary px-3.5 py-2.5 text-xs font-extrabold text-foreground focus:outline-none focus:border-amber-400 disabled:opacity-50"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-foreground">
                Optional Note / Message to Admin:
              </label>
              <textarea
                rows={3}
                placeholder="Enter any additional conditions or message to Admin..."
                value={sellerMessage}
                onChange={(e) => setSellerMessage(e.target.value)}
                disabled={vehicle?.vehicleStatus === "LIVE"}
                className="w-full rounded-xl border border-border bg-secondary p-3 text-xs font-semibold text-foreground focus:outline-none focus:border-amber-400 disabled:opacity-50"
              />
            </div>

            <button
              type="button"
              disabled={submittingSeller || vehicle?.vehicleStatus === "LIVE"}
              onClick={handleSendSellerResponse}
              className="w-full rounded-2xl bg-[#FFC700] hover:bg-[#FFD633] text-[#0D0E12] font-black py-3.5 text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="size-4" /> {submittingSeller ? "Submitting Decision..." : vehicle?.vehicleStatus === "LIVE" ? "Form Disabled (Auction Live)" : "Submit Price Decision"}
            </button>
          </fieldset>

          {vehicle?.sellerAgreed !== undefined && vehicle?.sellerAgreed !== null && (
            <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-3.5 text-xs font-semibold text-amber-700 dark:text-amber-300 space-y-1">
              <div className="flex items-center gap-1.5 font-extrabold text-amber-400">
                <CheckCircle2 className="size-4" />
                <span>Saved Seller Decision:</span>
              </div>
              <p className="text-foreground font-bold">
                {vehicle.sellerAgreed
                  ? "Agreed to sell at top bid"
                  : `NO (Counter expected ₹${vehicle.sellerCounterPrice?.toLocaleString("en-IN") || "N/A"})`}
              </p>
              {vehicle.sellerMessage && (
                <p className="text-muted-foreground italic text-[11px]">
                  "{vehicle.sellerMessage}"
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Modal for Photo Zoom */}
      {previewIndex !== null &&
        vehicle.images &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
            onClick={() => setPreviewIndex(null)}
          >
            <div
              className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-3xl border border-white/20 bg-black/40 shadow-2xl flex flex-col items-center justify-center p-2"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setPreviewIndex(null)}
                className="absolute right-4 top-4 z-50 grid size-10 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-all border border-white/20 cursor-pointer"
              >
                <CloseIcon className="size-5" />
              </button>

              <img
                src={vehicle.images[previewIndex]?.url}
                alt="Inspection Zoom"
                className="max-h-[80vh] max-w-[85vw] object-contain rounded-2xl"
              />

              <div className="mt-3 text-xs font-black text-white/80 bg-neutral-900 border border-white/10 px-4 py-1.5 rounded-full shadow-sm">
                Photo {previewIndex + 1} of {vehicle.images.length}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
