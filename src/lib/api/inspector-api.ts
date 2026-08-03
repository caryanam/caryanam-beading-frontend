import axios from "axios";
import { API_BASE_URL } from "../api";
import { readSession } from "../session";

export const inspectorApiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

inspectorApiClient.interceptors.request.use(
  (config) => {
    const session = readSession("inspector");
    if (session?.token && config.headers) {
      config.headers.Authorization = `Bearer ${session.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

inspectorApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.dispatchEvent(new CustomEvent("session-expired", { detail: { role: "inspector" } }));
    }
    return Promise.reject(error);
  }
);

export interface VehicleDraft {
  id?: number;
  vehicleNumber: string;
  ownerName?: string;
  brand?: string;
  model?: string;
  variant?: string;
  manufacturingYear?: number;
  fuelType?: string;
  transmission?: string;
  odometerReading?: number;
  insuranceStatus?: string;
  inspectorCode?: string;
  suggestedPrice?: number;
}

export interface PanelDraft {
  panelName: string;
  condition: "OK" | "DAMAGED" | "REPAINTED" | "CHANGED" | "SCRATCH" | "DENT" | "RUST" | "NA";
  imageUrl?: string;
}

export interface MechanicalDraft {
  engineStatus?: string;
  engineOil?: string;
  brakeOil?: string;
  steeringOil?: string;
  coolant?: string;
  brakeBooster?: string;
  brakeWorking?: string;
  apron?: string;
  chassis?: string;
  suspension?: string;
  bush?: string;
  leakage?: string;
  transmission?: string;
  gearbox?: string;
  differential?: string;
  axle?: string;
  engineNoise?: string;
  smoke?: string;
  fluidLeakage?: string;
}

export interface TyreDraft {
  frontLeftBrand?: string;
  frontLeftYear?: number;
  frontLeftTread?: number;
  frontRightBrand?: string;
  frontRightYear?: number;
  frontRightTread?: number;
  rearLeftBrand?: string;
  rearLeftYear?: number;
  rearLeftTread?: number;
  rearRightBrand?: string;
  rearRightYear?: number;
  rearRightTread?: number;
  spareBrand?: string;
  spareYear?: number;
  spareTread?: number;
  hasJack?: boolean;
  hasHandle?: boolean;
  hasToolkit?: boolean;
  hasTriangle?: boolean;
  hasFirstAidBox?: boolean;
}

export interface InteriorDraft {
  batteryBrand?: string;
  batterySerialNumber?: string;
  acCooling?: string;
  evaluatorValuation?: number;
  rightTailLamp?: string;
  leftTailLamp?: string;
  rightHeadLamp?: string;
  leftHeadLamp?: string;
  indicators?: string;
  bootFloor?: string;
  dashboard?: string;
  fogLamps?: string;
  powerWindows?: string;
  musicSystem?: string;
  steeringMountedControls?: string;
  wiper?: string;
  rearDefogger?: string;
  rearWasher?: string;
  instrumentCluster?: string;
  infotainment?: string;
  centralLock?: string;
  pushButton?: string;
  sunroof?: string;
  sensors?: string;
  remarks?: string;
}

export interface InspectionDraftRequest {
  vehicleDetails?: VehicleDraft;
  exteriorPanelDetails?: PanelDraft[];
  mechanicalDetails?: MechanicalDraft;
  tyreDetails?: TyreDraft;
  interiorDetails?: InteriorDraft;
  exteriorRating?: number;
  mechanicalRating?: number;
  tyreRating?: number;
  interiorRating?: number;
}

export interface InspectionSummary {
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
  vehicleName?: string;
  rejectionReason?: string;
  vehicleImage?: string;
}

// API methods
export const getMyInspections = async (): Promise<{ success: boolean; data: InspectionSummary[] }> => {
  const res = await inspectorApiClient.get("/api/inspector/inspection");
  return res.data;
};

export const getInspectionDetails = async (id: number | string): Promise<{ success: boolean; data: any }> => {
  const res = await inspectorApiClient.get(`/api/inspector/inspection/${id}`);
  return res.data;
};

export const saveInspectionDraft = async (payload: InspectionDraftRequest): Promise<{ success: boolean; data: any }> => {
  const res = await inspectorApiClient.post("/api/inspector/inspection", payload);
  return res.data;
};

export const updateInspectionDraft = async (id: number | string, payload: InspectionDraftRequest): Promise<{ success: boolean; data: any }> => {
  const res = await inspectorApiClient.put(`/api/inspector/inspection/${id}`, payload);
  return res.data;
};

export const uploadInspectionImage = async (id: number | string, category: string, file: File): Promise<{ success: boolean; data: string }> => {
  const formData = new FormData();
  formData.append("category", category);
  formData.append("file", file);
  const res = await inspectorApiClient.post(`/api/inspector/inspection/${id}/image`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

export const submitInspectionReport = async (id: number | string): Promise<{ success: boolean }> => {
  const res = await inspectorApiClient.post(`/api/inspector/inspection/${id}/submit`);
  return res.data;
};

export const deleteInspectionDraft = async (id: number | string): Promise<{ success: boolean }> => {
  const res = await inspectorApiClient.delete(`/api/inspector/inspection/${id}`);
  return res.data;
};

export interface InspectorProfile {
  id: number;
  fullName: string;
  email: string;
  mobileNumber: string;
  role: string;
}

export const getInspectorProfile = async (): Promise<{ success: boolean; data: InspectorProfile }> => {
  const res = await inspectorApiClient.get("/api/inspector/profile");
  return res.data;
};

export const updateInspectorProfile = async (data: { fullName: string; mobileNumber: string }): Promise<{ success: boolean; data: InspectorProfile }> => {
  const res = await inspectorApiClient.put("/api/inspector/profile", data);
  return res.data;
};

export const changeInspectorPassword = async (data: any): Promise<{ success: boolean }> => {
  const res = await inspectorApiClient.put("/api/inspector/profile/password", data);
  return res.data;
};

export interface InspectorStats {
  todayInspections: number;
  pendingUploads: number;
  completedReports: number;
  vehiclesSubmitted: number;
}

export const getInspectorStats = async (): Promise<{ success: boolean; data: InspectorStats }> => {
  const res = await inspectorApiClient.get("/api/inspector/inspection/stats");
  return res.data;
};
