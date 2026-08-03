import { Shield } from "lucide-react";

export function Privacy() {
  return (
    <section className="py-20 bg-background animate-rise">
      <div className="mx-auto max-w-4xl px-6">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground flex items-center justify-center gap-3">
            <Shield className="size-8 text-[#FFC700]" /> Privacy Policy
          </h1>
          <p className="mt-3 text-xs font-bold text-[#FFC700] tracking-widest uppercase">
            Data Protection & Dealer Anonymity Parameters
          </p>
        </div>

        <div className="prose prose-zinc text-xs sm:text-sm text-muted-foreground leading-relaxed font-medium space-y-6">
          <h3 className="text-xs font-black text-foreground uppercase tracking-wider">
            1. Information We Collect
          </h3>
          <p>
            To register a dealership profile, we collect dealership names, owner
            names, verifiable physical addresses, work email addresses, and
            active mobile contact numbers. For inspectors, full names and
            verification credentials are collected. No credit card information
            is processed directly on our servers.
          </p>

          <h3 className="text-xs font-black text-foreground uppercase tracking-wider">
            2. Bidding and Telemetry Logs
          </h3>
          <p>
            Bid history logs, timestamps, active room interactions, and
            wishlists are fully mapped to your dealer account inside our
            relational databases. We do not use browser tracking or cache
            bidding arrays in local storage, guaranteeing data recovery on page
            refresh.
          </p>

          <h3 className="text-xs font-black text-foreground uppercase tracking-wider">
            3. Sharing Constraints
          </h3>
          <p>
            Your dealership name is kept anonymous during active live bidding
            rooms. The highest bid is broadcasted publicly to active room
            participants, but individual dealer names are only visible to the
            system administrator for legal verification and audit purposes.
          </p>

          <h3 className="text-xs font-black text-foreground uppercase tracking-wider">
            4. Data Erasure
          </h3>
          <p>
            Dealers can request temporary deactivation or complete profile
            erasure by routing a ticket through our official support channel at{" "}
            <strong>operations@caryanam.com</strong>.
          </p>
        </div>
      </div>
    </section>
  );
}
