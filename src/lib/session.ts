import type { Role } from "./mock-data";

if (typeof window !== "undefined") {
  localStorage.removeItem("caryanam.session");
}


export interface Session {
  role: Role;
  name: string;
  email: string;
  token?: string;
  id?: number;
  dealerId?: number;
  dealershipName?: string;
  mobileNumber?: string;
}

export const getStorageKey = (role: Role): string => {
  if (role === "admin") return "admindata";
  if (role === "inspector") return "inspectordata";
  if (role === "freelancer") return "freelancerdata";
  return "dealerdata";
};

export const saveSession = (s: Session) => {
  if (typeof window !== "undefined") {
    const key = getStorageKey(s.role);
    localStorage.setItem(key, JSON.stringify(s));
  }
};

export const readSession = (role?: Role): Session | null => {
  if (typeof window === "undefined") return null;
  try {
    if (role) {
      const raw = localStorage.getItem(getStorageKey(role));
      return raw ? (JSON.parse(raw) as Session) : null;
    }
    
    // Check path to resolve active session
    let activeRole: Role | null = null;
    const path = window.location.pathname;
    if (path.startsWith("/admin")) activeRole = "admin";
    else if (path.startsWith("/inspector")) activeRole = "inspector";
    else if (path.startsWith("/freelancer")) activeRole = "freelancer";
    else if (path.startsWith("/dealer")) activeRole = "dealer";

    if (activeRole) {
      const raw = localStorage.getItem(getStorageKey(activeRole));
      if (raw) return JSON.parse(raw) as Session;
    }

    // Fallback: Check all keys
    for (const r of ["admin", "inspector", "freelancer", "dealer"] as Role[]) {
      const raw = localStorage.getItem(getStorageKey(r));
      if (raw) return JSON.parse(raw) as Session;
    }
    return null;
  } catch {
    return null;
  }
};

export const clearSession = (role?: Role) => {
  if (typeof window !== "undefined") {
    if (role) {
      localStorage.removeItem(getStorageKey(role));
    } else {
      localStorage.removeItem("admindata");
      localStorage.removeItem("inspectordata");
      localStorage.removeItem("freelancerdata");
      localStorage.removeItem("dealerdata");
    }
  }
};

export const homeFor = (role: Role) =>
  role === "admin"
    ? "/admin"
    : role === "inspector"
    ? "/inspector"
    : role === "freelancer"
    ? "/freelancer"
    : "/dealer/marketplace";

export const normalizeRole = (role: string): Role => {
  const r = role.toUpperCase();
  if (r === "ADMIN") return "admin";
  if (r === "INSPECTOR") return "inspector";
  if (r === "FREELANCER" || r === "FREELANCE") return "freelancer";
  return "dealer";
};
