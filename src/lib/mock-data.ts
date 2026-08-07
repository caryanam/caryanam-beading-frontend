export type Role = "admin" | "inspector" | "dealer";
export type VehicleStatus = "draft" | "pending" | "approved" | "rejected";

export interface Vehicle {
  id: string;
  regNo: string;
  brand: string;
  model: string;
  variant: string;
  year: number;
  fuel: "Petrol" | "Diesel" | "CNG" | "LPG" | "Electric" | "Hybrid";
  transmission: "Manual" | "Automatic";
  odometer: number;
  owner: string;
  score: number;
  basePrice: number;
  highestBid: number;
  bids: number;
  status: VehicleStatus;
  auction: "live" | "scheduled" | "completed" | "sold out" | "sold" | "ended";
  endsAt?: number;
  inspector: string;
  image: string;
}

const img = (seed: string) =>
  `https://images.unsplash.com/${seed}?auto=format&fit=crop&w=1200&q=80&sat=-100`;

const now = Date.now();

export const vehicles: Vehicle[] = [
  {
    id: "V-1042",
    regNo: "MH12 AB 4421",
    brand: "Mercedes-Benz",
    model: "C-Class",
    variant: "C 220d Progressive",
    year: 2021,
    fuel: "Diesel",
    transmission: "Automatic",
    odometer: 38400,
    owner: "First Owner",
    score: 92,
    basePrice: 3450000,
    highestBid: 3780000,
    bids: 24,
    status: "approved",
    auction: "live",
    endsAt: now + 1000 * 60 * 74,
    inspector: "Rahul Verma",
    image: img("photo-1503376780353-7e6692767b70"),
  },
  {
    id: "V-1041",
    regNo: "KA05 MN 8890",
    brand: "BMW",
    model: "3 Series",
    variant: "330i M Sport",
    year: 2020,
    fuel: "Petrol",
    transmission: "Automatic",
    odometer: 51200,
    owner: "Second Owner",
    score: 86,
    basePrice: 3120000,
    highestBid: 3305000,
    bids: 18,
    status: "approved",
    auction: "live",
    endsAt: now + 1000 * 60 * 26,
    inspector: "Nikhil Rao",
    image: img("photo-1555215695-3004980ad54e"),
  },
  {
    id: "V-1040",
    regNo: "DL8C AF 1123",
    brand: "Audi",
    model: "Q5",
    variant: "45 TFSI Technology",
    year: 2019,
    fuel: "Petrol",
    transmission: "Automatic",
    odometer: 64800,
    owner: "First Owner",
    score: 78,
    basePrice: 3890000,
    highestBid: 3960000,
    bids: 11,
    status: "pending",
    auction: "scheduled",
    endsAt: now + 1000 * 60 * 60 * 20,
    inspector: "Rahul Verma",
    image: img("photo-1606664515524-ed2f786a0bd6"),
  },
  {
    id: "V-1039",
    regNo: "TN10 BZ 7745",
    brand: "Toyota",
    model: "Fortuner",
    variant: "4x2 AT Legender",
    year: 2022,
    fuel: "Diesel",
    transmission: "Automatic",
    odometer: 29100,
    owner: "First Owner",
    score: 95,
    basePrice: 4120000,
    highestBid: 4480000,
    bids: 31,
    status: "approved",
    auction: "live",
    endsAt: now + 1000 * 60 * 8,
    inspector: "Sana Iqbal",
    image: img("photo-1552519507-da3b142c6e3d"),
  },
  {
    id: "V-1038",
    regNo: "GJ01 KK 2210",
    brand: "Hyundai",
    model: "Creta",
    variant: "SX(O) Turbo DCT",
    year: 2023,
    fuel: "Petrol",
    transmission: "Automatic",
    odometer: 12400,
    owner: "First Owner",
    score: 88,
    basePrice: 1740000,
    highestBid: 1815000,
    bids: 14,
    status: "approved",
    auction: "completed",
    endsAt: now - 1000 * 60 * 60 * 5,
    inspector: "Sana Iqbal",
    image: img("photo-1494976388531-d1058494cdd8"),
  },
  {
    id: "V-1037",
    regNo: "RJ14 CX 5567",
    brand: "Tata",
    model: "Nexon EV",
    variant: "Max XZ+ Lux",
    year: 2022,
    fuel: "Electric",
    transmission: "Automatic",
    odometer: 21800,
    owner: "First Owner",
    score: 81,
    basePrice: 1490000,
    highestBid: 1522000,
    bids: 9,
    status: "rejected",
    auction: "scheduled",
    endsAt: now + 1000 * 60 * 60 * 40,
    inspector: "Nikhil Rao",
    image: img("photo-1617788138017-80ad40651399"),
  },
];

