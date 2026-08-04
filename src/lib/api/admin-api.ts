import axios from "axios";
import { API_BASE_URL } from "../api";
import { readSession } from "../session";

export const adminApiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

adminApiClient.interceptors.request.use(
  (config) => {
    const session = readSession("admin");
    if (session?.token && config.headers) {
      config.headers.Authorization = `Bearer ${session.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

adminApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.dispatchEvent(new CustomEvent("session-expired", { detail: { role: "admin" } }));
    }
    return Promise.reject(error);
  }
);

// Admin Vehicle & Inspection Management APIs
export interface AdminInspectionSummary {
  inspectionId: number;
  vehicleNumber: string;
  ownerName: string;
  brand: string;
  model: string;
  variant: string;
  status: string;
  submittedAt: string | null;
  inspectorName: string;
  suggestedPrice?: number;
  rejectionReason?: string;
  vehicleStatus?: string;
  currentHighestBid?: number;
  currentHighestBidder?: string;
  auctionEndTime?: number;
  totalBids?: number;
}

export const getSubmittedInspections = async () => {
  const res = await adminApiClient.get<any>("/api/admin/inspections");
  return res.data;
};

export const getInspectionById = async (id: number) => {
  const res = await adminApiClient.get<any>(`/api/admin/inspection/${id}`);
  return res.data;
};

export const approveInspection = async (id: number) => {
  const res = await adminApiClient.put<any>(`/api/admin/inspection/${id}/approve`);
  return res.data;
};

export const rejectInspection = async (id: number, reason: string) => {
  const res = await adminApiClient.put<any>(`/api/admin/inspection/${id}/reject`, { reason });
  return res.data;
};

export interface DealerWonBid {
  vehicleId: number;
  vehicleNumber: string;
  brand: string;
  model: string;
  variant: string;
  winningBidAmount: number;
  status: string;
}

export interface AdminDealer {
  id: number;
  dealershipName: string;
  ownerName: string;
  email: string;
  mobileNumber: string;
  role: string;
  address?: string;
  area?: string;
  city?: string;
  totalBids?: number;
  wonBidsCount?: number;
  wonBids?: DealerWonBid[];
}

export const getRegisteredDealers = async (): Promise<{ success: boolean; data: AdminDealer[] }> => {
  const res = await adminApiClient.get("/api/admin/dealers");
  return res.data;
};

export const updateAdminDealer = async (id: number, data: Partial<AdminDealer>): Promise<{ success: boolean; data?: AdminDealer; message?: string }> => {
  const res = await adminApiClient.put(`/api/admin/dealer/${id}`, data);
  return res.data;
};

export const deleteAdminDealer = async (id: number): Promise<{ success: boolean; message?: string }> => {
  const res = await adminApiClient.delete(`/api/admin/dealer/${id}`);
  return res.data;
};

export const importDealersExcel = async (file: File): Promise<{ success: boolean; message?: string }> => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await adminApiClient.post("/api/admin/dealers/import", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

export const startLiveAuction = async (id: number): Promise<{ success: boolean }> => {
  const res = await adminApiClient.put(`/api/admin/inspection/${id}/go-live`);
  return res.data;
};

export const stopLiveAuction = async (id: number): Promise<{ success: boolean }> => {
  try {
    const res = await adminApiClient.put(`/api/admin/inspection/${id}/stop-auction`);
    return res.data;
  } catch (err) {
    const res = await adminApiClient.put(`/api/admin/inspection/${id}/stop`);
    return res.data;
  }
};

export const getAdminBidHistory = async (id: number): Promise<{ success: boolean; data: { dealer: string; amount: number; time: string }[] }> => {
  const res = await adminApiClient.get(`/api/admin/inspection/${id}/bids`);
  return res.data;
};
