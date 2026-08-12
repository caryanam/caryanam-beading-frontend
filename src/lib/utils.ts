import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function maskDealerName(name?: string): string {
  if (!name || name.trim() === "") return "De****";
  const trimmed = name.trim();
  if (trimmed.includes("*")) {
    return trimmed;
  }
  if (trimmed.includes("@")) {
    const [user, domain] = trimmed.split("@");
    const maskedUser = user.length <= 2 ? `${user}****` : `${user.slice(0, 2)}****`;
    return `${maskedUser}@${domain}`;
  }
  if (trimmed.length <= 2) return `${trimmed}****`;
  return `${trimmed.slice(0, 2)}****`;
}

export function formatIndianDateTime(input: string | number | Date | null | undefined): string {
  if (!input) return "N/A";

  if (input instanceof Date) {
    return isNaN(input.getTime()) ? "N/A" : formatParsedDate(input);
  }

  if (typeof input === "number") {
    const d = new Date(input);
    return isNaN(d.getTime()) ? "N/A" : formatParsedDate(d);
  }

  if (typeof input === "string") {
    const trimmed = input.trim();
    if (!trimmed) return "N/A";

    const parsedDate = parseDateStringToLocal(trimmed);
    if (parsedDate && !isNaN(parsedDate.getTime())) {
      return formatParsedDate(parsedDate);
    }

    return trimmed;
  }

  return "N/A";
}

function parseDateStringToLocal(inputStr: string): Date | null {
  const trimmed = inputStr.trim();
  if (!trimmed) return null;

  // ISO format without explicit Z or offset: e.g. "2026-08-11T17:20:15.166002" or "2026-08-11 17:20:15"
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    const hours = parseInt(isoMatch[4], 10);
    const minutes = parseInt(isoMatch[5], 10);
    const seconds = parseInt(isoMatch[6], 10);
    const msStr = (isoMatch[7] || "0").slice(0, 3).padEnd(3, "0");
    const ms = parseInt(msStr, 10);
    return new Date(year, month, day, hours, minutes, seconds, ms);
  }

  // If string contains explicit timezone indicator Z or + / - offset
  if (trimmed.includes("Z") || /[+-]\d{2}:\d{2}$/.test(trimmed)) {
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? null : d;
  }

  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? null : d;
}

function formatParsedDate(date: Date): string {
  const exactTime = date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  if (diffMs < 0 || diffMs < 10000) {
    return `1 min ago (${exactTime.toLowerCase()})`;
  }

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  let relative = "";
  if (diffMin <= 1) {
    relative = "1 min ago";
  } else if (diffMin < 60) {
    relative = `${diffMin} min${diffMin > 1 ? "s" : ""} ago`;
  } else if (diffHr < 24) {
    relative = `${diffHr} hr${diffHr > 1 ? "s" : ""} ago`;
  } else if (diffDay < 7) {
    relative = `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;
  } else {
    relative = date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return `${relative} (${exactTime.toLowerCase()})`;
}

