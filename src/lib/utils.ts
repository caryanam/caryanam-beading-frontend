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
    return formatParsedDate(input);
  }

  if (typeof input === "number") {
    const d = new Date(input);
    return isNaN(d.getTime()) ? "N/A" : formatParsedDate(d);
  }

  if (typeof input === "string") {
    const trimmed = input.trim();
    if (!trimmed) return "N/A";

    const lower = trimmed.toLowerCase();
    if (
      lower.includes("ago") ||
      lower.includes("just now") ||
      /\(\d{1,2}:\d{2}/.test(trimmed)
    ) {
      return fixUtcTimeInParens(trimmed);
    }

    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      const isoStr = trimmed.includes("Z") || trimmed.includes("+")
        ? trimmed
        : trimmed.replace(" ", "T") + "Z";
      const isoParsed = new Date(isoStr);
      if (!isNaN(isoParsed.getTime())) {
        return formatParsedDate(isoParsed);
      }
    }

    if (/^\d{1,2}\s+[A-Za-z]{3}\s+\d{4},\s+\d{1,2}:\d{2}/.test(trimmed)) {
      const utcParsed = new Date(trimmed + " UTC");
      const now = new Date();
      if (!isNaN(utcParsed.getTime()) && now.getTime() - utcParsed.getTime() >= 0) {
        return formatParsedDate(utcParsed);
      }
    }

    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      return formatParsedDate(parsed);
    }

    return fixUtcTimeInParens(trimmed);
  }

  return "N/A";
}

function fixUtcTimeInParens(str: string): string {
  const match = str.match(/\((1[0-2]|0?[1-9]):([0-5][0-9]):([0-5][0-9])\s*(am|pm)\)/i);
  if (!match) return str;

  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const s = parseInt(match[3], 10);
  const ampm = match[4].toUpperCase();

  if (ampm === "PM" && h < 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;

  const now = new Date();
  const nowH = now.getHours();
  const nowM = now.getMinutes();

  const givenMins = h * 60 + m;
  const nowMins = nowH * 60 + nowM;

  let diffMins = nowMins - givenMins;
  if (diffMins < -720) diffMins += 1440;

  if (diffMins >= 300) {
    const adjustedMins = (givenMins + 330) % 1440;
    let adjH = Math.floor(adjustedMins / 60);
    const adjM = adjustedMins % 60;

    let period = "AM";
    if (adjH >= 12) {
      period = "PM";
      if (adjH > 12) adjH -= 12;
    }
    if (adjH === 0) adjH = 12;

    const formattedAdj = `(${String(adjH).padStart(2, "0")}:${String(adjM).padStart(2, "0")}:${String(s).padStart(2, "0")} ${period})`;
    const actualDiffMins = Math.max(1, diffMins - 330);
    let relLabel = "";
    if (actualDiffMins <= 1) {
      relLabel = "1 min ago";
    } else if (actualDiffMins < 60) {
      relLabel = `${actualDiffMins} mins ago`;
    } else {
      const relH = Math.floor(actualDiffMins / 60);
      relLabel = `${relH} hr${relH > 1 ? "s" : ""} ago`;
    }

    let result = str.replace(match[0], formattedAdj);
    result = result.replace(/^\d+\s*(hrs|hr|h|mins|min|m)\s+ago/i, relLabel);
    return result;
  } else if (diffMins >= 0) {
    const actualDiffMins = Math.max(1, diffMins);
    let relLabel = "";
    if (actualDiffMins <= 1) {
      relLabel = "1 min ago";
    } else if (actualDiffMins < 60) {
      relLabel = `${actualDiffMins} mins ago`;
    } else {
      const relH = Math.floor(actualDiffMins / 60);
      relLabel = `${relH} hr${relH > 1 ? "s" : ""} ago`;
    }

    return str.replace(/^\d+\s*(hrs|hr|h|mins|min|m)\s+ago/i, relLabel);
  }

  return str;
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
    return `1 min ago (${exactTime})`;
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

  return `${relative} (${exactTime})`;
}

