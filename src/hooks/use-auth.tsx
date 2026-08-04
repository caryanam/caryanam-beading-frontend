import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient, decodeToken } from "@/lib/api";
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
      const response = await apiClient.post("/api/auth/login", { email, password });
      const apiResponse = response.data;

      if (apiResponse.success && apiResponse.data) {
        const authData = apiResponse.data;
        const token = authData.token;

        // Decode JWT token to check for any encoded role or email claims
        const decoded = decodeToken(token);
        console.log("Decoded Token Claims:", decoded);

        // Extract role from token payload, falling back to the response body enum if not present
        const rawRole = decoded?.role || authData.role;
        const role = normalizeRole(rawRole);

        const newSession: Session = {
          id: authData.id,
          name: authData.fullName || decoded?.fullName || authData.email.split("@")[0],
          email: authData.email,
          role: role,
          mobileNumber: authData.mobileNumber,
          token: token,
        };

        saveSession(newSession);
        setUser(newSession);
        toast.success(apiResponse.message || "Login successful!");
        
        // Navigate role-wise to dashboard
        navigate(homeFor(role), { replace: true });
        return newSession;
      } else {
        throw new Error(apiResponse.message || "Invalid credentials.");
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || "Login failed.";
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
      const response = await apiClient.post("/api/dealer/register", {
        ...data,
        confirmPassword: data.password, // Set confirmPassword equal to password for validation
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
      const response = await apiClient.post("/api/inspector/register", {
        ...data,
        confirmPassword: data.password, // Set confirmPassword equal to password for validation
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

  const logout = () => {
    clearSession(user?.role);
    setUser(null);
    toast.success("Logged out successfully.");
    navigate("/", { replace: true });
  };

  return {
    user,
    loading,
    error,
    login,
    registerDealer,
    registerInspector,
    logout,
  };
}
