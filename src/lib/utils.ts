import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function maskDealerName(name?: string): string {
  if (!name || name.trim() === "") return "De******";
  const trimmed = name.trim();
  if (trimmed.length <= 2) return `${trimmed}******`;
  return `${trimmed.slice(0, 2)}******`;
}
