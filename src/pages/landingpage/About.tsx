import { ShieldCheck, Award, Users, Sparkles, Building2, Zap, CheckCircle2 } from "lucide-react";

export function About() {
  return (
    <section className="py-10 sm:py-16 bg-background animate-rise relative overflow-hidden text-foreground">
      {/* Decorative Ambient Lighting Spheres */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-[#FFC700]/10 dark:bg-[#FFC700]/15 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="mx-auto max-w-3xl px-4 sm:px-6 relative z-10">
        
        {/* Section Hero Header */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#FFC700]/40 bg-[#FFC700]/15 text-xs font-extrabold text-[#FFC700] mb-3 shadow-sm uppercase tracking-wider">
            <Sparkles className="size-3.5" /> Established B2B Remarketing Platform
          </div>
          
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-foreground">
            About Caryanam Bidding
          </h1>
          
          <p className="mt-2 text-xs font-bold text-muted-foreground tracking-widest uppercase">
            India's Premier Used Car Inspection & Live Dealer Auction Infrastructure
          </p>
        </div>

        {/* Company Overview Hero Card */}
        <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 mb-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FFC700] via-amber-400 to-[#FFD633]" />
          
          <div className="flex items-start gap-4">
            <div className="size-11 rounded-xl bg-[#FFC700]/15 border border-[#FFC700]/30 flex items-center justify-center text-[#FFC700] shrink-0 mt-0.5">
              <Building2 className="size-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-foreground tracking-tight mb-1">
                Caryanam India Pvt. Ltd.
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground font-semibold leading-relaxed">
                Caryanam Bidding is a technology-driven vehicle remarketing and digital evaluation platform connecting certified automobile inspectors, auction managers, and verified pre-owned car dealers across India.
              </p>
            </div>
          </div>
        </div>

        {/* Mission Statement Banner */}
        <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 mb-6 shadow-sm">
          <p className="text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed">
            Our mission is to bring absolute transparency, standardized evaluation benchmarks, and sub-second bidding speed to pre-owned vehicle auctions. By pairing 140+ point digital inspection reports with real-time live auctions, Caryanam empowers dealers to acquire inventory with complete confidence.
          </p>
        </div>

        {/* 2 Key Feature Cards */}
        <div className="grid gap-4 sm:grid-cols-2 mb-6">
          
          {/* Card 1: 140+ Point Inspection Quality */}
          <div className="p-5 border border-border/80 bg-card rounded-2xl flex flex-col gap-3 shadow-sm hover:border-[#FFC700]/40 transition-colors">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-[#FFC700]/15 text-[#FFC700] flex items-center justify-center shrink-0 border border-[#FFC700]/30">
                <ShieldCheck className="size-5" />
              </div>
              <h3 className="text-xs sm:text-sm font-extrabold text-foreground uppercase tracking-wider">
                140+ Point Inspection Quality
              </h3>
            </div>
            <p className="text-xs text-muted-foreground font-medium leading-relaxed">
              Certified inspectors evaluate exterior body panels, engine mechanics, electrical systems, OBD scanner codes, tyre tread wear, and legal documentation with mandatory photo proof.
            </p>
          </div>

          {/* Card 2: Sub-Second Live Auction Engine */}
          <div className="p-5 border border-border/80 bg-card rounded-2xl flex flex-col gap-3 shadow-sm hover:border-[#FFC700]/40 transition-colors">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-[#FFC700]/15 text-[#FFC700] flex items-center justify-center shrink-0 border border-[#FFC700]/30">
                <Zap className="size-5" />
              </div>
              <h3 className="text-xs sm:text-sm font-extrabold text-foreground uppercase tracking-wider">
                Sub-Second Live Auction Engine
              </h3>
            </div>
            <p className="text-xs text-muted-foreground font-medium leading-relaxed">
              Powers 10-minute live auctions with sub-second bid synchronization, countdown timers, and immediate winner determination across dealer devices.
            </p>
          </div>

        </div>

        {/* Bottom Callout Banner */}
        <div className="rounded-2xl border border-[#FFC700]/30 bg-[#FFC700]/10 p-5 sm:p-6 space-y-2 relative overflow-hidden">
          <div className="flex items-center gap-2.5">
            <Users className="size-5 text-[#FFC700] shrink-0" />
            <h3 className="text-xs sm:text-sm font-extrabold text-foreground uppercase tracking-wider">
              Unified B2B Auction Ecosystem
            </h3>
          </div>
          <p className="text-xs text-muted-foreground font-medium leading-relaxed">
            Whether sourcing pre-owned inventory, conducting 140+ point evaluations, or managing live auction rooms, Caryanam Bidding provides a high-fidelity workspace engineered for performance.
          </p>
        </div>

      </div>
    </section>
  );
}

