import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Menu, X, LogIn, UserPlus, MapPin, Phone, Mail } from "lucide-react";
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
import { DeleteAccount } from "./landingpage/DeleteAccount";

interface LandingPageProps {
  page?: "home" | "about" | "why" | "contact" | "privacy" | "terms" | "auth" | "delete-account";
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
    role: Role = "dealer"
  ) => {
    navigate(mode === "login" ? "/login" : "/register", {
      state: { mode, role },
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-[#FFC700] selection:text-[#0D0E12]">
      {/* Dynamic Header Navbar */}
      {!isAuth && (
        <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/80 backdrop-blur-xl transition-all">
          <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            {/* Brand Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <span className="relative grid size-11 place-items-center rounded-2xl overflow-hidden bg-[#0D0E12] border border-[#FFC700]/40 shadow-[0_0_20px_rgba(255,199,0,0.15)] group-hover:border-[#FFC700] transition-all">
                <img src="/logo.png" alt="Caryanam Bidding" className="size-full object-cover" />
              </span>
              <div className="flex flex-col">
                <span className="text-base font-black tracking-wider uppercase text-foreground group-hover:text-[#FFC700] transition-colors">
                  Caryanam Bidding
                </span>
                <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase -mt-0.5">
                  Remarketing Telemetry
                </span>
              </div>
            </Link>

            {/* Navigation Items (Desktop - lg breakpoint: 1024px+) */}
            <nav className="hidden lg:flex items-center gap-1.5 bg-secondary/40 p-1.5 rounded-2xl border border-border/60">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.id}
                    to={link.path}
                    className={cn(
                      "px-4 py-2 text-sm font-extrabold rounded-xl transition-all cursor-pointer",
                      isActive
                        ? "bg-[#FFC700] text-[#0D0E12] shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/80",
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Auth Buttons (Desktop - lg breakpoint: 1024px+) */}
            <div className="hidden lg:flex items-center gap-3">
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

            {/* Mobile & Tablet Menu Toggle Icon (< 1024px) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 lg:hidden text-foreground hover:text-[#FFC700] rounded-2xl border border-border bg-secondary/50 cursor-pointer"
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

      {/* Mobile & Tablet Drawer Menu (< 1024px) */}
      {!isAuth && mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-20 bottom-0 z-40 bg-background/95 backdrop-blur-2xl flex flex-col p-6 sm:p-8 border-t border-border animate-fade-in overflow-y-auto">
          <div className="mx-auto max-w-2xl w-full flex flex-col justify-between flex-1 py-2">
            <nav className="flex flex-col gap-3 sm:gap-4 mb-8">
              {navLinks.map((link) => (
                <Link
                  key={link.id}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "text-base sm:text-xl font-extrabold text-left p-3.5 sm:p-4 rounded-2xl transition-all flex items-center justify-between",
                    location.pathname === link.path
                      ? "bg-[#FFC700]/15 text-[#FFC700] border border-[#FFC700]/30"
                      : "text-foreground hover:bg-secondary/80",
                  )}
                >
                  <span>{link.label}</span>
                </Link>
              ))}
            </nav>
            <div className="flex flex-col sm:flex-row gap-3.5 pt-6 border-t border-border mt-auto">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center rounded-2xl border border-border py-3.5 text-sm sm:text-base font-extrabold text-foreground hover:bg-secondary transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center rounded-2xl bg-[#FFC700] hover:bg-[#FFD633] text-[#0D0E12] py-3.5 text-sm sm:text-base font-black shadow-md transition-all"
              >
                Register
              </Link>
            </div>
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
        {page === "delete-account" && <DeleteAccount />}
        {page === "auth" && (
          <Login initialMode={initialMode} />
        )}
      </main>

      {/* Corporate Layout Footer */}
      {!isAuth && (
        <footer className="border-t border-border bg-[#0D0E12] text-zinc-400 py-10 sm:py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 lg:gap-8">
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
                    <span className="break-all sm:break-normal">support@caryanamlive.com</span>
                  </li>
                  <li className="flex items-center gap-2 text-zinc-300">
                    <Phone className="size-4 text-[#FFC700] shrink-0" />
                    <span className="font-mono">+91 7755994123</span>
                  </li>
                  <li className="flex items-start gap-2 text-zinc-300">
                    <MapPin className="size-4 text-[#FFC700] shrink-0 mt-0.5" />
                    <span>Pune, Maharashtra 411014</span>
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
                  <li>
                    <Link to="/delete-account" className="hover:text-white transition-colors">
                      Delete My Account
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-10 sm:mt-12 border-t border-zinc-800/80 pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between text-xs sm:text-sm text-zinc-400 gap-3 text-center sm:text-left">
              <p>
                Developed by Caryanamindia Pvt Ltd
              </p>
              <p className="font-medium">
                © 2026 Caryanam Bidding. All rights reserved by Caryanamindia Pvt Ltd
              </p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
