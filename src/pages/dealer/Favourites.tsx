import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { dealerNav } from "@/components/nav-config";
import { VehicleCard } from "@/components/premium";
import { getDealerWishlist } from "@/lib/api/dealer-api";
import { readSession } from "@/lib/session";

export function DealerFavourites() {
  const [favourites, setFavourites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavourites = async () => {
      setLoading(true);
      try {
        const res = await getDealerWishlist();
        if (res.success && res.data) {
          const mapped = res.data.map((item: any) => {
            const basePrice = item.suggestedPrice || 350000;
            const bidCount = item.totalBids || 0;
            const highestBid = item.currentHighestBid || basePrice;
            
            let fuelType: "Petrol" | "Diesel" | "CNG" | "Electric" = "Petrol";
            const f = (item.fuel || "").toLowerCase();
            if (f.includes("diesel")) fuelType = "Diesel";
            else if (f.includes("cng")) fuelType = "CNG";
            else if (f.includes("electric") || f.includes("ev")) fuelType = "Electric";

            let transmissionType: "Manual" | "Automatic" = "Manual";
            const t = (item.transmission || "").toLowerCase();
            if (t.includes("auto")) transmissionType = "Automatic";

            return {
              id: String(item.inspectionId),
              regNo: item.vehicleNumber,
              brand: item.brand,
              model: item.model,
              variant: item.variant,
              year: item.year || 2020,
              fuel: fuelType,
              transmission: transmissionType,
              odometer: item.odometer || 45000,
              owner: item.ownerName,
              score: 88 + (item.inspectionId % 10),
              basePrice,
              highestBid,
              bids: bidCount,
              status: "approved" as const,
              auction: item.vehicleStatus === "LIVE" ? ("live" as const) : (item.vehicleStatus === "SOLD OUT" || item.vehicleStatus === "SOLD_OUT" || item.vehicleStatus === "SOLD" || item.vehicleStatus === "ENDED") ? ("sold out" as const) : ("scheduled" as const),
              image: item.vehicleImage || "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=400&q=80",
              endsAt: item.auctionEndTime || (Date.now() + 1000 * 60 * 60 * 24),
            };
          });
          setFavourites(mapped);
        }
      } catch (err) {
        console.error("Failed to load wishlist from API, using local storage fallback", err);
        const session = readSession("dealer");
        const email = session?.email || "default_dealer";
        const key = `dealer_${email}_favourites`;
        const favList = JSON.parse(localStorage.getItem(key) || "[]");
        setFavourites(favList);
      } finally {
        setLoading(false);
      }
    };
    fetchFavourites();
  }, []);

  return (
    <AppShell role="dealer" nav={dealerNav} title="Favourites" breadcrumb={["Dealer", "Favourites"]}>
      {loading ? (
        <div className="flex h-60 items-center justify-center bg-card border border-border rounded-3xl shadow-soft">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : favourites.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-16 text-center shadow-soft">
          <p className="font-extrabold text-foreground text-lg">Your watchlist is empty.</p>
          <p className="text-xs text-muted-foreground mt-1">Tap the heart button on any vehicle details page to save it here.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {favourites.map((v) => (
            <VehicleCard key={v.id} vehicle={v} />
          ))}
        </div>
      )}
    </AppShell>
  );
}
