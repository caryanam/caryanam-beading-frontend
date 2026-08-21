import axios from "axios";
import { toast } from "sonner";
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
  freelancerName?: string;
  suggestedPrice?: number;
  rejectionReason?: string;
  vehicleStatus?: string;
  currentHighestBid?: number;
  currentHighestBidder?: string;
  auctionEndTime?: number;
  totalBids?: number;
  year?: number;
  fuel?: string;
  sellerAgreed?: boolean;
  sellerCounterPrice?: number;
  sellerMessage?: string;
  adminDealerMessage?: string;
  dealerReplyMessage?: string;
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

export interface AdminInspector {
  id: number;
  fullName: string;
  email: string;
  mobileNumber: string;
  role: string;
  uploads?: number;
}

export const getRegisteredInspectors = async (): Promise<{ success: boolean; data: AdminInspector[] }> => {
  const res = await adminApiClient.get("/api/admin/inspectors");
  return res.data;
};

export const deleteAdminInspector = async (id: number): Promise<{ success: boolean; message?: string }> => {
  const res = await adminApiClient.delete(`/api/admin/inspector/${id}`);
  return res.data;
};

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

export const startLiveAuction = async (id: number, durationMinutes?: number): Promise<{ success: boolean }> => {
  const res = await adminApiClient.put(`/api/admin/inspection/${id}/go-live`, durationMinutes ? { durationMinutes, duration: durationMinutes } : {});
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

export const downloadAdminInspectionPdf = async (id: number) => {
  const toastId = toast.loading("Generating & Downloading PDF report... Please wait...");
  try {
    const res = await adminApiClient.get(`/api/admin/inspection/${id}/pdf`, {
      responseType: "blob",
    });
    const blob = new Blob([res.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Inspection_Report_${id}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    toast.success("PDF report downloaded successfully!", { id: toastId });
  } catch (err: any) {
    toast.error(err?.response?.data?.message || "Failed to download PDF report.", { id: toastId });
    throw err;
  }
};

export const sendAdminDealerMessage = async (id: number, message: string): Promise<{ success: boolean }> => {
  const res = await adminApiClient.post(`/api/admin/inspection/${id}/dealer-message`, { message });
  return res.data;
};

export const updateInspectionVehicleStatus = async (id: number, vehicleStatus: string): Promise<{ success: boolean; message?: string }> => {
  const res = await adminApiClient.put(`/api/admin/inspection/${id}/vehicle-status`, { vehicleStatus });
  return res.data;
};

export const getAdminNotifications = async (): Promise<{ success: boolean; data: any[] }> => {
  const res = await adminApiClient.get("/api/admin/notifications");
  return res.data;
};

export const markAdminNotificationAsRead = async (id: number): Promise<{ success: boolean }> => {
  const res = await adminApiClient.put(`/api/admin/notifications/${id}/read`);
  return res.data;
};

export const markAllAdminNotificationsAsRead = async (): Promise<{ success: boolean }> => {
  const res = await adminApiClient.put("/api/admin/notifications/mark-all-read");
  return res.data;
};

export const getRegisteredFreelancers = async (): Promise<{ success: boolean; data: AdminInspector[] }> => {
  const res = await adminApiClient.get("/api/admin/freelancers");
  return res.data;
};
