import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  UserX,
  Lock,
  Mail,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ArrowLeft,
  ShieldAlert,
  Trash2,
  FileX2,
  Gavel,
  Check,
  ShieldCheck,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { publicClient } from "@/lib/api";
import { readSession, clearSession } from "@/lib/session";

export function DeleteAccount() {
  const navigate = useNavigate();
  const [emailOrMobile, setEmailOrMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deletedSuccess, setDeletedSuccess] = useState(false);

  // Pre-fill email or mobile if user is currently logged in
  useEffect(() => {
    const session = readSession();
    if (session?.email) {
      setEmailOrMobile(session.email);
    } else if (session?.mobileNumber) {
      setEmailOrMobile(session.mobileNumber);
    }
  }, []);

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!emailOrMobile.trim()) {
      toast.error("Please enter your registered Email Address or Mobile Number.");
      return;
    }

    if (!password) {
      toast.error("Please enter your password to confirm account deletion.");
      return;
    }

    if (!agreed) {
      toast.error("You must check the agreement checkbox before deleting your account.");
      return;
    }

    setLoading(true);

    try {
      const response = await publicClient.post("/api/auth/delete-account", {
        emailOrMobile: emailOrMobile.trim(),
        password: password,
      });

      if (response.data && response.data.success) {
        clearSession();
        setDeletedSuccess(true);
        toast.success(response.data.message || "Account deleted successfully.");
      } else {
        toast.error(
          response.data?.message || "Failed to delete account. Please check your credentials."
        );
      }
    } catch (error: any) {
      console.error("Account deletion error:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to delete account. Please verify your email/mobile and password.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-14 sm:py-20 bg-background animate-rise relative overflow-hidden">
      {/* Background Decorative Ambient Lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-500/10 dark:bg-red-600/15 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-[#FFC700]/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="mx-auto max-w-3xl px-6 lg:px-8 relative z-10">

        {/* Section Header - Matching Contact.tsx typography */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-rose-500/40 bg-rose-500/15 text-sm font-black text-rose-500 mb-3 shadow-sm">
            <UserX className="size-4" /> Account Erasure Desk
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
            Delete My Account
          </h1>
          <p className="mt-2 text-sm font-extrabold text-muted-foreground tracking-wider uppercase">
            Permanent Profile Erasure & Credentials Removal
          </p>
        </div>

        {deletedSuccess ? (
          /* Success Screen Card */
          <div className="p-6 sm:p-10 border border-emerald-500/30 bg-card rounded-3xl space-y-8 shadow-soft text-center relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600" />

            <div className="mx-auto size-16 sm:size-20 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 mb-4 shadow-inner">
              <CheckCircle2 className="size-8 sm:size-10" />
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight mb-2">
                Account Permanently Deleted
              </h2>
              <p className="text-sm sm:text-base font-semibold text-muted-foreground leading-relaxed max-w-lg mx-auto">
                Your Freelancer, Dealer, or Inspector profile and associated credentials have been completely removed from Caryanam Bidding platform.
              </p>
            </div>

            <div className="bg-secondary/50 border border-border rounded-2xl p-5 text-left space-y-3 text-xs sm:text-sm font-semibold text-muted-foreground">
              <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 font-extrabold">
                <Check className="size-5 shrink-0" />
                <span>Session token destroyed</span>
              </div>
              <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 font-extrabold">
                <Check className="size-5 shrink-0" />
                <span>Personal data & access privileges purged</span>
              </div>
              <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 font-extrabold">
                <Check className="size-5 shrink-0" />
                <span>Authentication credentials unlinked</span>
              </div>
            </div>

            <button
              onClick={() => navigate("/")}
              className="w-full py-4 px-6 rounded-2xl bg-[#FFC700] hover:bg-[#FFD633] active:scale-[0.99] text-[#0D0E12] font-black text-sm sm:text-base transition-all shadow-[0_8px_24px_rgba(255,199,0,0.3)] cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider"
            >
              <ShieldCheck className="size-5" />
              Return to Home Page
            </button>
          </div>
        ) : (
          /* Form Card - Matching Contact.tsx container padding & text sizes */
          <div className="p-6 sm:p-10 border border-border bg-card rounded-3xl space-y-8 shadow-soft relative overflow-hidden">
            {/* Top Accent Gradient Bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-rose-500 to-red-600" />

            <h3 className="text-lg font-black text-foreground uppercase tracking-wider border-b border-border pb-4 flex items-center gap-3">
              <Building2 className="size-6 text-[#FFC700]" /> Deletion Authorization Form
            </h3>

            {/* Warning Callout Box */}
            <div className="bg-rose-500/10 dark:bg-rose-950/20 border border-rose-500/30 rounded-2xl p-5">
              <div className="flex items-start gap-4">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-500 shrink-0 border border-rose-500/30 mt-0.5">
                  <AlertTriangle className="size-5 sm:size-6" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-extrabold text-foreground mb-1">
                    Warning: Account deletion is permanent.
                  </h4>
                  <p className="text-xs sm:text-sm font-semibold text-muted-foreground leading-relaxed">
                    Deleting your account will remove your profile (Freelancer, Dealer, or Inspector), revoke bidding access, and unlink historic listings.
                  </p>
                </div>
              </div>

              {/* Impact Summary Pills */}
              <div className="mt-5 pt-4 border-t border-rose-500/20 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-bold text-muted-foreground">
                <div className="flex items-center gap-2 bg-background/80 px-3.5 py-2.5 rounded-xl border border-rose-500/15">
                  <Trash2 className="size-4 text-rose-500 shrink-0" />
                  <span>Profile Erased</span>
                </div>
                <div className="flex items-center gap-2 bg-background/80 px-3.5 py-2.5 rounded-xl border border-rose-500/15">
                  <Gavel className="size-4 text-amber-500 shrink-0" />
                  <span>Bids Revoked</span>
                </div>
                <div className="flex items-center gap-2 bg-background/80 px-3.5 py-2.5 rounded-xl border border-rose-500/15">
                  <FileX2 className="size-4 text-rose-500 shrink-0" />
                  <span>Listings Unlinked</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleDeleteAccount} className="space-y-6 text-sm sm:text-base">
              {/* Email / Mobile Field */}
              <div>
                <label className="text-xs font-bold text-muted-foreground block uppercase tracking-wider mb-2">
                  Email Address or Mobile Number
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-[#FFC700] transition-colors">
                    <Mail className="size-5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={emailOrMobile}
                    onChange={(e) => setEmailOrMobile(e.target.value)}
                    placeholder="Enter your registered email or mobile"
                    className="w-full bg-background border border-border rounded-2xl pl-11 pr-4 py-3.5 text-sm sm:text-base text-foreground font-semibold placeholder:text-muted-foreground focus:outline-none focus:border-[#FFC700] focus:ring-4 focus:ring-[#FFC700]/15 transition-all"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="text-xs font-bold text-muted-foreground block uppercase tracking-wider mb-2">
                  Password Confirmation
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-[#FFC700] transition-colors">
                    <Lock className="size-5" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your account password"
                    className="w-full bg-background border border-border rounded-2xl pl-11 pr-11 py-3.5 text-sm sm:text-base text-foreground font-semibold placeholder:text-muted-foreground focus:outline-none focus:border-[#FFC700] focus:ring-4 focus:ring-[#FFC700]/15 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>
              </div>

              {/* Agreement Checkbox */}
              <div className="pt-2">
                <label className="flex items-start gap-4 p-4 rounded-2xl border border-border bg-background/50 hover:bg-background transition-colors cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-0.5 size-4 rounded bg-background border-border text-rose-600 focus:ring-rose-500 accent-rose-600 cursor-pointer shrink-0"
                  />
                  <span className="text-xs sm:text-sm text-muted-foreground group-hover:text-foreground transition-colors leading-relaxed font-semibold">
                    I understand that deleting my account is permanent and cannot be restored or undone under any circumstances.
                  </span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-4">
                <button
                  type="submit"
                  disabled={loading || !agreed}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none text-white font-extrabold text-sm sm:text-base transition-all shadow-lg shadow-red-600/25 flex items-center justify-center gap-2.5 cursor-pointer uppercase tracking-wider"
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-5 animate-spin" />
                      <span>Deleting Account...</span>
                    </>
                  ) : (
                    <>
                      <UserX className="size-5" />
                      <span>Permanently Delete My Account</span>
                    </>
                  )}
                </button>

                <Link
                  to="/"
                  className="block text-center py-2.5 text-xs sm:text-sm font-extrabold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
                >
                  Cancel and go back
                </Link>
              </div>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}


