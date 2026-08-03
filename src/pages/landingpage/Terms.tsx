import { Scale } from "lucide-react";

export function Terms() {
  return (
    <section className="py-20 bg-background animate-rise">
      <div className="mx-auto max-w-4xl px-6">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground flex items-center justify-center gap-3">
            <Scale className="size-8 text-[#FFC700]" /> Terms & Conditions
          </h1>
          <p className="mt-3 text-xs font-bold text-[#FFC700] tracking-widest uppercase">
            Bid Acceptance Rules & Deposit Requirements
          </p>
        </div>

        <div className="prose prose-zinc text-xs sm:text-sm text-muted-foreground leading-relaxed font-medium space-y-6">
          <h3 className="text-xs font-black text-foreground uppercase tracking-wider">
            1. Binding Bid Commitment
          </h3>
          <p>
            Every bid submitted inside live auction rooms is a legally binding
            contract. Once the ticking timer reaches zero, the dealer holding
            the highest bid accepts full liability for the vehicle purchase
            price as recorded in the live monitor bidding logs.
          </p>

          <h3 className="text-xs font-black text-foreground uppercase tracking-wider">
            2. Go Live and Bid Acceptance Duration
          </h3>
          <p>
            The live room remains active for exactly 10 minutes from the moment
            the system administrator clicks the "Go Live" action. Bid history
            resets or adjustments after the room timer has expired are strictly
            disallowed.
          </p>

          <h3 className="text-xs font-black text-foreground uppercase tracking-wider">
            3. Actual Valuation vs. Bid Approval
          </h3>
          <p>
            Vehicles are displayed with a base price mapped from certified
            inspector valuations. If a bid meets or exceeds the baseline
            threshold, the auction state converts to "Sold Out" on approval, and
            checkout processes are generated.
          </p>

          <h3 className="text-xs font-black text-foreground uppercase tracking-wider">
            4. User Account Verification
          </h3>
          <p>
            Dealers registered through bulk Excel import sheets must verify
            their physical location coordinates (address, area, and city) prior
            to placing bids on high-value asset telemetry listings.
          </p>
        </div>
      </div>
    </section>
  );
}
