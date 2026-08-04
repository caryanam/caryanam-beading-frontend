import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useParams } from "react-router-dom";
import {
  Download,
  FileText,
  Heart,
  Zap,
  Shield,
  CheckCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Eye,
  MessageSquare,
  Send,
  X as CloseIcon,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { dealerNav } from "@/components/nav-config";
import { Panel, ScoreBadge, StatusChip } from "@/components/premium";
import { inr, timeLeft } from "@/lib/mock-data";
import {
  getMarketplaceInspectionDetails,
  placeDealerBid,
  getVehicleBidHistory,
  getDealerWishlist,
  addToWishlist,
  removeFromWishlist,
} from "@/lib/api/dealer-api";
import { API_BASE_URL } from "@/lib/api";
import { readSession } from "@/lib/session";
import { cn } from "@/lib/utils";

export function DealerVehicleDetail() {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const [vehicle, setVehicle] = useState<any>(null);
  const [rawDetails, setRawDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState(0);
  const [remaining, setRemaining] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [isFavourite, setIsFavourite] = useState(false);
  const [bidHistory, setBidHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!vehicle?.id) return;
    const checkWishlist = async () => {
      try {
        const res = await getDealerWishlist();
        if (res.success && res.data) {
          setIsFavourite(res.data.some((item: any) => String(item.inspectionId) === String(vehicle.id)));
        }
      } catch (err) {
        console.error("Failed to fetch wishlist status", err);
        const session = readSession("dealer");
        const email = session?.email || "default_dealer";
        const favList = JSON.parse(
          localStorage.getItem(`dealer_${email}_favourites`) || "[]",
        );
        setIsFavourite(favList.some((item: any) => String(item.id) === String(vehicle.id)));
      }
    };
    checkWishlist();
  }, [vehicle?.id]);

  useEffect(() => {
    if (!vehicleId || loading) return;

    let socket: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connectWebSocket = () => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      let host = "localhost:8080";
      if (API_BASE_URL && API_BASE_URL.includes("://")) {
        host = API_BASE_URL.split("://")[1];
      } else if (API_BASE_URL) {
        host = API_BASE_URL;
      }

      const wsUrl = `${protocol}//${host}/ws/auction?inspectionId=${vehicleId}`;
      console.log("Connecting to WebSocket:", wsUrl);

      socket = new WebSocket(wsUrl);

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("WebSocket event received:", data);
          if (
            (data.type === "BID_UPDATE" || data.type === "GO_LIVE") &&
            Number(data.inspectionId) === Number(vehicleId)
          ) {
            setVehicle((prev: any) => {
              if (!prev) return prev;
              return {
                ...prev,
                highestBid: data.currentHighestBid,
                highestBidder: data.currentHighestBidder,
                bids: data.totalBids,
                endsAt: data.auctionEndTime,
                auction: "live",
                vehicleStatus: "LIVE",
              };
            });
            setBidHistory(data.bidHistory || []);
            setAmount(data.currentHighestBid + 25000);
            if (data.type === "GO_LIVE") {
              toast.success("Auction is now live!");
            }
          } else if (
            data.type === "AUCTION_ENDED" &&
            Number(data.inspectionId) === Number(vehicleId)
          ) {
            setVehicle((prev: any) => {
              if (!prev) return prev;
              return {
                ...prev,
                vehicleStatus: "SOLD OUT",
                auction: "completed",
                highestBidder: data.winner,
              };
            });
            toast.info("Auction has ended.");
          }
        } catch (err) {
          console.error("Error parsing WS message:", err);
        }
      };

      socket.onerror = (err) => {
        console.error("WebSocket error:", err);
      };

      socket.onclose = (e) => {
        console.log("WebSocket connection closed:", e);
        if (!e.wasClean) {
          reconnectTimeout = setTimeout(connectWebSocket, 3000);
        }
      };
    };

    connectWebSocket();

    return () => {
      if (socket) {
        socket.close(1000, "Component unmounted");
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [vehicleId, loading]);

  const handleToggleFavourite = async () => {
    if (!vehicle) return;
    try {
      if (isFavourite) {
        const res = await removeFromWishlist(Number(vehicle.id));
        if (res.success) {
          setIsFavourite(false);
          toast.success("Removed from watchlist.");
        } else {
          toast.error("Failed to remove from watchlist.");
        }
      } else {
        const res = await addToWishlist(Number(vehicle.id));
        if (res.success) {
          setIsFavourite(true);
          toast.success("Added to favourites watchlist!");
        } else {
          toast.error("Failed to add to watchlist.");
        }
      }
    } catch (err: any) {
      console.error("Error updating watchlist:", err);
      const session = readSession("dealer");
      const email = session?.email || "default_dealer";
      const key = `dealer_${email}_favourites`;
      let favList = JSON.parse(localStorage.getItem(key) || "[]");

      if (isFavourite) {
        favList = favList.filter((item: any) => String(item.id) !== String(vehicle.id));
        setIsFavourite(false);
        toast.success("Removed from watchlist.");
      } else {
        favList.push(vehicle);
        setIsFavourite(true);
        toast.success("Added to favourites watchlist!");
      }
      localStorage.setItem(key, JSON.stringify(favList));
    }
  };

  const handlePlaceBid = async () => {
    if (!vehicle) return;
    if (amount <= vehicle.highestBid) {
      toast.error("Bid must exceed the current highest bid.");
      return;
    }

    try {
      const res = await placeDealerBid(Number(vehicleId), amount);
      if (res.success) {
        toast.success(`Bid of ${inr(amount)} submitted successfully!`);
        setAmount(amount + 25000);
      } else {
        toast.error(res.message || "Failed to place bid.");
      }
    } catch (err: any) {
      console.error("Error placing bid:", err);
      toast.error(err.response?.data?.message || "Failed to submit bid.");
    }
  };

  useEffect(() => {
    const loadDetails = async () => {
      if (!vehicleId) return;
      setLoading(true);
      try {
        const res = await getMarketplaceInspectionDetails(Number(vehicleId));
        if (res.success && res.data) {
          const raw = res.data;
          setRawDetails(raw);
          const v = raw.vehicleDetails || {};
          const inspectionId = raw.inspectionId || Number(vehicleId);

          const basePrice = v.suggestedPrice || 0;
          const highestBid =
            v.currentHighestBid && v.currentHighestBid > 0
              ? v.currentHighestBid
              : basePrice;
          const bidCount = v.totalBids || 0;

          let fuelType = "Petrol";
          const f = (v.fuelType || "").toLowerCase();
          if (f.includes("diesel")) fuelType = "Diesel";
          else if (f.includes("cng")) fuelType = "CNG";
          else if (f.includes("lpg")) fuelType = "LPG";
          else if (f.includes("hybrid")) fuelType = "Hybrid";
          else if (f.includes("electric") || f.includes("ev"))
            fuelType = "Electric";
          else if (v.fuelType) fuelType = v.fuelType;

          let transmissionType = "Manual";
          const t = (v.transmission || "").toLowerCase();
          if (t.includes("auto")) transmissionType = "Automatic";

          const endsAtTime =
            v.auctionEndTime || Date.now() + 1000 * 60 * 60 * 24;

          // Get images list containing {url, name} objects
          const imageList = raw.inspectionPhotos || [];
          const validPhotos = imageList
            .filter((img: any) => img.imageUrl)
            .map((img: any) => ({
              url: img.imageUrl,
              name: img.displayName || "Vehicle View",
            }));
          const finalImages =
            validPhotos.length > 0
              ? validPhotos
              : [
                  {
                    url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80",
                    name: "Default View",
                  },
                ];
          const primaryImage = finalImages[0].url;

          const mapped = {
            id: String(inspectionId),
            regNo: v.vehicleNumber || "N/A",
            brand: v.brand || "Vehicle",
            model: v.model || "Details",
            variant: v.variant || "",
            year: v.manufacturingYear || 2020,
            fuel: fuelType,
            transmission: transmissionType,
            odometer: v.odometerReading || 45000,
            owner: v.ownerName || "1st Owner",
            score: 88 + (inspectionId % 10),
            basePrice,
            highestBid,
            highestBidder: v.currentHighestBidder
              ? v.currentHighestBidder.dealershipName || v.currentHighestBidder
              : null,
            bids: bidCount,
            status: "approved",
            auction:
              v.vehicleStatus === "LIVE"
                ? "live"
                : v.vehicleStatus === "SOLD OUT" ||
                    v.vehicleStatus === "SOLD" ||
                    v.vehicleStatus === "ENDED"
                  ? "completed"
                  : "scheduled",
            image: primaryImage,
            images: finalImages,
            endsAt: endsAtTime,
            inspector: raw.inspectorName || "Certified Inspector",
            vehicleStatus: v.vehicleStatus,
          };
          setVehicle(mapped);
          setBidHistory(raw.bidHistory || []);
          setAmount(highestBid + 25000);
          setRemaining(timeLeft(endsAtTime));
        }
      } catch (err: any) {
        console.error("Failed to load vehicle details", err);
        toast.error("Could not retrieve vehicle details.");
      } finally {
        setLoading(false);
      }
    };
    loadDetails();
  }, [vehicleId]);

  // Handle keyboard navigation for preview lightbox modal
  useEffect(() => {
    if (previewIndex === null || !vehicle?.images) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        setPreviewIndex((prev) =>
          prev !== null ? (prev + 1) % vehicle.images.length : null,
        );
      } else if (e.key === "ArrowLeft") {
        setPreviewIndex((prev) =>
          prev !== null
            ? (prev - 1 + vehicle.images.length) % vehicle.images.length
            : null,
        );
      } else if (e.key === "Escape") {
        setPreviewIndex(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewIndex, vehicle?.images]);

  useEffect(() => {
    if (!vehicle?.endsAt) return;
    const id = setInterval(() => setRemaining(timeLeft(vehicle.endsAt)), 1000);
    return () => clearInterval(id);
  }, [vehicle?.endsAt]);

  const downloadReport = () => {
    if (!vehicle?.id) return;
    const pdfUrl = `${API_BASE_URL}/api/inspector/inspection/${vehicle.id}/pdf`;
    window.open(pdfUrl, "_blank");
    toast.success("Downloading PDF report...");
  };

  if (loading) {
    return (
      <AppShell
        role="dealer"
        nav={dealerNav}
        title="Loading..."
        breadcrumb={["Dealer", "Marketplace"]}
      >
        <div className="flex h-80 items-center justify-center bg-card border border-border rounded-3xl shadow-soft">
          <span className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </AppShell>
    );
  }

  if (!vehicle) {
    return (
      <AppShell
        role="dealer"
        nav={dealerNav}
        title="Not Found"
        breadcrumb={["Dealer", "Marketplace"]}
      >
        <div className="rounded-3xl border border-dashed border-border bg-card p-16 text-center shadow-soft">
          <p className="font-extrabold text-foreground text-lg">
            Vehicle details not found.
          </p>
        </div>
      </AppShell>
    );
  }

  // Sub-section data references
  const ratings = rawDetails?.ratings || {};
  const mechanical = rawDetails?.mechanicalDetails || {};
  const tyre = rawDetails?.tyreDetails || {};
  const interior = rawDetails?.interiorDetails || {};
  const exteriorPanels = rawDetails?.exteriorPanelDetails || [];

  const session = readSession("dealer");
  const myName = session?.name || "";
  const isEnded =
    vehicle &&
    (vehicle.auction === "completed" ||
      vehicle.vehicleStatus === "ENDED" ||
      vehicle.vehicleStatus === "SOLD OUT" ||
      vehicle.vehicleStatus === "SOLD" ||
      remaining === "Ended");

  const myEmail = session?.email || "";
  const noBids =
    vehicle &&
    (!vehicle.highestBidder ||
      vehicle.highestBidder === "No bids" ||
      vehicle.bids === 0);

  const isWinner =
    vehicle &&
    !noBids &&
    (vehicle.highestBidder === myName ||
      vehicle.highestBidder === myEmail ||
      (rawDetails?.currentHighestBidder &&
        (rawDetails.currentHighestBidder === myName ||
          rawDetails.currentHighestBidder === myEmail ||
          rawDetails.currentHighestBidder?.dealershipName === myName ||
          rawDetails.currentHighestBidder?.ownerName === myName ||
          rawDetails.currentHighestBidder?.email === myEmail)));
  const participated =
    vehicle && bidHistory.some((b: any) => b.dealer === myName || b.dealer === myEmail);

  return (
    <AppShell
      role="dealer"
      nav={dealerNav}
      title={`${vehicle.brand} ${vehicle.model}`}
      breadcrumb={["Dealer", "Marketplace", vehicle.id]}
    >
      <div className="grid gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          {/* Main Gallery */}
          <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
            <div
              onClick={() => setPreviewIndex(0)}
              className="relative aspect-[16/9] w-full overflow-hidden bg-secondary cursor-pointer group"
            >
              <img
                src={vehicle.image}
                alt={`${vehicle.brand} ${vehicle.model}`}
                className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span className="rounded-full bg-black/60 backdrop-blur-md px-3.5 py-1 text-xs font-extrabold text-white border border-white/10">
                  {vehicle.year} Model
                </span>
                <span className="rounded-full bg-black/60 backdrop-blur-md px-3.5 py-1 text-xs font-extrabold text-[#FFC700] border border-[#FFC700]/30">
                  {vehicle.regNo}
                </span>
              </div>
            </div>
            {vehicle.images && vehicle.images.length > 0 && (
              <div className="grid grid-cols-4 gap-3 p-4 bg-secondary/60">
                {vehicle.images.slice(0, 4).map((imgObj: any, idx: number) => {
                  const isLast = idx === 3 && vehicle.images.length > 4;
                  return (
                    <div
                      key={idx}
                      onClick={() => setPreviewIndex(idx)}
                      className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl cursor-pointer hover:scale-[1.03] transition-all shadow-sm group"
                    >
                      <img
                        src={imgObj.url}
                        alt={imgObj.name}
                        loading="lazy"
                        className="size-full object-cover"
                      />
                      {isLast && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white font-extrabold transition-all group-hover:bg-black/70">
                          <span className="text-lg">
                            +{vehicle.images.length - 4}
                          </span>
                          <span className="text-[10px] tracking-wider uppercase mt-0.5">
                            View More
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Dynamic Tabs Navigation Bar */}
          <div className="flex border-b border-border bg-card rounded-2xl p-1.5 shadow-soft overflow-x-auto gap-1">
            {[
              { id: "overview", label: "Overview" },
              { id: "exterior", label: "Exterior Condition" },
              { id: "mechanical", label: "Engine & Mechanical" },
              { id: "tyres", label: "Tyres & Toolkit" },
              { id: "interior", label: "Interior & Electricals" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-xl px-4 py-2.5 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-[#FFC700] text-[#0D0E12] shadow-sm"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content Panels */}
          {activeTab === "overview" && (
            <>
              {/* Vehicle Spec Grid */}
              <Panel title="Vehicle Inspection Specs">
                <dl className="grid gap-5 sm:grid-cols-3">
                  {[
                    ["Registration No.", vehicle.regNo],
                    ["Manufacturing Year", String(vehicle.year)],
                    ["Trim & Variant", vehicle.variant],
                    ["Fuel Type", vehicle.fuel],
                    ["Transmission", vehicle.transmission],
                    [
                      "Odometer Reading",
                      `${vehicle.odometer.toLocaleString("en-IN")} km`,
                    ],
                    ["Ownership Count", vehicle.owner],
                    ["Inspected By", vehicle.inspector],
                    ["Base Valuation", inr(vehicle.basePrice)],
                  ].map(([k, val]) => (
                    <div
                      key={k}
                      className="rounded-2xl bg-secondary/50 p-3.5 border border-border/60"
                    >
                      <dt className="text-xs text-muted-foreground font-semibold">
                        {k}
                      </dt>
                      <dd className="truncate text-sm font-extrabold text-foreground mt-1">
                        {val}
                      </dd>
                    </div>
                  ))}
                </dl>
              </Panel>

              {/* Inspection Report Download */}
              <Panel title="200-Point Digital Inspection Certificate">
                <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-[#FFC700]/30 bg-[#FFC700]/5 p-5">
                  <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#FFC700] text-[#0D0E12] shadow-sm">
                    <FileText className="size-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold text-foreground">
                      Inspection-Report-{vehicle.id}.pdf
                    </p>
                    <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                      Verified by Certified Inspector · 2.4 MB
                    </p>
                  </div>
                  <button
                    onClick={downloadReport}
                    className="flex shrink-0 items-center gap-2 rounded-2xl bg-[#FFC700] hover:bg-[#FFD633] px-5 py-3 text-xs font-extrabold text-[#0D0E12] shadow-[0_4px_16px_rgba(255,199,0,0.35)] transition-all cursor-pointer"
                  >
                    <Download className="size-4" /> Download PDF Report
                  </button>
                </div>
              </Panel>
            </>
          )}

          {activeTab === "exterior" && (
            <Panel
              title="Exterior Panel Health"
              action={
                <ScoreBadge
                  score={ratings.exterior ? Number(ratings.exterior) * 20 : 85}
                />
              }
            >
              {exteriorPanels.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-xs font-bold text-muted-foreground">
                  No panels evaluation recorded.
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {exteriorPanels.map((p: any) => {
                    const cond = (p.condition || "").toUpperCase();
                    const isOk = cond === "OK";
                    return (
                      <div
                        key={p.id || p.panelName}
                        className="flex items-center justify-between rounded-xl bg-secondary/40 border border-border p-3"
                      >
                        <span className="text-xs font-extrabold text-foreground">
                          {p.panelName}
                        </span>
                        <div className="flex items-center gap-2.5">
                          {p.imageUrl && (
                            <button
                              type="button"
                              onClick={() => window.open(p.imageUrl, "_blank")}
                              className="inline-flex items-center gap-1 text-[10px] font-extrabold text-blue-500 hover:text-blue-600 bg-blue-500/10 px-2 py-1 rounded-full border border-blue-500/20 cursor-pointer flex-shrink-0"
                              title="View Panel Photo"
                            >
                              <Eye className="size-3" /> Photo
                            </button>
                          )}
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                              isOk
                                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                            }`}
                          >
                            {isOk ? (
                              <CheckCircle className="size-3" />
                            ) : (
                              <AlertTriangle className="size-3" />
                            )}
                            {cond}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Panel>
          )}

          {activeTab === "mechanical" && (
            <Panel
              title="Engine & Transmission Diagnostics"
              action={
                <ScoreBadge
                  score={
                    ratings.mechanical ? Number(ratings.mechanical) * 20 : 88
                  }
                />
              }
            >
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  ["Engine Condition", mechanical.engineStatus],
                  ["Engine Oil", mechanical.engineOil],
                  ["Brake Fluid Level", mechanical.brakeOil],
                  ["Coolant Quality", mechanical.coolant],
                  ["Suspension Action", mechanical.suspension],
                  ["Axle Wear", mechanical.axle],
                  ["Exhaust Smoke Level", mechanical.smoke],
                  ["Engine Noise / Vibration", mechanical.engineNoise],
                  ["Fluid Leakages Check", mechanical.fluidLeakage],
                ].map(([k, val]) => (
                  <div
                    key={k}
                    className="flex items-center justify-between rounded-xl bg-secondary/40 border border-border p-4"
                  >
                    <span className="text-xs font-extrabold text-foreground">
                      {k}
                    </span>
                    <span className="text-xs font-black text-muted-foreground uppercase">
                      {val || "OK"}
                    </span>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {activeTab === "tyres" && (
            <Panel
              title="Tyres Integrity & Tool Kits"
              action={
                <ScoreBadge
                  score={ratings.tyre ? Number(ratings.tyre) * 20 : 90}
                />
              }
            >
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                Tyres Wear & Brands
              </h4>
              <div className="grid gap-4 sm:grid-cols-2 mb-6">
                {[
                  ["Front Left Tyre", tyre.frontLeftBrand, tyre.frontLeftTread],
                  [
                    "Front Right Tyre",
                    tyre.frontRightBrand,
                    tyre.frontRightTread,
                  ],
                  ["Rear Left Tyre", tyre.rearLeftBrand, tyre.rearLeftTread],
                  ["Rear Right Tyre", tyre.rearRightBrand, tyre.rearRightTread],
                  ["Spare Tyre", tyre.spareBrand, tyre.spareTread],
                ].map(([lbl, brand, tread]) => (
                  <div
                    key={lbl}
                    className="rounded-xl bg-secondary/40 border border-border p-4 flex flex-col justify-between gap-1"
                  >
                    <span className="text-xs font-extrabold text-foreground">
                      {lbl}
                    </span>
                    <div className="flex justify-between items-center mt-1.5">
                      <span className="text-xs font-semibold text-muted-foreground">
                        {brand || "JK Tyre"}
                      </span>
                      <span className="text-[11px] font-black text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                        {tread || 6} mm
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                Safety & Toolkit Checklist
              </h4>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ["Mechanical Jack Present", tyre.hasJack],
                  ["Wrench & Handle Present", tyre.hasHandle],
                  ["Standard Tool Kit Present", tyre.hasToolkit],
                  ["Reflective Hazard Triangle", tyre.hasTriangle],
                  ["First Aid Kit Installed", tyre.hasFirstAidBox],
                ].map(([label, active]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between rounded-xl bg-secondary/40 border border-border p-3"
                  >
                    <span className="text-xs font-extrabold text-foreground">
                      {label}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        active !== false
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-rose-500/10 text-rose-600"
                      }`}
                    >
                      {active !== false ? "AVAILABLE" : "MISSING"}
                    </span>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {activeTab === "interior" && (
            <Panel
              title="Electricals & Cabin Amenities"
              action={
                <ScoreBadge
                  score={ratings.interior ? Number(ratings.interior) * 20 : 92}
                />
              }
            >
              {/* Battery and AC Section */}
              <div className="grid gap-4 sm:grid-cols-3 mb-6">
                <div className="rounded-2xl bg-secondary/50 p-4 border border-border/60">
                  <dt className="text-xs text-muted-foreground font-semibold">
                    Battery Brand & Details
                  </dt>
                  <dd className="truncate text-sm font-extrabold text-foreground mt-1">
                    {interior.batteryBrand
                      ? `${interior.batteryBrand} (${interior.batterySerialNumber || ""})`
                      : "N/A"}
                  </dd>
                </div>
                <div className="rounded-2xl bg-secondary/50 p-4 border border-border/60">
                  <dt className="text-xs text-muted-foreground font-semibold">
                    AC Cooling Performance
                  </dt>
                  <dd className="truncate text-sm font-extrabold text-foreground mt-1">
                    {interior.acCooling || "N/A"}
                  </dd>
                </div>
                <div className="rounded-2xl bg-secondary/50 p-4 border border-border/60">
                  <dt className="text-xs text-muted-foreground font-semibold">
                    Suggested Valuation
                  </dt>
                  <dd className="truncate text-sm font-extrabold text-foreground mt-1">
                    {inr(vehicle.basePrice)}
                  </dd>
                </div>
              </div>

              {/* 25 Checklist Items Grid */}
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  {
                    label: "Right Side Tail Lamp",
                    val: interior.rightTailLamp,
                  },
                  { label: "Left Side Tail Lamp", val: interior.leftTailLamp },
                  {
                    label: "Right Side Head Light",
                    val: interior.rightHeadLamp,
                  },
                  { label: "Left Side Head Light", val: interior.leftHeadLamp },
                  { label: "Right Indicator", val: interior.indicators },
                  { label: "Left Indicator", val: interior.indicators },
                  { label: "Boot Floor", val: interior.bootFloor },
                  { label: "Washer Fluid", val: interior.wiper },
                  { label: "Dashboard", val: interior.dashboard },
                  { label: "Left Side Fog Lamp", val: interior.fogLamps },
                  { label: "Right Side Fog Lamp", val: interior.fogLamps },
                  { label: "Rear Stop Light", val: interior.rightTailLamp },
                  {
                    label: "Power Window All Buttons",
                    val: interior.powerWindows,
                  },
                  { label: "Music System", val: interior.musicSystem },
                  {
                    label: "Adjustable Steering",
                    val: interior.steeringMountedControls,
                  },
                  {
                    label: "Steering Mounted Controls",
                    val: interior.steeringMountedControls,
                  },
                  { label: "Wiper Washer Front", val: interior.wiper },
                  { label: "Rear Defogger", val: interior.rearDefogger },
                  { label: "Rear Wiper Washer", val: interior.rearWasher },
                  {
                    label: "Instrument Cluster",
                    val: interior.instrumentCluster,
                  },
                  { label: "Infotainment System", val: interior.infotainment },
                  { label: "Central Lock", val: interior.centralLock },
                  { label: "Push Start Button", val: interior.pushButton },
                  { label: "Sunroof", val: interior.sunroof },
                  { label: "All Sensors", val: interior.sensors },
                ].map((item) => {
                  const cond = (item.val || "OK / WORKING").toUpperCase();
                  const isOk =
                    cond.includes("OK") ||
                    (cond.includes("WORKING") && !cond.includes("NOT"));

                  // Helper function to look up the image category
                  const photoUrl = (() => {
                    if (!rawDetails?.inspectionPhotos) return null;
                    const found = rawDetails.inspectionPhotos.find(
                      ({ imageCategory }: { imageCategory: string }) =>
                        imageCategory === item.label,
                    );
                    return (found as { imageUrl?: string } | undefined)?.imageUrl || null;
                  })();

                  return (
                    <div
                      key={item.label}
                      className="flex items-center justify-between rounded-xl bg-secondary/40 border border-border p-3"
                    >
                      <span className="text-xs font-extrabold text-foreground truncate max-w-[200px]">
                        {item.label}
                      </span>
                      <div className="flex items-center gap-2.5 shrink-0">
                        {photoUrl && (
                          <button
                            type="button"
                            onClick={() => window.open(photoUrl, "_blank")}
                            className="inline-flex items-center gap-1 text-[10px] font-extrabold text-blue-500 hover:text-blue-600 bg-blue-500/10 px-2 py-1 rounded-full border border-blue-500/20 cursor-pointer"
                            title={`View ${item.label} Photo`}
                          >
                            <Eye className="size-3" /> Photo
                          </button>
                        )}
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                            isOk
                              ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                          }`}
                        >
                          {isOk ? (
                            <CheckCircle className="size-3" />
                          ) : (
                            <AlertTriangle className="size-3" />
                          )}
                          {cond}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {interior.remarks && (
                <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs font-semibold text-amber-700 dark:text-amber-400">
                  <span className="font-extrabold block text-foreground mb-1">
                    Inspector Hand-written Remarks:
                  </span>
                  {interior.remarks}
                </div>
              )}
            </Panel>
          )}
        </div>

        {/* Live Bidding Box Sidebar */}
        <div className="space-y-5">
          <div className="surface-dark rounded-3xl p-7 text-white border border-[#FFC700]/40 shadow-lift relative overflow-hidden before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_right,rgba(255,199,0,0.18),transparent_60%)]">
            <div className="relative z-10 flex items-center justify-between gap-3">
              <StatusChip status={vehicle.auction} />
              <span className="text-xs font-extrabold text-[#FFC700] flex items-center gap-1">
                <Zap className="size-3.5 fill-current" /> {vehicle.bids} Bids
              </span>
            </div>

            <p className="relative z-10 mt-6 text-xs font-extrabold tracking-widest text-[#FFC700] uppercase">
              Highest Bid Price
            </p>
            <p className="relative z-10 mt-1 text-3xl font-extrabold text-white tracking-tight">
              {inr(vehicle.highestBid)}
            </p>

            <p className="relative z-10 mt-5 text-xs font-extrabold tracking-widest text-white/60 uppercase">
              Auction Closing In
            </p>
            <p className="relative z-10 mt-1 text-lg font-extrabold text-white">
              {remaining}
            </p>

            {isEnded ? (
              <div className="relative z-10 mt-6 rounded-2xl border p-4 bg-white/5 border-white/10 space-y-2 text-center">
                {noBids ? (
                  <>
                    <p className="text-sm font-black text-amber-400 flex items-center gap-1.5 justify-center">
                      <AlertTriangle className="size-4" /> Unsold
                    </p>
                    <p className="text-[11px] text-white/70 font-semibold">
                      The live bidding ended with no active bids placed.
                    </p>
                  </>
                ) : isWinner ? (
                  <>
                    <p className="text-sm font-black text-emerald-400 flex items-center gap-1.5 justify-center animate-bounce">
                      🏆 Bid Winner!
                    </p>
                    <p className="text-[11px] text-white/95 font-semibold leading-relaxed">
                      Congratulations! You won the bidding for this vehicle with
                      the highest bid of{" "}
                      <strong className="text-emerald-300">
                        {inr(vehicle.highestBid)}
                      </strong>
                      !
                    </p>
                  </>
                ) : participated ? (
                  <>
                    <p className="text-sm font-black text-rose-400 flex items-center gap-1.5 justify-center">
                      ❌ Outbid / Lost
                    </p>
                    <p className="text-[11px] text-white/70 font-semibold leading-relaxed">
                      You participated in this room, but another dealer won with
                      the highest bid of {inr(vehicle.highestBid)}.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-black text-white/80 flex items-center gap-1.5 justify-center">
                      🏁 Closed
                    </p>
                    <p className="text-[11px] text-white/70 font-semibold leading-relaxed">
                      This live bidding is now closed. Sold to{" "}
                      {vehicle.highestBidder || "highest bidder"} for{" "}
                      {inr(vehicle.highestBid)}.
                    </p>
                  </>
                )}
              </div>
            ) : (
              <>
                <div className="relative z-10 mt-6 space-y-2">
                  <label className="block text-xs font-bold text-white/80">
                    Enter Your Bid (₹)
                  </label>
                  <input
                    type="number"
                    value={amount}
                    step={25000}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full rounded-2xl border border-[#FFC700]/40 bg-white/10 px-4 py-3.5 text-base font-extrabold text-white outline-none focus:border-[#FFC700] focus:ring-2 focus:ring-[#FFC700]/40"
                  />
                </div>

                <button
                  onClick={handlePlaceBid}
                  className="relative z-10 mt-4 w-full rounded-2xl bg-[#FFC700] hover:bg-[#FFD633] py-4 text-sm font-extrabold text-[#0D0E12] shadow-[0_4px_20px_rgba(255,199,0,0.4)] transition-all hover:shadow-[0_6px_24px_rgba(255,199,0,0.55)] cursor-pointer"
                >
                  Submit Live Bid
                </button>
              </>
            )}
          </div>

          <button
            onClick={handleToggleFavourite}
            className="flex w-full items-center justify-center gap-2 rounded-3xl border border-border bg-card py-4 text-xs font-extrabold shadow-soft transition-all hover:border-[#FFC700]/60 hover:bg-secondary cursor-pointer"
          >
            <Heart
              className={`size-4 ${isFavourite ? "fill-rose-500 text-rose-500" : "text-[#FFC700] fill-[#FFC700]/20"}`}
            />
            {isFavourite
              ? "Remove from Watchlist"
              : "Add to Favourites Watchlist"}
          </button>
        </div>
      </div>

      {previewIndex !== null &&
        vehicle.images &&
        vehicle.images.length > 0 &&
        createPortal(
          <div
            onClick={() => setPreviewIndex(null)}
            className="fixed inset-0 z-[99999] flex flex-col justify-between bg-neutral-950/95 backdrop-blur-xl animate-in fade-in duration-200 cursor-zoom-out"
          >
            {/* Top Bar Header */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex w-full items-center justify-between px-6 py-4 border-b border-white/10 bg-black/45 backdrop-blur-md z-20 cursor-default select-none animate-slide-down"
            >
              <div className="min-w-0">
                <h3 className="text-base font-extrabold text-white tracking-tight">
                  {vehicle.brand} {vehicle.model}
                </h3>
                <p className="text-xs font-semibold text-white/60 mt-0.5">
                  {vehicle.images[previewIndex]?.name || "Inspection Photo"}
                </p>
              </div>
              <button
                onClick={() => setPreviewIndex(null)}
                className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all hover:scale-105 cursor-pointer border border-white/10"
                title="Close Preview"
              >
                <CloseIcon className="size-5" />
              </button>
            </div>

            {/* Center Area (Arrows and Image) */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative flex flex-1 w-full items-center justify-center px-12 md:px-20 cursor-default"
            >
              {/* Prev Button */}
              <button
                onClick={() =>
                  setPreviewIndex((prev) =>
                    prev !== null
                      ? (prev - 1 + vehicle.images.length) %
                        vehicle.images.length
                      : null,
                  )
                }
                className="absolute left-6 md:left-10 p-4 rounded-full bg-black/60 hover:bg-black/80 hover:scale-110 text-white transition-all cursor-pointer border border-white/10 z-20 shadow-2xl"
                title="Previous Image"
              >
                <ChevronLeft className="size-8" />
              </button>

              {/* Current Image Frame */}
              <div className="relative flex h-[60vh] w-full max-w-4xl items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-black/40 shadow-[0_15px_50px_rgba(0,0,0,0.4)]">
                <img
                  src={vehicle.images[previewIndex]?.url}
                  alt={vehicle.images[previewIndex]?.name}
                  className="w-full h-full object-contain select-none pointer-events-none"
                />
              </div>

              {/* Next Button */}
              <button
                onClick={() =>
                  setPreviewIndex((prev) =>
                    prev !== null ? (prev + 1) % vehicle.images.length : null,
                  )
                }
                className="absolute right-6 md:right-10 p-4 rounded-full bg-black/60 hover:bg-black/80 hover:scale-110 text-white transition-all cursor-pointer border border-white/10 z-20 shadow-2xl"
                title="Next Image"
              >
                <ChevronRight className="size-8" />
              </button>
            </div>

            {/* Bottom Bar (Strip and Counter) */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full flex flex-col items-center bg-black/45 border-t border-white/10 py-5 px-6 gap-4 z-20 cursor-default select-none animate-slide-up"
            >
              {/* Mini-Thumbnails Slider Strip */}
              <div className="flex gap-2.5 overflow-x-auto max-w-full no-scrollbar pb-1">
                {vehicle.images.map((imgObj: any, idx: number) => {
                  const isActive = idx === previewIndex;
                  return (
                    <img
                      key={idx}
                      src={imgObj.url}
                      alt=""
                      onClick={() => setPreviewIndex(idx)}
                      className={`h-11 w-16 object-cover rounded-lg cursor-pointer transition-all border-2 ${
                        isActive
                          ? "border-[#FFC700] scale-105 opacity-100 shadow-[0_0_10px_rgba(255,199,0,0.5)]"
                          : "border-transparent opacity-50 hover:opacity-85"
                      }`}
                    />
                  );
                })}
              </div>

              {/* Counter pill */}
              <div className="text-xs font-black text-white/80 bg-neutral-900 border border-white/10 px-4 py-1.5 rounded-full shadow-sm">
                Image {previewIndex + 1} of {vehicle.images.length}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </AppShell>
  );
}
