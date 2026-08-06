import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  ClipboardCheck,
  Eye,
  EyeOff,
  Mail,
  RefreshCw,
  ShieldCheck,
  X,
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
  initialRole = "dealer",
}: LoginProps) {
  const [role, setRole] = useState<Role | null>(initialRole);
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);

  const { login, registerDealer, registerInspector, sendOtp, verifyOtp, loading } = useAuth();

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const set = (k: string) => (v: string) =>
    setValues((s) => ({ ...s, [k]: v }));

  const handleMobileChange = (v: string) => {
    const numeric = v.replace(/\D/g, "");
    if (numeric.length > 0) {
      const cleaned = numeric.replace(/^[0-5]+/, "");
      setValues((s) => ({ ...s, mobile: cleaned.slice(0, 10) }));
    } else {
      setValues((s) => ({ ...s, mobile: "" }));
    }
  };

  const handleEmailOrMobileChange = (v: string) => {
    if (/[a-zA-Z@]/.test(v)) {
      setValues((s) => ({ ...s, email: v }));
      return;
    }

    const numeric = v.replace(/\D/g, "");
    if (numeric.length > 0) {
      const cleaned = numeric.replace(/^[0-5]+/, "");
      setValues((s) => ({ ...s, email: cleaned.slice(0, 10) }));
    } else {
      setValues((s) => ({ ...s, email: "" }));
    }
  };

  const triggerOtpFlow = async () => {
    setSendingOtp(true);
    setOtpError(null);
    setOtpInput("");
    try {
      await sendOtp(values.email, values.mobile);
      setShowOtpModal(true);
      setResendCooldown(60);
    } catch (err: any) {
      console.error("Failed to send OTP", err);
    } finally {
      setSendingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setSendingOtp(true);
    setOtpError(null);
    try {
      await sendOtp(values.email, values.mobile);
      setResendCooldown(60);
      toast.success("A new OTP code has been sent to your email!");
    } catch (err: any) {
      console.error("Resend OTP failed", err);
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyAndRegister = async () => {
    if (!otpInput || otpInput.trim().length !== 6) {
      setOtpError("Please enter the 6-digit OTP code.");
      return;
    }
    setVerifyingOtp(true);
    setOtpError(null);
    try {
      const isSuccess = await verifyOtp(values.email, otpInput.trim());
      if (!isSuccess) {
        setOtpError("Invalid or expired OTP. Please check your email and try again.");
        return;
      }

      if (role === "dealer") {
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
          toast.success("Registration successful! Please sign in with your credentials.");
          setShowOtpModal(false);
          setMode("login");
          setValues({ email: values.email });
        }
      } else if (role === "inspector") {
        const success = await registerInspector({
          fullName: values.fullName,
          email: values.email,
          mobile: values.mobile || "",
          password: values.password,
        });
        if (success) {
          toast.success("Registration successful! Please sign in with your credentials.");
          setShowOtpModal(false);
          setMode("login");
          setValues({ email: values.email });
        }
      }
    } catch (err: any) {
      console.error("Registration after OTP verification failed", err);
      setOtpError(err.response?.data?.message || err.message || "Registration failed.");
    } finally {
      setVerifyingOtp(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "login") {
      const input = (values.email || "").trim();
      if (!input) {
        toast.error("Email Address or Mobile Number is required.");
        return;
      }
      if (!values.password) {
        toast.error("Account Password is required.");
        return;
      }

      if (input.includes("@")) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(input)) {
          toast.error("Please enter a valid email address.");
          return;
        }
      } else {
        const mobileRegex = /^[6-9][0-9]{9}$/;
        if (!mobileRegex.test(input)) {
          toast.error("Mobile number must be a 10-digit number starting with 6, 7, 8, or 9.");
          return;
        }
      }

      try {
        await login(input, values.password);
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
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(values.email)) {
          toast.error("Please enter a valid email address.");
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
        if (!values.address || values.address.trim().length < 5) {
          toast.error("Address must be at least 5 characters long.");
          return;
        }
        if (!values.area || values.area.trim().length < 3) {
          toast.error("Area must be at least 3 characters long.");
          return;
        }
        if (!values.city || values.city.trim().length < 3) {
          toast.error("City must be at least 3 characters long.");
          return;
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
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(values.email)) {
          toast.error("Please enter a valid email address.");
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
      }

      // Form is 100% valid! Trigger OTP email & open verification modal
      triggerOtpFlow();
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
            "absolute top-0 left-0 h-full w-1/2 flex flex-col justify-start overflow-y-auto px-12 py-8 transition-all duration-700 ease-in-out z-20 no-scrollbar",
            isSignUp ? "translate-x-full opacity-0 pointer-events-none" : "opacity-100"
          )}
        >
          <form onSubmit={submit} className="w-full max-w-[420px] mx-auto flex flex-col items-center my-auto">
            <h1 className="text-4xl font-extrabold text-zinc-900 tracking-tight mb-2 self-start">Sign In</h1>

            <p className="text-xs font-bold text-zinc-400 mb-6 uppercase tracking-wider self-start">
              Sign in With Email / Mobile & Password
            </p>

            <div className="w-full space-y-4">
              <Field
                label="Email Address or Mobile Number"
                placeholder="Enter Email or 10-digit Mobile"
                type="text"
                value={values.email ?? ""}
                onChange={handleEmailOrMobileChange}
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
            "absolute top-0 left-0 h-full w-1/2 flex flex-col justify-start overflow-y-auto px-12 py-8 transition-all duration-700 ease-in-out z-10 opacity-0 pointer-events-none no-scrollbar",
            isSignUp ? "translate-x-full opacity-100 z-30 pointer-events-auto" : ""
          )}
        >
          <form onSubmit={submit} className="w-full max-w-[440px] mx-auto flex flex-col items-center my-auto">
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
                  "absolute top-0 left-0 w-1/2 h-full flex flex-col items-center justify-center px-12 text-center transition-all duration-700 ease-in-out",
                  isSignUp ? "translate-x-0 opacity-100" : "-translate-x-[20%] opacity-0"
                )}
              >
                {/* Overlay Top Bar */}
                <div className="absolute top-8 left-8 right-8 flex items-center justify-between z-20">
                  <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-xs font-bold text-zinc-200 hover:text-white transition-all bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/15 hover:border-[#FFC700]/50 shadow-md group cursor-pointer"
                  >
                    <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform text-[#FFC700]" />
                    <span>Back to Home</span>
                  </Link>

                  <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 shadow-md">
                    <span className="relative grid size-6 place-items-center rounded-lg overflow-hidden bg-[#0D0E12] border border-[#FFC700]/40">
                      <img src="/logo.png" alt="Caryanam Bidding" className="size-full object-cover" />
                    </span>
                    <p className="text-[11px] font-extrabold tracking-[0.18em] text-[#FFC700] uppercase">
                      Caryanam Bidding
                    </p>
                  </div>
                </div>

                {/* Premium Glassmorphic Card */}
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-10 rounded-[32px] max-w-md w-full flex flex-col items-center shadow-[0_25px_60px_rgba(0,0,0,0.35)] transition-all duration-500 hover:border-white/30 hover:bg-white/15">
                  <div className="size-16 rounded-2xl bg-gradient-to-b from-[#FFC700]/25 to-transparent border border-[#FFC700]/30 backdrop-blur-md flex items-center justify-center mb-6 shadow-[0_0_25px_rgba(255,199,0,0.15)]">
                    <img src="/logo.png" alt="Logo" className="size-9 object-contain drop-shadow-md" />
                  </div>

                  <h2 className="text-3xl font-black mb-3 tracking-tight uppercase text-white text-center">Active Workspace</h2>
                  <p className="text-zinc-300 mb-8 text-xs font-semibold leading-relaxed text-center max-w-xs">
                    Log in to resume your active auctions, manage digital inspections, and monitor live bids.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setRole(null);
                      setValues({});
                    }}
                    className="w-full bg-[#FFC700] hover:bg-[#FFD633] text-[#0D0E12] transition-all duration-300 py-3.5 rounded-full text-xs font-black tracking-widest uppercase cursor-pointer shadow-[0_4px_20px_rgba(255,199,0,0.3)] hover:shadow-[0_6px_25px_rgba(255,199,0,0.45)] hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Sign In
                  </button>
                </div>
              </div>

              {/* Right Panel (shown when isSignUp is false, offers to Sign Up) */}
              <div
                className={cn(
                  "absolute top-0 right-0 w-1/2 h-full flex flex-col items-center justify-center px-12 text-center transition-all duration-700 ease-in-out",
                  isSignUp ? "translate-x-[20%] opacity-0" : "translate-x-0 opacity-100"
                )}
              >
                {/* Overlay Top Bar */}
                <div className="absolute top-8 left-8 right-8 flex items-center justify-between z-20">
                  <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-xs font-bold text-zinc-200 hover:text-white transition-all bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/15 hover:border-[#FFC700]/50 shadow-md group cursor-pointer"
                  >
                    <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform text-[#FFC700]" />
                    <span>Back to Home</span>
                  </Link>

                  <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 shadow-md">
                    <span className="relative grid size-6 place-items-center rounded-lg overflow-hidden bg-[#0D0E12] border border-[#FFC700]/40">
                      <img src="/logo.png" alt="Caryanam Bidding" className="size-full object-cover" />
                    </span>
                    <p className="text-[11px] font-extrabold tracking-[0.18em] text-[#FFC700] uppercase">
                      Caryanam Bidding
                    </p>
                  </div>
                </div>

                {/* Premium Glassmorphic Card */}
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-10 rounded-[32px] max-w-md w-full flex flex-col items-center shadow-[0_25px_60px_rgba(0,0,0,0.35)] transition-all duration-500 hover:border-white/30 hover:bg-white/15">
                  <div className="size-16 rounded-2xl bg-gradient-to-b from-[#FFC700]/25 to-transparent border border-[#FFC700]/30 backdrop-blur-md flex items-center justify-center mb-6 shadow-[0_0_25px_rgba(255,199,0,0.15)]">
                    <img src="/logo.png" alt="Logo" className="size-9 object-contain drop-shadow-md" />
                  </div>

                  <h2 className="text-3xl font-black mb-3 tracking-tight uppercase text-white text-center">Caryanam Bidding</h2>
                  <p className="text-zinc-300 mb-8 text-xs font-semibold leading-relaxed text-center max-w-xs">
                    Access verified digital inspections, live remarketing, and supercar telemetry logs.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signup");
                      setRole("dealer");
                      setValues({});
                    }}
                    className="w-full bg-[#FFC700] hover:bg-[#FFD633] text-[#0D0E12] transition-all duration-300 py-3.5 rounded-full text-xs font-black tracking-widest uppercase cursor-pointer shadow-[0_4px_20px_rgba(255,199,0,0.3)] hover:shadow-[0_6px_25px_rgba(255,199,0,0.45)] hover:scale-[1.02] active:scale-[0.98]"
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
        {/* Back to Home Button Mobile */}
        <Link
          to="/"
          className="absolute top-6 left-6 z-30 inline-flex items-center gap-2 text-xs font-black text-white bg-[#0D0E12]/80 backdrop-blur-md px-3.5 py-2 rounded-full border border-[#FFC700]/40 shadow-md hover:bg-[#0D0E12] transition-all cursor-pointer"
        >
          <ArrowLeft className="size-4 text-[#FFC700]" />
          <span>Back to Home</span>
        </Link>

        {/* Background Car Image for brand feeling */}
        <div
          className="absolute top-0 left-0 w-full h-44 bg-cover bg-center"
          style={{ backgroundImage: `url(${authImage})` }}
        />
        <div className="absolute top-0 left-0 w-full h-44 bg-gradient-to-b from-[#0D0E12]/80 to-zinc-50" />

        {/* Top corporate brand logo */}
        <div className="flex items-center justify-end w-full max-w-md mx-auto mb-4 mt-6 relative z-10 px-4">
          <div className="flex items-center gap-2">
            <span className="relative grid size-8 place-items-center rounded-xl overflow-hidden bg-[#0D0E12] border border-[#FFC700]/40 shadow-sm">
              <img src="/logo.png" alt="Caryanam Bidding" className="size-full object-cover" />
            </span>
            <p className="text-xs font-extrabold tracking-[0.15em] text-[#0D0E12] uppercase">
              Caryanam Bidding
            </p>
          </div>
        </div>

        {mode === "login" ? (
          <form onSubmit={submit} className="w-full max-w-md mx-auto flex flex-col items-center relative z-10 bg-white p-8 rounded-[24px] shadow-md border border-zinc-100">
            <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight mb-1">Sign In</h1>

            <p className="text-xs font-bold text-zinc-400 mb-5 uppercase tracking-wider">
              Sign in With Email / Mobile & Password
            </p>

            <div className="w-full space-y-3">
              <Field
                label="Email Address or Mobile Number"
                placeholder="Enter Email or 10-digit Mobile"
                type="text"
                value={values.email ?? ""}
                onChange={handleEmailOrMobileChange}
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

      {/* OTP Verification Modal Popup */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#0D0E12] border border-[#FFC700]/30 rounded-3xl p-6 sm:p-8 shadow-2xl text-white">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowOtpModal(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white transition-colors cursor-pointer p-1"
            >
              <X className="size-5" />
            </button>

            {/* Header Icon */}
            <div className="flex flex-col items-center text-center">
              <div className="size-16 rounded-2xl bg-gradient-to-b from-[#FFC700]/25 to-transparent border border-[#FFC700]/30 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(255,199,0,0.2)]">
                <Mail className="size-8 text-[#FFC700]" />
              </div>

              <h3 className="text-2xl font-extrabold text-white tracking-tight">
                Verify Email Address
              </h3>

              <p className="text-xs font-semibold text-zinc-400 mt-2 max-w-xs leading-relaxed">
                We've sent a 6-digit verification code to:
                <span className="block text-sm font-bold text-[#FFC700] mt-1 font-mono break-all">
                  {values.email}
                </span>
              </p>
            </div>

            {/* OTP Input Box */}
            <div className="mt-6">
              <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center mb-2">
                Enter 6-Digit OTP Code
              </label>
              <input
                type="text"
                maxLength={6}
                autoFocus
                value={otpInput}
                onChange={(e) => {
                  setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 6));
                  if (otpError) setOtpError(null);
                }}
                placeholder="0 0 0 0 0 0"
                className="w-full text-center text-3xl font-black tracking-[10px] font-mono bg-[#16181F] border border-[#FFC700]/30 focus:border-[#FFC700] text-[#FFC700] placeholder-zinc-700 py-3.5 rounded-2xl outline-none transition-all shadow-inner"
              />
            </div>

            {/* Error Alert Box */}
            {otpError && (
              <div className="mt-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 px-4 py-2.5 rounded-xl text-xs font-bold text-center">
                {otpError}
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={handleVerifyAndRegister}
                disabled={verifyingOtp || otpInput.length !== 6}
                className="w-full bg-[#FFC700] hover:bg-[#FFD633] text-[#0D0E12] py-4 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-[0_4px_15px_rgba(255,199,0,0.3)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
              >
                {verifyingOtp ? (
                  <span className="flex items-center gap-2">
                    <span className="size-4 animate-spin rounded-full border-2 border-[#0D0E12] border-t-transparent" />
                    Verifying & Creating Account...
                  </span>
                ) : (
                  "Verify & Complete Registration"
                )}
              </button>

              <div className="flex items-center justify-between text-xs px-1">
                <span className="text-zinc-500 font-semibold">Didn't receive the email?</span>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || sendingOtp}
                  className="font-bold text-[#FFC700] hover:underline disabled:text-zinc-500 disabled:no-underline cursor-pointer flex items-center gap-1"
                >
                  {sendingOtp ? (
                    "Sending..."
                  ) : resendCooldown > 0 ? (
                    `Resend OTP in ${resendCooldown}s`
                  ) : (
                    <>
                      <RefreshCw className="size-3" /> Resend OTP
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
