import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  User,
  Cog,
  ShieldCheck,
  TrendingUp,
  Heart,
  Zap,
  Shield,
  CheckCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Eye,
  ArrowLeft,
  Clock,
  Car,
  Gauge,
  Fuel,
  Settings2,
  X as CloseIcon,
  Sparkles,
  Layers,
  Video,
  Play,
  Share2,
  CheckCircle2,
  Camera,
  Trophy,
  LogIn,
  UserPlus,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { dealerNav } from "@/components/nav-config";
import { Panel, ScoreBadge, StatusChip } from "@/components/premium";
import { inr, timeLeft } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import {
  getMarketplaceInspectionDetails,
  placeDealerBid,
  getDealerWishlist,
  addToWishlist,
  removeFromWishlist,
  downloadDealerInspectionPdf,
} from "@/lib/api/dealer-api";
import { getFreelancerInspectionDetails } from "@/lib/api/freelancer-api";
import { API_BASE_URL } from "@/lib/api";
import { readSession } from "@/lib/session";

const isActualVideoUrl = (url?: string | null): boolean => {
  if (!url) return false;
  const clean = url.toLowerCase().split("?")[0].split("#")[0];
  if (clean.startsWith("data:video/")) return true;
  return /\.(mp4|webm|mov|avi|mkv|3gp|flv|wmv)$/i.test(clean);
};

