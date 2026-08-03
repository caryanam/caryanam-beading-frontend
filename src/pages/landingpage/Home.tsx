import { ArrowRight, Zap, ClipboardCheck, Award } from "lucide-react";
import authImage from "@/assets/auth-inspection.jpg";

interface HomeProps {
  onNavigateToAuth: (mode: "login" | "signup") => void;
  onNavigateToWhy: () => void;
}

export function Home({ onNavigateToAuth, onNavigateToWhy }: HomeProps) {
  return (
    <div className="flex flex-col animate-rise">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#0D0E12] text-white py-24 sm:py-32">
        <div className="absolute inset-0 z-0">
          <img
            src={authImage}
            alt="High value car inspection bay overview"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0D0E12] via-[#0D0E12]/80 to-transparent" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
          <div className="max-w-2xl text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#FFC700]/30 bg-[#FFC700]/10 px-4 py-1.5 text-xs font-extrabold text-[#FFC700] mb-6 shadow-sm">
              Verified Vehicle Auction & Bidding
            </div>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-none text-white">
              Corporate Vehicle Remarketing{" "}
              <span className="text-[#FFC700] block mt-2">
                Perfected at Scale.
              </span>
            </h1>
            <p className="mt-6 text-sm sm:text-base leading-relaxed text-zinc-300 font-medium max-w-lg">
              Real-time WebSocket bidding engine, 200-point certifiable digital
              inspections, and verified buyer authentication for dealers and
              aggregators.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <button
                onClick={() => onNavigateToAuth("login")}
                className="rounded-xl bg-[#FFC700] hover:bg-[#FFD633] text-[#0D0E12] px-6 py-3.5 text-xs font-black shadow-[0_4px_20px_rgba(255,199,0,0.35)] transition-all flex items-center gap-2 cursor-pointer"
              >
                Bidding Workspace <ArrowRight className="size-4" />
              </button>
              <button
                onClick={onNavigateToWhy}
                className="rounded-xl border border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800 text-white px-6 py-3.5 text-xs font-bold transition-all cursor-pointer"
              >
                How Bidding Works
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Metrics */}
      <section className="bg-secondary/30 border-y border-border/60 py-10">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { val: "18,400+", label: "Verified Vehicles" },
              { val: "1,260", label: "Registered Dealerships" },
              { val: "₹840Cr", label: "Total Valuation Traded" },
              { val: "99.8%", label: "Inspection Authenticity" },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <p className="text-2xl sm:text-3xl font-black text-[#FFC700] tracking-tight">
                  {stat.val}
                </p>
                <p className="text-[10px] sm:text-xs font-extrabold text-muted-foreground uppercase tracking-widest">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Spotlight */}
      <section className="py-20 bg-background">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-extrabold tracking-[0.25em] text-[#FFC700] uppercase mb-3">
              Enterprise Suite
            </h2>
            <p className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
              Next-Generation Vehicle Liquidation
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: ClipboardCheck,
                title: "200-Point Wizard",
                desc: "Inspectors utilize standardized tools to measure mechanical fluid, tyre tread wear, and upload detailed sheet metal panel images.",
              },
              {
                icon: Zap,
                title: "WebSocket Telemetry",
                desc: "Sub-second bid updates, ticking live timers, and active room logs synchronize automatically across screens without refreshing.",
              },
              {
                icon: Award,
                title: "Verified Authenticity",
                desc: "Complete database integrity. Registration logs, bid entries, and wishlist preferences are fully stored and verified.",
              },
            ].map((feat, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-border bg-card p-6 shadow-soft hover:border-[#FFC700]/40 transition-colors"
              >
                <span className="grid size-11 place-items-center rounded-xl bg-[#FFC700]/10 text-[#FFC700] mb-5">
                  <feat.icon className="size-5.5" />
                </span>
                <h3 className="text-sm font-black text-foreground mb-2.5">
                  {feat.title}
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground font-medium">
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
