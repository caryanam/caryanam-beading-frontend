import axios from "axios";
import { API_BASE_URL } from "../api";
import { readSession } from "../session";

export const dealerApiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

dealerApiClient.interceptors.request.use(
  (config) => {
    const session = readSession("dealer");
    if (session?.token && config.headers) {
      config.headers.Authorization = `Bearer ${session.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

dealerApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.dispatchEvent(new CustomEvent("session-expired", { detail: { role: "dealer" } }));
    }
    return Promise.reject(error);
  }
);

export interface DealerInspectionSummary {
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
  vehicleImage?: string;
  year?: number;
  fuel?: string;
  transmission?: string;
  odometer?: number;
  vehicleStatus?: string;
  currentHighestBid?: number;
  auctionEndTime?: number;
  totalBids?: number;
}

export const getMarketplaceInspections = async (): Promise<{ success: boolean; data: DealerInspectionSummary[] }> => {
  const res = await dealerApiClient.get("/api/dealer/inspections");
  return res.data;
};

export const getMarketplaceInspectionDetails = async (id: number): Promise<{ success: boolean; data: any }> => {
  const res = await dealerApiClient.get(`/api/dealer/inspection/${id}`);
  return res.data;
};

export interface DealerProfile {
  id: number;
  dealershipName: string;
  ownerName: string;
  email: string;
  mobileNumber: string;
  role: string;
}

export const getDealerProfile = async (): Promise<{ success: boolean; data: DealerProfile }> => {
  const res = await dealerApiClient.get("/api/dealer/profile");
  return res.data;
};

export const updateDealerProfile = async (data: { fullName: string; mobileNumber: string }): Promise<{ success: boolean; data: DealerProfile }> => {
  const res = await dealerApiClient.put("/api/dealer/profile", data);
  return res.data;
};

export const changeDealerPassword = async (data: any): Promise<{ success: boolean }> => {
  const res = await dealerApiClient.put("/api/dealer/profile/password", data);
  return res.data;
};

export const placeDealerBid = async (id: number, amount: number): Promise<{ success: boolean; message?: string }> => {
  const res = await dealerApiClient.post(`/api/dealer/inspection/${id}/bid`, { amount });
  return res.data;
};

export const getVehicleBidHistory = async (id: number): Promise<{ success: boolean; data: any[] }> => {
  const res = await dealerApiClient.get(`/api/dealer/inspection/${id}/bids`);
  return res.data;
};

export const getDealerWishlist = async (): Promise<{ success: boolean; data: DealerInspectionSummary[] }> => {
  const res = await dealerApiClient.get("/api/dealer/wishlist");
  return res.data;
};

export const addToWishlist = async (id: number): Promise<{ success: boolean }> => {
  const res = await dealerApiClient.post(`/api/dealer/wishlist/add/${id}`);
  return res.data;
};

export const removeFromWishlist = async (id: number): Promise<{ success: boolean }> => {
  const res = await dealerApiClient.delete(`/api/dealer/wishlist/remove/${id}`);
  return res.data;
};

export const getDealerBidsHistory = async (): Promise<{ success: boolean; data: any[] }> => {
  const res = await dealerApiClient.get("/api/dealer/bids");
  return res.data;
};
