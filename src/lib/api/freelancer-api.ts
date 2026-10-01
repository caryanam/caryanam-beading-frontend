import axios from "axios";
import { toast } from "sonner";
import { API_BASE_URL } from "../api";
import { readSession } from "../session";
import type { InspectionDraftRequest, InspectionSummary } from "./inspector-api";

export const freelancerApiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

freelancerApiClient.interceptors.request.use(
  (config) => {
    const session = readSession("freelancer") || readSession();
    if (session?.token && config.headers) {
      config.headers.Authorization = `Bearer ${session.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

freelancerApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && readSession("freelancer")) {
      window.dispatchEvent(new CustomEvent("session-expired", { detail: { role: "freelancer" } }));
    }
    return Promise.reject(error);
  }
);

// Dedicated Freelancer API Endpoints (/api/freelancer/*)
export const getFreelancerInspections = async (
  params?: { freelancerId?: number | string; all?: boolean; scope?: string } | number | string
): Promise<{ success: boolean; data: InspectionSummary[] }> => {
  try {
    let queryString = "";
    if (typeof params === "object" && params !== null) {
      const q = new URLSearchParams();
      if (params.freelancerId) q.append("freelancerId", String(params.freelancerId));
      if (params.all) q.append("all", "true");
      if (params.scope) q.append("scope", params.scope);
      queryString = q.toString() ? `?${q.toString()}` : "";
    } else if (params !== undefined && params !== null) {
      queryString = `?freelancerId=${params}`;
    }

    const res = await freelancerApiClient.get(`/api/freelancer/inspection${queryString}`);
    return res.data;
  } catch (err: any) {
    if (err.response?.status === 404 || err.response?.status === 403) {
      try {
        let altQuery = "";
        if (typeof params === "object" && params !== null) {
          const q = new URLSearchParams();
          if (params.freelancerId) q.append("freelancerId", String(params.freelancerId));
          if (params.all) q.append("all", "true");
          altQuery = q.toString() ? `?${q.toString()}` : "";
        } else if (params !== undefined && params !== null) {
          altQuery = `?freelancerId=${params}`;
        }
        const altRes = await freelancerApiClient.get(`/api/freelancer/vehicles${altQuery}`);
        return altRes.data;
      } catch {
        return { success: true, data: [] };
      }
    }
    return { success: false, data: [] };
  }
};

export const getFreelancerInspectionDetails = async (id: number | string): Promise<{ success: boolean; data: any }> => {
  try {
    const res = await freelancerApiClient.get(`/api/freelancer/inspection/${id}`);
    return res.data;
  } catch (err: any) {
    if (err.response?.status === 404 || err.response?.status === 403) {
      const altRes = await freelancerApiClient.get(`/api/freelancer/vehicles/${id}`);
      return altRes.data;
    }
    throw err;
  }
};

export const saveFreelancerInspectionDraft = async (payload: InspectionDraftRequest): Promise<{ success: boolean; data: any }> => {
  try {
    const res = await freelancerApiClient.post("/api/freelancer/inspection", payload);
    return res.data;
  } catch (err: any) {
    if (err.response?.status === 404 || err.response?.status === 403) {
      const altRes = await freelancerApiClient.post("/api/freelancer/vehicles", payload);
      return altRes.data;
    }
    throw err;
  }
};

export const updateFreelancerInspectionDraft = async (id: number | string, payload: InspectionDraftRequest): Promise<{ success: boolean; data: any }> => {
  try {
    const res = await freelancerApiClient.put(`/api/freelancer/inspection/${id}`, payload);
    return res.data;
  } catch (err: any) {
    if (err.response?.status === 404 || err.response?.status === 403) {
      const altRes = await freelancerApiClient.put(`/api/freelancer/vehicles/${id}`, payload);
      return altRes.data;
    }
    throw err;
  }
};

export const uploadFreelancerInspectionImage = async (id: number | string, category: string, file: File): Promise<{ success: boolean; data: string }> => {
  const formData = new FormData();
  formData.append("category", category);
  formData.append("file", file);
  try {
    const res = await freelancerApiClient.post(`/api/freelancer/inspection/${id}/image`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  } catch (err: any) {
    if (err.response?.status === 404 || err.response?.status === 403) {
      const altRes = await freelancerApiClient.post(`/api/freelancer/vehicles/${id}/image`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return altRes.data;
    }
    throw err;
  }
};

export const submitFreelancerInspectionReport = async (id: number | string): Promise<{ success: boolean }> => {
  try {
    const res = await freelancerApiClient.post(`/api/freelancer/inspection/${id}/submit`);
    return res.data;
  } catch (err: any) {
    if (err.response?.status === 404 || err.response?.status === 403) {
      const altRes = await freelancerApiClient.post(`/api/freelancer/vehicles/${id}/submit`);
      return altRes.data;
    }
    throw err;
  }
};

export const deleteFreelancerInspectionDraft = async (id: number | string): Promise<{ success: boolean }> => {
  try {
    const res = await freelancerApiClient.delete(`/api/freelancer/inspection/${id}`);
    return res.data;
  } catch (err: any) {
    if (err.response?.status === 404 || err.response?.status === 403) {
      const altRes = await freelancerApiClient.delete(`/api/freelancer/vehicles/${id}`);
      return altRes.data;
    }
    throw err;
  }
};

// Freelancer Notifications API (/api/freelancer/notifications)
export const getFreelancerNotifications = async (): Promise<{ success: boolean; data: any[] }> => {
  try {
    const res = await freelancerApiClient.get("/api/freelancer/notifications");
    return res.data;
  } catch (err: any) {
    try {
      const altRes = await freelancerApiClient.get("/api/freelancer/inspection/notifications");
      return altRes.data;
    } catch {
      return { success: true, data: [] };
    }
  }
};

export const markFreelancerNotificationAsRead = async (id: number | string): Promise<{ success: boolean }> => {
  try {
    const res = await freelancerApiClient.put(`/api/freelancer/notifications/${id}/read`);
    return res.data;
  } catch (err: any) {
    try {
      const altRes = await freelancerApiClient.post(`/api/freelancer/notifications/${id}/read`);
      return altRes.data;
    } catch {
      return { success: true };
    }
  }
};

export const markAllFreelancerNotificationsAsRead = async (): Promise<{ success: boolean }> => {
  try {
    const res = await freelancerApiClient.put("/api/freelancer/notifications/mark-all-read");
    return res.data;
  } catch (err: any) {
    try {
      const altRes = await freelancerApiClient.post("/api/freelancer/notifications/mark-all-read");
      return altRes.data;
    } catch {
      return { success: true };
    }
  }
};

export interface FreelancerProfile {
  id: number;
  fullName: string;
  email: string;
  mobileNumber: string;
  role: string;
}

export const getFreelancerProfile = async (): Promise<{ success: boolean; data: FreelancerProfile }> => {
  const res = await freelancerApiClient.get("/api/freelancer/profile");
  return res.data;
};

export const updateFreelancerProfile = async (data: { fullName: string; email?: string; mobileNumber: string }): Promise<{ success: boolean; data: FreelancerProfile }> => {
  const res = await freelancerApiClient.put("/api/freelancer/profile", data);
  return res.data;
};

export const changeFreelancerPassword = async (data: any): Promise<{ success: boolean }> => {
  const res = await freelancerApiClient.put("/api/freelancer/profile/password", data);
  return res.data;
};
