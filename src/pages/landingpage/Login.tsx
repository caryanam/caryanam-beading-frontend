import { useState } from "react";
import {
  Building2,
  ClipboardCheck,
  Eye,
  EyeOff,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import type { Role } from "@/lib/mock-data";
import authImage from "@/assets/premium_supercar.png";

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
    title: "Inspector",
    copy: "Inspect vehicles, submit 200-point reports for approval.",
    icon: ClipboardCheck,
    signup: true,
  },
  {
    key: "dealer",
    title: "Dealer",
    copy: "Browse verified inventory, place bids, manage purchases.",
    icon: Building2,
    signup: true,
  },
];

function Field({
  label,
  placeholder,
  type = "text",
  value,
  onChange,
  trailing,
  required,
}: {
  label: string;
  placeholder?: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  trailing?: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col items-start gap-1.5 w-full">
      <label className="text-[10px] font-black text-zinc-400 tracking-wider uppercase px-1 flex items-center">
        {label}
        {required && <span className="text-red-500 font-bold ml-1 text-[11px]">*</span>}
      </label>
      <div className="relative w-full">
        <input
          type={type}
          value={value}
          placeholder={placeholder || `Enter ${label}`}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="w-full rounded-[14px] bg-[#f1f3f6] border border-transparent focus:bg-white px-5 py-3.5 text-sm font-semibold text-zinc-800 placeholder-zinc-400 outline-none transition-all focus:ring-1 focus:ring-[#FFC700]/15"
        />
        {trailing && (
          <div className="absolute top-1/2 -translate-y-1/2 right-4 flex items-center">
            {trailing}
          </div>
        )}
      </div>
    </div>
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

  const set = (k: string) => (v: string) =>
    setValues((s) => ({ ...s, [k]: v }));

  const handleMobileChange = (v: string) => {
    const numeric = v.replace(/\D/g, "");
    if (numeric.length > 0 && /^[0-5]/.test(numeric)) {
      return;
    }
    const limited = numeric.slice(0, 10);
    setValues((s) => ({ ...s, mobile: limited }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "login") {
      if (!values.email) {
        toast.error("Email Address is required.");
        return;
      }
      if (!values.password) {
        toast.error("Account Password is required.");
        return;
      }
      try {
        await login(values.email, values.password);
      } catch (err) {
        console.error("Login attempt failed:", err);
      }
    } else {
      if (!role) return;

      if (role === "dealer") {
        if (!values.shopName) {
          toast.error("Dealership / Shop Name is required.");
          return;
        }
        if (!values.ownerName) {
          toast.error("Owner Name is required.");
          return;
        }
        if (!values.email) {
          toast.error("Email Address is required.");
          return;
        }
        if (!values.mobile) {
          toast.error("Mobile Number is required.");
          return;
        }
        if (!/^[6-9][0-9]{9}$/.test(values.mobile)) {
          toast.error("Mobile number must be a 10-digit number starting with 6, 7, 8, or 9.");
          return;
        }
        if (!values.password) {
          toast.error("Account Password is required.");
          return;
        }
        if (!values.address) {
          toast.error("Address is required.");
          return;
        }
        if (!values.area) {
          toast.error("Area is required.");
          return;
        }
        if (!values.city) {
          toast.error("City is required.");
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
        if (!values.email) {
          toast.error("Email Address is required.");
          return;
        }
        if (!values.mobile) {
          toast.error("Mobile Number is required.");
          return;
        }
        if (!/^[6-9][0-9]{9}$/.test(values.mobile)) {
          toast.error("Mobile number must be a 10-digit number starting with 6, 7, 8, or 9.");
          return;
        }
        if (!values.password) {
          toast.error("Account Password is required.");
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

  const isSignUp = mode === "signup";

  return (
    <div className="w-full min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans antialiased">
      {/* Desktop sliding panels - End-to-end screen layout */}
      <div className="hidden lg:block relative overflow-hidden w-full h-screen bg-zinc-50 dark:bg-zinc-950">
        
        {/* Sign In Form Container */}
        <div
          className={cn(
            "absolute top-0 left-0 h-full w-1/2 flex flex-col justify-center px-12 transition-all duration-700 ease-in-out z-20",
            isSignUp ? "translate-x-full opacity-0 pointer-events-none" : "opacity-100"
          )}
        >
          <form onSubmit={submit} className="w-full max-w-[420px] mx-auto flex flex-col items-center">
            <div className="flex items-center gap-2 mb-8 self-start">
              <span className="grid size-8 place-items-center rounded-xl bg-[#FFC700] text-[#0D0E12] font-extrabold shadow-sm">
                <Zap className="size-4.5 fill-current" />
              </span>
              <p className="text-xs font-extrabold tracking-[0.2em] text-[#FFC700] uppercase">
                Caryanam Bidding
              </p>
            </div>

            <h1 className="text-4xl font-extrabold text-zinc-900 tracking-tight mb-2 self-start">Sign In</h1>
            
            <p className="text-xs font-bold text-zinc-400 mb-6 uppercase tracking-wider self-start">
              Sign in With Email & Password
            </p>

            <div className="w-full space-y-4">
              <Field
                label="Email Address"
                placeholder="Enter E-mail"
                type="email"
                value={values.email ?? ""}
                onChange={set("email")}
                required
              />
              <Field
                label="Account Password"
                placeholder="Enter Password"
                type={showPassword ? "text" : "password"}
                value={values.password ?? ""}
                onChange={set("password")}
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="text-zinc-400 hover:text-[#FFC700] transition-colors cursor-pointer"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                }
                required
              />
            </div>

            <div className="w-full flex justify-end items-end my-6">
              <button
                type="button"
                onClick={() => toast.info("Password reset link dispatched.")}
                className="text-xs font-semibold text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FFC700] hover:bg-[#FFD633] text-[#0D0E12] py-4 rounded-[14px] font-black tracking-wide uppercase transition-all duration-300 shadow-[0_4px_14px_rgba(255,199,0,0.35)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-xs flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#0D0E12] border-t-transparent" />
                  Processing...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>

        {/* Sign Up Form Container */}
        <div
          className={cn(
            "absolute top-0 left-0 h-full w-1/2 flex flex-col justify-center px-12 transition-all duration-700 ease-in-out z-10 opacity-0 pointer-events-none",
            isSignUp ? "translate-x-full opacity-100 z-30 pointer-events-auto" : ""
          )}
        >
          <form onSubmit={submit} className="w-full max-w-[440px] mx-auto flex flex-col items-center">
            <div className="flex items-center gap-2 mb-6 self-start">
              <span className="grid size-8 place-items-center rounded-xl bg-[#FFC700] text-[#0D0E12] font-extrabold shadow-sm">
                <Zap className="size-4.5 fill-current" />
              </span>
              <p className="text-xs font-extrabold tracking-[0.2em] text-[#FFC700] uppercase">
                Caryanam Bidding
              </p>
            </div>

            <h1 className="text-4xl font-extrabold text-zinc-900 tracking-tight mb-2 self-start">Sign Up</h1>

            {/* Role selector */}
            <div className="grid grid-cols-2 gap-1 rounded-[14px] bg-zinc-100 p-1 border border-zinc-200/50 w-full mb-4">
              {(["dealer", "inspector"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setRole(r);
                    setValues({});
                  }}
                  className={cn(
                    "rounded-xl py-2.5 text-xs font-bold capitalize transition-all cursor-pointer flex items-center justify-center gap-1.5",
                    role === r
                      ? "bg-[#FFC700] text-[#0D0E12] shadow-sm font-black"
                      : "text-zinc-500 hover:text-zinc-800",
                  )}
                >
                  {r === "dealer" ? (
                    <>
                      <Building2 className="size-3.5" />
                      Dealer
                    </>
                  ) : (
                    <>
                      <ClipboardCheck className="size-3.5" />
                      Inspector
                    </>
                  )}
                </button>
              ))}
            </div>

            {/* Inputs Grid */}
            <div className="w-full max-h-[350px] overflow-y-auto pr-1 no-scrollbar space-y-3">
              
              {role === "inspector" && (
                <div className="space-y-3">
                  <Field
                    label="Full Name"
                    placeholder="Full Name"
                    value={values.fullName ?? ""}
                    onChange={set("fullName")}
                    required
                  />
                  <Field
                    label="Email Address"
                    placeholder="Enter E-mail"
                    type="email"
                    value={values.email ?? ""}
                    onChange={set("email")}
                    required
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      label="Mobile Number"
                      placeholder="Mobile Number"
                      value={values.mobile ?? ""}
                      onChange={handleMobileChange}
                      required
                    />
                    <Field
                      label="Account Password"
                      placeholder="Password"
                      type={showPassword ? "text" : "password"}
                      value={values.password ?? ""}
                      onChange={set("password")}
                      trailing={
                        <button
                          type="button"
                          onClick={() => setShowPassword((s) => !s)}
                          className="text-zinc-400 hover:text-[#FFC700] transition-colors cursor-pointer"
                          aria-label="Toggle password visibility"
                        >
                          {showPassword ? (
                            <EyeOff className="size-4" />
                          ) : (
                            <Eye className="size-4" />
                          )}
                        </button>
                      }
                      required
                    />
                  </div>
                </div>
              )}
              
              {role === "dealer" && (
                <div className="grid grid-cols-2 gap-3">
                  {/* Basic Info */}
                  <div className="col-span-1">
                    <Field
                      label="Dealership / Shop Name"
                      placeholder="Dealership Name"
                      value={values.shopName ?? ""}
                      onChange={set("shopName")}
                      required
                    />
                  </div>
                  <div className="col-span-1">
                    <Field
                      label="Owner Name"
                      placeholder="Owner Name"
                      value={values.ownerName ?? ""}
                      onChange={set("ownerName")}
                      required
                    />
                  </div>

                  {/* Credentials First */}
                  <div className="col-span-2">
                    <Field
                      label="Email Address"
                      placeholder="Enter E-mail"
                      type="email"
                      value={values.email ?? ""}
                      onChange={set("email")}
                      required
                    />
                  </div>
                  <div className="col-span-1">
                    <Field
                      label="Mobile Number"
                      placeholder="Mobile Number"
                      value={values.mobile ?? ""}
                      onChange={handleMobileChange}
                      required
                    />
                  </div>
                  <div className="col-span-1">
                    <Field
                      label="Account Password"
                      placeholder="Password"
                      type={showPassword ? "text" : "password"}
                      value={values.password ?? ""}
                      onChange={set("password")}
                      trailing={
                        <button
                          type="button"
                          onClick={() => setShowPassword((s) => !s)}
                          className="text-zinc-400 hover:text-[#FFC700] transition-colors cursor-pointer"
                          aria-label="Toggle password visibility"
                        >
                          {showPassword ? (
                            <EyeOff className="size-4" />
                          ) : (
                            <Eye className="size-4" />
                          )}
                        </button>
                      }
                      required
                    />
                  </div>

                  {/* Location Address Last */}
                  <div className="col-span-2">
                    <Field
                      label="Address"
                      placeholder="Dealership Address"
                      value={values.address ?? ""}
                      onChange={set("address")}
                      required
                    />
                  </div>
                  <div className="col-span-1">
                    <Field
                      label="Area"
                      placeholder="Area / Locality"
                      value={values.area ?? ""}
                      onChange={set("area")}
                      required
                    />
                  </div>
                  <div className="col-span-1">
                    <Field
                      label="City"
                      placeholder="City"
                      value={values.city ?? ""}
                      onChange={set("city")}
                      required
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full bg-[#FFC700] hover:bg-[#FFD633] text-[#0D0E12] py-4 rounded-[14px] font-black tracking-wide uppercase transition-all duration-300 shadow-[0_4px_14px_rgba(255,199,0,0.35)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-xs flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#0D0E12] border-t-transparent" />
                  Processing...
                </span>
              ) : (
                "Sign Up"
              )}
            </button>
          </form>
        </div>

        {/* Overlay Container - No Padding (extends flush with screen edges) */}
        <div
          className={cn(
            "absolute top-0 left-1/2 w-1/2 h-full transition-all duration-700 ease-in-out z-40 p-0",
            isSignUp ? "-translate-x-full" : ""
          )}
        >
          {/* Inner divider rounded edges container */}
          <div
            className={cn(
              "w-full h-full overflow-hidden relative shadow-2xl transition-all duration-700",
              isSignUp ? "rounded-r-[48px] rounded-l-none" : "rounded-l-[48px] rounded-r-none"
            )}
          >
            {/* Background Car Image */}
            <div
              className="absolute inset-0 bg-cover bg-center transition-all duration-700 ease-in-out scale-105"
              style={{ backgroundImage: `url(${authImage})` }}
            />
            {/* Obsidian Satin overlay with subtle gold wash */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#0D0E12]/95 via-[#0D0E12]/70 to-[#FFC700]/15" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0D0E12] via-transparent to-transparent" />

            {/* Overlay inner content - White text directly on dark overlay */}
            <div
              className={cn(
                "text-white relative -left-full h-full w-[200%] transform transition-transform duration-700 ease-in-out flex",
                isSignUp ? "translate-x-1/2" : "translate-x-0"
              )}
            >
              {/* Left Panel (shown when isSignUp is true, offers to Sign In) */}
              <div
                className={cn(
                  "absolute top-0 left-0 w-1/2 h-full flex flex-col items-center justify-center px-16 text-center transition-all duration-700 ease-in-out",
                  isSignUp ? "translate-x-0 opacity-100" : "-translate-x-[20%] opacity-0"
                )}
              >
                {/* Premium Glassmorphic Card for enhanced contrast */}
                <div className="bg-white/15 backdrop-blur-md border border-white/25 p-8 rounded-[28px] max-w-sm flex flex-col items-center shadow-[0_12px_40px_rgba(0,0,0,0.06)]">
                  <h2 className="text-4xl font-black mb-3 tracking-tight uppercase text-white">Active Workspace</h2>
                  <p className="text-zinc-300 mb-6 text-xs font-bold leading-relaxed">
                    Log in to resume your active auctions, manage digital inspections, and monitor live bids.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setRole(null);
                      setValues({});
                    }}
                    className="border-2 border-white hover:bg-white hover:text-[#0D0E12] transition-all text-white px-10 py-3 rounded-full text-xs font-extrabold tracking-widest uppercase cursor-pointer bg-transparent"
                  >
                    Sign In
                  </button>
                </div>
              </div>

              {/* Right Panel (shown when isSignUp is false, offers to Sign Up) */}
              <div
                className={cn(
                  "absolute top-0 right-0 w-1/2 h-full flex flex-col items-center justify-center px-16 text-center transition-all duration-700 ease-in-out",
                  isSignUp ? "translate-x-[20%] opacity-0" : "translate-x-0 opacity-100"
                )}
              >
                {/* Premium Glassmorphic Card for enhanced contrast */}
                <div className="bg-white/15 backdrop-blur-md border border-white/25 p-8 rounded-[28px] max-w-sm flex flex-col items-center shadow-[0_12px_40px_rgba(0,0,0,0.06)]">
                  <h2 className="text-4xl font-black mb-3 tracking-tight uppercase text-white">Caryanam Bidding</h2>
                  <p className="text-zinc-300 mb-6 text-xs font-bold leading-relaxed">
                    Access verified digital inspections, live remarketing, and supercar telemetry logs.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signup");
                      setRole("dealer");
                      setValues({});
                    }}
                    className="border-2 border-white hover:bg-white hover:text-[#0D0E12] transition-all text-white px-10 py-3 rounded-full text-xs font-extrabold tracking-widest uppercase cursor-pointer bg-transparent"
                  >
                    Sign Up
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Form Layout */}
      <div className="lg:hidden w-full min-h-screen bg-zinc-50 flex flex-col justify-center relative overflow-hidden px-6 py-12">
        {/* Background Car Image for brand feeling */}
        <div
          className="absolute top-0 left-0 w-full h-44 bg-cover bg-center"
          style={{ backgroundImage: `url(${authImage})` }}
        />
        <div className="absolute top-0 left-0 w-full h-44 bg-gradient-to-b from-[#0D0E12]/80 to-zinc-50" />

        {/* Top corporate brand logo */}
        <div className="flex items-center justify-center gap-2 mb-6 mt-32 relative z-10">
          <span className="grid size-8 place-items-center rounded-xl bg-[#0D0E12] text-[#FFC700] font-extrabold shadow-md">
            <Zap className="size-4.5 fill-current" />
          </span>
          <p className="text-xs font-extrabold tracking-[0.2em] text-[#0D0E12] uppercase">
            Caryanam Bidding
          </p>
        </div>

        {mode === "login" ? (
          <form onSubmit={submit} className="w-full max-w-md mx-auto flex flex-col items-center relative z-10 bg-white p-8 rounded-[24px] shadow-md border border-zinc-100">
            <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight mb-1">Sign In</h1>

            <p className="text-xs font-bold text-zinc-400 mb-5 uppercase tracking-wider">
              Sign in With Email & Password
            </p>

            <div className="w-full space-y-3">
              <Field
                label="Email Address"
                placeholder="Enter E-mail"
                type="email"
                value={values.email ?? ""}
                onChange={set("email")}
                required
              />
              <Field
                label="Account Password"
                placeholder="Enter Password"
                type={showPassword ? "text" : "password"}
                value={values.password ?? ""}
                onChange={set("password")}
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="text-zinc-400 hover:text-[#FFC700] transition-colors cursor-pointer"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                }
                required
              />
            </div>

            <div className="w-full flex justify-between items-center my-4 text-xs">
              <label className="flex items-center gap-2 text-zinc-400 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  className="size-4 rounded border-zinc-300 accent-[#FFC700] cursor-pointer"
                />
                Remember me
              </label>
              <button
                type="button"
                onClick={() => toast.info("Password reset link dispatched.")}
                className="font-bold text-zinc-500 hover:text-[#FFC700] transition-colors"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FFC700] hover:bg-[#FFD633] text-[#0D0E12] py-3.5 rounded-xl font-black tracking-wide uppercase transition-all duration-300 shadow-[0_4px_14px_rgba(255,199,0,0.3)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-xs"
            >
              {loading ? "Processing..." : "Sign In"}
            </button>

            <div className="mt-6 text-center text-xs font-semibold text-zinc-400">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setRole("dealer");
                  setValues({});
                }}
                className="font-bold text-[#FFC700] hover:underline cursor-pointer"
              >
                Sign Up
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={submit} className="w-full max-w-md mx-auto flex flex-col items-center relative z-10 bg-white p-8 rounded-[24px] shadow-md border border-zinc-100">
            <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight mb-4">Sign Up</h1>

            {/* Role selector */}
            <div className="grid grid-cols-2 gap-1 rounded-[14px] bg-zinc-100 p-1 border border-zinc-200/50 w-full mb-4">
              {(["dealer", "inspector"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setRole(r);
                    setValues({});
                  }}
                  className={cn(
                    "rounded-xl py-2 text-xs font-bold capitalize transition-all cursor-pointer flex items-center justify-center gap-1",
                    role === r
                      ? "bg-[#FFC700] text-[#0D0E12] shadow-sm font-black"
                      : "text-zinc-500 hover:text-zinc-800",
                  )}
                >
                  {r === "dealer" ? "Dealer" : "Inspector"}
                </button>
              ))}
            </div>

            {/* Inputs Stack */}
            <div className="w-full space-y-3 max-h-[300px] overflow-y-auto no-scrollbar pr-1">
              
              {role === "inspector" && (
                <>
                  <Field
                    label="Full Name"
                    placeholder="Full Name"
                    value={values.fullName ?? ""}
                    onChange={set("fullName")}
                    required
                  />
                  <Field
                    label="Email Address"
                    placeholder="Enter E-mail"
                    type="email"
                    value={values.email ?? ""}
                    onChange={set("email")}
                    required
                  />
                  <Field
                    label="Mobile Number"
                    placeholder="Mobile Number"
                    value={values.mobile ?? ""}
                    onChange={handleMobileChange}
                    required
                  />
                  <Field
                    label="Account Password"
                    placeholder="Password"
                    type={showPassword ? "text" : "password"}
                    value={values.password ?? ""}
                    onChange={set("password")}
                    trailing={
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="text-zinc-400 hover:text-[#FFC700] transition-colors cursor-pointer"
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>
                    }
                    required
                  />
                </>
              )}
              
              {role === "dealer" && (
                <>
                  <Field
                    label="Dealership / Shop Name"
                    placeholder="Dealership Name"
                    value={values.shopName ?? ""}
                    onChange={set("shopName")}
                    required
                  />
                  <Field
                    label="Owner Name"
                    placeholder="Owner Name"
                    value={values.ownerName ?? ""}
                    onChange={set("ownerName")}
                    required
                  />
                  <Field
                    label="Email Address"
                    placeholder="Enter E-mail"
                    type="email"
                    value={values.email ?? ""}
                    onChange={set("email")}
                    required
                  />
                  <Field
                    label="Mobile Number"
                    placeholder="Mobile Number"
                    value={values.mobile ?? ""}
                    onChange={handleMobileChange}
                    required
                  />
                  <Field
                    label="Account Password"
                    placeholder="Password"
                    type={showPassword ? "text" : "password"}
                    value={values.password ?? ""}
                    onChange={set("password")}
                    trailing={
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="text-zinc-400 hover:text-[#FFC700] transition-colors cursor-pointer"
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>
                    }
                    required
                  />
                  <Field
                    label="Address"
                    placeholder="Dealership Address"
                    value={values.address ?? ""}
                    onChange={set("address")}
                    required
                  />
                  <Field
                    label="Area"
                    placeholder="Area"
                    value={values.area ?? ""}
                    onChange={set("area")}
                    required
                  />
                  <Field
                    label="City"
                    placeholder="City"
                    value={values.city ?? ""}
                    onChange={set("city")}
                    required
                  />
                </>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full bg-[#FFC700] hover:bg-[#FFD633] text-[#0D0E12] py-3.5 rounded-xl font-black tracking-wide uppercase transition-all duration-300 shadow-[0_4px_14px_rgba(255,199,0,0.3)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-xs"
            >
              {loading ? "Processing..." : "Sign Up"}
            </button>

            <div className="mt-6 text-center text-xs font-semibold text-zinc-400">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setRole(null);
                  setValues({});
                }}
                className="font-bold text-[#FFC700] hover:underline cursor-pointer"
              >
                Sign In
              </button>
            </div>
          </form>
        )}
      </div>

    </div>
  );
}
