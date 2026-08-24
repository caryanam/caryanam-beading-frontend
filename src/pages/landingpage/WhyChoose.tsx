import { ShieldCheck, Zap, Trophy, Lock, Sparkles, CheckCircle2, Building2 } from "lucide-react";

export function WhyChoose() {
  return (
    <section className="py-10 sm:py-16 bg-background animate-rise relative overflow-hidden text-foreground">
      {/* Decorative Ambient Lighting Spheres */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-[#FFC700]/10 dark:bg-[#FFC700]/15 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="mx-auto max-w-3xl px-4 sm:px-6 relative z-10">
        
        {/* Section Hero Header */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#FFC700]/40 bg-[#FFC700]/15 text-xs font-extrabold text-[#FFC700] mb-3 shadow-sm uppercase tracking-wider">
            <Sparkles className="size-3.5" /> Core Platform Advantages
          </div>
          
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-foreground">
            Why Choose Caryanam Bidding
          </h1>
          
          <p className="mt-2 text-xs font-bold text-muted-foreground tracking-widest uppercase">
            Engineered For High-Fidelity Automobile Liquidation
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
              <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                Empowering pre-owned car dealers and certified inspectors with transparent evaluation data, sub-second bidding speed, and verified auction telemetry.
              </p>
            </div>
          </div>
        </div>

        {/* 4 Advantage Cards */}
        <div className="grid gap-4 sm:grid-cols-2 mb-6">
          {[
            {
              icon: ShieldCheck,
              title: "140+ Point Certified Inspections",
              desc: "Every vehicle undergoes evaluation covering body panels, engine diagnostics, electrical systems, tyres, and documentation with photo evidence.",
            },
            {
              icon: Zap,
              title: "Sub-Second WebSocket Live Bids",
              desc: "Our real-time bidding server synchronizes bids, active room logs, and live 10-minute auction countdown timers instantaneously.",
            },
            {
              icon: Trophy,
              title: "Transparent Winners & Bid Logs",
              desc: "Complete transparency with verified auction winner records, total bid counts, and detailed bid history logs stored securely.",
            },
            {
              icon: Lock,
              title: "Verified Dealer Authentication",
              desc: "Only verified dealer accounts can participate in live auctions, ensuring a secure and credible bidding environment for all partners.",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-5 border border-border/80 bg-card rounded-2xl flex flex-col gap-3 shadow-sm hover:border-[#FFC700]/40 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-[#FFC700]/15 text-[#FFC700] flex items-center justify-center shrink-0 border border-[#FFC700]/30">
                  <item.icon className="size-5" />
                </div>
                <h3 className="text-xs sm:text-sm font-extrabold text-foreground uppercase tracking-wider">
                  {item.title}
                </h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom Trust Banner */}
        <div className="rounded-2xl border border-[#FFC700]/30 bg-[#FFC700]/10 p-5 sm:p-6 space-y-2 relative overflow-hidden">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="size-5 text-[#FFC700] shrink-0" />
            <h3 className="text-xs sm:text-sm font-extrabold text-foreground uppercase tracking-wider">
              Built For Performance & Reliability
            </h3>
          </div>
          <p className="text-xs text-muted-foreground font-medium leading-relaxed">
            Trusted by verified dealerships and certified automotive inspectors across India.
          </p>
        </div>

      </div>
    </section>
  );
}

