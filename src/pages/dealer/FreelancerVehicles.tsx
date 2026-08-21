import { useEffect, useMemo, useState } from "react";
import { Filter, Search } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { dealerNav } from "@/components/nav-config";
import { VehicleCard } from "@/components/premium";
import { getFreelancerInspections } from "@/lib/api/freelancer-api";
import { toast } from "sonner";

const uniq = (list: string[]) => ["All", ...Array.from(new Set(list))];

export function DealerFreelancerVehicles() {
  const [inspections, setInspections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState("All");
  const [fuel, setFuel] = useState("All");
  const [transmission, setTransmission] = useState("All");

  useEffect(() => {
    const fetchFreelancerVehicles = async () => {
      setLoading(true);
      try {
        const res = await getFreelancerInspections();
        if (res.success && res.data) {
          // Filter for only LIVE, APPROVED, SUBMITTED, READY_FOR_AUCTION (exclude DRAFT/IN_PROGRESS)
          const valid = res.data.filter((item: any) => {
            const s = String(item.status || item.vehicleStatus || "").toUpperCase();
            return s !== "DRAFT" && s !== "IN_PROGRESS";
          });
          setInspections(valid);
        } else {
          setInspections([]);
        }
      } catch (err: any) {
        console.error("Failed to load freelancer marketplace inspections", err);
        toast.error("Could not load freelancer vehicles.");
      } finally {
        setLoading(false);
      }
    };
    fetchFreelancerVehicles();
  }, []);

  // Map backend freelancer inspection summaries to format expected by VehicleCard
  const mappedVehicles = useMemo(() => {
    return inspections.map((v) => {
      const insId = v.inspectionId || v.id;
      const basePrice = v.suggestedPrice || v.price || 350000;
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
      const f = (v.fuel || v.fuelType || "").toLowerCase();
      if (f.includes("diesel")) fuelType = "Diesel";
      else if (f.includes("cng")) fuelType = "CNG";
      else if (f.includes("lpg")) fuelType = "LPG";
      else if (f.includes("hybrid")) fuelType = "Hybrid";
      else if (f.includes("electric") || f.includes("ev"))
        fuelType = "Electric";
      else if (v.fuel || v.fuelType) fuelType = (v.fuel || v.fuelType) as any;

      let transmissionType: "Manual" | "Automatic" = "Manual";
      const t = (v.transmission || "").toLowerCase();
      if (t.includes("auto")) transmissionType = "Automatic";

      const vStatus = String(v.vehicleStatus || v.status || "").toUpperCase();

      return {
        id: String(insId),
        regNo: v.vehicleNumber || v.registrationNumber || v.regNo || `INS-${insId}`,
        brand: v.brand || "",
        model: v.model || "",
        variant: v.variant || "",
        year: v.year || v.manufacturingYear || v.registrationYear || 2021,
        fuel: fuelType,
        transmission: transmissionType,
        odometer: v.odometer || v.odometerReading || 0,
        owner: v.ownerName || "1st Owner",
        score: 88 + (insId % 10),
        basePrice,
        highestBid,
        bids: bidCount,
        status: "approved" as const,
        auction:
          vStatus === "LIVE"
            ? ("live" as const)
            : (vStatus === "SOLD OUT" || vStatus === "SOLD_OUT" || vStatus === "SOLD")
            ? ("sold out" as const)
            : (vStatus === "ENDED" || vStatus === "AUCTION ENDED" || vStatus === "AUCTION_ENDED")
            ? ("ended" as const)
            : ("scheduled" as const),
        image:
          (v.photos && v.photos[0]) ||
          v.vehicleImage ||
          "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=400&q=80",
        endsAt: v.auctionEndTime || Date.now() + 1000 * 60 * 15,
        inspector: v.freelancerName || v.inspectorName || (v.inspectorId ? `Freelancer #${v.inspectorId}` : "Freelancer"),
        location: v.location || v.city || undefined,
        rtoInformation: v.rtoInformation || v.rto || undefined,
        engineRating: v.engineRating || v.overallRating || v.rating || undefined,
        isFreelancer: true,
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
          .includes(query.trim().toLowerCase())
    );
  }, [mappedVehicles, query, brand, fuel, transmission]);

  const selects = [
    {
      label: "Brand",
      value: brand,
      set: setBrand,
      options: uniq(mappedVehicles.map((v) => v.brand).filter(Boolean)),
    },
    {
      label: "Fuel",
      value: fuel,
      set: setFuel,
      options: uniq(mappedVehicles.map((v) => v.fuel).filter(Boolean)),
    },
    {
      label: "Transmission",
      value: transmission,
      set: setTransmission,
      options: uniq(mappedVehicles.map((v) => v.transmission).filter(Boolean)),
    },
  ];

  return (
    <AppShell
      role="dealer"
      nav={dealerNav}
      title="Freelancer Vehicles"
      breadcrumb={["Dealer", "Freelancer Vehicles"]}
    >
      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-border bg-card p-5 shadow-soft">
        <label className="flex min-w-[240px] flex-1 items-center gap-2.5 rounded-2xl border border-border bg-secondary px-4 py-3 transition-all focus-within:border-[#FFC700] focus-within:ring-2 focus-within:ring-[#FFC700]/30">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search brand, model, registration no..."
            className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-muted-foreground text-foreground"
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
            No freelancer vehicles match your active filters
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
