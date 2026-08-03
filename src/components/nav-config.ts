import {
  Bell,
  Car,
  FileBarChart,
  FileText,
  Gauge,
  Gavel,
  Heart,
  LayoutDashboard,
  Store,
  Upload,
  UserRound,
  Users,
} from "lucide-react";
import type { NavItem } from "./app-shell";

export const adminNav: NavItem[] = [
  { label: "Dashboard", to: "/admin", icon: LayoutDashboard },
  { label: "Vehicles", to: "/admin/vehicles", icon: Car },
  { label: "Auctions", to: "/admin/auctions", icon: Gavel },
  { label: "Live Monitor", to: "/admin/live-bidding", icon: Bell },
  { label: "Dealers", to: "/admin/dealers", icon: Store },
  { label: "Inspectors", to: "/admin/inspectors", icon: Users },
  { label: "Analytics", to: "/admin/analytics", icon: FileBarChart },
];

export const inspectorNav: NavItem[] = [
  { label: "Dashboard", to: "/inspector", icon: LayoutDashboard },
  { label: "Add Vehicle", to: "/inspector/add-vehicle", icon: Upload },
  { label: "My Vehicles", to: "/inspector/vehicles", icon: Car },
  { label: "Notifications", to: "/inspector/notifications", icon: Bell },
  { label: "Profile", to: "/inspector/profile", icon: UserRound },
];

export const dealerNav: NavItem[] = [
  { label: "Dashboard", to: "/dealer", icon: Gauge },
  { label: "Marketplace", to: "/dealer/marketplace", icon: Car },
  { label: "My Bids", to: "/dealer/bids", icon: Gavel },
  { label: "Favourites", to: "/dealer/favourites", icon: Heart },
  { label: "Profile", to: "/dealer/profile", icon: UserRound },
];