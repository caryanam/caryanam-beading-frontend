import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient, publicClient, decodeToken } from "@/lib/api";
import {
  saveSession,
  readSession,
  clearSession,
  homeFor,
  normalizeRole,
  type Session,
} from "@/lib/session";
import { toast } from "sonner";

export function useAuth() {
  const navigate = useNavigate();
  const [user, setUser] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync user state with localStorage on mount
  useEffect(() => {
    setUser(readSession());
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await publicClient.post("/api/auth/login", { email, password });
      const apiResponse = response.data;

      if (apiResponse.success && apiResponse.data) {
        const authData = apiResponse.data;
        const token = authData.token;

        const decoded = decodeToken(token);
        console.log("Decoded Token Claims:", decoded);

        const rawRole = decoded?.role || authData.role;
        const role = normalizeRole(rawRole);

        const newSession: Session = {
          id: authData.id,
          dealerId: authData.id,
          name: authData.fullName || decoded?.fullName || authData.email.split("@")[0],
          dealershipName: authData.dealershipName || authData.fullName,
          email: authData.email,
          role: role,
          mobileNumber: authData.mobileNumber,
          token: token,
        };

        saveSession(newSession);
        setUser(newSession);
        toast.success(apiResponse.message || "Login successful!");
        
        navigate(homeFor(role), { replace: true });
        return newSession;
      } else {
        throw new Error(apiResponse.message || "Invalid credentials.");
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || "Invalid credentials. Please check your email/mobile number and password.";
      setError(errMsg);
      toast.error(errMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const registerDealer = async (data: {
    dealershipName: string;
    ownerName: string;
    email: string;
    mobile: string;
    password: string;
    address?: string;
    area?: string;
    city?: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await publicClient.post("/api/dealer/register", {
        ...data,
        confirmPassword: data.password,
      });
      const apiResponse = response.data;

      if (apiResponse.success) {
        toast.success(apiResponse.message || "Dealer registered successfully! Please log in.");
        return true;
      } else {
        throw new Error(apiResponse.message || "Registration failed.");
      }
    } catch (err: any) {
      const apiErrors = err.response?.data?.errors;
      if (Array.isArray(apiErrors) && apiErrors.length > 0) {
        apiErrors.forEach((errorStr: string) => {
          toast.error(errorStr);
        });
      }
      const errMsg = err.response?.data?.message || err.message || "Dealer registration failed.";
      setError(errMsg);
      if (!Array.isArray(apiErrors) || apiErrors.length === 0) {
        toast.error(errMsg);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const registerInspector = async (data: {
    fullName: string;
    email: string;
    mobile: string;
    password: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await publicClient.post("/api/inspector/register", {
        ...data,
        confirmPassword: data.password,
      });
      const apiResponse = response.data;

      if (apiResponse.success) {
        toast.success(apiResponse.message || "Inspector registered successfully! Please log in.");
        return true;
      } else {
        throw new Error(apiResponse.message || "Registration failed.");
      }
    } catch (err: any) {
      const apiErrors = err.response?.data?.errors;
      if (Array.isArray(apiErrors) && apiErrors.length > 0) {
        apiErrors.forEach((errorStr: string) => {
          toast.error(errorStr);
        });
      }
      const errMsg = err.response?.data?.message || err.message || "Inspector registration failed.";
      setError(errMsg);
      if (!Array.isArray(apiErrors) || apiErrors.length === 0) {
        toast.error(errMsg);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const registerFreelancer = async (data: {
    fullName: string;
    email: string;
    mobile: string;
    password: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await publicClient.post("/api/freelancer/register", {
        ...data,
        confirmPassword: data.password,
      });
      const apiResponse = response.data;

      if (apiResponse.success) {
        toast.success(apiResponse.message || "Freelancer registered successfully! Please log in.");
        return true;
      } else {
        throw new Error(apiResponse.message || "Registration failed.");
      }
    } catch (err: any) {
      const apiErrors = err.response?.data?.errors;
      if (Array.isArray(apiErrors) && apiErrors.length > 0) {
        apiErrors.forEach((errorStr: string) => {
          toast.error(errorStr);
        });
      }
      const errMsg = err.response?.data?.message || err.message || "Freelancer registration failed.";
      setError(errMsg);
      if (!Array.isArray(apiErrors) || apiErrors.length === 0) {
        toast.error(errMsg);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearSession(user?.role);
    setUser(null);
    toast.success("Logged out successfully.");
    navigate("/", { replace: true });
  };

  const sendOtp = async (email: string, mobile?: string) => {
    setLoading(true);
    try {
      const response = await publicClient.post("/api/auth/send-otp", { email, mobile });
      toast.success(response.data.message || "OTP sent successfully to your email!");
      return true;
    } catch (err: any) {
      const errMsg = err.response?.data?.message || "Failed to send OTP.";
      toast.error(errMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (email: string, otp: string) => {
    setLoading(true);
    try {
      const response = await publicClient.post("/api/auth/verify-otp", { email, otp });
      if (response.data.success) {
        toast.success("Email verified successfully!");
        return true;
      } else {
        toast.error(response.data.message || "Invalid OTP.");
        return false;
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || "Invalid or expired OTP.";
      toast.error(errMsg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const sendPasswordOtp = async (email: string) => {
    setLoading(true);
    try {
      const response = await publicClient.post("/api/auth/send-password-otp", { email });
      toast.success(response.data.message || "OTP sent successfully to your email!");
      return true;
    } catch (err: any) {
      const errMsg = err.response?.data?.message || "Failed to send OTP.";
      toast.error(errMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string, otp: string, newPassword: string) => {
    setLoading(true);
    setError(null);
    const payload = {
      email,
      otp,
      newPassword,
      password: newPassword,
      confirmPassword: newPassword,
    };

    const endpoints = [
      { method: "post", url: "/api/auth/reset-password" },
      { method: "put", url: "/api/auth/reset-password" },
      { method: "post", url: "/api/auth/update-password" },
      { method: "put", url: "/api/auth/update-password" },
      { method: "post", url: "/api/auth/change-password" },
      { method: "put", url: "/api/auth/change-password" },
      { method: "post", url: "/api/auth/forgot-password" },
      { method: "put", url: "/api/auth/forgot-password" },
    ];

    let lastError: any = null;

    for (const ep of endpoints) {
      try {
        const res = ep.method === "put"
          ? await publicClient.put(ep.url, payload)
          : await publicClient.post(ep.url, payload);
        
        if (res.data?.success !== false) {
          toast.success(res.data?.message || "Password reset successfully! Please sign in.");
          return true;
        }
      } catch (err: any) {
        lastError = err;
        const status = err.response?.status;
        const msg = String(err.response?.data?.message || err.response?.data || "");
        if (status === 404 || msg.includes("No static resource") || msg.includes("Not Found")) {
          continue;
        }
        const realMsg = err.response?.data?.message || err.message || "Password reset failed.";
        setError(realMsg);
        toast.error(realMsg);
        throw err;
      }
    }

    const finalMsg = lastError?.response?.data?.message || lastError?.message || "Password reset failed.";
    setError(finalMsg);
    toast.error(finalMsg);
    throw lastError;
  };

  return {
    user,
    loading,
    error,
    login,
    registerDealer,
    registerInspector,
    registerFreelancer,
    sendOtp,
    sendPasswordOtp,
    verifyOtp,
    resetPassword,
    logout,
  };
}