export const inspectors = [
  { id: "INS-01", name: "Rahul Verma", email: "rahul@caryanam.in", mobile: "+91 98220 41122", uploads: 128, status: "Active" },
  { id: "INS-02", name: "Sana Iqbal", email: "sana@caryanam.in", mobile: "+91 98450 77310", uploads: 96, status: "Active" },
  { id: "INS-03", name: "Nikhil Rao", email: "nikhil@caryanam.in", mobile: "+91 99870 22145", uploads: 74, status: "On Leave" },
  { id: "INS-04", name: "Aarti Sharma", email: "aarti@caryanam.in", mobile: "+91 91760 55901", uploads: 41, status: "Suspended" },
];

export const dealers = [
  { id: "DL-01", shop: "Skyline Motors", owner: "Imran Shaikh", email: "imran@skyline.in", mobile: "+91 98111 22440", bids: 214, status: "Verified" },
  { id: "DL-02", shop: "Apex Auto Hub", owner: "Rohit Malhotra", email: "rohit@apexauto.in", mobile: "+91 99001 78220", bids: 176, status: "Verified" },
  { id: "DL-03", shop: "Prime Wheels", owner: "Kavya Nair", email: "kavya@primewheels.in", mobile: "+91 97400 11235", bids: 143, status: "Pending" },
  { id: "DL-04", shop: "Velocity Cars", owner: "Sameer Gupta", email: "sameer@velocity.in", mobile: "+91 90040 66120", bids: 88, status: "Blocked" },
];

export const auctionActivity = [
  { month: "Jan", auctions: 42, bids: 310 },
  { month: "Feb", auctions: 55, bids: 388 },
  { month: "Mar", auctions: 61, bids: 452 },
  { month: "Apr", auctions: 48, bids: 401 },
  { month: "May", auctions: 72, bids: 540 },
  { month: "Jun", auctions: 84, bids: 622 },
  { month: "Jul", auctions: 91, bids: 705 },
];

export const dealerRegistrations = [
  { month: "Feb", dealers: 12 },
  { month: "Mar", dealers: 19 },
  { month: "Apr", dealers: 15 },
  { month: "May", dealers: 26 },
  { month: "Jun", dealers: 31 },
  { month: "Jul", dealers: 38 },
];

export const inspectionStatus = [
  { name: "Approved", value: 412 },
  { name: "Pending", value: 96 },
  { name: "Rejected", value: 38 },
  { name: "Draft", value: 54 },
];

export const activity = [
  { title: "Auction #A-2214 closed at ₹44.8L", meta: "Toyota Fortuner · Skyline Motors", time: "12 min ago" },
  { title: "Vehicle V-1042 approved", meta: "Mercedes-Benz C-Class · Admin", time: "48 min ago" },
  { title: "New dealer registered", meta: "Prime Wheels · Bengaluru", time: "2 h ago" },
  { title: "Inspection report uploaded", meta: "Rahul Verma · 14 images, 1 PDF", time: "3 h ago" },
  { title: "Bid increment updated to ₹5,000", meta: "Auction settings", time: "Yesterday" },
];

export const bidHistory = [
  { dealer: "Skyline Motors", amount: 3780000, time: "2 min ago" },
  { dealer: "Apex Auto Hub", amount: 3745000, time: "9 min ago" },
  { dealer: "Prime Wheels", amount: 3690000, time: "22 min ago" },
  { dealer: "Velocity Cars", amount: 3610000, time: "41 min ago" },
  { dealer: "Skyline Motors", amount: 3520000, time: "1 h ago" },
];

export const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

export const timeLeft = (endsAt?: number) => {
  if (!endsAt) return "Ended";
  const diff = endsAt - Date.now();
  if (diff <= 0) return "Ended";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`;
};