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
    const session = readSession("freelancer");
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
    if (error.response?.status === 401) {
      window.dispatchEvent(new CustomEvent("session-expired", { detail: { role: "freelancer" } }));
    }
    return Promise.reject(error);
  }
);

// Dedicated Freelancer API Endpoints (/api/freelancer/*)
export const getFreelancerInspections = async (): Promise<{ success: boolean; data: InspectionSummary[] }> => {
  try {
    const res = await freelancerApiClient.get("/api/freelancer/inspection");
    return res.data;
  } catch (err: any) {
    if (err.response?.status === 404 || err.response?.status === 403) {
      try {
        const altRes = await freelancerApiClient.get("/api/freelancer/vehicles");
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

export const updateFreelancerProfile = async (data: { fullName: string; mobileNumber: string }): Promise<{ success: boolean; data: FreelancerProfile }> => {
  const res = await freelancerApiClient.put("/api/freelancer/profile", data);
  return res.data;
};

export const changeFreelancerPassword = async (data: any): Promise<{ success: boolean }> => {
  const res = await freelancerApiClient.put("/api/freelancer/profile/password", data);
  return res.data;
};
