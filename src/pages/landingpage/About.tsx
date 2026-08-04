import { ShieldCheck, Award, Users, Sparkles } from "lucide-react";

export function About() {
  return (
    <section className="py-14 sm:py-20 bg-background animate-rise">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">

        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#FFC700]/40 bg-[#FFC700]/15 text-sm font-black text-[#FFC700] mb-3 shadow-sm">
            <Sparkles className="size-4" /> Established B2B Remarketing Platform
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
            About Caryanam Bidding
          </h1>
          <p className="mt-2 text-sm font-extrabold text-muted-foreground tracking-wider uppercase">
            India's Premier Used Car Inspection & Live Dealer Auction Infrastructure
          </p>
        </div>

        {/* Core Narrative */}
        <div className="space-y-6 text-sm sm:text-base text-muted-foreground leading-relaxed font-medium">
          <div className="p-6 border border-border bg-card rounded-2xl shadow-soft">
            <p className="text-base sm:text-lg text-foreground font-bold leading-snug">
              Caryanam Bidding is a technology-driven vehicle remarketing and digital evaluation platform connecting certified automobile inspectors, auction managers, and verified pre-owned car dealers across India.
            </p>
          </div>

          <p className="text-sm sm:text-base leading-relaxed px-1">
            Our mission is to bring absolute transparency, standardized evaluation benchmarks, and sub-second bidding speed to pre-owned vehicle auctions. By pairing 140+ point digital inspection reports with real-time WebSocket live auctions, Caryanam empowers dealers to acquire inventory with complete confidence.
          </p>

          {/* 2 Key Feature Cards */}
          <div className="grid gap-6 sm:grid-cols-2 pt-2">
            <div className="p-6 border border-border bg-card rounded-2xl flex flex-col gap-3 shadow-soft hover:border-[#FFC700]/40 transition-all">
              <span className="flex size-11 items-center justify-center rounded-xl bg-[#FFC700]/15 text-[#FFC700] shrink-0 border border-[#FFC700]/30">
                <ShieldCheck className="size-5.5" />
              </span>
              <h3 className="text-sm sm:text-base font-black text-foreground uppercase tracking-wider">
                140+ Point Inspection Quality
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Certified inspectors evaluate exterior body panels, engine mechanics, electrical systems, OBD scanner codes, tyre tread wear, and legal documentation with mandatory photo proof.
              </p>
            </div>

            <div className="p-6 border border-border bg-card rounded-2xl flex flex-col gap-3 shadow-soft hover:border-emerald-500/40 transition-all">
              <span className="flex size-11 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500 shrink-0 border border-emerald-500/30">
                <Award className="size-5.5" />
              </span>
              <h3 className="text-sm sm:text-base font-black text-foreground uppercase tracking-wider">
                Sub-Second Live Auction Engine
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Powers 10-minute live auctions with sub-second WebSocket bid synchronization, countdown timers, and immediate winner determination across dealer devices.
              </p>
            </div>
          </div>

          {/* Bottom Callout Banner */}
          <div className="rounded-2xl border border-[#FFC700]/40 bg-[#FFC700]/5 p-6 space-y-2.5">
            <h3 className="text-sm sm:text-base font-black text-foreground uppercase tracking-wider flex items-center gap-2">
              <Users className="size-5 text-[#FFC700]" /> Unified B2B Auction Ecosystem
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Whether sourcing pre-owned inventory, conducting 140+ point evaluations, or managing live auction rooms, Caryanam Bidding provides a high-fidelity workspace engineered for performance.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
