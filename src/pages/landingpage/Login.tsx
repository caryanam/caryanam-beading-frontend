import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  ClipboardCheck,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  RefreshCw,
  ShieldCheck,
  X,
  UserCheck,
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
      key: "freelancer",
      title: "Freelancer",
      copy: "Upload basic vehicle specs, photos, and video for quick bidding.",
      icon: UserCheck,
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
      <label className="text-[10px] sm:text-[11px] font-extrabold text-zinc-700 dark:text-zinc-300 tracking-wider uppercase px-1 flex items-center">
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
          className="w-full rounded-[14px] bg-[#f4f5f8] dark:bg-[#181A24] border border-zinc-200/80 dark:border-zinc-800 focus:bg-white dark:focus:bg-[#1C1E2B] focus:border-[#FFC700] px-4.5 py-3 sm:py-3.5 text-sm font-semibold text-zinc-900 dark:text-white placeholder-zinc-400 outline-none transition-all focus:ring-2 focus:ring-[#FFC700]/20"
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

  const { login, registerDealer, registerInspector, registerFreelancer, sendOtp, sendPasswordOtp, verifyOtp, resetPassword, loading } = useAuth();

  // Forgot Password State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);
  const [resetEmail, setResetEmail] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotAlert, setForgotAlert] = useState<{ text: string; type: "error" | "success" | "warning" } | null>(null);
  const [forgotResendCooldown, setForgotResendCooldown] = useState(0);

  useEffect(() => {
    if (forgotResendCooldown > 0) {
      const timer = setTimeout(() => setForgotResendCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [forgotResendCooldown]);

  const openForgotModal = () => {
    setResetEmail(values.email || "");
    setResetOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setForgotStep(1);
    setForgotAlert(null);
    setShowForgotModal(true);
  };

  const handleSendResetOtp = async () => {
    const input = resetEmail.trim();
    if (!input) {
      setForgotAlert({ text: "Please enter your registered Email address.", type: "warning" });
      return;
    }
    setForgotLoading(true);
    setForgotAlert(null);
    try {
      await sendPasswordOtp(input);
      setForgotAlert({ text: "Verification OTP sent to your email!", type: "success" });
      setForgotStep(2);
      setForgotResendCooldown(60);
    } catch (err: any) {
      setForgotAlert({ text: err.response?.data?.message || err.message || "Failed to send OTP.", type: "error" });
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyResetOtp = async () => {
    const otp = resetOtp.trim();
    if (!otp || otp.length !== 6) {
      setForgotAlert({ text: "Please enter the 6-digit OTP code.", type: "warning" });
      return;
    }
    setForgotLoading(true);
    setForgotAlert(null);
    try {
      const verified = await verifyOtp(resetEmail.trim(), otp);
      if (verified) {
        setForgotAlert({ text: "OTP verified! Please set your new password.", type: "success" });
        setForgotStep(3);
      } else {
        setForgotAlert({ text: "Invalid or expired OTP code.", type: "error" });
      }
    } catch (err: any) {
      setForgotAlert({ text: err.response?.data?.message || err.message || "OTP verification failed.", type: "error" });
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword) {
      setForgotAlert({ text: "Please enter a new password.", type: "warning" });
      return;
    }
    if (newPassword.length < 6) {
      setForgotAlert({ text: "Password must be at least 6 characters long.", type: "warning" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotAlert({ text: "Passwords do not match.", type: "warning" });
      return;
    }

    setForgotLoading(true);
    setForgotAlert(null);
    try {
      await resetPassword(resetEmail.trim(), resetOtp.trim(), newPassword);
      setShowForgotModal(false);
      setMode("login");
      setValues({ email: resetEmail.trim() });
    } catch (err: any) {
      setForgotAlert({ text: err.response?.data?.message || err.message || "Password reset failed.", type: "error" });
    } finally {
      setForgotLoading(false);
    }
  };


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
      } else if (role === "freelancer") {
        const success = await registerFreelancer({
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
              <button
                type="button"
                onClick={openForgotModal}
                className="text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-[#FFC700] dark:hover:text-[#FFC700] transition-colors cursor-pointer"
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
            "absolute top-0 left-0 h-full w-1/2 flex flex-col justify-start overflow-y-auto px-12 py-8 transition-all duration-700 ease-in-out z-10 opacity-0 pointer-events-none no-scrollbar",
            isSignUp ? "translate-x-full opacity-100 z-30 pointer-events-auto" : ""
          )}
        >
          <form onSubmit={submit} className="w-full max-w-[440px] mx-auto flex flex-col items-center my-auto">
            <h1 className="text-4xl font-extrabold text-zinc-900 tracking-tight mb-2 self-start">Sign Up</h1>

            {/* Role selector */}
            <div className="grid grid-cols-3 gap-1 rounded-[14px] bg-zinc-100 p-1 border border-zinc-200/50 w-full mb-4">
              {(["dealer", "inspector", "freelancer"] as const).map((r) => (
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
                  ) : r === "inspector" ? (
                    <>
                      <ClipboardCheck className="size-3.5" />
                      Inspector
                    </>
                  ) : (
                    <>
                      <UserCheck className="size-3.5" />
                      Freelancer
                    </>
                  )}
                </button>
              ))}
            </div>

            {/* Inputs Grid */}
            <div className="w-full max-h-[350px] overflow-y-auto pr-1 no-scrollbar space-y-3">

              {(role === "inspector" || role === "freelancer") && (
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

      {/* Mobile & Tablet Form Layout (< 1024px) - Premium Combination Theme */}
      <div className="lg:hidden w-full min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col justify-between relative overflow-hidden px-4 sm:px-6 py-6 sm:py-10">
        {/* Top Dark Hero Backdrop */}
        <div className="absolute top-0 left-0 w-full h-64 sm:h-72 bg-[#0D0E12] overflow-hidden">
          <img
            src={authImage}
            alt="Luxury Supercar Background"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0D0E12]/80 via-[#0D0E12]/60 to-slate-50 dark:to-zinc-950" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[500px] h-[200px] bg-[#FFC700]/15 rounded-full blur-[100px] pointer-events-none" />
        </div>

        {/* Top Bar Navigation */}
        <div className="relative z-20 flex items-center justify-between w-full max-w-md sm:max-w-xl mx-auto mb-4 sm:mb-6 pt-1">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-zinc-200 hover:text-white transition-all bg-[#0D0E12]/80 backdrop-blur-md px-3.5 sm:px-4 py-2 rounded-full border border-white/15 hover:border-[#FFC700]/50 shadow-md group cursor-pointer"
          >
            <ArrowLeft className="size-4 text-[#FFC700] group-hover:-translate-x-1 transition-transform" />
            <span>Back to Home</span>
          </Link>

          <div className="flex items-center gap-2 bg-[#0D0E12]/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 shadow-md">
            <span className="relative grid size-6 place-items-center rounded-lg overflow-hidden bg-[#0D0E12] border border-[#FFC700]/40">
              <img src="/logo.png" alt="Caryanam Bidding" className="size-full object-cover" />
            </span>
            <span className="text-[10px] sm:text-[11px] font-black tracking-[0.15em] text-[#FFC700] uppercase">
              Caryanam Bidding
            </span>
          </div>
        </div>

        {/* Combination Glass Card */}
        <div className="relative z-20 w-full max-w-md sm:max-w-xl mx-auto my-auto bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-6 sm:p-8 rounded-[28px] sm:rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col">

          {/* Mode Switcher Tabs (Sign In vs Sign Up) */}
          <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 p-1.5 border border-zinc-200/60 dark:border-zinc-700 mb-6">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setRole(null);
                setValues({});
              }}
              className={cn(
                "rounded-xl py-2.5 sm:py-3 text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2",
                mode === "login"
                  ? "bg-[#FFC700] text-[#0D0E12] shadow-md font-black"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
              )}
            >
              <Zap className={cn("size-4", mode === "login" ? "text-[#0D0E12]" : "text-[#FFC700]")} />
              <span>Sign In</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setRole("dealer");
                setValues({});
              }}
              className={cn(
                "rounded-xl py-2.5 sm:py-3 text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2",
                mode === "signup"
                  ? "bg-[#FFC700] text-[#0D0E12] shadow-md font-black"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
              )}
            >
              <UserCheck className={cn("size-4", mode === "signup" ? "text-[#0D0E12]" : "text-[#FFC700]")} />
              <span>Sign Up</span>
            </button>
          </div>

          {/* Render Sign In Form */}
          {mode === "login" ? (
            <form onSubmit={submit} className="w-full flex flex-col">
              <div className="text-left mb-5">
                <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">Welcome Back</h1>
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-1">
                  Sign in with your Email Address or Mobile Number
                </p>
              </div>

              <div className="space-y-4">
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

              <div className="flex justify-end items-center my-4 text-xs">
                <button
                  type="button"
                  onClick={openForgotModal}
                  className="font-bold text-zinc-600 dark:text-zinc-400 hover:text-[#FFC700] transition-colors cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#FFC700] hover:bg-[#FFD633] text-[#0D0E12] py-3.5 sm:py-4 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-300 shadow-[0_4px_16px_rgba(255,199,0,0.35)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#0D0E12] border-t-transparent" />
                    Processing...
                  </span>
                ) : (
                  "Sign In to Bidding Portal"
                )}
              </button>
            </form>
          ) : (
            /* Render Sign Up Form */
            <form onSubmit={submit} className="w-full flex flex-col">
              <div className="text-left mb-4">
                <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">Create Account</h1>
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-1">
                  Select your role to start bidding and remarketing
                </p>
              </div>

              {/* Role selector - 3 Tabs for Dealer, Inspector & Freelancer */}
              <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 p-1 border border-zinc-200/60 dark:border-zinc-700 w-full mb-4">
                {(["dealer", "inspector", "freelancer"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setRole(r);
                      setValues({});
                    }}
                    className={cn(
                      "rounded-xl py-2 sm:py-2.5 px-1 text-[10px] xs:text-xs font-extrabold capitalize transition-all cursor-pointer flex items-center justify-center gap-1.5",
                      role === r
                        ? "bg-[#FFC700] text-[#0D0E12] shadow-sm font-black"
                        : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                    )}
                  >
                    {r === "dealer" ? (
                      <>
                        <Building2 className="size-3.5 shrink-0" />
                        <span className="truncate">Dealer</span>
                      </>
                    ) : r === "inspector" ? (
                      <>
                        <ClipboardCheck className="size-3.5 shrink-0" />
                        <span className="truncate">Inspector</span>
                      </>
                    ) : (
                      <>
                        <UserCheck className="size-3.5 shrink-0" />
                        <span className="truncate">Freelancer</span>
                      </>
                    )}
                  </button>
                ))}
              </div>

              {/* Inputs Stack */}
              <div className="w-full space-y-3 max-h-[48vh] sm:max-h-[55vh] overflow-y-auto no-scrollbar pr-1">
                {(role === "inspector" || role === "freelancer") && (
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                    <div className="col-span-1 sm:col-span-2">
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

                    <div className="col-span-1 sm:col-span-2">
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
                        placeholder="Area"
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
                className="mt-5 w-full bg-[#FFC700] hover:bg-[#FFD633] text-[#0D0E12] py-3.5 sm:py-4 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-300 shadow-[0_4px_16px_rgba(255,199,0,0.35)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#0D0E12] border-t-transparent" />
                    Processing...
                  </span>
                ) : (
                  "Create Account"
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer info text */}
        <div className="relative z-20 text-center text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mt-4">
          © 2026 Caryanam Bidding • Encrypted & Verifiable B2B Telemetry
        </div>
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

      {/* ── FORGOT PASSWORD MODAL POPUP ── */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#0D0E12] border border-[#FFC700]/30 rounded-3xl p-6 sm:p-8 shadow-2xl text-white">
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white transition-colors cursor-pointer p-1"
            >
              <X className="size-5" />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="size-16 rounded-2xl bg-gradient-to-b from-[#FFC700]/25 to-transparent border border-[#FFC700]/30 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(255,199,0,0.2)]">
                <KeyRound className="size-8 text-[#FFC700]" />
              </div>
              <h3 className="text-2xl font-extrabold text-white tracking-tight">
                {forgotStep === 1 ? "Forgot Password?" : forgotStep === 2 ? "Verify OTP Code" : "Set New Password"}
              </h3>
              <p className="text-xs font-semibold text-zinc-400 mt-2 max-w-xs leading-relaxed">
                {forgotStep === 1
                  ? "Enter your registered Email address to receive a password reset OTP."
                  : forgotStep === 2
                  ? `Enter the 6-digit verification code sent to ${resetEmail}`
                  : "Create a new secure password for your account."}
              </p>
            </div>

            {forgotAlert && (
              <div
                className={
                  "mt-4 px-4 py-2.5 rounded-xl text-xs font-bold text-center border " +
                  (forgotAlert.type === "error"
                    ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                    : forgotAlert.type === "success"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-400")
                }
              >
                {forgotAlert.text}
              </div>
            )}

            {/* STEP 1: Enter Email */}
            {forgotStep === 1 && (
              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">
                    Registered Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="Enter your registered email"
                      className="w-full bg-[#16181F] border border-white/10 focus:border-[#FFC700] text-white placeholder-zinc-500 px-4 py-3 rounded-xl text-sm font-semibold outline-none transition-all"
                    />
                    <Mail className="size-4 text-zinc-400 absolute right-4 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSendResetOtp}
                  disabled={forgotLoading || !resetEmail.trim()}
                  className="w-full bg-[#FFC700] hover:bg-[#FFD633] text-[#0D0E12] py-3.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-[0_4px_15px_rgba(255,199,0,0.3)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                >
                  {forgotLoading ? "Sending OTP..." : "Send Reset OTP"}
                </button>
              </div>
            )}

            {/* STEP 2: Enter OTP Code */}
            {forgotStep === 2 && (
              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center mb-2">
                    Enter 6-Digit OTP Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    autoFocus
                    value={resetOtp}
                    onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="0 0 0 0 0 0"
                    className="w-full text-center text-3xl font-black tracking-[10px] font-mono bg-[#16181F] border border-[#FFC700]/30 focus:border-[#FFC700] text-[#FFC700] placeholder-zinc-700 py-3 rounded-2xl outline-none transition-all shadow-inner"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleVerifyResetOtp}
                  disabled={forgotLoading || resetOtp.length !== 6}
                  className="w-full bg-[#FFC700] hover:bg-[#FFD633] text-[#0D0E12] py-3.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-[0_4px_15px_rgba(255,199,0,0.3)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                >
                  {forgotLoading ? "Verifying..." : "Verify OTP Code"}
                </button>

                <div className="flex items-center justify-center text-xs pt-1">
                  <button
                    type="button"
                    onClick={handleSendResetOtp}
                    disabled={forgotResendCooldown > 0 || forgotLoading}
                    className="font-bold text-[#FFC700] hover:underline disabled:text-zinc-500 disabled:no-underline cursor-pointer"
                  >
                    {forgotResendCooldown > 0 ? `Resend OTP in ${forgotResendCooldown}s` : "Resend OTP Code"}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Set New Password */}
            {forgotStep === 3 && (
              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full bg-[#16181F] border border-white/10 focus:border-[#FFC700] text-white placeholder-zinc-500 px-4 py-3 rounded-xl text-sm font-semibold outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-[#FFC700]"
                    >
                      {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full bg-[#16181F] border border-white/10 focus:border-[#FFC700] text-white placeholder-zinc-500 px-4 py-3 rounded-xl text-sm font-semibold outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-[#FFC700]"
                    >
                      {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={forgotLoading || !newPassword || !confirmPassword}
                  className="w-full bg-[#FFC700] hover:bg-[#FFD633] text-[#0D0E12] py-3.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-[0_4px_15px_rgba(255,199,0,0.3)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                >
                  {forgotLoading ? "Resetting Password..." : "Reset Password"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}