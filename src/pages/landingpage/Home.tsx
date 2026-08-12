import { ArrowRight, Zap, ClipboardCheck, Award, ShieldCheck } from "lucide-react";
import authImage from "@/assets/auth-inspection.jpg";

interface HomeProps {
  onNavigateToAuth: (mode: "login" | "signup") => void;
  onNavigateToWhy: () => void;
}

export function Home({ onNavigateToAuth, onNavigateToWhy }: HomeProps) {
  return (
    <div className="flex flex-col animate-rise">
      {/* Hero Banner Section */}
      <section className="relative overflow-hidden bg-[#0D0E12] text-white py-16 sm:py-24 min-h-[calc(100vh-5rem)] flex flex-col justify-center">
        <div className="absolute inset-0 z-0">
          <img
            src="/hero-car.png"
            alt="Luxury B2B Vehicle Auction"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0D0E12] via-[#0D0E12]/85 to-transparent" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8 w-full">
          <div className="max-w-4xl text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#FFC700]/40 bg-[#FFC700]/15 px-4 py-1.5 text-sm font-black text-[#FFC700] mb-5 shadow-sm">
              <ShieldCheck className="size-4.5" /> India's Premier B2B Car Bidding Platform
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight lg:leading-[1.12] text-white">
              Certified Used Car Auctions{" "}
              <span className="text-[#FFC700] block mt-1.5">
                Built For Dealer Growth.
              </span>
            </h1>
            <p className="mt-6 text-base sm:text-lg lg:text-xl leading-relaxed text-zinc-300 font-medium max-w-3xl">
              Access 140+ point digital inspection reports, participate in real-time 10-minute live auctions, and acquire pre-owned vehicles with complete transparency.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <button
                onClick={() => onNavigateToAuth("login")}
                className="rounded-2xl bg-[#FFC700] hover:bg-[#FFD633] text-[#0D0E12] px-7 py-4 text-base font-black shadow-[0_4px_24px_rgba(255,199,0,0.35)] hover:shadow-[0_6px_28px_rgba(255,199,0,0.45)] transition-all flex items-center gap-2.5 cursor-pointer"
              >
                Enter Bidding Portal <ArrowRight className="size-5" />
              </button>
              <button
                onClick={onNavigateToWhy}
                className="rounded-2xl border border-zinc-700 bg-zinc-900/60 hover:bg-zinc-800 text-white px-7 py-4 text-base font-extrabold transition-all cursor-pointer"
              >
                Why Caryanam Bidding
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Telemetry Bar */}
      <section className="bg-secondary/30 border-y border-border/60 py-8">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { val: "25,000+", label: "Inspected Vehicles" },
              { val: "1,500+", label: "Verified Dealers" },
              { val: "10-Min", label: "Live Auction Windows" },
              { val: "100%", label: "Inspection Authenticity" },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <p className="text-3xl sm:text-4xl font-black text-[#FFC700] tracking-tight">
                  {stat.val}
                </p>
                <p className="text-xs sm:text-sm font-extrabold text-muted-foreground uppercase tracking-wider">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Platform Pillars Spotlight */}
      <section className="py-16 sm:py-20 bg-background">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-sm font-black tracking-[0.25em] text-[#FFC700] uppercase mb-2.5">
              Platform Innovations
            </h2>
            <p className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
              Everything Needed for Seamless Vehicle Bidding
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: ClipboardCheck,
                title: "140+ Point Digital Inspections",
                desc: "Certified evaluations covering exterior body panels, engine mechanics, electrical systems, OBD diagnostics, tyre tread depths, and mandatory photo proof.",
              },
              {
                icon: Zap,
                title: "Real-Time WebSocket Bidding",
                desc: "Sub-second bid synchronization with live countdown timers, bid increment controls, and instant leaderboards across all dealer screens.",
              },
              {
                icon: Award,
                title: "Verified Winner Logs & Transparency",
                desc: "Complete transparency with verified winner records, bid histories, and structured admin approval workflows.",
              },
            ].map((feat, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-border bg-card p-6 shadow-soft hover:border-[#FFC700]/40 transition-all group"
              >
                <span className="grid size-12 place-items-center rounded-2xl bg-[#FFC700]/15 text-[#FFC700] mb-5 border border-[#FFC700]/30 group-hover:scale-105 transition-transform">
                  <feat.icon className="size-6" />
                </span>
                <h3 className="text-base sm:text-lg font-black text-foreground mb-2.5">
                  {feat.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground font-medium">
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
