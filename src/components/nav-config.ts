import {
  Bell,
  Car,
  FileBarChart,
  FileText, MessageSquare,
  Gauge,
  Gavel,
  Heart,
  LayoutDashboard,
  Store,
  Upload,
  UserCheck,
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
  { label: "Freelancers", to: "/admin/freelancers", icon: UserCheck },
  { label: "Analytics", to: "/admin/analytics", icon: FileBarChart },
  { label: "Enquiries", to: "/admin/enquiries", icon: MessageSquare },
];

export const inspectorNav: NavItem[] = [
  { label: "Dashboard", to: "/inspector", icon: LayoutDashboard },
  { label: "Add Vehicle", to: "/inspector/add-vehicle", icon: Upload },
  { label: "My Vehicles", to: "/inspector/vehicles", icon: Car },
  { label: "Profile", to: "/inspector/profile", icon: UserRound },
];

export const freelancerNav: NavItem[] = [
  { label: "Dashboard", to: "/freelancer", icon: LayoutDashboard },
  { label: "Add Vehicle", to: "/freelancer/add-vehicle", icon: Upload },
  { label: "My Vehicles", to: "/freelancer/vehicles", icon: Car },
  { label: "Profile", to: "/freelancer/profile", icon: UserRound },
];

export const dealerNav: NavItem[] = [
  { label: "Dashboard", to: "/dealer", icon: Gauge },
  { label: "Marketplace", to: "/dealer/marketplace", icon: Store },
  { label: "Freelancer Vehicles", to: "/dealer/freelancer-vehicles", icon: UserCheck },
  { label: "My Bids", to: "/dealer/bids", icon: Gavel },
  { label: "Favourites", to: "/dealer/favourites", icon: Heart },
  { label: "Profile", to: "/dealer/profile", icon: UserRound },
];