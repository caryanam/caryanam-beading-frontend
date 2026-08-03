import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { dealerNav } from "@/components/nav-config";
import { DataTable, type Column } from "@/components/data-table";
import { StatusChip } from "@/components/premium";
import { inr } from "@/lib/mock-data";
import { getDealerBidsHistory } from "@/lib/api/dealer-api";

interface DealerBidRecord {
  id: string;
  vehicleId: string;
  brand: string;
  model: string;
  regNo: string;
  myBid: number;
  highestBid: number;
  totalBids: number;
  timestamp: string;
  status: string;
  auction: "live" | "scheduled" | "completed";
}

export function DealerBids() {
  const [bids, setBids] = useState<DealerBidRecord[]>([]);

  useEffect(() => {
    const fetchBids = async () => {
      try {
        const res = await getDealerBidsHistory();
        if (res.success && res.data) {
          setBids(res.data);
        }
      } catch (err) {
        console.error("Failed to load dealer bids list", err);
      }
    };
    fetchBids();
  }, []);

  const columns: Column<DealerBidRecord>[] = [
    {
      key: "vehicle",
      header: "Vehicle",
      cell: (v) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-sm text-foreground">
            {v.brand} {v.model}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{v.regNo}</p>
        </div>
      ),
    },
    { key: "mybid", header: "My bid", cell: (v) => inr(v.myBid) },
    { key: "highest", header: "Highest bid", cell: (v) => inr(v.highestBid) },
    { key: "bids", header: "Total bids", cell: (v) => v.totalBids },
    {
      key: "outcome",
      header: "Outcome",
      cell: (v) => {
        if (v.auction === "live") {
          return <StatusChip status="live" />;
        }
        const isWin = v.myBid >= v.highestBid;
        return <StatusChip status={isWin ? "won" : "lost"} />;
      },
    },
  ];

  return (
    <AppShell
      role="dealer"
      nav={dealerNav}
      title="My Bids"
      breadcrumb={["Dealer", "My Bids"]}
    >
      {bids.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-16 text-center shadow-soft">
          <p className="font-extrabold text-foreground text-lg">
            You have not placed any bids yet.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Visit the marketplace tab to browse vehicles and place bids.
          </p>
        </div>
      ) : (
        <DataTable
          rows={bids}
          columns={columns}
          searchKeys={["brand", "model", "regNo"]}
          placeholder="Search by brand, model, registration no..."
        />
      )}
    </AppShell>
  );
}
