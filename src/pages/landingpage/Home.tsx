import { ArrowRight, Zap, ClipboardCheck, Award, ShieldCheck, Download, Smartphone, Sparkles, Shield, Radio, CheckCircle2, Menu, Bell, RefreshCw, Trophy, Car, Heart, ChevronRight, Store, TrendingUp } from "lucide-react";

interface HomeProps {
  onNavigateToAuth: (mode: "login" | "signup") => void;
  onNavigateToWhy: () => void;
}

export function Home({ onNavigateToAuth, onNavigateToWhy }: HomeProps) {
  const apkDownloadUrl = "https://github.com/caryanam/caryanam-beading-apk/releases/download/v1/CaryanamBidding.apk";

  return (
    <div className="flex flex-col animate-rise overflow-x-hidden">
      {/* Hero Banner Section */}
      <section className="relative overflow-hidden bg-[#0D0E12] text-white py-12 sm:py-16 md:py-20 lg:py-28 min-h-[calc(100vh-5rem)] flex flex-col justify-center">
        {/* Ambient Lighting Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[280px] xs:w-[450px] sm:w-[600px] md:w-[700px] h-[200px] sm:h-[300px] md:h-[400px] bg-[#FFC700]/10 rounded-full blur-[100px] sm:blur-[140px] pointer-events-none z-10" />

        <div className="absolute inset-0 z-0">
          <img
            src="/hero-car.png"
            alt="Luxury B2B Vehicle Auction"
            className="w-full h-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0D0E12] via-[#0D0E12]/90 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D0E12] via-transparent to-transparent" />
        </div>

        <div className="relative z-20 mx-auto max-w-7xl px-4 sm:px-6 md:px-8 lg:px-8 w-full">
          <div className="max-w-3xl md:max-w-4xl text-left">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-[#FFC700]/40 bg-[#FFC700]/15 px-3 sm:px-3.5 py-1 text-[11px] xs:text-xs sm:text-sm font-extrabold text-[#FFC700] mb-4 sm:mb-5 shadow-sm uppercase tracking-wider max-w-full flex-wrap">
              <ShieldCheck className="size-3.5 sm:size-4 shrink-0 text-[#FFC700]" />
              <span>India's Premier B2B Car Bidding Platform</span>
            </div>

            <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight md:leading-[1.1] text-white">
              Certified Used Car Auctions{" "}
              <span className="text-[#FFC700] block mt-1 sm:mt-1.5">
                Built For Dealer Growth.
              </span>
            </h1>

            <p className="mt-4 sm:mt-5 text-xs xs:text-sm sm:text-base lg:text-lg leading-relaxed text-zinc-300 font-medium max-w-2xl md:max-w-3xl">
              Access 140+ point digital inspection reports, participate in real-time 10-minute live auctions, and acquire pre-owned vehicles with complete transparency.
            </p>

            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row md:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-3.5 w-full">
              <button
                onClick={() => onNavigateToAuth("login")}
                className="w-full sm:w-auto rounded-xl bg-[#FFC700] hover:bg-[#FFD633] text-[#0D0E12] px-5 sm:px-6 py-3 sm:py-3.5 text-xs sm:text-sm font-black uppercase tracking-wider shadow-[0_4px_24px_rgba(255,199,0,0.35)] hover:shadow-[0_6px_28px_rgba(255,199,0,0.45)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer text-center"
              >
                <span>Enter Bidding Portal</span>
                <ArrowRight className="size-4 shrink-0" />
              </button>

              <button
                onClick={onNavigateToWhy}
                className="w-full sm:w-auto rounded-xl border border-zinc-700/80 bg-zinc-900/80 hover:bg-zinc-800 text-white px-5 sm:px-6 py-3 sm:py-3.5 text-xs sm:text-sm font-extrabold tracking-wide transition-all cursor-pointer text-center"
              >
                Why Caryanam Bidding
              </button>

              <a
                href={apkDownloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto rounded-xl border border-[#FFC700]/40 bg-[#FFC700]/10 hover:bg-[#FFC700]/20 text-[#FFC700] px-4 sm:px-5 py-3 sm:py-3.5 text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm text-center"
              >
                <Smartphone className="size-4 text-[#FFC700] shrink-0" />
                <span>Download Android App</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Telemetry Bar */}
      <section className="bg-card border-y border-border/70 py-6 sm:py-8 md:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 text-center">
            {[
              { val: "25,000+", label: "Inspected Vehicles" },
              { val: "1,500+", label: "Verified Dealers" },
              { val: "10-Min", label: "Live Auction Windows" },
              { val: "100%", label: "Inspection Authenticity" },
            ].map((stat, i) => (
              <div
                key={i}
                className="flex flex-col gap-1 p-3 sm:p-4 rounded-xl border border-border/40 md:border-r md:border-border/50 md:last:border-r-0 md:rounded-none md:border-b-0 md:border-t-0 md:border-l-0 bg-card/60 md:bg-transparent"
              >
                <p className="text-xl xs:text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-black text-[#FFC700] tracking-tight">
                  {stat.val}
                </p>
                <p className="text-[10px] sm:text-xs font-extrabold text-muted-foreground uppercase tracking-wider">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Platform Pillars Spotlight */}
      <section className="py-10 sm:py-14 md:py-18 lg:py-20 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#FFC700]/40 bg-[#FFC700]/15 text-[11px] sm:text-xs font-extrabold text-[#FFC700] mb-3 shadow-sm uppercase tracking-wider">
              <Sparkles className="size-3.5" />
              <span>Platform Innovations</span>
            </div>

            <h2 className="text-xl xs:text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-black tracking-tight text-foreground px-2">
              Everything Needed for Seamless Vehicle Bidding
            </h2>
          </div>

          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-3">
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
                className="rounded-2xl border border-border/80 bg-card p-5 md:p-6 lg:p-7 shadow-sm hover:border-[#FFC700]/40 transition-colors group flex flex-col justify-between"
              >
                <div>
                  <div className="size-10 sm:size-11 place-items-center rounded-xl bg-[#FFC700]/15 text-[#FFC700] mb-3.5 sm:mb-4 border border-[#FFC700]/30 flex items-center justify-center">
                    <feat.icon className="size-5" />
                  </div>
                  <h3 className="text-xs sm:text-sm md:text-base font-extrabold text-foreground uppercase tracking-wider mb-2">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compact Light Theme Mobile App Download Section */}
      <section className="relative py-10 sm:py-14 md:py-16 lg:py-18 bg-secondary/30 text-foreground border-t border-border/70 overflow-hidden">
        {/* Background Ambient Glows */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 -translate-x-1/2 size-48 sm:size-72 rounded-full bg-[#FFC700]/10 blur-[80px] sm:blur-[100px] pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 md:px-8 lg:px-8">
          <div className="grid gap-8 sm:gap-10 md:gap-8 lg:grid-cols-12 md:grid-cols-12 items-center">

            {/* Left Content Column */}
            <div className="md:col-span-7 lg:col-span-7 text-left space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#FFC700]/40 bg-[#FFC700]/15 px-3 py-1 text-[11px] sm:text-xs font-black text-[#FFC700] shadow-sm max-w-full flex-wrap">
                <Smartphone className="size-3.5 text-[#FFC700] shrink-0" />
                <span className="truncate">Caryanam Mobile Bidding App v1.0</span>
                <span className="flex h-2 w-2 relative shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFC700] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FFC700]" />
                </span>
              </div>

              <h2 className="text-xl xs:text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-black tracking-tight leading-tight text-foreground">
                Find Your Next Deal{" "}
                <span className="text-[#FFC700] block mt-0.5 sm:mt-1">
                  Faster With Our Mobile App.
                </span>
              </h2>

              <p className="text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed max-w-xl">
                Browse verified listings, connect directly with trusted dealers, and manage your vehicle bidding journey anytime, anywhere. Experience sub-second live auctions, instant bid alerts, and zero brokerage.
              </p>

              {/* Enhanced Interactive Feature List Cards */}
              <div className="grid gap-2.5 grid-cols-1 sm:grid-cols-3 md:grid-cols-3 pt-1">
                {[
                  {
                    title: "Instant Alerts",
                    subtitle: "Real-time live notifications",
                    icon: Zap,
                  },
                  {
                    title: "Direct Reports",
                    subtitle: "140+ point evaluation access",
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
                    className="rounded-xl border border-border/80 bg-card p-3 shadow-sm hover:border-[#FFC700]/60 transition-all group flex flex-row sm:flex-col items-center sm:items-start gap-3 sm:gap-0"
                  >
                    <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#FFC700]/15 text-[#FFC700] sm:mb-2 border border-[#FFC700]/30 group-hover:scale-105 transition-transform">
                      <item.icon className="size-3.5" />
                    </span>
                    <div>
                      <h4 className="text-xs font-black text-foreground uppercase tracking-wide">{item.title}</h4>
                      <p className="text-[10px] font-semibold text-muted-foreground mt-0.5 leading-snug">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Call-to-action Action Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2">
                <a
                  href={apkDownloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#FFC700] hover:bg-[#FFD633] text-[#0D0E12] px-6 py-3 text-xs font-black tracking-wider uppercase shadow-[0_4px_20px_rgba(255,199,0,0.35)] hover:shadow-[0_6px_28px_rgba(255,199,0,0.5)] hover:scale-[1.02] active:scale-95 transition-all cursor-pointer group shrink-0 text-center"
                >
                  <Download className="size-4 group-hover:translate-y-0.5 transition-transform shrink-0" />
                  <span>DOWNLOAD FOR ANDROID</span>
                </a>

                <div className="flex items-center justify-center sm:justify-start gap-1.5 text-[11px] font-extrabold text-muted-foreground">
                  <CheckCircle2 className="size-3.5 text-[#FFC700] shrink-0" />
                  <span>Verified Safe APK • Direct Download</span>
                </div>
              </div>
            </div>

            {/* Right Phone Mockup Compact Presentation Column */}
            <div className="md:col-span-5 lg:col-span-5 flex justify-center md:justify-end relative pt-4 md:pt-0 px-2 sm:px-4">

              {/* Backlight Yellow Glow Effect */}
              <div className="absolute -inset-3 rounded-[40px] bg-gradient-to-tr from-[#FFC700]/25 via-amber-300/20 to-transparent blur-2xl opacity-80 pointer-events-none" />

              {/* Floating Glass Badge 1 - Left Top */}
              <div className="absolute -left-2 sm:-left-4 md:-left-6 lg:-left-6 top-8 z-30 hidden sm:flex md:flex items-center gap-2 rounded-xl border border-border/90 bg-card/95 p-2 shadow-lg backdrop-blur-xl">
                <div className="grid size-6 place-items-center rounded-lg bg-emerald-500/15 text-emerald-500 shrink-0">
                  <Radio className="size-3 animate-pulse" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-muted-foreground uppercase">WebSocket Live</p>
                  <p className="text-[10px] font-extrabold text-foreground">Sub-Second Bidding</p>
                </div>
              </div>

              {/* Floating Glass Badge 2 - Right Bottom */}
              <div className="absolute -right-2 sm:-right-4 md:-right-6 lg:-right-6 bottom-6 z-30 hidden sm:flex md:flex items-center gap-2 rounded-xl border border-[#FFC700]/50 bg-card/95 p-2 shadow-lg backdrop-blur-xl">
                <div className="grid size-6 place-items-center rounded-lg bg-[#FFC700]/20 text-[#FFC700] shrink-0">
                  <Trophy className="size-3 text-[#FFC700]" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-muted-foreground uppercase">Rating</p>
                  <p className="text-[10px] font-extrabold text-[#FFC700]">4.9 ⭐ (1.5k+)</p>
                </div>
              </div>

              {/* Smartphone Chassis - Compact Realistic App Presentation */}
              <div className="relative w-full max-w-[240px] xs:max-w-[260px] sm:max-w-[270px] md:max-w-[250px] lg:max-w-[290px] aspect-[9/17.5] rounded-[42px] border-[8px] border-[#0D0E12] bg-[#0A0B0E] text-white shadow-[0_25px_50px_-12px_rgba(0,0,0,0.35)] ring-1 ring-slate-800 overflow-hidden flex flex-col justify-between z-20 mx-auto md:mr-0">

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
                      <span className="absolute -top-1 -right-1 bg-[#FFC700] text-[#0D0E12] text-[8px] font-black rounded-full px-1">42</span>
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
                    <button className="mt-2.5 w-full rounded-xl bg-[#FFC700] hover:bg-[#FFD633] py-1.5 text-[10px] font-black text-[#0D0E12] flex items-center justify-center gap-1 shadow-sm transition-colors uppercase cursor-pointer">
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
                        <Zap className="size-3" />
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







