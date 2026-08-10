import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Menu, X, ShieldCheck, User, LogIn, UserPlus, MapPin, Phone, Mail } from "lucide-react";
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

interface LandingPageProps {
  page?: "home" | "about" | "why" | "contact" | "privacy" | "terms" | "auth";
  initialMode?: "login" | "signup";
}

export function LandingPage({ page = "home", initialMode = "login" }: LandingPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const isAuth = page === "auth" || location.pathname === "/login" || location.pathname === "/register" || location.pathname === "/signup";

  const navLinks = [
    { id: "home", label: "Home", path: "/" },
    { id: "about", label: "About Us", path: "/about" },
    { id: "why", label: "Why Choose Us", path: "/why-choose-us" },
    { id: "contact", label: "Contact Us", path: "/contact" },
  ] as const;

  const navigateToAuth = (
    mode: "login" | "signup",
    role: Role | null = null,
  ) => {
    setMobileMenuOpen(false);
    if (mode === "login") {
      navigate("/login");
    } else {
      navigate("/register");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background font-sans antialiased text-foreground">
      {/* Premium Glassmorphic Sticky Navigation Header */}
      {!isAuth && (
        <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/85 backdrop-blur-xl shadow-sm">
          <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">

            {/* Brand Logo & Badging */}
            <Link
              to="/"
              className="flex items-center gap-3 cursor-pointer focus:outline-none group"
            >
              <div className="relative grid size-11 place-items-center rounded-2xl overflow-hidden shadow-[0_4px_16px_rgba(255,199,0,0.35)] bg-[#0D0E12] border border-[#FFC700]/50 transition-transform group-hover:scale-105 shrink-0">
                <img src="/logo.png" alt="Caryanam Bidding" className="size-full object-cover" />
              </div>
              <div className="text-left flex flex-col justify-center">
                <div className="flex items-center gap-2">
                  <span className="text-base font-black tracking-wider uppercase text-foreground">
                    Caryanam
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#FFC700]/15 text-[#FFC700] border border-[#FFC700]/30 hidden sm:inline-block">
                    B2B Auctions
                  </span>
                </div>
                <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                  Used Car Inspection & Bidding
                </span>
              </div>
            </Link>

            {/* Desktop Nav Links Pill Bar */}
            <nav className="hidden md:flex items-center gap-1.5 rounded-full border border-border/80 bg-secondary/40 p-1.5 backdrop-blur-md">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path || (link.path === "/" && location.pathname === "");
                return (
                  <Link
                    key={link.id}
                    to={link.path}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-bold transition-all cursor-pointer",
                      isActive
                        ? "bg-[#FFC700] text-[#0D0E12] shadow-sm font-black"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/80",
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Desktop Action Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-2xl border border-border px-4.5 py-2.5 text-sm font-extrabold text-foreground hover:bg-secondary hover:border-[#FFC700]/50 transition-all cursor-pointer shadow-sm"
              >
                <LogIn className="size-4 text-[#FFC700]" /> Sign In
              </Link>

              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-2xl bg-[#FFC700] hover:bg-[#FFD633] text-[#0D0E12] px-5 py-2.5 text-sm font-black shadow-[0_4px_16px_rgba(255,199,0,0.3)] hover:shadow-[0_6px_20px_rgba(255,199,0,0.45)] transition-all cursor-pointer"
              >
                <UserPlus className="size-4" /> Register
              </Link>
            </div>

            {/* Mobile Menu Toggle Icon */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 md:hidden text-foreground hover:text-[#FFC700] rounded-2xl border border-border bg-secondary/50"
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
        <div className="md:hidden fixed inset-0 top-20 z-40 bg-background/95 backdrop-blur-2xl flex flex-col p-6 border-t border-border animate-fade-in">
          <nav className="flex flex-col gap-4 mb-8">
            {navLinks.map((link) => (
              <Link
                key={link.id}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "text-base font-extrabold text-left p-3 rounded-2xl transition-all",
                  location.pathname === link.path
                    ? "bg-[#FFC700]/15 text-[#FFC700] border border-[#FFC700]/30"
                    : "text-foreground hover:bg-secondary",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex flex-col gap-3 mt-auto pt-4 border-t border-border">
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center rounded-2xl border border-border py-3.5 text-sm font-extrabold text-foreground hover:bg-secondary transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center rounded-2xl bg-[#FFC700] hover:bg-[#FFD633] text-[#0D0E12] py-3.5 text-sm font-black shadow-md transition-all"
            >
              Register
            </Link>
          </div>
        </div>
      )}

      {/* Main Dynamic View Content */}
      <main className="flex-1">
        {page === "home" && (
          <Home
            onNavigateToAuth={navigateToAuth}
            onNavigateToWhy={() => navigate("/why-choose-us")}
          />
        )}
        {page === "about" && <About />}
        {page === "why" && <WhyChoose />}
        {page === "contact" && <Contact />}
        {page === "privacy" && <Privacy />}
        {page === "terms" && <Terms />}
        {page === "auth" && (
          <Login initialMode={initialMode} />
        )}
      </main>

      {/* Corporate Layout Footer */}
      {!isAuth && (
        <footer className="border-t border-border bg-[#0D0E12] text-zinc-400 py-12">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid gap-8 md:grid-cols-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="relative grid size-9 place-items-center rounded-xl overflow-hidden bg-[#0D0E12] border border-[#FFC700]/40 shadow-md">
                    <img src="/logo.png" alt="Caryanam Bidding" className="size-full object-cover" />
                  </span>
                  <span className="text-base font-black tracking-wider uppercase text-white">
                    Caryanam Bidding
                  </span>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed text-zinc-400">
                  Verifiable auto-remarketing telemetry and digital bidding
                  platform. Dedicated to absolute auction transparency and
                  structural inspection compliance.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-black text-white uppercase tracking-wider mb-4">
                  Platform Pages
                </h4>
                <ul className="space-y-2.5 text-xs sm:text-sm">
                  <li>
                    <Link to="/" className="hover:text-white transition-colors">
                      Home
                    </Link>
                  </li>
                  <li>
                    <Link to="/about" className="hover:text-white transition-colors">
                      About Us
                    </Link>
                  </li>
                  <li>
                    <Link to="/why-choose-us" className="hover:text-white transition-colors">
                      Why Choose Us
                    </Link>
                  </li>
                  <li>
                    <Link to="/contact" className="hover:text-white transition-colors">
                      Contact Us
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-black text-white uppercase tracking-wider mb-4">
                  Contact Information
                </h4>
                <ul className="space-y-2.5 text-xs sm:text-sm">
                  <li className="flex items-center gap-2 text-zinc-300">
                    <Mail className="size-4 text-[#FFC700] shrink-0" />
                    <span>support@caryanam.com</span>
                  </li>
                  <li className="flex items-center gap-2 text-zinc-300">
                    <Phone className="size-4 text-[#FFC700] shrink-0" />
                    <span className="font-mono">+91 22 4900 1200</span>
                  </li>
                  <li className="flex items-start gap-2 text-zinc-300">
                    <MapPin className="size-4 text-[#FFC700] shrink-0 mt-0.5" />
                    <span>BKC, Mumbai, Maharashtra 400051</span>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-black text-white uppercase tracking-wider mb-4">
                  Legal Compliance
                </h4>
                <ul className="space-y-2.5 text-xs sm:text-sm">
                  <li>
                    <Link to="/privacy" className="hover:text-white transition-colors">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link to="/terms" className="hover:text-white transition-colors">
                      Terms of Service
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-12 border-t border-zinc-800 pt-8 flex flex-col md:flex-row items-center justify-between text-xs sm:text-sm text-zinc-400">
              <p>
                Developed by Caryanamindia Pvt Ltd
              </p>
              <p className="mt-2 md:mt-0 font-medium">
                © 2026 Caryanam Bidding. All rights reserved by Caryanamindia Pvt Ltd


              </p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
