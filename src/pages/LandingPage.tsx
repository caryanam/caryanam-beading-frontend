import { useState } from "react";
import { Zap, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/mock-data";

// Import modular page components
import { Home } from "./landingpage/Home";
import { About } from "./landingpage/About";
import { WhyChoose } from "./landingpage/WhyChoose";
import { Contact } from "./landingpage/Contact";
import { Privacy } from "./landingpage/Privacy";
import { Terms } from "./landingpage/Terms";
import { Login } from "./landingpage/Login";

export function LandingPage() {
  const [activeTab, setActiveTab] = useState<
    "home" | "about" | "why" | "contact" | "privacy" | "terms" | "auth"
  >("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authConfig, setAuthConfig] = useState<{
    mode: "login" | "signup";
    role: Role | null;
  }>({
    mode: "login",
    role: null,
  });

  const navigateToAuth = (
    mode: "login" | "signup",
    role: Role | null = null,
  ) => {
    setAuthConfig({ mode, role });
    setActiveTab("auth");
    setMobileMenuOpen(false);
  };

  const isAuth = activeTab === "auth";

  return (
    <div className="flex flex-col min-h-screen bg-background font-sans antialiased text-foreground">
      {/* Premium Sticky Navigation Header */}
      {!isAuth && (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
            <button
              onClick={() => setActiveTab("home")}
              className="flex items-center gap-2 cursor-pointer focus:outline-none"
            >
              <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[#FFC700] to-[#E6B200] text-[#0D0E12] font-black shadow-[0_4px_12px_rgba(255,199,0,0.3)]">
                <Zap className="size-4.5 fill-current" />
              </span>
              <div className="text-left">
                <span className="text-sm font-black tracking-wider uppercase text-foreground">
                  Caryanam
                </span>
                <span className="block text-[8px] font-black tracking-[0.2em] text-[#FFC700] uppercase">
                  Remarketing
                </span>
              </div>
            </button>

            {/* Desktop Nav Links */}
            <nav className="hidden md:flex items-center gap-7">
              {(
                [
                  { id: "home", label: "Home" },
                  { id: "about", label: "About Us" },
                  { id: "why", label: "Why Choose Us" },
                  { id: "contact", label: "Contact" },
                ] as const
              ).map((link) => (
                <button
                  key={link.id}
                  onClick={() => setActiveTab(link.id)}
                  className={cn(
                    "text-xs font-bold transition-colors hover:text-[#FFC700] cursor-pointer",
                    activeTab === link.id
                      ? "text-[#FFC700]"
                      : "text-muted-foreground",
                  )}
                >
                  {link.label}
                </button>
              ))}
            </nav>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => navigateToAuth("login")}
                className="text-xs font-extrabold text-foreground hover:text-[#FFC700] transition-colors px-4 py-2 cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={() => navigateToAuth("signup", "dealer")}
                className="rounded-xl bg-[#FFC700] hover:bg-[#FFD633] text-[#0D0E12] px-4.5 py-2 text-xs font-black shadow-sm transition-all cursor-pointer"
              >
                Join Platform
              </button>
            </div>

            {/* Mobile Menu Icon */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 md:hidden text-foreground hover:text-[#FFC700]"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="size-6" />
              ) : (
                <Menu className="size-6" />
              )}
            </button>
          </div>
        </header>
      )}

      {/* Mobile Drawer Menu */}
      {!isAuth && mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 z-40 bg-background flex flex-col p-6 border-t border-border animate-fade-in">
          <nav className="flex flex-col gap-5 mb-8">
            {(
              [
                { id: "home", label: "Home" },
                { id: "about", label: "About Us" },
                { id: "why", label: "Why Choose Us" },
                { id: "contact", label: "Contact" },
              ] as const
            ).map((link) => (
              <button
                key={link.id}
                onClick={() => {
                  setActiveTab(link.id);
                  setMobileMenuOpen(false);
                }}
                className={cn(
                  "text-left text-sm font-bold tracking-tight py-1 transition-colors",
                  activeTab === link.id
                    ? "text-[#FFC700]"
                    : "text-muted-foreground",
                )}
              >
                {link.label}
              </button>
            ))}
          </nav>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigateToAuth("login")}
              className="w-full text-center py-3.5 border border-border rounded-xl text-xs font-bold text-foreground"
            >
              Sign In
            </button>
            <button
              onClick={() => navigateToAuth("signup", "dealer")}
              className="w-full text-center py-3.5 bg-[#FFC700] text-[#0D0E12] rounded-xl text-xs font-black"
            >
              Join Platform
            </button>
          </div>
        </div>
      )}

      {/* Main Content Sections */}
      <main className="flex-1">
        {activeTab === "home" && (
          <Home
            onNavigateToAuth={navigateToAuth}
            onNavigateToWhy={() => setActiveTab("why")}
          />
        )}
        {activeTab === "about" && <About />}
        {activeTab === "why" && <WhyChoose />}
        {activeTab === "contact" && <Contact />}
        {activeTab === "privacy" && <Privacy />}
        {activeTab === "terms" && <Terms />}
        {activeTab === "auth" && (
          <Login initialMode={authConfig.mode} initialRole={authConfig.role} />
        )}
      </main>

      {/* Corporate Layout Footer */}
      {!isAuth && (
        <footer className="border-t border-border bg-[#0D0E12] text-zinc-400 py-12">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid gap-8 md:grid-cols-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="grid size-8 place-items-center rounded-xl bg-[#FFC700] text-[#0D0E12] font-black">
                    <Zap className="size-4 fill-current" />
                  </span>
                  <span className="text-sm font-black tracking-wider uppercase text-white">
                    Caryanam
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-zinc-500">
                  Verifiable auto-remarketing telemetry and digital bidding
                  platform. Dedicated to absolute auction transparency and
                  structural inspection compliance.
                </p>
              </div>

              <div>
                <h4 className="text-xs font-black text-white uppercase tracking-wider mb-4">
                  Platform Pages
                </h4>
                <ul className="space-y-2.5 text-[11px]">
                  <li>
                    <button
                      onClick={() => setActiveTab("home")}
                      className="hover:text-white transition-colors cursor-pointer"
                    >
                      Home Workspace
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setActiveTab("about")}
                      className="hover:text-white transition-colors cursor-pointer"
                    >
                      About Caryanam
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setActiveTab("why")}
                      className="hover:text-white transition-colors cursor-pointer"
                    >
                      Why Choose Us
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setActiveTab("contact")}
                      className="hover:text-white transition-colors cursor-pointer"
                    >
                      Contact Office
                    </button>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-black text-white uppercase tracking-wider mb-4">
                  Regulatory & Legal
                </h4>
                <ul className="space-y-2.5 text-[11px]">
                  <li>
                    <button
                      onClick={() => setActiveTab("privacy")}
                      className="hover:text-white transition-colors cursor-pointer"
                    >
                      Privacy Policy
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setActiveTab("terms")}
                      className="hover:text-white transition-colors cursor-pointer"
                    >
                      Terms & Conditions
                    </button>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-black text-white uppercase tracking-wider mb-4">
                  Bidding Support
                </h4>
                <p className="text-[11px] leading-relaxed text-zinc-500 mb-2">
                  Questions about bulk upload validation or bid history audits?
                </p>
                <button
                  onClick={() => setActiveTab("contact")}
                  className="text-[11px] font-black text-[#FFC700] hover:underline"
                >
                  Submit Support Ticket
                </button>
              </div>
            </div>

            <div className="mt-10 border-t border-zinc-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-zinc-600 font-semibold">
              <p>
                © {new Date().getFullYear()} Caryanam Enterprise (Remarketing
                Platforms). All Rights Reserved.
              </p>
              <p>ISO 27001 Certified · Verified Bid Telemetry</p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
