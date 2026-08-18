import { useEffect, useMemo, useState } from "react";
import { Filter, Search } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { dealerNav } from "@/components/nav-config";
import { VehicleCard } from "@/components/premium";
import {
  getMarketplaceInspections,
  type DealerInspectionSummary,
} from "@/lib/api/dealer-api";
import { toast } from "sonner";

const uniq = (list: string[]) => ["All", ...Array.from(new Set(list))];

export function DealerMarketplace() {
  const [inspections, setInspections] = useState<DealerInspectionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState("All");
  const [fuel, setFuel] = useState("All");
  const [transmission, setTransmission] = useState("All");

  useEffect(() => {
    const fetchMarketplace = async () => {
      setLoading(true);
      try {
        const res = await getMarketplaceInspections();
        if (res.success && res.data) {
          setInspections(res.data);
        }
      } catch (err: any) {
        console.error("Failed to load marketplace inspections", err);
        toast.error("Could not load marketplace vehicles.");
      } finally {
        setLoading(false);
      }
    };
    fetchMarketplace();
  }, []);

  // Map backend inspection summaries to format expected by VehicleCard
  const mappedVehicles = useMemo(() => {
    return inspections.map((v) => {
      const basePrice = v.suggestedPrice || 350000;
      const bidCount = v.totalBids || 0;
      const highestBid =
        v.currentHighestBid && v.currentHighestBid > 0
          ? v.currentHighestBid
          : 0;

      let fuelType:
        | "Petrol"
        | "Diesel"
        | "CNG"
        | "LPG"
        | "Electric"
        | "Hybrid" = "Petrol";
      const f = (v.fuel || "").toLowerCase();
      if (f.includes("diesel")) fuelType = "Diesel";
      else if (f.includes("cng")) fuelType = "CNG";
      else if (f.includes("lpg")) fuelType = "LPG";
      else if (f.includes("hybrid")) fuelType = "Hybrid";
      else if (f.includes("electric") || f.includes("ev"))
        fuelType = "Electric";
      else if (v.fuel) fuelType = v.fuel as any;

      let transmissionType: "Manual" | "Automatic" = "Manual";
      const t = (v.transmission || "").toLowerCase();
      if (t.includes("auto")) transmissionType = "Automatic";

      return {
        id: String(v.inspectionId),
        regNo: v.vehicleNumber,
        brand: v.brand,
        model: v.model,
        variant: v.variant,
        year: v.year || 2020,
        fuel: fuelType,
        transmission: transmissionType,
        odometer: v.odometer ?? 0,
        owner: v.ownerName || "1st Owner",
        score: 88 + (v.inspectionId % 10),
        basePrice,
        highestBid,
        bids: bidCount,
        status: "approved" as const,
        auction:
          v.vehicleStatus === "LIVE"
            ? ("live" as const)
            : (v.vehicleStatus === "SOLD OUT" || v.vehicleStatus === "SOLD_OUT" || v.vehicleStatus === "SOLD")
            ? ("sold out" as const)
            : (v.vehicleStatus === "ENDED" || v.vehicleStatus === "AUCTION ENDED" || v.vehicleStatus === "AUCTION_ENDED")
            ? ("ended" as const)
            : ("scheduled" as const),
        image:
          v.vehicleImage ||
          "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=400&q=80",
        endsAt: v.auctionEndTime || Date.now() + 1000 * 60 * 60 * 24 * 2,
        inspector: v.inspectorName || "Certified Inspector",
        location: (v as any).location || (v as any).city || undefined,
        rtoInformation: (v as any).rtoInformation || (v as any).rto || undefined,
        engineRating: (v as any).engineRating || (v as any).overallRating || (v as any).rating || undefined,
      };
    });
  }, [inspections]);

  const filtered = useMemo(() => {
    return mappedVehicles.filter(
      (v) =>
        (brand === "All" || v.brand === brand) &&
        (fuel === "All" || v.fuel === fuel) &&
        (transmission === "All" || v.transmission === transmission) &&
        `${v.brand} ${v.model} ${v.variant} ${v.regNo}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
    );
  }, [mappedVehicles, query, brand, fuel, transmission]);

  const selects = [
    {
      label: "Brand",
      value: brand,
      set: setBrand,
      options: uniq(mappedVehicles.map((v) => v.brand)),
    },
    {
      label: "Fuel",
      value: fuel,
      set: setFuel,
      options: uniq(mappedVehicles.map((v) => v.fuel)),
    },
    {
      label: "Transmission",
      value: transmission,
      set: setTransmission,
      options: uniq(mappedVehicles.map((v) => v.transmission)),
    },
  ];

  return (
    <AppShell
      role="dealer"
      nav={dealerNav}
      title="Vehicle Marketplace"
      breadcrumb={["Dealer", "Marketplace"]}
    >
      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-border bg-card p-5 shadow-soft">
        <label className="flex min-w-[240px] flex-1 items-center gap-2.5 rounded-2xl border border-border bg-secondary px-4 py-3 transition-all focus-within:border-[#FFC700] focus-within:ring-2 focus-within:ring-[#FFC700]/30">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search brand, model, registration no..."
            className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-muted-foreground"
          />
        </label>

        {selects.map((s, i) => (
          <div
            key={i}
            className="flex items-center gap-1.5 rounded-2xl border border-border bg-card px-3.5 py-2.5 shadow-soft transition-all focus-within:border-[#FFC700]"
          >
            <span className="text-[11px] font-bold text-muted-foreground uppercase">
              {s.label}:
            </span>
            <select
              value={s.value}
              onChange={(e) => s.set(e.target.value)}
              className="bg-transparent text-xs font-extrabold capitalize outline-none cursor-pointer text-foreground"
            >
              {s.options.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {/* Grid Results */}
      {loading ? (
        <div className="flex h-60 items-center justify-center bg-card border border-border rounded-3xl shadow-soft mt-6">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-16 text-center shadow-soft mt-6">
          <Filter className="size-10 text-[#FFC700] mx-auto mb-3" />
          <p className="font-extrabold text-foreground text-lg">
            No vehicles match your active filters
          </p>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">
            Try adjusting your brand, fuel type or transmission filter settings.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 mt-6">
          {filtered.map((v) => (
            <VehicleCard key={v.id} vehicle={v} />
          ))}
        </div>
      )}
    </AppShell>
  );
}