export function DealerFreelancerVehicleDetail() {
  const { vehicleId, id } = useParams<{ vehicleId?: string; id?: string }>();
  const activeId = vehicleId || id;
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState<any>(null);
  const [rawDetails, setRawDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState(0);
  const [remaining, setRemaining] = useState("");
  const [activeTab, setActiveTab] = useState("car_documents");
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [activeVideoModalUrl, setActiveVideoModalUrl] = useState<string | null>(null);
  const [isFavourite, setIsFavourite] = useState(false);
  const [bidHistory, setBidHistory] = useState<any[]>([]);
  const [submittingBid, setSubmittingBid] = useState(false);

  const formatMediaUrl = (url: string | null | undefined): string => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
      return url;
    }
    const cleanBase = API_BASE_URL.replace(/\/+$/, "");
    const cleanPath = url.startsWith("/") ? url : `/${url}`;
    return `${cleanBase}${cleanPath}`;
  };

  // 1. Fetch Freelancer Vehicle Details
  useEffect(() => {
    const loadDetails = async () => {
      if (!activeId) return;
      setLoading(true);

      try {
        let raw: any = null;

        // Try freelancer inspection details API
        try {
          const fRes: any = await getFreelancerInspectionDetails(activeId);
          if (fRes?.success && fRes?.data) {
            raw = fRes.data;
          } else if (fRes && (fRes.id || fRes.inspectionId)) {
            raw = fRes;
          }
        } catch (e) {
          console.warn("getFreelancerInspectionDetails failed, trying marketplace API...", e);
        }

        // Fallback to getMarketplaceInspectionDetails
        if (!raw) {
          try {
            const mRes = await getMarketplaceInspectionDetails(Number(activeId));
            if (mRes?.success && mRes?.data) {
              raw = mRes.data;
            }
          } catch (e) {
            console.warn("getMarketplaceInspectionDetails fallback also failed", e);
          }
        }

        // Local Storage fallback if offline
        if (!raw) {
          const localList = JSON.parse(localStorage.getItem("freelancer_vehicles_list") || "[]");
          const found = localList.find((v: any) => String(v.id || v.inspectionId) === String(activeId));
          if (found) raw = found;
        }

        if (raw) {
          setRawDetails(raw);
          const v = raw.vehicleDetails || raw || {};
          const insId = raw.inspectionId || raw.id || Number(activeId);

          const basePrice = v.suggestedPrice || v.price || raw.suggestedPrice || raw.price || 0;
          const history = raw.bidHistory || raw.bids || [];
          const topBidInHistory = history.length > 0 ? (history[0].amount || history[0].bidAmount || 0) : 0;
          const topBidderInHistory = history.length > 0 ? (history[0].dealerName || history[0].dealer || history[0].dealershipName) : null;

          const highestBid = Math.max(
            (v.currentHighestBid && v.currentHighestBid > 0) ? v.currentHighestBid : (raw.currentHighestBid || 0),
            topBidInHistory
          );
          const bidCount = Math.max(v.totalBids || raw.totalBids || 0, history.length);
          const highestBidder = topBidderInHistory || (v.currentHighestBidder
            ? (v.currentHighestBidder.dealershipName || v.currentHighestBidder)
            : raw.currentHighestBidder || null);

          let fuelType = "Petrol";
          const f = (v.fuelType || v.fuel || raw.fuelType || raw.fuel || "").toLowerCase();
          if (f.includes("diesel")) fuelType = "Diesel";
          else if (f.includes("cng")) fuelType = "CNG";
          else if (f.includes("electric") || f.includes("ev")) fuelType = "Electric";
          else if (v.fuelType || raw.fuelType) fuelType = v.fuelType || raw.fuelType;

          let transmissionType = "Manual";
          const t = (v.transmission || raw.transmission || "").toLowerCase();
          if (t.includes("auto")) transmissionType = "Automatic";

          const endsAtTime = v.auctionEndTime || raw.auctionEndTime || Date.now() + 1000 * 60 * 15;

          // Photos parsing
          let validPhotos: any[] = [];
          if (Array.isArray(raw.photos) && raw.photos.length > 0) {
            validPhotos = raw.photos
              .filter((p: any) => p && typeof p === "string" && p.trim().length > 0)
              .map((p: string, idx: number) => ({
                url: formatMediaUrl(p),
                name: idx === 0 ? "Front View" : `Inspection Photo ${idx + 1}`,
                category: "Vehicle Photo",
              }));
          } else if (Array.isArray(raw.inspectionPhotos) && raw.inspectionPhotos.length > 0) {
            validPhotos = raw.inspectionPhotos
              .filter((img: any) => img && (img.imageUrl || img.url))
              .map((img: any) => ({
                url: formatMediaUrl(img.imageUrl || img.url),
                name: img.displayName || img.imageCategory || "Inspection View",
                category: img.imageCategory || "Vehicle Photo",
              }));
          } else if (raw.vehicleImage || v.vehicleImage) {
            validPhotos = [{
              url: formatMediaUrl(raw.vehicleImage || v.vehicleImage),
              name: "Front View",
              category: "Vehicle Photo",
            }];
          }

          const finalImages = validPhotos.length > 0
            ? validPhotos
            : [{
                url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80",
                name: "Front View",
              }];
          const primaryImage = finalImages[0].url;

          // Video parsing - multi-source extraction for freelancer walkaround video
          let videoList: any[] = [];

          // 1. Check direct videoUrl
          if (raw.videoUrl || v.videoUrl) {
            videoList.push({
              id: 1,
              displayName: "Freelancer Walkaround Video",
              videoUrl: formatMediaUrl(raw.videoUrl || v.videoUrl),
              imageUrl: primaryImage,
              condition: "NORMAL",
            });
          }

          // 2. Check inspectionVideos array
          if (Array.isArray(raw.inspectionVideos) && raw.inspectionVideos.length > 0) {
            raw.inspectionVideos.forEach((vid: any, idx: number) => {
              const url = vid.videoUrl || vid.url || vid.mediaUrl;
              if (url) {
                const formatted = formatMediaUrl(url);
                if (!videoList.some((existing) => existing.videoUrl === formatted)) {
                  videoList.push({
                    id: videoList.length + 1,
                    displayName: vid.displayName || vid.title || `Walkaround Video ${idx + 1}`,
                    videoUrl: formatted,
                    imageUrl: primaryImage,
                    condition: "NORMAL",
                  });
                }
              }
            });
          }

          // 3. Check inspectionPhotos for video categories or video file extensions
          if (Array.isArray(raw.inspectionPhotos) && raw.inspectionPhotos.length > 0) {
            raw.inspectionPhotos.forEach((item: any) => {
              const cat = item.imageCategory || item.displayName || item.photoType || "";
              const url = item.imageUrl || item.url || (typeof item === "string" ? item : "");
              if (!url) return;

              const lowerUrl = url.toLowerCase();
              const isVid =
                cat === "Walkaround Video" ||
                cat === "Engine / Motor Noise" ||
                cat.toLowerCase().includes("video") ||
                /\.(mp4|webm|mov|avi|mkv|3gp|flv|wmv)($|\?)/i.test(lowerUrl);

              if (isVid) {
                const formatted = formatMediaUrl(url);
                if (!videoList.some((existing) => existing.videoUrl === formatted)) {
                  videoList.push({
                    id: videoList.length + 1,
                    displayName: cat || "Walkaround Video",
                    videoUrl: formatted,
                    imageUrl: primaryImage,
                    condition: "NORMAL",
                  });
                }
              }
            });
          }

          // 4. Check photos string array for video file extensions
          if (Array.isArray(raw.photos) && raw.photos.length > 0) {
            raw.photos.forEach((urlStr: any) => {
              if (typeof urlStr === "string" && /\.(mp4|webm|mov|avi|mkv|3gp|flv|wmv)($|\?)/i.test(urlStr.toLowerCase())) {
                const formatted = formatMediaUrl(urlStr);
                if (!videoList.some((existing) => existing.videoUrl === formatted)) {
                  videoList.push({
                    id: videoList.length + 1,
                    displayName: "Walkaround Video",
                    videoUrl: formatted,
                    imageUrl: primaryImage,
                    condition: "NORMAL",
                  });
                }
              }
            });
          }

          const statusStr = v.vehicleStatus || raw.vehicleStatus || raw.status || "APPROVED";

          const mapped = {
            id: String(insId),
            brand: v.brand || raw.brand || "Vehicle",
            model: v.model || raw.model || "Details",
            variant: v.variant || raw.variant || "",
            registrationNumber: v.vehicleNumber || v.registrationNumber || raw.vehicleNumber || raw.registrationNumber || "N/A",
            customerName: v.customerName || raw.customerName || "N/A",
            customerMobileNumber: v.customerMobileNumber || raw.customerMobileNumber || "N/A",
            year: v.manufacturingYear || v.registrationYear || raw.manufacturingYear || raw.registrationYear || raw.year || 2021,
            registrationYear: v.registrationYear || raw.registrationYear || null,
            fuel: fuelType,
            transmission: transmissionType,
            odometer: v.odometerReading || v.odometer || raw.odometerReading || raw.odometer || 0,
            insuranceStatus: v.insuranceStatus || raw.insuranceStatus || "Valid",
            location: v.location || raw.location || "N/A",
            rtoInformation: v.rtoInformation || v.rto || raw.rtoInformation || "N/A",
            underHypothecation: v.underHypothecation || raw.underHypothecation || "No",
            accidental: v.accidental || raw.accidental || "No",
            score: 90,
            basePrice,
            highestBid,
            highestBidder,
            bids: bidCount,
            status: "approved",
            auction:
              statusStr === "LIVE"
                ? "live"
                : (statusStr === "SOLD OUT" || statusStr === "SOLD_OUT" || statusStr === "SOLD")
                  ? "sold out"
                  : (statusStr === "ENDED" || statusStr === "AUCTION ENDED" || statusStr === "AUCTION_ENDED")
                    ? "ended"
                    : "scheduled",
            image: primaryImage,
            images: finalImages,
            videos: videoList,
            endsAt: endsAtTime,
            inspector: raw.freelancerName || raw.inspectorName || "Freelancer Submitter",
            owner: v.ownerName || v.customerName || raw.ownerName || raw.customerName || "1st Owner",
            vehicleStatus: statusStr,
          };

          setVehicle(mapped);
          setBidHistory(history);

          const startAmount = highestBid > 0 ? highestBid + 2000 : basePrice || 2000;
          setAmount(startAmount);
          setRemaining(timeLeft(endsAtTime));
        }
      } catch (err) {
        console.error("Failed to load freelancer vehicle details", err);
        toast.error("Could not retrieve vehicle details.");
      } finally {
        setLoading(false);
      }
    };

    loadDetails();
  }, [activeId]);

  // Wishlist check
  useEffect(() => {
    if (!vehicle?.id) return;
    const checkWishlist = async () => {
      try {
        const res = await getDealerWishlist();
        if (res.success && res.data) {
          setIsFavourite(
            res.data.some(
              (item: any) => String(item.inspectionId || item.id) === String(vehicle.id)
            )
          );
        }
      } catch (err) {}
    };
    checkWishlist();
  }, [vehicle?.id]);

  // WebSocket Live Bidding Listener
  useEffect(() => {
    if (!activeId || loading) return;

    let socket: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connectWebSocket = () => {
      const protocol = API_BASE_URL.startsWith("https") || window.location.protocol === "https:" ? "wss:" : "ws:";
      let host = "localhost:8080";
      if (API_BASE_URL && API_BASE_URL.includes("://")) {
        host = API_BASE_URL.split("://")[1];
      } else if (API_BASE_URL) {
        host = API_BASE_URL;
      }

      const wsUrl = `${protocol}//${host}/ws/auction?inspectionId=${activeId}`;
      socket = new WebSocket(wsUrl);

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (
            (data.type === "BID_UPDATE" || data.type === "GO_LIVE") &&
            Number(data.inspectionId) === Number(activeId)
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
            setAmount(data.currentHighestBid + 2000);
            if (data.type === "GO_LIVE") {
              toast.success("Auction is now live!");
            }
          } else if (
            data.type === "AUCTION_ENDED" &&
            Number(data.inspectionId) === Number(activeId)
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
        } catch (err) {}
      };

      socket.onclose = (e) => {
        if (!e.wasClean) {
          reconnectTimeout = setTimeout(connectWebSocket, 3000);
        }
      };
    };

    connectWebSocket();

    return () => {
      if (socket) socket.close(1000, "Component unmounted");
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [activeId, loading]);

  useEffect(() => {
    if (!vehicle?.endsAt) return;
    const intervalId = setInterval(() => setRemaining(timeLeft(vehicle.endsAt)), 1000);
    return () => clearInterval(intervalId);
  }, [vehicle?.endsAt]);

  const handleToggleFavourite = async () => {
    if (!vehicle) return;
    try {
      if (isFavourite) {
        const res = await removeFromWishlist(Number(vehicle.id));
        if (res.success) {
          setIsFavourite(false);
          toast.success("Removed from watchlist.");
        }
      } else {
        const res = await addToWishlist(Number(vehicle.id));
        if (res.success) {
          setIsFavourite(true);
          toast.success("Added to favourites watchlist!");
        }
      }
      window.dispatchEvent(new CustomEvent("wishlist-updated"));
    } catch (err) {
      toast.error("Could not update watchlist.");
    }
  };

  const handlePlaceBid = async () => {
    if (!vehicle || submittingBid) return;
    if (isWinner) {
      toast.info("You already hold the highest bid on this vehicle.");
      return;
    }

    const currentHighest = vehicle.highestBid || 0;
    const minBidRequired = currentHighest > 0 ? currentHighest + 1000 : vehicle.basePrice || 10000;

    if (amount < minBidRequired) {
      toast.error(`Bid amount must be at least ${inr(minBidRequired)} to outbid current highest bid.`);
      return;
    }

    setSubmittingBid(true);
    try {
      const res = await placeDealerBid(Number(activeId), amount);
      if (res.success) {
        toast.success(`Bid of ${inr(amount)} submitted successfully!`);
        setVehicle((prev: any) => ({
          ...prev,
          highestBid: amount,
          bids: (prev.bids || 0) + 1,
        }));
        setAmount(amount + 2000);
      } else {
        toast.error(res.message || "Failed to place bid.");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit bid.");
    } finally {
      setSubmittingBid(false);
    }
  };

  const addQuickIncrement = (increment: number) => {
    const currentHighest = vehicle?.highestBid || 0;
    const base = currentHighest > 0 ? currentHighest : vehicle?.basePrice || 0;
    const nextAmount = Math.max(amount, base) + increment;
    setAmount(nextAmount);
  };

  if (loading) {
    return (
      <AppShell role="dealer" nav={dealerNav} title="Loading Vehicle..." breadcrumb={["Dealer", "Freelancer Vehicles"]}>
        <div className="flex h-96 flex-col items-center justify-center gap-4 bg-card border border-border rounded-3xl shadow-soft">
          <span className="h-12 w-12 animate-spin rounded-full border-4 border-[#FFC700] border-t-transparent" />
          <p className="text-sm font-extrabold text-muted-foreground animate-pulse">
            Fetching Freelancer Vehicle & Live Auction State...
          </p>
        </div>
      </AppShell>
    );
  }

  if (!vehicle) {
    return (
      <AppShell role="dealer" nav={dealerNav} title="Not Found" breadcrumb={["Dealer", "Freelancer Vehicles"]}>
        <div className="rounded-3xl border border-dashed border-border bg-card p-16 text-center shadow-soft">
          <p className="font-extrabold text-foreground text-lg">
            Vehicle details not found.
          </p>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-[#FFC700] px-5 py-2.5 text-xs font-extrabold text-[#0D0E12] shadow-sm hover:scale-105 transition-all"
          >
            <ArrowLeft className="size-4" /> Go Back
          </button>
        </div>
      </AppShell>
    );
  }

  const session: any = readSession("dealer");
  const myName = (session?.name || "").toLowerCase().trim();
  const myEmail = (session?.email || "").toLowerCase().trim();
  const myDealership = (session?.dealershipName || "").toLowerCase().trim();
  const myId = session?.dealerId || session?.id;

  const isLive = vehicle.auction === "live";
  const isComingSoon = vehicle.auction === "scheduled" || (vehicle.auction as string) === "coming soon";
  const isEnded =
    vehicle &&
    (vehicle.auction === "completed" ||
      vehicle.vehicleStatus === "ENDED" ||
      vehicle.vehicleStatus === "SOLD OUT" ||
      vehicle.vehicleStatus === "SOLD" ||
      remaining === "Ended");

  const noBids = vehicle && (!vehicle.highestBidder || vehicle.highestBidder === "No bids" || vehicle.bids === 0);
  const topBid = bidHistory[0];
  const topBidderStr = (
    vehicle?.highestBidder ||
    rawDetails?.vehicleDetails?.currentHighestBidder ||
    rawDetails?.currentHighestBidder?.dealershipName ||
    topBid?.dealer ||
    ""
  ).toLowerCase().trim();

  const isWinner =
    vehicle &&
    !noBids &&
    Boolean(
      session &&
      ((myId && topBid?.dealerId && String(topBid.dealerId) === String(myId)) ||
        (myEmail && topBid?.dealerEmail && topBid.dealerEmail.toLowerCase().trim() === myEmail) ||
        (myName && topBidderStr.length > 0 && topBidderStr.includes(myName)) ||
        (myEmail && topBidderStr.length > 0 && topBidderStr.includes(myEmail)) ||
        (myDealership && topBidderStr.length > 0 && topBidderStr.includes(myDealership)))
    );

  const participated =
    vehicle &&
    bidHistory.some((b: any) => {
      const bd = (b.dealer || b.dealerName || b.dealershipName || b.dealerEmail || "").toLowerCase().trim();
      return (
        (myName && bd.includes(myName)) ||
        (myEmail && bd.includes(myEmail)) ||
        (myDealership && bd.includes(myDealership))
      );
    });

  const detailSteps = [
    { id: "car_documents", title: "Step 1: Car Documents & Legal", subtitle: "RTO, NOC, Fitness, RC & Tax status" },
    { id: "videos", title: `Step 2: Videos & Sound (${vehicle?.videos?.length || 0})`, subtitle: "Engine noise & video clips" },
  ];

  return (
    <AppShell role="dealer" nav={dealerNav} title={`${vehicle.brand} ${vehicle.model}`} breadcrumb={["Dealer", "Freelancer Vehicles", vehicle.id]}>
      <div className="space-y-6">
        {/* Top Hero Breadcrumb & Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="grid size-10 place-items-center rounded-2xl border border-border bg-secondary hover:bg-secondary/80 text-foreground transition-all hover:scale-105"
              title="Go back"
            >
              <ArrowLeft className="size-5 stroke-[2.5]" />
            </button>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-foreground sm:text-2xl uppercase">
                  {vehicle.brand} {vehicle.model}
                </h1>
                <span className="text-sm font-semibold text-muted-foreground">
                  {vehicle.variant}
                </span>
                <span className="rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider">
                  Freelancer Vehicle
                </span>
                <StatusChip status={vehicle.auction} />
              </div>
              <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground">
                <span>Mfg: {vehicle.year}</span>
                <span className="text-muted-foreground/60">&bull;</span>
                <span>Reg: {vehicle.registrationYear || "N/A"}</span>
                <span className="text-muted-foreground/60">&bull;</span>
                <span>{vehicle.owner || "1st Owner"}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleToggleFavourite}
              className={cn(
                "flex items-center gap-2 rounded-2xl border px-3 py-2.5 text-xs font-extrabold transition-all cursor-pointer shadow-sm",
                isFavourite
                  ? "border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                  : "border-border bg-secondary text-foreground hover:border-[#FFC700]/50"
              )}
            >
              <Heart className={cn("size-4", isFavourite ? "fill-rose-500 text-rose-500" : "text-muted-foreground")} />
            </button>
          </div>
        </div>

        {/* 10 Overview Specs Cards Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { label: "REGISTRATION YEAR", value: vehicle.registrationYear ? String(vehicle.registrationYear) : "N/A", icon: CalendarDays, color: "text-amber-500 bg-amber-500/15" },
            { label: "OWNERSHIP", value: vehicle.owner || "1st Owner", icon: User, color: "text-indigo-500 bg-indigo-500/15" },
            { label: "MANUFACTURING", value: vehicle.year ? String(vehicle.year) : "N/A", icon: Car, color: "text-[#FFC700] bg-[#FFC700]/15" },
            { label: "VARIANT & TRIM", value: vehicle.variant || "Standard", icon: Cog, color: "text-purple-500 bg-purple-500/15" },
            { label: "FUEL TYPE", value: vehicle.fuel || "N/A", icon: Fuel, color: "text-emerald-500 bg-emerald-500/15" },
            { label: "TRANSMISSION", value: vehicle.transmission || "N/A", icon: Settings2, color: "text-purple-500 bg-purple-500/15" },
            { label: "ODOMETER", value: vehicle.odometer ? `${Number(vehicle.odometer).toLocaleString("en-IN")} km` : "N/A", icon: Gauge, color: "text-blue-500 bg-blue-500/15" },
            { label: "INSURANCE STATUS", value: vehicle.insuranceStatus || "Valid", icon: ShieldCheck, color: "text-teal-500 bg-teal-500/15" },
            { label: "LOCATION", value: vehicle.location || "N/A", icon: MapPin, color: "text-rose-500 bg-rose-500/15" },
            { label: "BASE PRICE", value: inr(vehicle.basePrice), icon: TrendingUp, color: "text-[#FFC700] bg-[#FFC700]/15" },
          ].map((item, idx) => {
            const IconComp = item.icon;
            return (
              <div key={idx} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-soft hover:border-[#FFC700]/40 transition-all">
                <div className={`grid size-10 place-items-center rounded-xl shrink-0 ${item.color}`}>
                  <IconComp className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider truncate">{item.label}</p>
                  <p className="text-xs font-black text-foreground mt-0.5 truncate">{item.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Grid: Left Gallery & Details, Right Live Bidding Panel */}
        <div className="grid gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            {/* Gallery Card */}
            <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
              <div onClick={() => setPreviewIndex(0)} className="relative aspect-[16/9] w-full overflow-hidden bg-secondary cursor-pointer group">
                <img src={vehicle.image} alt={`${vehicle.brand} ${vehicle.model}`} className="size-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

                <div className="absolute left-4 top-4 z-10 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-black/60 backdrop-blur-md px-3.5 py-1 text-xs font-extrabold text-white border border-white/10 shadow-sm">
                    {vehicle.year} Model
                  </span>
                  <span className="rounded-full bg-[#FFC700] px-3.5 py-1 text-xs font-black text-[#0D0E12] shadow-sm">
                    Score {vehicle.score}/100
                  </span>
                </div>

                <div className="absolute right-4 top-4 z-10">
                  <span className="rounded-full bg-black/60 backdrop-blur-md px-3.5 py-1 text-xs font-extrabold text-white border border-white/10 flex items-center gap-1.5">
                    <Eye className="size-3.5 text-[#FFC700]" /> Click photo for Lightbox
                  </span>
                </div>

                <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between text-white">
                  <div>
                    <p className="text-lg font-black tracking-tight drop-shadow-md uppercase">
                      {vehicle.brand} {vehicle.model} {vehicle.variant}
                    </p>
                    <p className="text-xs text-white/80 font-semibold drop-shadow">
                      Evaluated by {vehicle.inspector}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 backdrop-blur-md px-3 py-1.5 text-xs font-extrabold border border-white/20">
                    <Camera className="size-3.5" /> {vehicle.images?.length || 1} Inspection Photos
                  </span>
                </div>
              </div>

              {/* Gallery Thumbnails Grid */}
              {vehicle.images && vehicle.images.length > 0 && (
                <div className="grid grid-cols-4 gap-3 p-4 bg-secondary/40 border-t border-border">
                  {vehicle.images.slice(0, 4).map((imgObj: any, idx: number) => {
                    const isLast = idx === 3 && vehicle.images.length > 4;
                    return (
                      <div key={idx} onClick={() => setPreviewIndex(idx)} className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl cursor-pointer hover:scale-[1.03] transition-all shadow-sm group border border-border">
                        <img src={imgObj.url} alt={imgObj.name} loading="lazy" className="size-full object-cover" />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                        <span className="absolute bottom-1.5 left-1.5 text-[9px] font-bold text-white bg-black/60 px-1.5 py-0.5 rounded-md backdrop-blur-sm truncate max-w-[90%]">
                          {imgObj.name}
                        </span>
                        {isLast && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white font-extrabold backdrop-blur-xs transition-all group-hover:bg-black/80">
                            <span className="text-lg font-black text-[#FFC700]">+{vehicle.images.length - 4}</span>
                            <span className="text-[10px] tracking-wider uppercase mt-0.5 text-white/90">More Photos</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Stepper Tabs Bar */}
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
              {detailSteps.map((s, idx) => {
                const isActive = activeTab === s.id;
                return (
                  <div key={s.id} onClick={() => setActiveTab(s.id)} className={cn("rounded-2xl border p-3.5 shadow-soft transition-all duration-200 cursor-pointer flex flex-col justify-between", isActive ? "border-[#FFC700] bg-card shadow-md ring-2 ring-[#FFC700]/30" : "border-border bg-card/40 hover:border-[#FFC700]/50 opacity-80")}>
                    <div className="flex items-center gap-2">
                      <div className={cn("flex size-6 items-center justify-center rounded-lg text-xs font-black transition-colors shrink-0", isActive ? "bg-[#FFC700] text-[#0D0E12]" : "bg-secondary text-muted-foreground")}>
                        {idx + 1}
                      </div>
                      <span className="text-xs font-extrabold text-foreground truncate">{s.title.split(":")[1] || s.title}</span>
                    </div>
                    <p className="mt-1 line-clamp-1 text-[10px] font-semibold text-muted-foreground">{s.subtitle}</p>
                  </div>
                );
              })}
            </div>

            {/* STEP 1: Car Documents & Legal */}
            {activeTab === "car_documents" && (
              <Panel title="Car Documents & Legal Status" description="Registration, RTO, Ownership & Insurance status.">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { label: "Registration Number", value: vehicle.registrationNumber || "N/A" },
                    { label: "Owner Profile", value: vehicle.owner || "1st Owner" },
                    { label: "Location", value: vehicle.location || "N/A" },
                    { label: "RTO Information", value: vehicle.rtoInformation || "N/A" },
                    { label: "Insurance Status & Validity", value: vehicle.insuranceStatus || "Valid" },
                    { label: "Under Hypothecation", value: vehicle.underHypothecation || "No" },
                    { label: "Accidental History", value: vehicle.accidental || "No" },
                  ].map((doc) => (
                    <div key={doc.label} className="rounded-2xl border border-border bg-card p-4 shadow-soft flex flex-col justify-between gap-2">
                      <span className="text-xs font-extrabold text-muted-foreground uppercase">{doc.label}</span>
                      <span className="text-sm font-black text-foreground">{doc.value}</span>
                    </div>
                  ))}
                </div>
              </Panel>
            )}

            {/* STEP 2: Videos */}
            {activeTab === "videos" && (
              <Panel title="🎥 Inspection Videos & Sound Recordings" description="Walkaround and sound recordings.">
                {vehicle.videos && vehicle.videos.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {vehicle.videos.map((vid: any, idx: number) => (
                      <div key={idx} className="rounded-2xl border border-border bg-card p-4 shadow-soft space-y-3">
                        <span className="text-xs font-black text-foreground block">{vid.displayName}</span>
                        <div className="aspect-video w-full overflow-hidden rounded-xl bg-black border border-border">
                          <video src={vid.videoUrl} controls className="size-full object-contain" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-border p-8 text-center text-xs font-bold text-muted-foreground">
                    No video recordings attached for this vehicle.
                  </div>
                )}
              </Panel>
            )}
          </div>

          {/* High-Stakes Live Bidding Sidebar */}
          <div className="space-y-5">
            <div className={`rounded-3xl p-6 text-white border transition-all duration-300 relative overflow-hidden ${isWinner ? "bg-[#062419] border-emerald-500/60 shadow-[0_0_30px_rgba(16,185,129,0.25)]" : participated ? "bg-[#230d12] border-rose-500/50 shadow-[0_0_25px_rgba(244,63,94,0.2)]" : "surface-dark border-[#FFC700]/40 shadow-lift"}`}>
              <div className="relative z-10 flex items-center justify-between gap-3 border-b border-white/10 pb-4">
                <StatusChip status={vehicle.auction} />
                {isWinner ? (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 font-extrabold text-xs animate-pulse">
                    <Sparkles className="size-3.5 text-emerald-400" />
                    <span>You are Highest on Bid!</span>
                  </div>
                ) : participated ? (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/50 text-rose-300 font-extrabold text-xs">
                    <AlertTriangle className="size-3.5 text-rose-400" />
                    <span>You are Outbid</span>
                  </div>
                ) : null}
              </div>

              <div className="relative z-10 my-5 space-y-4">
                <div className="flex items-baseline justify-between gap-2">
                  <div>
                    <p className={`text-[10px] font-extrabold tracking-widest uppercase ${isWinner ? "text-emerald-400" : participated ? "text-rose-400" : "text-[#FFC700]"}`}>Highest Bid</p>
                    <p className="mt-1 text-3xl font-black text-white tracking-tight">
                      {isComingSoon || !vehicle.highestBid ? "No Bids Yet" : inr(vehicle.highestBid)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-white/50 uppercase">Base Price</p>
                    <p className="mt-1 text-xs font-bold text-white/80">{inr(vehicle.basePrice)}</p>
                  </div>
                </div>

                {isLive && (
                  <div className="flex items-center justify-between rounded-2xl bg-white/5 border border-white/10 px-4 py-3">
                    <span className="text-xs font-bold text-white/70 flex items-center gap-1.5">
                      <Clock className="size-4 text-[#FFC700]" /> Closing In
                    </span>
                    <span className="text-base font-black text-[#FFC700] tracking-wide">{remaining}</span>
                  </div>
                )}
              </div>

              {isComingSoon ? (
                <div className="relative z-10 rounded-2xl border border-[#FFC700]/30 bg-[#FFC700]/10 p-5 text-center space-y-2">
                  <Clock className="size-8 text-[#FFC700] mx-auto animate-bounce" />
                  <p className="text-sm font-extrabold text-white">Bidding Opening Soon</p>
                </div>
              ) : isEnded ? (
                <div className="relative z-10 rounded-2xl border p-5 bg-white/5 border-white/10 space-y-2 text-center">
                  {noBids ? (
                    <p className="text-sm font-black text-amber-400 flex items-center gap-1.5 justify-center">
                      <AlertTriangle className="size-4" /> Unsold
                    </p>
                  ) : isWinner ? (
                    <p className="text-sm font-black text-emerald-400 flex items-center gap-1.5 justify-center animate-bounce">
                      <Trophy className="size-4" /> Bid Winner!
                    </p>
                  ) : (
                    <p className="text-sm font-black text-white/80 flex items-center gap-1.5 justify-center">Bid Closed</p>
                  )}
                </div>
              ) : (
                <div className="relative z-10 space-y-4">
                  {isWinner ? (
                    <div className="rounded-2xl bg-emerald-500/20 border border-emerald-500/40 p-4 flex items-center gap-3 text-emerald-200">
                      <Sparkles className="size-5 shrink-0 text-emerald-400 animate-bounce" />
                      <div>
                        <p className="text-xs font-black text-emerald-300 uppercase tracking-wide">You are on Top!</p>
                        <p className="text-[11px] font-semibold text-emerald-200/90">You currently hold the highest bid of {inr(vehicle.highestBid)}.</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-[11px] font-bold text-white/70 uppercase tracking-wider mb-2">
                          Quick Bid Increment
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <button
                            type="button"
                            onClick={() => addQuickIncrement(2000)}
                            className="rounded-xl border border-[#FFC700]/30 bg-[#101216] hover:bg-[#FFC700] hover:text-[#0D0E12] hover:border-[#FFC700] py-2 text-xs font-black transition-all cursor-pointer text-[#FFC700]"
                          >
                            +2k
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-white/80">Enter Bid Amount ₹</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FFC700] font-black">₹</span>
                          <input type="number" value={amount} step={2000} onChange={(e) => setAmount(Number(e.target.value))} className="w-full rounded-2xl border border-[#FFC700]/40 bg-white/10 pl-9 pr-4 py-3.5 text-lg font-black text-white outline-none focus:border-[#FFC700]" />
                        </div>
                      </div>

                      <button onClick={handlePlaceBid} disabled={submittingBid} className="w-full rounded-2xl bg-[#FFC700] hover:bg-[#FFD633] py-4 text-sm font-black text-[#0D0E12] shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50">
                        {submittingBid ? <span>Submitting...</span> : <><Zap className="size-4 fill-current" /> Submit Live Bid</>}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Preview Modal */}
      {previewIndex !== null && vehicle.images && vehicle.images.length > 0 && createPortal(
        <div onClick={() => setPreviewIndex(null)} className="fixed inset-0 z-[99999] flex flex-col justify-between bg-neutral-950/95 backdrop-blur-xl animate-in fade-in duration-200 cursor-zoom-out">
          <div onClick={(e) => e.stopPropagation()} className="flex w-full items-center justify-between px-6 py-4 border-b border-white/10 bg-black/45 backdrop-blur-md z-20 cursor-default select-none">
            <div className="min-w-0">
              <h3 className="text-base font-extrabold text-white tracking-tight uppercase">{vehicle.brand} {vehicle.model} {vehicle.variant}</h3>
              <p className="text-xs font-semibold text-[#FFC700] mt-0.5">{vehicle.images[previewIndex]?.name || "Inspection Photo"}</p>
            </div>
            <button onClick={() => setPreviewIndex(null)} className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all hover:scale-105 cursor-pointer border border-white/10" title="Close Preview">
              <CloseIcon className="size-5" />
            </button>
          </div>

          <div onClick={(e) => e.stopPropagation()} className="relative flex flex-1 w-full items-center justify-center px-12 md:px-20 cursor-default">
            <button onClick={() => setPreviewIndex((prev) => prev !== null ? (prev - 1 + vehicle.images.length) % vehicle.images.length : null)} className="absolute left-6 md:left-10 p-4 rounded-full bg-black/60 hover:bg-black/80 hover:scale-110 text-white transition-all cursor-pointer border border-white/10 z-20 shadow-2xl">
              <ChevronLeft className="size-8" />
            </button>
            <div className="relative flex h-[60vh] w-full max-w-4xl items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-black/40 shadow-2xl">
              <img src={vehicle.images[previewIndex]?.url} alt={vehicle.images[previewIndex]?.name} className="w-full h-full object-contain select-none pointer-events-none" />
            </div>
            <button onClick={() => setPreviewIndex((prev) => prev !== null ? (prev + 1) % vehicle.images.length : null)} className="absolute right-6 md:right-10 p-4 rounded-full bg-black/60 hover:bg-black/80 hover:scale-110 text-white transition-all cursor-pointer border border-white/10 z-20 shadow-2xl">
              <ChevronRight className="size-8" />
            </button>
          </div>
        </div>,
        document.body
      )}
    </AppShell>
  );
}
