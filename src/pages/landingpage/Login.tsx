import { useState } from "react";
import {
  ArrowRight,
  Building2,
  ClipboardCheck,
  Eye,
  EyeOff,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import authImage from "@/assets/auth-inspection.jpg";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import type { Role } from "@/lib/mock-data";

const roles: {
  key: Role;
  title: string;
  copy: string;
  icon: React.ComponentType<{ className?: string }>;
  signup: boolean;
}[] = [
  {
    key: "admin",
    title: "Admin Workspace",
    copy: "Approve vehicles, manage live auctions, monitor revenue.",
    icon: ShieldCheck,
    signup: false,
  },
  {
    key: "inspector",
    title: "Inspector Hub",
    copy: "Inspect vehicles, submit 200-point reports for approval.",
    icon: ClipboardCheck,
    signup: true,
  },
  {
    key: "dealer",
    title: "Dealer Portal",
    copy: "Browse verified inventory, place bids, manage purchases.",
    icon: Building2,
    signup: true,
  },
];

function Field({
  label,
  type = "text",
  value,
  onChange,
  trailing,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  trailing?: React.ReactNode;
}) {
  return (
    <label className="group relative block">
      <input
        type={type}
        value={value}
        placeholder=" "
        onChange={(e) => onChange(e.target.value)}
        className="peer w-full rounded-2xl border border-border bg-card px-4 pt-6 pb-2.5 text-sm font-medium outline-none transition-all focus:border-[#FFC700] focus:ring-2 focus:ring-[#FFC700]/30 shadow-soft"
      />
      <span className="pointer-events-none absolute top-4 left-4 text-sm text-muted-foreground transition-all peer-focus:top-2 peer-focus:text-[11px] peer-focus:text-[#0D0E12] font-bold peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:font-bold">
        {label}
      </span>
      {trailing && <span className="absolute top-4 right-4">{trailing}</span>}
    </label>
  );
}

interface LoginProps {
  initialMode?: "login" | "signup";
  initialRole?: Role | null;
}

export function Login({
  initialMode = "login",
  initialRole = null,
}: LoginProps) {
  const [role, setRole] = useState<Role | null>(initialRole);
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});

  const { login, registerDealer, registerInspector, loading } = useAuth();

  const active = roles.find((r) => r.key === role);
  const set = (k: string) => (v: string) =>
    setValues((s) => ({ ...s, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "login") {
      if (!values.email || !values.password) {
        toast.error("Enter your email and password to continue.");
        return;
      }
      try {
        await login(values.email, values.password);
      } catch (err) {
        console.error("Login attempt failed:", err);
      }
    } else {
      if (!role) return;
      if (!values.email || !values.password) {
        toast.error("Enter your email and password to register.");
        return;
      }

      if (role === "dealer") {
        if (!values.shopName || !values.ownerName) {
          toast.error("Dealership Name and Owner Name are required.");
          return;
        }
        try {
          const success = await registerDealer({
            dealershipName: values.shopName,
            ownerName: values.ownerName,
            email: values.email,
            mobile: values.mobile || "",
            password: values.password,
            address: values.address || "",
            area: values.area || "",
            city: values.city || "",
          });
          if (success) {
            setMode("login");
            setValues({ email: values.email });
          }
        } catch (err) {
          console.error("Dealer registration failed:", err);
        }
      } else if (role === "inspector") {
        if (!values.fullName) {
          toast.error("Full Name is required.");
          return;
        }
        try {
          const success = await registerInspector({
            fullName: values.fullName,
            email: values.email,
            mobile: values.mobile || "",
            password: values.password,
          });
          if (success) {
            setMode("login");
            setValues({ email: values.email });
          }
        } catch (err) {
          console.error("Inspector registration failed:", err);
        }
      }
    }
  };

  return (
    <div className="grid lg:grid-cols-2 bg-background font-sans antialiased">
      {/* Left Visual Panel */}
      <div className="relative hidden overflow-hidden bg-[#0D0E12] lg:block min-h-[600px]">
        <img
          src={authImage}
          alt="Inspector reviewing a luxury vehicle in a studio inspection bay"
          width={1024}
          height={1536}
          className="absolute inset-0 size-full object-cover opacity-80 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0E12] via-[#0D0E12]/60 to-transparent" />
        <div className="relative flex h-full flex-col justify-between p-14 text-white">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-[#FFC700] to-[#E6B200] text-[#0D0E12] shadow-[0_4px_20px_rgba(255,199,0,0.45)]">
              <Zap className="size-6 fill-current" />
            </div>
            <div>
              <p className="text-sm font-extrabold tracking-[0.3em] uppercase">
                <span className="text-[#FFC700]">Caryanam</span> Enterprise
              </p>
              <p className="text-[10px] font-bold tracking-[0.2em] text-white/50 uppercase">
                Vehicle Remarketing Platform
              </p>
            </div>
          </div>

          <div className="max-w-md mt-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#FFC700]/40 bg-[#FFC700]/15 px-4 py-1.5 text-xs font-extrabold text-[#FFC700] mb-5 shadow-sm">
              Supercar Grade Telemetry & Bidding
            </div>
            <h2 className="text-4xl leading-tight font-extrabold text-white tracking-tight">
              Inspection-grade trust.{" "}
              <span className="text-[#FFC700]">Auction-grade speed.</span>
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-white/70 font-medium">
              200-point digital inspections, verified dealer network and live
              bidding — one enterprise platform built for high-value vehicle
              remarketing.
            </p>
          </div>
        </div>
      </div>

      {/* Right Login / Access Form Panel */}
      <div className="flex items-center justify-center bg-background px-6 py-14 sm:px-12 min-h-[600px]">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-xl bg-[#FFC700] text-[#0D0E12] font-extrabold shadow-sm">
              <Zap className="size-4.5 fill-current" />
            </span>
            <p className="text-xs font-extrabold tracking-[0.28em] text-[#FFC700] uppercase">
              Caryanam Enterprise
            </p>
          </div>

          <h1 className="mt-6 text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            {mode === "login" ? "Welcome back" : "Register account"}
          </h1>
          <p className="mt-2 text-sm font-medium text-muted-foreground">
            {mode === "login"
              ? "Sign in with your credentials to access the bidding dashboard"
              : `${active?.title || "Register"} · fill details to request access`}
          </p>

          {mode === "signup" && (
            <div className="mt-7 grid grid-cols-2 gap-1 rounded-2xl bg-secondary p-1 border border-border">
              {(["dealer", "inspector"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setRole(r);
                    setValues({});
                  }}
                  className={cn(
                    "rounded-xl py-2.5 text-xs font-extrabold capitalize transition-all cursor-pointer",
                    role === r
                      ? "bg-[#FFC700] text-[#0D0E12] shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {r === "dealer" ? "Dealer Portal" : "Inspector Hub"}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={submit} className="mt-7 space-y-4">
            {mode === "signup" && role === "inspector" && (
              <Field
                label="Full Name"
                value={values.fullName ?? ""}
                onChange={set("fullName")}
              />
            )}
            {mode === "signup" && role === "dealer" && (
              <>
                <Field
                  label="Dealership / Shop Name"
                  value={values.shopName ?? ""}
                  onChange={set("shopName")}
                />
                <Field
                  label="Owner Name"
                  value={values.ownerName ?? ""}
                  onChange={set("ownerName")}
                />
                <Field
                  label="Address"
                  value={values.address ?? ""}
                  onChange={set("address")}
                />
                <Field
                  label="Area"
                  value={values.area ?? ""}
                  onChange={set("area")}
                />
                <Field
                  label="City"
                  value={values.city ?? ""}
                  onChange={set("city")}
                />
              </>
            )}
            <Field
              label="Work Email Address"
              type="email"
              value={values.email ?? ""}
              onChange={set("email")}
            />
            {mode === "signup" && (
              <Field
                label="Mobile Contact Number"
                value={values.mobile ?? ""}
                onChange={set("mobile")}
              />
            )}
            <Field
              label="Account Password"
              type={showPassword ? "text" : "password"}
              value={values.password ?? ""}
              onChange={set("password")}
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="text-muted-foreground transition-colors hover:text-[#FFC700] cursor-pointer"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              }
            />

            {mode === "login" && (
              <div className="flex items-center justify-between pt-1 text-xs font-semibold">
                <label className="flex items-center gap-2 text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    className="size-4 rounded border-border accent-[#FFC700]"
                  />
                  Remember this session
                </label>
                <button
                  type="button"
                  onClick={() => toast.info("Password reset link dispatched.")}
                  className="font-bold text-foreground hover:text-[#FFC700] transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FFC700] hover:bg-[#FFD633] py-4 text-sm font-extrabold text-[#0D0E12] shadow-[0_4px_20px_rgba(255,199,0,0.4)] transition-all hover:shadow-[0_6px_24px_rgba(255,199,0,0.55)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0D0E12] border-t-transparent" />
                  Processing...
                </span>
              ) : (
                <>
                  {mode === "login"
                    ? "Enter Workspace"
                    : "Complete Registration"}
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </form>

          {mode === "login" ? (
            <div className="mt-8 text-center text-xs font-semibold text-muted-foreground">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setRole("dealer");
                  setValues({});
                }}
                className="font-bold text-foreground hover:text-[#FFC700] transition-colors cursor-pointer"
              >
                Register
              </button>
            </div>
          ) : (
            <div className="mt-8 text-center text-xs font-semibold text-muted-foreground">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setRole(null);
                  setValues({});
                }}
                className="font-bold text-foreground hover:text-[#FFC700] transition-colors cursor-pointer"
              >
                Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
