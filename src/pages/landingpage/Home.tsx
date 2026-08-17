import { ArrowRight, Zap, ClipboardCheck, Award, ShieldCheck, Check, Download, Smartphone, Layers, Users, Gavel, User, Star, Sparkles, Shield, Radio, CheckCircle2, Menu, Bell, RefreshCw, Trophy, Car, Heart, ChevronRight, Store, TrendingUp } from "lucide-react";
import authImage from "@/assets/auth-inspection.jpg";

interface HomeProps {
  onNavigateToAuth: (mode: "login" | "signup") => void;
  onNavigateToWhy: () => void;
}

export function Home({ onNavigateToAuth, onNavigateToWhy }: HomeProps) {
  const apkDownloadUrl = "https://github.com/caryanam/caryanam-beading-apk/releases/download/v1/CaryanamBidding.apk";

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
              <a
                href={apkDownloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-2xl border border-[#FFC700]/40 bg-[#FFC700]/10 hover:bg-[#FFC700]/20 text-[#FFC700] px-6 py-4 text-base font-extrabold transition-all flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Smartphone className="size-5 text-[#FFC700]" /> Download Android App
              </a>
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

      {/* Compact Light Theme Mobile App Download Section (Exact Caryanam Dealer App Mockup) */}
      <section className="relative py-10 sm:py-14 bg-[#F8F9FA] text-slate-900 border-t border-slate-200 overflow-hidden">
        {/* Background Subtle Yellow Ambient Lighting */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 -translate-x-1/2 size-72 rounded-full bg-[#FFC700]/15 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-10 size-60 rounded-full bg-amber-300/20 blur-[90px] pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-12 items-center">

            {/* Left Content Column */}
            <div className="lg:col-span-7 text-left space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#FFC700]/50 bg-[#FFC700]/15 px-3.5 py-1 text-xs font-black text-[#B38900] shadow-sm backdrop-blur-md">
                <Smartphone className="size-3.5 text-[#B38900]" />
                <span>Caryanam Mobile Bidding App v1.0</span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFC700] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FFC700]" />
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight text-slate-900">
                Find Your Dream Car{" "}
                <span className="bg-gradient-to-r from-[#D9A700] via-[#FFC700] to-[#E6B200] bg-clip-text text-transparent block mt-0.5">
                  Faster With Our Mobile App.
                </span>
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed max-w-xl">
                Browse verified listings, connect directly with trusted dealers, and manage your car buying journey anytime, anywhere. Experience sub-second live auctions, instant bid alerts, and zero brokerage.
              </p>

              {/* Enhanced Interactive Feature List Cards */}
              <div className="grid gap-2.5 sm:grid-cols-3 pt-1">
                {[
                  {
                    title: "Instant Alerts",
                    subtitle: "Real-time live notifications",
                    icon: Zap,
                  },
                  {
                    title: "Direct Dealer Chat",
                    subtitle: "140+ point report access",
                    icon: Shield,
                  },
                  {
                    title: "Save & Compare",
                    subtitle: "Multi-vehicle tracking",
                    icon: Sparkles,
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm hover:shadow-md hover:border-[#FFC700]/60 transition-all group"
                  >
                    <span className="grid size-7 place-items-center rounded-lg bg-[#FFC700]/15 text-[#B38900] mb-2 border border-[#FFC700]/30 group-hover:scale-110 transition-transform">
                      <item.icon className="size-3.5" />
                    </span>
                    <h4 className="text-xs font-black text-slate-900">{item.title}</h4>
                    <p className="text-[10px] font-semibold text-slate-500 mt-0.5 leading-snug">
                      {item.subtitle}
                    </p>
                  </div>
                ))}
              </div>

              {/* Call-to-action Action Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2">
                <a
                  href={apkDownloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#FFC700] hover:bg-[#FFD633] text-[#0D0E12] px-6 py-3 text-xs font-black tracking-wider uppercase shadow-[0_4px_20px_rgba(255,199,0,0.35)] hover:shadow-[0_6px_28px_rgba(255,199,0,0.5)] hover:scale-105 transition-all cursor-pointer group shrink-0"
                >
                  <Download className="size-4 group-hover:translate-y-0.5 transition-transform" />
                  <span>DOWNLOAD FOR ANDROID</span>

                </a>

                <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-slate-600">
                  <CheckCircle2 className="size-3.5 text-[#B38900] shrink-0" />
                  <span>Verified Safe APK • Direct Download</span>
                </div>
              </div>
            </div>

            {/* Right Phone Mockup Compact Presentation Column (Exact Caryanam App Screen) */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end relative">

              {/* Backlight Yellow Glow Effect */}
              <div className="absolute -inset-3 rounded-[40px] bg-gradient-to-tr from-[#FFC700]/25 via-amber-300/20 to-transparent blur-2xl opacity-80 pointer-events-none" />

              {/* Floating Glass Badge 1 - Left Top */}
              <div className="absolute -left-4 top-8 z-30 hidden sm:flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white/95 p-2 shadow-lg backdrop-blur-xl animate-bounce duration-[3000ms]">
                <div className="grid size-6 place-items-center rounded-lg bg-emerald-500/15 text-emerald-600">
                  <Radio className="size-3 animate-pulse" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase">WebSocket Live</p>
                  <p className="text-[10px] font-extrabold text-slate-800">Sub-Second Bidding</p>
                </div>
              </div>

              {/* Floating Glass Badge 2 - Right Bottom */}
              <div className="absolute -right-2 bottom-6 z-30 hidden sm:flex items-center gap-2 rounded-xl border border-[#FFC700]/50 bg-white/95 p-2 shadow-lg backdrop-blur-xl">
                <div className="grid size-6 place-items-center rounded-lg bg-[#FFC700]/20 text-[#B38900]">
                  <Star className="size-3 fill-[#FFC700] text-[#FFC700]" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase">Rating</p>
                  <p className="text-[10px] font-extrabold text-[#B38900]">4.9 ⭐ (1.5k+)</p>
                </div>
              </div>

              {/* Smartphone Chassis - Compact Realistic App Presentation */}
              <div className="relative w-full max-w-[260px] sm:max-w-[280px] aspect-[9/17.5] rounded-[42px] border-[8px] border-[#0D0E12] bg-[#0A0B0E] text-white shadow-[0_25px_50px_-12px_rgba(0,0,0,0.35)] ring-1 ring-slate-800 overflow-hidden flex flex-col justify-between z-20">

                {/* Smartphone Dynamic Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-4.5 bg-[#0D0E12] rounded-b-xl z-40 flex items-center justify-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-900 border border-zinc-700" />
                  <div className="w-6 h-1 rounded-full bg-zinc-800" />
                </div>

                {/* Smartphone Top App Navigation Bar */}
                <div className="pt-6 px-3 pb-2 flex items-center justify-between border-b border-zinc-800/60 bg-[#0D0E12] text-xs font-bold text-white z-30 shrink-0">
                  <Menu className="size-4 text-zinc-300" />
                  <div className="flex items-center gap-1 text-[11px] font-black text-white">
                    <Store className="size-3.5 text-[#FFC700]" />
                    <span>Dealer</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Bell className="size-3.5 text-zinc-300" />
                      <span className="absolute -top-1 -right-1 bg.yellow-500 text-[#0D0E12] bg-[#FFC700] text-[8px] font-black rounded-full px-1">42</span>
                    </div>
                    <RefreshCw className="size-3.5 text-zinc-300" />
                  </div>
                </div>

                {/* Smartphone Screen Viewport - Exact Caryanam Dealer Mobile App UI */}
                <div className="p-3 flex-1 flex flex-col gap-2.5 overflow-y-auto no-scrollbar bg-[#0A0B0E] text-left">

                  {/* Yellow Welcome Banner Card */}
                  <div className="relative overflow-hidden rounded-2xl border border-[#FFC700]/30 bg-gradient-to-br from-[#161720] via-[#12131A] to-[#0D0E12] p-3 text-white shadow-md">
                    <div className="flex items-start gap-2.5">
                      <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-[#FFC700] text-[#0D0E12] shadow-sm">
                        <Zap className="size-4 fill-[#0D0E12]" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs font-black text-white truncate">
                          Welcome, Asif Attar
                        </h3>
                        <p className="text-[9px] font-medium text-zinc-400 mt-0.5 leading-snug">
                          Live Auctions Active · 0 Bidding Rooms Online · 2 Vehicles Inspected
                        </p>
                      </div>
                    </div>
                    <button className="mt-2.5 w-full rounded-xl bg-[#FFC700] hover:bg-[#FFD633] py-1.5 text-[10px] font-black text-[#0D0E12] flex items-center justify-center gap-1 shadow-sm transition-colors uppercase">
                      <span>EXPLORE MARKETPLACE</span>
                      <ChevronRight className="size-3" />
                    </button>
                  </div>

                  {/* 2x2 Metric Cards Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Live Bidding Rooms */}
                    <div className="rounded-xl border border-zinc-800/80 bg-[#12131A] p-2.5 flex flex-col justify-between">
                      <div className="grid size-6 place-items-center rounded-lg bg-emerald-500/20 text-emerald-400 mb-1.5">
                        <Zap className="size-3" />
                      </div>
                      <div>
                        <span className="text-sm font-black text-white block">0</span>
                        <span className="text-[9px] font-extrabold text-zinc-300 block">Live Bidding Rooms</span>
                        <div className="flex items-center gap-1 text-[8px] font-bold text-emerald-400 mt-0.5">
                          <TrendingUp className="size-2.5" />
                          <span>Active sessions</span>
                        </div>
                      </div>
                    </div>

                    {/* Auctions Won */}
                    <div className="rounded-xl border border-zinc-800/80 bg-[#12131A] p-2.5 flex flex-col justify-between">
                      <div className="grid size-6 place-items-center rounded-lg bg-[#FFC700]/20 text-[#FFC700] mb-1.5">
                        <Trophy className="size-3" />
                      </div>
                      <div>
                        <span className="text-sm font-black text-white block">1</span>
                        <span className="text-[9px] font-extrabold text-zinc-300 block">Auctions Won</span>
                        <div className="flex items-center gap-1 text-[8px] font-bold text-[#FFC700] mt-0.5">
                          <TrendingUp className="size-2.5" />
                          <span>Assigned won vehicles</span>
                        </div>
                      </div>
                    </div>

                    {/* Upcoming Auctions */}
                    <div className="rounded-xl border border-zinc-800/80 bg-[#12131A] p-2.5 flex flex-col justify-between">
                      <div className="grid size-6 place-items-center rounded-lg bg-blue-500/20 text-blue-400 mb-1.5">
                        <Car className="size-3" />
                      </div>
                      <div>
                        <span className="text-sm font-black text-white block">0</span>
                        <span className="text-[9px] font-extrabold text-zinc-300 block">Upcoming Auctions</span>
                        <div className="flex items-center gap-1 text-[8px] font-bold text-blue-400 mt-0.5">
                          <TrendingUp className="size-2.5" />
                          <span>Coming Soon rooms</span>
                        </div>
                      </div>
                    </div>

                    {/* My Bids Placed */}
                    <div className="rounded-xl border border-zinc-800/80 bg-[#12131A] p-2.5 flex flex-col justify-between">
                      <div className="grid size-6 place-items-center rounded-lg bg-purple-500/20 text-purple-400 mb-1.5">
                        <Gavel className="size-3" />
                      </div>
                      <div>
                        <span className="text-sm font-black text-white block">1</span>
                        <span className="text-[9px] font-extrabold text-zinc-300 block">My Bids Placed</span>
                        <div className="flex items-center gap-1 text-[8px] font-bold text-purple-400 mt-0.5">
                          <TrendingUp className="size-2.5" />
                          <span>Total active & past bids</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Watchlist Card */}
                  <div className="rounded-xl border border-zinc-800/80 bg-[#12131A] p-2.5">
                    <div className="grid size-6 place-items-center rounded-lg bg-rose-500/20 text-rose-400 mb-1.5">
                      <Heart className="size-3" />
                    </div>
                    <span className="text-sm font-black text-white block">1</span>
                    <span className="text-[9px] font-extrabold text-zinc-300 block">My Watchlist</span>
                    <div className="flex items-center gap-1 text-[8px] font-bold text-rose-400 mt-0.5">
                      <TrendingUp className="size-2.5" />
                      <span>Saved favourite vehicles</span>
                    </div>
                  </div>

                </div>

              </div>

            </div>

          </div>
        </div>
      </section>
    </div>
  );
}






