import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useParams, Link } from "react-router-dom";
import {
  Heart,
  Zap,
  Shield,
  CheckCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Eye,
  ArrowLeft,
  Clock,
  Car,
  Gauge,
  Fuel,
  Settings2,
  TrendingUp,
  X as CloseIcon,
  Sparkles,
  Layers,
  Video,
  Play,
  Share2,
  CheckCircle2,
  Camera,
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
import {
  getMarketplaceInspectionDetails,
  getPublicInspectionDetails,
  placeDealerBid,
  getDealerWishlist,
  addToWishlist,
  removeFromWishlist,
  submitSellerResponse,
  submitDealerReply,
} from "@/lib/api/dealer-api";
import { API_BASE_URL } from "@/lib/api";
import { readSession } from "@/lib/session";
import { cn, maskDealerName } from "@/lib/utils";

export function DealerVehicleDetail() {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const [vehicle, setVehicle] = useState<any>(null);
  const [rawDetails, setRawDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState(0);
  const [remaining, setRemaining] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [activeVideoModalUrl, setActiveVideoModalUrl] = useState<string | null>(null);
  const [isFavourite, setIsFavourite] = useState(false);
  const [bidHistory, setBidHistory] = useState<any[]>([]);

  const [sellerAgreed, setSellerAgreed] = useState<boolean>(true);
  const [sellerCounterPrice, setSellerCounterPrice] = useState<number | null>(null);
  const [sellerMessage, setSellerMessage] = useState("");
  const [dealerReplyText, setDealerReplyText] = useState("");
  const [submittingSeller, setSubmittingSeller] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);
  const [submittingBid, setSubmittingBid] = useState(false);

  useEffect(() => {
    if (vehicle) {
      if (vehicle.sellerAgreed !== undefined && vehicle.sellerAgreed !== null) {
        setSellerAgreed(vehicle.sellerAgreed);
      }
      if (vehicle.sellerCounterPrice) setSellerCounterPrice(vehicle.sellerCounterPrice);
      if (vehicle.sellerMessage) setSellerMessage(vehicle.sellerMessage);
    }
  }, [vehicle]);

  useEffect(() => {
    if (!vehicleId) return;
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host.includes(":") ? window.location.host.split(":")[0] + ":8080" : window.location.host;
    const wsUrl = `${wsProtocol}//${host}/ws/auction?inspectionId=${vehicleId}`;
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(wsUrl);
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "SELLER_RESPONSE") {
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
          } else if (data.type === "ADMIN_DEALER_MESSAGE") {
            setVehicle((prev: any) =>
              prev ? { ...prev, adminDealerMessage: data.adminDealerMessage || data.message } : prev
            );
          } else if (data.type === "DEALER_REPLY") {
            setVehicle((prev: any) =>
              prev ? { ...prev, dealerReplyMessage: data.dealerReplyMessage || data.reply } : prev
            );
          } else if (data.type === "VEHICLE_STATUS_UPDATE" || data.type === "AUCTION_ENDED") {
            setVehicle((prev: any) =>
              prev ? { ...prev, vehicleStatus: data.vehicleStatus || "ENDED" } : prev
            );
          }
        } catch (e) {}
      };
    } catch (e) {}

    return () => {
      if (ws) ws.close();
    };
  }, [vehicleId]);

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

  const handleSendDealerReply = async () => {
    if (!vehicleId || !dealerReplyText.trim()) {
      toast.error("Please enter a reply message.");
      return;
    }
    setSubmittingReply(true);
    try {
      const res = await submitDealerReply(Number(vehicleId), dealerReplyText);
      if (res.success) {
        toast.success("Reply sent to Admin!");
        setVehicle((prev: any) => ({
          ...prev,
          dealerReplyMessage: dealerReplyText,
        }));
        setDealerReplyText("");
      } else {
        toast.error("Failed to send reply.");
      }
    } catch (err) {
      toast.error("Error sending reply.");
    } finally {
      setSubmittingReply(false);
    }
  };

  useEffect(() => {
    if (!vehicle?.id) return;
    const checkWishlist = async () => {
      try {
        const res = await getDealerWishlist();
        if (res.success && res.data) {
          setIsFavourite(
            res.data.some(
              (item: any) => String(item.inspectionId || item.id) === String(vehicle.id),
            ),
          );
        }
      } catch (err) {
        console.error("Failed to fetch wishlist status from API", err);
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
            setAmount(data.currentHighestBid + 2000);
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
          console.error("Error parsing WS message:", event);
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
      console.error("Error updating watchlist via API:", err);
      toast.error("Could not update watchlist.");
    }
  };

  const handlePlaceBid = async () => {
    if (!vehicle || submittingBid) return;

    const currentHighest = vehicle.highestBid || 0;
    const minBidRequired =
      currentHighest > 0 ? currentHighest + 1000 : vehicle.basePrice || 10000;

    if (amount < minBidRequired) {
      toast.error(
        `Bid amount must be at least ${inr(minBidRequired)} to outbid current highest bid.`,
      );
      return;
    }

    setSubmittingBid(true);
    try {
      const res = await placeDealerBid(Number(vehicleId), amount);
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
      console.error("Error placing bid:", err);
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
              : 0;
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
              url: formatMediaUrl(img.imageUrl),
              name: img.displayName || img.imageCategory || "Inspection View",
              photoType: img.photoType,
              category: img.imageCategory,
            }));
          const imageOnlyPhotos = validPhotos.filter(
            (p: any) =>
              !p.url.toLowerCase().match(/\.(mp4|webm|mov|avi)($|\?)/i) &&
              !p.url.toLowerCase().includes("video")
          );
          const finalImages =
            validPhotos.length > 0
              ? validPhotos
              : [
                {
                  url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80",
                  name: "Front View",
                },
              ];
          const primaryImage = (imageOnlyPhotos.length > 0 ? imageOnlyPhotos[0] : finalImages[0]).url;

          const videoList = (raw.inspectionVideos || []).filter(
            (vid: any) => vid.videoUrl && vid.captured !== false,
          );

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
            highestBidder: v.currentHighestBidder
              ? v.currentHighestBidder.dealershipName || v.currentHighestBidder
              : null,
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
            videos: videoList,
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
          const startAmount =
            highestBid > 0 ? highestBid + 2000 : basePrice || 2000;
          setAmount(startAmount);
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

  const shareVehicle = () => {
    if (navigator.share) {
      navigator
        .share({
          title: `${vehicle.brand} ${vehicle.model}`,
          text: `Check out this ${vehicle.brand} ${vehicle.model} on Caryanam Auction Marketplace`,
          url: window.location.href,
        })
        .catch(() => { });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Vehicle link copied to clipboard!");
    }
  };

  const getConditionBadgeStyle = (condStr: string) => {
    const c = (condStr || "").trim().toUpperCase();
    if (
      c === "OK" ||
      c === "WORKING" ||
      c === "AVAILABLE" ||
      c === "YES" ||
      c === "EFFECTIVE / OK"
    ) {
      return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
    }
    if (
      c === "REPAINTED" ||
      c === "CHANGED" ||
      c === "SCRATCH" ||
      c === "LOW" ||
      c === "NEED REPLACEMENT"
    ) {
      return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    }
    if (
      c === "DENT" ||
      c === "RUST" ||
      c === "DAMAGED" ||
      c === "NOT OK" ||
      c === "NOT WORKING" ||
      c === "MISSING" ||
      c === "NO"
    ) {
      return "bg-rose-500/10 text-rose-600 border-rose-500/20";
    }
    return "bg-secondary text-muted-foreground border-border";
  };

  const formatMediaUrl = (url: string | null | undefined): string => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
      return url;
    }
    const cleanBase = API_BASE_URL.replace(/\/+$/, "");
    const cleanPath = url.startsWith("/") ? url : `/${url}`;
    return `${cleanBase}${cleanPath}`;
  };

  const findMatchingPhoto = (queryKeys: string[]) => {
    const allMedia = [
      ...(rawDetails?.inspectionPhotos || []),
      ...(rawDetails?.inspectionVideos || []),
    ];

    const validMedia = allMedia.filter(
      (p: any) => p && (p.imageUrl || p.videoUrl || p.url)
    );

    // Pass 1: Strict exact match check first
    let found = validMedia.find((p: any) => {
      const pt = (p.photoType || "").toUpperCase().trim();
      const ic = (p.imageCategory || p.category || "").toUpperCase().trim();
      const dn = (p.displayName || p.name || "").toUpperCase().trim();
      return queryKeys.some((q) => {
        const uq = q.toUpperCase().trim();
        return (pt && pt === uq) || (ic && ic === uq) || (dn && dn === uq);
      });
    });

    // Pass 2: Clean alphanumeric match
    if (!found) {
      found = validMedia.find((p: any) => {
        const pType = (p.photoType || "").toUpperCase().replace(/[^A-Z]/g, "");
        const pCat = (p.imageCategory || p.category || "").toUpperCase().replace(/[^A-Z]/g, "");
        const pDisp = (p.displayName || p.name || "").toUpperCase().replace(/[^A-Z]/g, "");
        return queryKeys.some((q) => {
          const qClean = q.toUpperCase().replace(/[^A-Z]/g, "");
          if (!qClean) return false;
          return pType === qClean || pCat === qClean || pDisp === qClean;
        });
      });
    }

    // Pass 3: Fallback to substring match
    if (!found) {
      found = validMedia.find((p: any) => {
        const pt = (p.photoType || "").toUpperCase().trim();
        const ic = (p.imageCategory || p.category || "").toUpperCase().trim();
        const dn = (p.displayName || p.name || "").toUpperCase().trim();
        return queryKeys.some((q) => {
          const uq = q.toUpperCase().trim();
          if (uq.length < 3) return false;
          return (pt && pt.includes(uq)) || (ic && ic.includes(uq)) || (dn && dn.includes(uq));
        });
      });
    }

    const rawUrl =
      (found as any)?.imageUrl ||
      (found as any)?.videoUrl ||
      (found as any)?.url ||
      null;
    return rawUrl ? formatMediaUrl(rawUrl) : null;
  };

  if (loading) {
    return (
      <AppShell role="dealer" nav={dealerNav} title="Loading Vehicle..." breadcrumb={["Dealer", "Marketplace"]}>
        <div className="flex h-96 flex-col items-center justify-center gap-4 bg-card border border-border rounded-3xl shadow-soft">
          <span className="h-12 w-12 animate-spin rounded-full border-4 border-[#FFC700] border-t-transparent" />
          <p className="text-sm font-extrabold text-muted-foreground animate-pulse">
            Fetching 200-Point Inspection & Live Auction State...
          </p>
        </div>
      </AppShell>
    );
  }

  if (!vehicle) {
    return (
      <AppShell role="dealer" nav={dealerNav} title="Not Found" breadcrumb={["Dealer", "Marketplace"]}>
        <div className="rounded-3xl border border-dashed border-border bg-card p-16 text-center shadow-soft">
          <p className="font-extrabold text-foreground text-lg">
            Vehicle details not found.
          </p>
          <Link
            to="/dealer/marketplace"
            className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-[#FFC700] px-5 py-2.5 text-xs font-extrabold text-[#0D0E12] shadow-sm hover:scale-105 transition-all"
          >
            <ArrowLeft className="size-4" /> Back to Marketplace
          </Link>
        </div>
      </AppShell>
    );
  }

  const ratings = rawDetails?.ratings || {};
  const mechanical = rawDetails?.mechanicalDetails || {};
  const tyre = rawDetails?.tyreDetails || {};
  const interior = rawDetails?.interiorDetails || {};
  const exteriorPanels = rawDetails?.exteriorPanelDetails || [];
  const videos = vehicle.videos || [];

  const session: any = readSession("dealer");
  const myName = (session?.name || "").toLowerCase().trim();
  const myEmail = (session?.email || "").toLowerCase().trim();
  const myDealership = (session?.dealershipName || "").toLowerCase().trim();

  const myId = session?.dealerId || session?.id;

  const isLive = vehicle.auction === "live";
  const isComingSoon =
    vehicle.auction === "scheduled" ||
    (vehicle.auction as string) === "coming soon";
  const isEnded =
    vehicle &&
    (vehicle.auction === "completed" ||
      vehicle.vehicleStatus === "ENDED" ||
      vehicle.vehicleStatus === "SOLD OUT" ||
      vehicle.vehicleStatus === "SOLD" ||
      remaining === "Ended");

  const noBids =
    vehicle &&
    (!vehicle.highestBidder ||
      vehicle.highestBidder === "No bids" ||
      vehicle.bids === 0);

  const topBid = bidHistory[0];
  const topBidderStr = (
    vehicle?.highestBidder ||
    rawDetails?.vehicleDetails?.currentHighestBidder ||
    rawDetails?.currentHighestBidder?.dealershipName ||
    rawDetails?.currentHighestBidder?.ownerName ||
    rawDetails?.currentHighestBidder?.email ||
    topBid?.dealer ||
    topBid?.dealerName ||
    topBid?.dealershipName ||
    ""
  ).toLowerCase().trim();

  const isWinner =
    vehicle &&
    !noBids &&
    Boolean(
      session &&
      (
        (myId && topBid?.dealerId && String(topBid.dealerId) === String(myId)) ||
        (myId && rawDetails?.vehicleDetails?.currentHighestBidderId && String(rawDetails.vehicleDetails.currentHighestBidderId) === String(myId)) ||
        (myEmail && topBid?.dealerEmail && topBid.dealerEmail.toLowerCase().trim() === myEmail) ||
        (myEmail && rawDetails?.vehicleDetails?.currentHighestBidderEmail && rawDetails.vehicleDetails.currentHighestBidderEmail.toLowerCase().trim() === myEmail) ||
        (myName && topBidderStr.length > 0 && topBidderStr.includes(myName)) ||
        (myEmail && topBidderStr.length > 0 && topBidderStr.includes(myEmail)) ||
        (myDealership && topBidderStr.length > 0 && topBidderStr.includes(myDealership))
      )
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
    { id: "overview", title: "Step 1: Vehicle Specs", subtitle: "Specs, insurance & primary photos" },
    { id: "exterior", title: `Step 2: Exterior Body (${exteriorPanels.length})`, subtitle: "Panel conditions & body photos" },
    { id: "mechanical", title: "Step 3: Mechanical", subtitle: "Engine, oil, transmission & brakes" },
    { id: "tyres", title: "Step 4: Tyres & Toolkit", subtitle: "Tread depth % & emergency tools" },
    { id: "interior", title: "Step 5: Interior & Electrical", subtitle: "Cabin, electricals & remarks" },
  ];

  const mainContent = (
    <>
      <div className="space-y-6">
        {/* Top Hero Breadcrumb & Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center gap-3">
            <Link
              to="/dealer/marketplace"
              className="grid size-10 place-items-center rounded-2xl border border-border bg-secondary hover:bg-secondary/80 text-foreground transition-all hover:scale-105"
              title="Back to Marketplace"
            >
              <ArrowLeft className="size-5 stroke-[2.5]" />
            </Link>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-foreground sm:text-2xl uppercase">
                  {vehicle.brand} {vehicle.model}
                </h1>
                <span className="text-sm font-semibold text-muted-foreground">
                  {vehicle.variant}
                </span>
                <StatusChip status={vehicle.auction} />
              </div>
              <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground">
                <span>{vehicle.year} Model</span>
                <span>•</span>
                <span>Inspected by {vehicle.inspector}</span>
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
                  : "border-border bg-secondary text-foreground hover:border-[#FFC700]/50",
              )}
            >
              <Heart
                className={cn(
                  "size-4",
                  isFavourite
                    ? "fill-rose-500 text-rose-500"
                    : "text-muted-foreground",
                )}
              />
            </button>
          </div>
        </div>

        {/* Quick Specs Pill Row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-soft">
            <div className="grid size-10 place-items-center rounded-xl bg-[#FFC700]/15 text-[#FFC700]">
              <Car className="size-5" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">
                Manufacturing
              </p>
              <p className="text-xs font-black text-foreground mt-0.5">
                {vehicle.year}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-soft">
            <div className="grid size-10 place-items-center rounded-xl bg-blue-500/15 text-blue-500">
              <Gauge className="size-5" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">
                Odometer
              </p>
              <p className="text-xs font-black text-foreground mt-0.5">
                {vehicle.odometer.toLocaleString("en-IN")} km
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-soft">
            <div className="grid size-10 place-items-center rounded-xl bg-emerald-500/15 text-emerald-500">
              <Fuel className="size-5" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">
                Fuel Type
              </p>
              <p className="text-xs font-black text-foreground mt-0.5">
                {vehicle.fuel}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-soft">
            <div className="grid size-10 place-items-center rounded-xl bg-purple-500/15 text-purple-500">
              <Settings2 className="size-5" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">
                Transmission
              </p>
              <p className="text-xs font-black text-foreground mt-0.5">
                {vehicle.transmission}
              </p>
            </div>
          </div>
        </div>

        {/* Main Grid: Left Gallery & Details, Right Live Bidding Panel */}
        <div className="grid gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            {/* Gallery Card */}
            <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
              <div
                onClick={() => setPreviewIndex(0)}
                className="relative aspect-[16/9] w-full overflow-hidden bg-secondary cursor-pointer group"
              >
                <img
                  src={vehicle.image}
                  alt={`${vehicle.brand} ${vehicle.model}`}
                  className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

                {/* Floating Top Badges */}
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
                    <Eye className="size-3.5 text-[#FFC700]" />
                    Click photo for Lightbox
                  </span>
                </div>

                <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between text-white">
                  <div>
                    <p className="text-lg font-black tracking-tight drop-shadow-md uppercase">
                      {vehicle.brand} {vehicle.model} {vehicle.variant}
                    </p>
                    <p className="text-xs text-white/80 font-semibold drop-shadow">
                      Inspected 200-Point Quality Verified
                    </p>
                  </div>
                  <span className="rounded-xl bg-white/10 backdrop-blur-md px-3 py-1.5 text-xs font-extrabold border border-white/20">
                    📷 {vehicle.images?.length || 1} Inspection Photos
                  </span>
                </div>
              </div>

              {/* Gallery Thumbnails Grid */}
              {vehicle.images && vehicle.images.length > 0 && (
                <div className="grid grid-cols-4 gap-3 p-4 bg-secondary/40 border-t border-border">
                  {vehicle.images.slice(0, 4).map((imgObj: any, idx: number) => {
                    const isLast = idx === 3 && vehicle.images.length > 4;
                    return (
                      <div
                        key={idx}
                        onClick={() => setPreviewIndex(idx)}
                        className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl cursor-pointer hover:scale-[1.03] transition-all shadow-sm group border border-border"
                      >
                        <img
                          src={imgObj.url}
                          alt={imgObj.name}
                          loading="lazy"
                          className="size-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                        <span className="absolute bottom-1.5 left-1.5 text-[9px] font-bold text-white bg-black/60 px-1.5 py-0.5 rounded-md backdrop-blur-sm truncate max-w-[90%]">
                          {imgObj.name}
                        </span>
                        {isLast && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white font-extrabold backdrop-blur-xs transition-all group-hover:bg-black/80">
                            <span className="text-lg font-black text-[#FFC700]">
                              +{vehicle.images.length - 4}
                            </span>
                            <span className="text-[10px] tracking-wider uppercase mt-0.5 text-white/90">
                              More Photos
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 5-Step Stepper Tabs Bar (Placed directly down to the main image gallery) */}
            <div className="grid gap-2.5 grid-cols-2 sm:grid-cols-5">
              {detailSteps.map((s, idx) => {
                const isActive = activeTab === s.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => setActiveTab(s.id)}
                    className={cn(
                      "rounded-2xl border p-3.5 shadow-soft transition-all duration-200 cursor-pointer flex flex-col justify-between",
                      isActive
                        ? "border-[#FFC700] bg-card shadow-md ring-2 ring-[#FFC700]/30"
                        : "border-border bg-card/40 hover:border-[#FFC700]/50 opacity-80",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "flex size-6 items-center justify-center rounded-lg text-xs font-black transition-colors shrink-0",
                          isActive
                            ? "bg-[#FFC700] text-[#0D0E12]"
                            : "bg-secondary text-muted-foreground",
                        )}
                      >
                        {idx + 1}
                      </div>
                      <span className="text-xs font-extrabold text-foreground truncate">
                        {s.title.split(":")[1] || s.title}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-1 text-[10px] font-semibold text-muted-foreground">
                      {s.subtitle}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* STEP 1: Overview & Specs */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <Panel title="Step 1: Vehicle Specifications">
                  <dl className="grid gap-4 sm:grid-cols-3">
                    {[
                      ["Manufacturing Year", String(vehicle.year)],
                      ["Variant & Trim", vehicle.variant || "Standard"],
                      ["Fuel Type", vehicle.fuel],
                      ["Transmission", vehicle.transmission],
                      [
                        "Odometer Reading",
                        `${vehicle.odometer.toLocaleString("en-IN")} km`,
                      ],
                      ["Insurance Status", vehicle.insuranceStatus || "Expired / N/A"],
                      ["Certified Inspector", vehicle.inspector],
                      ["Base Price", inr(vehicle.basePrice)],
                    ].map(([k, val]) => (
                      <div
                        key={k}
                        className="rounded-2xl bg-secondary/50 p-4 border border-border/60"
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

                {/* Primary Exterior Angle Photos */}
                <Panel
                  title="Primary Inspection Photos"
                  description="High-resolution mandatory vehicle angle photos."
                >
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[
                      { keys: ["FRONT_VIEW", "FRONT"], label: "Front Angle Photo" },
                      { keys: ["RIGHT_FRONT_VIEW", "RIGHT"], label: "Right Side Angle Photo" },
                      { keys: ["REAR_VIEW", "REAR"], label: "Rear Angle Photo" },
                      { keys: ["LEFT_FRONT_VIEW", "LEFT"], label: "Left Side Angle Photo" },
                      { keys: ["ROOF_VIEW", "ROOF"], label: "Roof Top Photo" },
                      { keys: ["ODOMETER_IMAGE", "ODOMETER"], label: "Odometer Cluster Photo" },
                    ].map((slot) => {
                      const imgUrl = findMatchingPhoto(slot.keys);
                      return (
                        <div
                          key={slot.label}
                          className="rounded-2xl border border-border bg-card p-3.5 shadow-soft flex flex-col gap-2"
                        >
                          <span className="text-xs font-extrabold text-foreground truncate">
                            {slot.label}
                          </span>
                          <div className="relative group aspect-[16/10] w-full overflow-hidden rounded-xl border border-border bg-secondary shadow-inner flex items-center justify-center">
                            {imgUrl ? (
                              <>
                                <img
                                  src={imgUrl}
                                  alt={slot.label}
                                  className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <button
                                    type="button"
                                    onClick={() => window.open(imgUrl, "_blank")}
                                    className="inline-flex items-center gap-1 rounded-xl bg-[#FFC700] text-[#0D0E12] px-3 py-1.5 text-[11px] font-black shadow-md hover:bg-[#FFD633] transition-all cursor-pointer"
                                  >
                                    <Eye className="size-3.5" /> View Photo
                                  </button>
                                </div>
                              </>
                            ) : (
                              <div className="flex size-full items-center justify-center text-[10px] text-muted-foreground font-bold">
                                Photo Available in Lightbox
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Panel>
              </div>
            )}

            {/* STEP 2: Exterior Body Panels */}
            {activeTab === "exterior" && (
              <div className="space-y-6">
                <Panel
                  title="Step 2: Exterior Body Inspection"
                  description="32-point panel condition report with inline photos."
                  action={
                    <ScoreBadge
                      score={
                        ratings.exterior ? Number(ratings.exterior) * 20 : 85
                      }
                    />
                  }
                >
                  {exteriorPanels.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-xs font-bold text-muted-foreground">
                      No panel details recorded for this vehicle.
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 items-start">
                      {exteriorPanels.map((p: any) => {
                        const cond = p.condition || "N/A";
                        return (
                          <div
                            key={p.id || p.panelName}
                            className="rounded-2xl border border-border bg-card p-3.5 shadow-soft flex flex-col gap-2.5"
                          >
                            <div className="flex items-center justify-between gap-2 w-full">
                              <span className="text-xs font-extrabold text-foreground truncate">
                                {p.panelName}
                              </span>
                              <span
                                className={`rounded-lg border px-2.5 py-0.5 text-[10px] font-black uppercase ${getConditionBadgeStyle(
                                  cond,
                                )}`}
                              >
                                {cond}
                              </span>
                            </div>

                            {p.imageUrl ? (
                              <div className="relative group aspect-[16/10] w-full overflow-hidden rounded-xl border border-border bg-secondary shadow-inner">
                                <img
                                  src={p.imageUrl}
                                  alt={p.panelName}
                                  className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <button
                                    type="button"
                                    onClick={() => window.open(p.imageUrl, "_blank")}
                                    className="inline-flex items-center gap-1 rounded-xl bg-[#FFC700] text-[#0D0E12] px-3 py-1.5 text-[11px] font-black shadow-md hover:bg-[#FFD633] transition-all cursor-pointer"
                                  >
                                    <Eye className="size-3.5" /> View Photo
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex h-14 w-full items-center justify-center rounded-xl border border-dashed border-border/60 bg-secondary/30 text-[10px] font-bold text-muted-foreground">
                                No panel photo attached
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Panel>

                <Panel
                  title="Mandatory Exterior Images"
                  description="Upload clean, high-resolution photos of five primary panels."
                >
                  <div className="grid gap-4.5 sm:grid-cols-2 lg:grid-cols-3">
                    {[
                      { keys: ["FRONT_VIEW", "FRONT SIDE IMAGE", "FRONT"], label: "FRONT SIDE IMAGE" },
                      { keys: ["RIGHT_FRONT_VIEW", "RIGHT SIDE IMAGE", "RIGHT"], label: "RIGHT SIDE IMAGE" },
                      { keys: ["REAR_VIEW", "REAR SIDE IMAGE", "REAR"], label: "REAR SIDE IMAGE" },
                      { keys: ["LEFT_FRONT_VIEW", "LEFT SIDE IMAGE", "LEFT"], label: "LEFT SIDE IMAGE" },
                      { keys: ["ROOF_VIEW", "ROOF TOP IMAGE", "ROOF"], label: "ROOF TOP IMAGE" },
                    ].map((slot) => {
                      const imgUrl = findMatchingPhoto(slot.keys);
                      return (
                        <div key={slot.label} className="rounded-2xl border border-border bg-card p-3.5 shadow-soft flex flex-col gap-2">
                          <span className="text-xs font-extrabold text-foreground truncate">{slot.label}</span>
                          <div className="relative group aspect-[16/10] w-full overflow-hidden rounded-xl border border-border bg-secondary shadow-inner flex items-center justify-center">
                            {imgUrl ? (
                              <>
                                <img src={imgUrl} alt={slot.label} className="size-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <button
                                    type="button"
                                    onClick={() => window.open(imgUrl, "_blank")}
                                    className="inline-flex items-center gap-1 rounded-xl bg-[#FFC700] text-[#0D0E12] px-3 py-1.5 text-[11px] font-black shadow-md hover:bg-[#FFD633] transition-all cursor-pointer"
                                  >
                                    <Eye className="size-3.5" /> View Photo
                                  </button>
                                </div>
                              </>
                            ) : (
                              <div className="flex size-full items-center justify-center text-[10px] text-muted-foreground font-bold">
                                No Image Attached
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Panel>
              </div>
            )}

            {/* STEP 3: Mechanical Health */}
            {activeTab === "mechanical" && (
              <div className="space-y-6">
                <Panel
                  title="Step 3: Mechanical Health Diagnostics"
                  description="Engine compartment, transmission bay and fluid assemblies."
                  action={
                    <ScoreBadge
                      score={
                        ratings.mechanical ? Number(ratings.mechanical) * 20 : 88
                      }
                    />
                  }
                >
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[
                      { key: "Engine / Motor Status", val: mechanical.engineStatus, photos: ["ENGINE / MOTOR STATUS", "ENGINE_IMAGE", "ENGINE"] },
                      { key: "Engine Oil", val: mechanical.engineOil, photos: ["ENGINE OIL"] },
                      { key: "Brakes Oil", val: mechanical.brakeOil, photos: ["BRAKES OIL", "BRAKE OIL"] },
                      { key: "Steering Oil", val: mechanical.steeringOil, photos: ["STEERING OIL"] },
                      { key: "Coolant", val: mechanical.coolant, photos: ["COOLANT"] },
                      { key: "Brakes Booster", val: mechanical.brakeBooster, photos: ["BRAKES BOOSTER", "BRAKE BOOSTER"] },
                      { key: "Brakes Working", val: mechanical.brakeWorking, photos: ["BRAKES WORKING", "BRAKE WORKING"] },
                      { key: "Apron Condition", val: mechanical.apron, photos: ["APRON CONDITION", "APRON"] },
                      { key: "Chassis Alignment", val: mechanical.chassis, photos: ["CHASSIS ALIGNMENT", "CHASSIS"] },
                      { key: "Suspension", val: mechanical.suspension, photos: ["SUSPENSION"] },
                      { key: "Suspension Bushing", val: mechanical.bush, photos: ["SUSPENSION BUSHING", "BUSH"] },
                      { key: "Oil Leakage", val: mechanical.leakage, photos: ["OIL LEAKAGE", "LEAKAGE"] },
                      { key: "Exhaust Smoke Color", val: mechanical.smoke, photos: ["EXHAUST SMOKE COLOR", "EXHAUST SMOKE", "SMOKE"] },
                      { key: "Manual Transmission Fluid Level", val: mechanical.transmission, photos: ["MANUAL TRANSMISSION FLUID LEVEL", "TRANSMISSION"] },
                      { key: "Differential Fluid Level", val: mechanical.differential, photos: ["DIFFERENTIAL FLUID LEVEL", "DIFFERENTIAL"] },
                      { key: "Fluid Leakages", val: mechanical.fluidLeakage, photos: ["FLUID LEAKAGES"] },
                      { key: "Steering Gearbox & Linkage", val: mechanical.gearbox, photos: ["STEERING GEARBOX & LINKAGE", "GEARBOX"] },
                      { key: "Driveline / Axle", val: mechanical.axle, photos: ["DRIVELINE / AXLE", "DRIVELINE", "AXLE"] },
                      { key: "Engine / Motor Noise", val: mechanical.engineNoise, photos: ["ENGINE / MOTOR NOISE", "ENGINE NOISE", "MOTOR NOISE"] },
                    ].map((item) => {
                      const strVal = String(item.val || "OK");
                      const photoUrl = findMatchingPhoto(item.photos);
                      return (
                        <div
                          key={item.key}
                          className="rounded-2xl border border-border bg-card p-3.5 shadow-soft flex flex-col gap-2.5"
                        >
                          <div className="flex items-center justify-between gap-2 w-full">
                            <span className="text-xs font-extrabold text-foreground truncate min-w-0">
                              {item.key}
                            </span>
                            <span
                              className={`rounded-lg border px-2.5 py-0.5 text-[10px] font-black uppercase ${getConditionBadgeStyle(
                                strVal,
                              )}`}
                            >
                              {strVal}
                            </span>
                          </div>

                          {photoUrl && (
                            <div className="relative group aspect-[16/10] w-full overflow-hidden rounded-xl border border-border bg-black shadow-inner">
                              {item.key === "Engine / Motor Noise" || item.key.includes("Noise") || photoUrl.includes(".mp4") || photoUrl.includes(".webm") || photoUrl.includes(".mov") || photoUrl.includes(".avi") || photoUrl.includes("video") ? (
                                <video
                                  src={photoUrl}
                                  controls
                                  preload="metadata"
                                  playsInline
                                  className="size-full object-cover rounded-xl"
                                >
                                  <source src={photoUrl} type="video/mp4" />
                                  Your browser does not support playing this video.
                                </video>
                              ) : (
                                <img
                                  src={photoUrl}
                                  alt={item.key}
                                  className="size-full object-cover transition-transform duration-300 group-hover:scale-102"
                                />
                              )}
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                <button
                                  type="button"
                                  onClick={() => window.open(photoUrl, "_blank")}
                                  className="inline-flex items-center gap-1 rounded-xl bg-[#FFC700] text-[#0D0E12] px-3 py-1.5 text-[11px] font-black shadow-md hover:bg-[#FFD633] transition-all cursor-pointer pointer-events-auto"
                                >
                                  <Eye className="size-3.5" /> {item.key === "Engine / Motor Noise" || item.key.includes("Noise") || photoUrl.includes("video") ? "View Video" : "View Photo"}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Panel>

                <Panel
                  title="Under-Bonnet Engine Room Photos"
                  description="Engine compartment and battery bay photos."
                >
                  <div className="grid gap-4.5 sm:grid-cols-2 lg:grid-cols-2">
                    {[
                      { keys: ["ENGINE_IMAGE", "ENGINE ROOM PHOTO", "ENGINE"], label: "ENGINE ROOM PHOTO" },
                      { keys: ["BATTERY_IMAGE", "BATTERY BAY PHOTO", "BATTERY"], label: "BATTERY BAY PHOTO" },
                    ].map((slot) => {
                      const imgUrl = findMatchingPhoto(slot.keys);
                      return (
                        <div key={slot.label} className="rounded-2xl border border-border bg-card p-4 shadow-soft flex flex-col gap-2">
                          <span className="text-xs font-extrabold text-foreground truncate">{slot.label}</span>
                          <div className="relative group aspect-[16/10] w-full overflow-hidden rounded-xl border border-border bg-secondary shadow-inner flex items-center justify-center">
                            {imgUrl ? (
                              <>
                                <img src={imgUrl} alt={slot.label} className="size-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <button
                                    type="button"
                                    onClick={() => window.open(imgUrl, "_blank")}
                                    className="inline-flex items-center gap-1 rounded-xl bg-[#FFC700] text-[#0D0E12] px-3 py-1.5 text-[11px] font-black shadow-md hover:bg-[#FFD633] transition-all cursor-pointer"
                                  >
                                    <Eye className="size-3.5" /> View Photo
                                  </button>
                                </div>
                              </>
                            ) : (
                              <div className="flex size-full items-center justify-center text-[10px] text-muted-foreground font-bold">
                                No Image Attached
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Panel>
              </div>
            )}

            {/* STEP 4: Tyres Specifications */}
            {activeTab === "tyres" && (
              <div className="space-y-6">
                <Panel
                  title="Step 4: Tyres Specifications & Toolkits"
                  description="Tread depth percentage, brand names & emergency equipment."
                  action={
                    <ScoreBadge
                      score={ratings.tyre ? Number(ratings.tyre) * 20 : 90}
                    />
                  }
                >
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                    Tyres Wear & Brand Details
                  </h4>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
                    {[
                      { label: "Front Left Tyre", brand: tyre.frontLeftBrand, tread: tyre.frontLeftTread, photoKey: ["FRONT_LEFT_TYRE", "FRONT LEFT"] },
                      { label: "Front Right Tyre", brand: tyre.frontRightBrand, tread: tyre.frontRightTread, photoKey: ["FRONT_RIGHT_TYRE", "FRONT RIGHT"] },
                      { label: "Rear Left Tyre", brand: tyre.rearLeftBrand, tread: tyre.rearLeftTread, photoKey: ["REAR_LEFT_TYRE", "REAR LEFT"] },
                      { label: "Rear Right Tyre", brand: tyre.rearRightBrand, tread: tyre.rearRightTread, photoKey: ["REAR_RIGHT_TYRE", "REAR RIGHT"] },
                      { label: "Spare Wheel", brand: tyre.spareBrand, tread: tyre.spareTread, photoKey: ["SPARE_WHEEL", "SPARE"] },
                    ].map((t) => {
                      const tyrePhoto = findMatchingPhoto(t.photoKey);
                      return (
                        <div
                          key={t.label}
                          className="rounded-2xl border border-border bg-card p-4 shadow-soft flex flex-col justify-between gap-2.5"
                        >
                          <div className="flex items-center justify-between border-b border-border pb-2">
                            <span className="text-xs font-extrabold text-foreground">
                              {t.label}
                            </span>
                            <span className="text-[11px] font-black text-emerald-600 bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/20">
                              {t.tread ? `${t.tread}% Tread` : "60% Tread"}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-muted-foreground">
                            Brand: <span className="text-foreground">{t.brand || "Standard Tyre"}</span>
                          </p>

                          {tyrePhoto && (
                            <div className="relative group aspect-[16/10] w-full overflow-hidden rounded-xl border border-border bg-secondary shadow-inner">
                              <img
                                src={tyrePhoto}
                                alt={t.label}
                                className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                  type="button"
                                  onClick={() => window.open(tyrePhoto, "_blank")}
                                  className="inline-flex items-center gap-1 rounded-xl bg-[#FFC700] text-[#0D0E12] px-3 py-1.5 text-[11px] font-black shadow-md hover:bg-[#FFD633] transition-all cursor-pointer"
                                >
                                  <Eye className="size-3.5" /> View Photo
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                    Safety & Emergency Toolkit
                  </h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      ["Jack", tyre.hasJack],
                      ["Handle", tyre.hasHandle],
                      ["Tool Kit", tyre.hasToolkit],
                      ["First Aid Box", tyre.hasFirstAidBox],
                      ["Emergency Triangle", tyre.hasTriangle],
                    ].map(([label, active]) => (
                      <div
                        key={label as string}
                        className="flex items-center justify-between rounded-2xl bg-card border border-border p-3.5 shadow-soft"
                      >
                        <span className="text-xs font-extrabold text-foreground">
                          {label as string}
                        </span>
                        <span
                          className={`inline-flex shrink-0 items-center justify-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${active !== false
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                            }`}
                        >
                          {active !== false ? "AVAILABLE" : "MISSING"}
                        </span>
                      </div>
                    ))}
                  </div>
                </Panel>

                <Panel
                  title="Tyres & Spare Wheel Photos"
                  description="Individual photos of four active tyres and spare wheel in boot."
                >
                  <div className="grid gap-4.5 sm:grid-cols-2 lg:grid-cols-3">
                    {[
                      { keys: ["FRONT_RIGHT_TYRE", "RIGHT SIDE FRONT TYRE IMG", "FRONT RIGHT"], label: "RIGHT SIDE FRONT TYRE IMG" },
                      { keys: ["REAR_RIGHT_TYRE", "RIGHT SIDE REAR TYRE IMG", "REAR RIGHT"], label: "RIGHT SIDE REAR TYRE IMG" },
                      { keys: ["REAR_LEFT_TYRE", "LEFT SIDE REAR TYRE IMG", "REAR LEFT"], label: "LEFT SIDE REAR TYRE IMG" },
                      { keys: ["FRONT_LEFT_TYRE", "LEFT SIDE FRONT TYRE IMG", "FRONT LEFT"], label: "LEFT SIDE FRONT TYRE IMG" },
                      { keys: ["SPARE_WHEEL", "SPARE WHEEL IMG", "SPARE"], label: "SPARE WHEEL IMG" },
                      { keys: ["TYRES_OVERVIEW", "TYRES OVERVIEW IMAGE", "TYRES"], label: "TYRES OVERVIEW IMAGE" },
                    ].map((slot) => {
                      const imgUrl = findMatchingPhoto(slot.keys);
                      return (
                        <div key={slot.label} className="rounded-2xl border border-border bg-card p-4 shadow-soft flex flex-col gap-2">
                          <span className="text-xs font-extrabold text-foreground truncate">{slot.label}</span>
                          <div className="relative group aspect-[16/10] w-full overflow-hidden rounded-xl border border-border bg-secondary shadow-inner flex items-center justify-center">
                            {imgUrl ? (
                              <>
                                <img src={imgUrl} alt={slot.label} className="size-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <button
                                    type="button"
                                    onClick={() => window.open(imgUrl, "_blank")}
                                    className="inline-flex items-center gap-1 rounded-xl bg-[#FFC700] text-[#0D0E12] px-3 py-1.5 text-[11px] font-black shadow-md hover:bg-[#FFD633] transition-all cursor-pointer"
                                  >
                                    <Eye className="size-3.5" /> View Photo
                                  </button>
                                </div>
                              </>
                            ) : (
                              <div className="flex size-full items-center justify-center text-[10px] text-muted-foreground font-bold">
                                No Image Attached
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Panel>
              </div>
            )}

            {/* STEP 5: Interior & Electricals */}
            {activeTab === "interior" && (
              <div className="space-y-6">
                <Panel
                  title="Step 5: Interior Cabin & Electrical Checklist"
                  description="Cabin trim, battery condition, electrical buttons & inspector remarks."
                  action={
                    <ScoreBadge
                      score={ratings.interior ? Number(ratings.interior) * 20 : 92}
                    />
                  }
                >
                  <div className="grid gap-4 sm:grid-cols-3 mb-6">
                    <div className="rounded-2xl bg-secondary/50 p-4 border border-border/60">
                      <dt className="text-xs text-muted-foreground font-semibold">
                        Battery Company
                      </dt>
                      <dd className="truncate text-sm font-extrabold text-foreground mt-1">
                        {interior.batteryBrand || "N/A"}
                      </dd>
                    </div>
                    <div className="rounded-2xl bg-secondary/50 p-4 border border-border/60">
                      <dt className="text-xs text-muted-foreground font-semibold">
                        Full Battery Serial Number
                      </dt>
                      <dd className="truncate text-sm font-extrabold text-foreground mt-1">
                        {interior.batterySerialNumber || "N/A"}
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
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[
                      { label: "Push Start Button", val: interior.pushButton, photos: ["PUSH START BUTTON", "PUSH START"] },
                      { label: "Sunroof", val: interior.sunroof, photos: ["SUNROOF"] },
                      { label: "Right Side Tail Lamp", val: interior.rightTailLamp, photos: ["RIGHT SIDE TAIL LAMP", "TAIL LAMP"] },
                      { label: "Left Side Tail Lamp", val: interior.leftTailLamp, photos: ["LEFT SIDE TAIL LAMP"] },
                      { label: "Right Side Head Light", val: interior.rightHeadLamp, photos: ["RIGHT SIDE HEAD LIGHT", "HEAD LIGHT"] },
                      { label: "Left Side Head Light", val: interior.leftHeadLamp, photos: ["LEFT SIDE HEAD LIGHT"] },
                      { label: "Right Indicator", val: interior.indicators, photos: ["RIGHT INDICATOR"] },
                      { label: "Left Indicator", val: interior.indicators, photos: ["LEFT INDICATOR"] },
                      { label: "Boot Floor", val: interior.bootFloor, photos: ["BOOT FLOOR"] },
                      { label: "Washer Fluid", val: "OK", photos: ["WASHER FLUID"] },
                      { label: "Dashboard", val: interior.dashboard, photos: ["DASHBOARD_IMAGE", "DASHBOARD"] },
                      { label: "Left Side Fog Lamp", val: interior.fogLamps, photos: ["LEFT SIDE FOG LAMP", "FOG LAMP"] },
                      { label: "Right Side Fog Lamp", val: interior.fogLamps, photos: ["RIGHT SIDE FOG LAMP", "FOG LAMP"] },
                      { label: "Rear Stop Light", val: "OK", photos: ["REAR STOP LIGHT"] },
                      { label: "Power Window All Buttons", val: interior.powerWindows, photos: ["POWER WINDOW ALL BUTTONS", "POWER WINDOW"] },
                      { label: "Music System", val: interior.musicSystem, photos: ["MUSIC SYSTEM"] },
                      { label: "Adjustable Steering", val: "OK", photos: ["ADJUSTABLE STEERING"] },
                      { label: "Steering Mounted Controls", val: interior.steeringMountedControls, photos: ["STEERING MOUNTED CONTROLS", "STEERING MOUNTED"] },
                      { label: "Wiper Washer Front", val: interior.wiper, photos: ["WIPER WASHER FRONT", "WIPER"] },
                      { label: "Rear Defogger", val: interior.rearDefogger, photos: ["REAR DEFOGGER"] },
                      { label: "Rear Wiper Washer", val: interior.rearWasher, photos: ["REAR WIPER WASHER", "REAR WASHER"] },
                      { label: "Instrument Cluster", val: interior.instrumentCluster, photos: ["INSTRUMENT CLUSTER"] },
                      { label: "Infotainment System", val: interior.infotainment, photos: ["INFOTAINMENT SYSTEM", "INFOTAINMENT"] },
                      { label: "Central Lock", val: interior.centralLock, photos: ["CENTRAL LOCK"] },
                      { label: "All Sensors", val: interior.sensors, photos: ["ALL SENSORS", "SENSORS"] },
                    ].map((item) => {
                      const cond = item.val || "OK / WORKING";
                      const photoUrl = findMatchingPhoto(item.photos);

                      return (
                        <div
                          key={item.label}
                          className="rounded-2xl border border-border bg-card p-3.5 shadow-soft flex flex-col gap-2.5"
                        >
                          <div className="flex items-center justify-between gap-2 w-full">
                            <span className="text-xs font-extrabold text-foreground truncate min-w-0">
                              {item.label}
                            </span>
                            <span
                              className={`rounded-lg border px-2.5 py-0.5 text-[10px] font-black uppercase ${getConditionBadgeStyle(
                                cond,
                              )}`}
                            >
                              {cond}
                            </span>
                          </div>

                          {photoUrl && (
                            <div className="relative group aspect-[16/10] w-full overflow-hidden rounded-xl border border-border bg-secondary shadow-inner">
                              <img
                                src={photoUrl}
                                alt={item.label}
                                className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                  type="button"
                                  onClick={() => window.open(photoUrl, "_blank")}
                                  className="inline-flex items-center gap-1 rounded-xl bg-[#FFC700] text-[#0D0E12] px-3 py-1.5 text-[11px] font-black shadow-md hover:bg-[#FFD633] transition-all cursor-pointer"
                                >
                                  <Eye className="size-3.5" /> View Photo
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-6 space-y-4">
                    <div>
                      <label className="block text-xs font-extrabold text-foreground mb-1.5">
                        Inspector Remarks & Notes
                      </label>
                      <div className="w-full rounded-2xl border border-border bg-card p-4 text-sm font-semibold text-foreground shadow-soft min-h-[100px]">
                        {interior.remarks || "No remarks entered."}
                      </div>
                    </div>
                  </div>
                </Panel>
              </div>
            )}
          </div>

          {/* High-Stakes Live Bidding Sidebar */}
          <div className="space-y-5">
            {/* Live Bidding Box */}
            <div className="surface-dark rounded-3xl p-6 text-white border border-[#FFC700]/40 shadow-lift relative overflow-hidden before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_right,rgba(255,199,0,0.2),transparent_65%)]">
              {/* Header Status */}
              <div className="relative z-10 flex items-center justify-between gap-3 border-b border-white/10 pb-4">
                <StatusChip status={vehicle.auction} />
                <span className="text-xs font-extrabold text-[#FFC700] flex items-center gap-1.5 bg-[#FFC700]/10 px-3 py-1 rounded-full border border-[#FFC700]/30">
                  <Zap className="size-3.5 fill-current animate-pulse" />{" "}
                  {vehicle.bids || 0} Total Bids
                </span>
              </div>

              {/* Price & Bid Display */}
              <div className="relative z-10 my-5 space-y-4">
                <div className="flex items-baseline justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-extrabold tracking-widest text-[#FFC700] uppercase">
                      Highest Bid
                    </p>
                    <p className="mt-1 text-3xl font-black text-white tracking-tight">
                      {isComingSoon || !vehicle.highestBid || vehicle.bids === 0
                        ? "No Bids Yet"
                        : inr(vehicle.highestBid)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-white/50 uppercase">
                      Actual Price
                    </p>
                    <p className="mt-1 text-xs font-bold text-white/80">
                      {inr(vehicle.basePrice)}
                    </p>
                  </div>
                </div>

                {isLive && (
                  <div className="flex items-center justify-between rounded-2xl bg-white/5 border border-white/10 px-4 py-3">
                    <span className="text-xs font-bold text-white/70 flex items-center gap-1.5">
                      <Clock className="size-4 text-[#FFC700]" /> Closing In
                    </span>
                    <span className="text-base font-black text-[#FFC700] tracking-wide">
                      {remaining}
                    </span>
                  </div>
                )}
              </div>

              {isComingSoon ? (
                <div className="relative z-10 rounded-2xl border border-[#FFC700]/30 bg-[#FFC700]/10 p-5 text-center space-y-2">
                  <Clock className="size-8 text-[#FFC700] mx-auto animate-bounce" />
                  <p className="text-sm font-extrabold text-white">
                    Bidding Opening Soon
                  </p>
                </div>
              ) : isEnded ? (
                <div className="relative z-10 rounded-2xl border p-5 bg-white/5 border-white/10 space-y-2 text-center">
                  {noBids ? (
                    <>
                      <p className="text-sm font-black text-amber-400 flex items-center gap-1.5 justify-center">
                        <AlertTriangle className="size-4" /> Unsold
                      </p>
                      <p className="text-xs text-white/70 font-semibold">
                        The live bidding ended with no active bids placed.
                      </p>
                    </>
                  ) : isWinner ? (
                    <>
                      <p className="text-sm font-black text-emerald-400 flex items-center gap-1.5 justify-center animate-bounce">
                        🏆 Bid Winner!
                      </p>
                      <p className="text-xs text-white/95 font-semibold leading-relaxed">
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
                      <p className="text-xs text-white/70 font-semibold leading-relaxed">
                        You participated in this room, but another dealer won with
                        the highest bid of {inr(vehicle.highestBid)}.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-black text-white/80 flex items-center gap-1.5 justify-center">
                        🏁 Closed
                      </p>
                      <p className="text-xs text-white/70 font-semibold leading-relaxed">
                        This live bidding is now closed. Sold for{" "}
                        {inr(vehicle.highestBid)}.
                      </p>
                    </>
                  )}
                  {/* Admin Message for Winning Dealer */}
                  {vehicle.adminDealerMessage && isWinner && (
                    <div className="mt-4 border-t border-white/10 pt-3 text-left space-y-2">
                      <div className="flex items-center gap-1.5 text-blue-400 font-extrabold text-xs">
                        <Sparkles className="size-3.5" />
                        <span>Admin Message to Dealer:</span>
                      </div>
                      <p className="text-xs text-white/90 font-semibold bg-blue-500/10 p-2.5 rounded-xl border border-blue-500/30">
                        "{vehicle.adminDealerMessage}"
                      </p>

                      <div className="space-y-2 pt-1">
                        <input
                          type="text"
                          placeholder="Type reply back to Admin..."
                          value={dealerReplyText}
                          onChange={(e) => setDealerReplyText(e.target.value)}
                          className="w-full rounded-xl bg-black/40 border border-white/20 px-3 py-2 text-xs font-semibold text-white placeholder:text-white/40 focus:outline-none focus:border-blue-400"
                        />
                        <button
                          type="button"
                          disabled={submittingReply}
                          onClick={handleSendDealerReply}
                          className="w-full rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-black py-2 text-xs shadow-md cursor-pointer disabled:opacity-50"
                        >
                          {submittingReply ? "Sending..." : "Send Reply to Admin"}
                        </button>
                      </div>

                      {vehicle.dealerReplyMessage && (
                        <div className="rounded-xl bg-emerald-400/10 border border-emerald-400/30 p-2 text-[11px] font-semibold text-emerald-300">
                          <span className="font-extrabold block">Your Reply Sent to Admin:</span>
                          "{vehicle.dealerReplyMessage}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative z-10 space-y-4">
                  {/* Quick Bid Increment Buttons */}
                  <div>
                    <label className="block text-[11px] font-bold text-white/70 uppercase tracking-wider mb-2">
                      Quick Bid Increment
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: "+500", val: 500 },
                        { label: "+1k", val: 1000 },
                        { label: "+1.5k", val: 1500 },
                        { label: "+2k", val: 2000 },
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => addQuickIncrement(preset.val)}
                          className="rounded-xl border border-[#FFC700]/30 bg-[#101216] hover:bg-[#FFC700] hover:text-[#0D0E12] hover:border-[#FFC700] py-2 text-xs font-black transition-all cursor-pointer text-[#FFC700]"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Input field */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-white/80">
                      Enter Bid Amount (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FFC700] font-black">
                        ₹
                      </span>
                      <input
                        type="number"
                        value={amount}
                        step={500}
                        onChange={(e) => setAmount(Number(e.target.value))}
                        className="w-full rounded-2xl border border-[#FFC700]/40 bg-white/10 pl-9 pr-4 py-3.5 text-lg font-black text-white outline-none focus:border-[#FFC700] focus:ring-2 focus:ring-[#FFC700]/40"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handlePlaceBid}
                    disabled={submittingBid}
                    className="w-full rounded-2xl bg-[#FFC700] hover:bg-[#FFD633] py-4 text-sm font-black text-[#0D0E12] shadow-[0_4px_20px_rgba(255,199,0,0.4)] transition-all hover:shadow-[0_6px_24px_rgba(255,199,0,0.55)] hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {submittingBid ? (
                      <>
                        <span className="animate-spin inline-block size-4 border-2 border-[#0D0E12] border-t-transparent rounded-full" />
                        <span>Submitting Bid...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="size-4 fill-current" /> Submit Live Bid
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Live Bid Stream / Activity Feed */}
            <div className="rounded-3xl border border-border bg-card p-5 space-y-4 shadow-soft">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-sm font-black uppercase tracking-wider text-foreground flex items-center gap-2">
                  <TrendingUp className="size-4 text-[#FFC700]" /> Bid Activity Stream
                </h3>
                <span className="text-[10px] font-bold text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                  Real-time
                </span>
              </div>

              {bidHistory.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1 no-scrollbar">
                  {bidHistory.map((bid: any, idx: number) => {
                    const isTop = idx === 0;
                    const bAmount = bid.amount || bid.bidAmount || 0;
                    const nextLowerBid = bidHistory[idx + 1];
                    const lowerAmount = nextLowerBid
                      ? nextLowerBid.amount || nextLowerBid.bidAmount || 0
                      : vehicle?.basePrice || 0;
                    const diff = bAmount > lowerAmount ? bAmount - lowerAmount : 0;

                    const bDealer =
                      bid.dealer ||
                      bid.dealerName ||
                      bid.dealershipName ||
                      "Registered Dealer";
                    const bTime =
                      bid.time ||
                      bid.bidTime ||
                      (bid.createdAt
                        ? new Date(bid.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Just now");

                    return (
                      <div
                        key={bid.id || idx}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-2xl border text-xs transition-all",
                          isTop
                            ? "bg-[#FFC700]/15 border-[#FFC700]/40 text-foreground font-bold"
                            : "bg-secondary/40 border-border/60 text-muted-foreground",
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "size-2 rounded-full",
                              isTop ? "bg-[#FFC700]" : "bg-muted-foreground/40",
                            )}
                          />
                          <div>
                            <p className="font-bold truncate max-w-[130px] text-foreground">
                              {maskDealerName(bDealer)}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {bTime}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end">
                          <p
                            className={cn(
                              "font-black text-sm",
                              isTop ? "text-[#FFC700]" : "text-foreground",
                            )}
                          >
                            {inr(bAmount)}
                          </p>
                          {diff > 0 && (
                            <p className="flex items-center gap-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                              <TrendingUp className="size-3.5" /> +{inr(diff)}
                            </p>
                          )}
                          {isTop && (
                            <span className="text-[9px] font-extrabold uppercase text-[#FFC700] mt-0.5">
                              HIGHEST BID
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 text-center rounded-2xl bg-secondary/30 border border-dashed border-border text-xs text-muted-foreground font-medium">
                  No live bids recorded yet. Place the first bid above!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Preview Modal */}
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
              className="flex w-full items-center justify-between px-6 py-4 border-b border-white/10 bg-black/45 backdrop-blur-md z-20 cursor-default select-none"
            >
              <div className="min-w-0">
                <h3 className="text-base font-extrabold text-white tracking-tight uppercase">
                  {vehicle.brand} {vehicle.model} {vehicle.variant}
                </h3>
                <p className="text-xs font-semibold text-[#FFC700] mt-0.5">
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

            {/* Center Area */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative flex flex-1 w-full items-center justify-center px-12 md:px-20 cursor-default"
            >
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

              <div className="relative flex h-[60vh] w-full max-w-4xl items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-black/40 shadow-[0_15px_50px_rgba(0,0,0,0.4)]">
                {vehicle.images[previewIndex]?.url?.match(/\.(mp4|webm|mov|avi)($|\?)/i) || vehicle.images[previewIndex]?.name?.includes("Noise") || vehicle.images[previewIndex]?.url?.includes("video") ? (
                  <video
                    src={vehicle.images[previewIndex]?.url}
                    controls
                    autoPlay
                    playsInline
                    className="max-h-full max-w-full rounded-2xl"
                  >
                    <source src={vehicle.images[previewIndex]?.url} type="video/mp4" />
                    Your browser does not support playing this video.
                  </video>
                ) : (
                  <img
                    src={vehicle.images[previewIndex]?.url}
                    alt={vehicle.images[previewIndex]?.name}
                    className="w-full h-full object-contain select-none pointer-events-none"
                  />
                )}
              </div>

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

            {/* Bottom Bar */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full flex flex-col items-center bg-black/45 border-t border-white/10 py-5 px-6 gap-4 z-20 cursor-default select-none"
            >
              <div className="flex gap-2.5 overflow-x-auto max-w-full no-scrollbar pb-1">
                {vehicle.images.map((imgObj: any, idx: number) => {
                  const isActive = idx === previewIndex;
                  return (
                    <img
                      key={idx}
                      src={imgObj.url}
                      alt=""
                      onClick={() => setPreviewIndex(idx)}
                      className={`h-11 w-16 object-cover rounded-lg cursor-pointer transition-all border-2 ${isActive
                        ? "border-[#FFC700] scale-105 opacity-100 shadow-[0_0_10px_rgba(255,199,0,0.5)]"
                        : "border-transparent opacity-50 hover:opacity-85"
                        }`}
                    />
                  );
                })}
              </div>

              <div className="text-xs font-black text-white/80 bg-neutral-900 border border-white/10 px-4 py-1.5 rounded-full shadow-sm">
                Photo {previewIndex + 1} of {vehicle.images.length}
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Dedicated Video Lightbox Modal */}
      {activeVideoModalUrl &&
        createPortal(
          <div
            onClick={() => setActiveVideoModalUrl(null)}
            className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in cursor-zoom-out"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-card p-5 sm:p-6 shadow-2xl flex flex-col gap-4 cursor-default"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="grid size-9 place-items-center rounded-xl bg-[#FFC700] text-[#0D0E12]">
                    <Video className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-foreground tracking-tight uppercase">
                      Engine / Motor Noise Recording
                    </h3>
                    <p className="text-[11px] font-semibold text-muted-foreground">
                      {vehicle?.brand} {vehicle?.model} {vehicle?.variant}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveVideoModalUrl(null)}
                  className="rounded-full bg-secondary p-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer border border-border"
                  title="Close Video"
                >
                  <CloseIcon className="size-5" />
                </button>
              </div>

              <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black border border-border flex items-center justify-center">
                <video
                  src={activeVideoModalUrl}
                  controls
                  autoPlay
                  playsInline
                  className="size-full object-contain rounded-2xl"
                >
                  <source src={activeVideoModalUrl} type="video/mp4" />
                  Your browser does not support HTML5 video.
                </video>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/60">
                <span className="font-semibold text-emerald-500 flex items-center gap-1.5">
                  <CheckCircle2 className="size-4" /> 200-Point Inspection Sound Recording Verified
                </span>
                <button
                  type="button"
                  onClick={() => window.open(activeVideoModalUrl, "_blank")}
                  className="font-black text-[#FFC700] hover:underline cursor-pointer flex items-center gap-1"
                >
                  Open Direct Link ↗
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );

  return (
    <AppShell
      role="dealer"
      nav={dealerNav}
      title={`${vehicle.brand} ${vehicle.model}`}
      breadcrumb={["Dealer", "Marketplace", vehicle.id]}
    >
      {mainContent}
    </AppShell>
  );
}
