import { ShieldCheck, Zap, Trophy, Lock, Sparkles, CheckCircle2 } from "lucide-react";

export function WhyChoose() {
  return (
    <section className="py-14 sm:py-20 bg-background animate-rise">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">

        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#FFC700]/40 bg-[#FFC700]/15 text-sm font-black text-[#FFC700] mb-3 shadow-sm">
            <Sparkles className="size-4" /> Core Platform Advantages
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
            Why Choose Caryanam Bidding
          </h1>
          <p className="mt-2 text-sm font-extrabold text-muted-foreground tracking-wider uppercase">
            Engineered For High-Fidelity Automobile Liquidation
          </p>
        </div>

        {/* 4 Advantage Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {[
            {
              icon: ShieldCheck,
              title: "140+ Point Certified Inspections",
              desc: "Every vehicle undergoes rigorous evaluation covering body panels, engine diagnostics, electrical systems, tyres, and documentation with mandatory high-resolution photo evidence.",
            },
            {
              icon: Zap,
              title: "Sub-Second WebSocket Live Bids",
              desc: "Our real-time bidding server synchronizes bids, active room logs, and live 10-minute auction countdown timers instantaneously across all connected dealer devices.",
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
              className="p-6 border border-border bg-card rounded-2xl flex flex-col gap-3.5 shadow-soft hover:border-[#FFC700]/40 transition-all group"
            >
              <div className="flex items-center gap-3.5">
                <span className="flex size-11 items-center justify-center rounded-xl bg-[#FFC700]/15 text-[#FFC700] shrink-0 border border-[#FFC700]/30 group-hover:scale-105 transition-transform">
                  <item.icon className="size-5.5" />
                </span>
                <h3 className="text-sm sm:text-base font-black text-foreground uppercase tracking-wide">
                  {item.title}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom Trust Banner */}
        <div className="mt-8 p-6 border border-[#FFC700]/40 bg-[#FFC700]/5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <span className="flex size-10 items-center justify-center rounded-xl bg-[#FFC700] text-[#0D0E12] font-black shrink-0">
              <CheckCircle2 className="size-5" />
            </span>
            <div>
              <p className="text-sm sm:text-base font-black text-foreground uppercase tracking-wider">
                Built For Performance & Reliability
              </p>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                Trusted by 1,500+ verified dealerships and certified automotive inspectors across India.
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
