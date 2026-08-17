import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";

import { LandingPage } from "@/pages/LandingPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { PublicBiddingPage } from "@/pages/PublicBiddingPage";

// Admin Pages
import { AdminLayout } from "@/pages/admin/AdminLayout";
import { AdminDashboard } from "@/pages/admin/Dashboard";
import { AdminAnalytics } from "@/pages/admin/Analytics";
import { AdminAuctions } from "@/pages/admin/Auctions";
import { AdminAuctionDetail } from "@/pages/admin/AuctionDetail";
import { AdminLiveBidding } from "@/pages/admin/LiveBidding";
import { AdminDealers } from "@/pages/admin/Dealers";
import { AdminInspectors } from "@/pages/admin/Inspectors";
import { AdminReports } from "@/pages/admin/Reports";
import { AdminSettings } from "@/pages/admin/Settings";
import { AdminVehicles } from "@/pages/admin/Vehicles";
import { AdminVehicleDetail } from "@/pages/admin/VehicleDetail";

// Dealer Pages
import { DealerLayout } from "@/pages/dealer/DealerLayout";
import { DealerDashboard } from "@/pages/dealer/Dashboard";
import { DealerMarketplace } from "@/pages/dealer/Marketplace";
import { DealerVehicleDetail } from "@/pages/dealer/VehicleDetail";
import { DealerBids } from "@/pages/dealer/Bids";
import { DealerFavourites } from "@/pages/dealer/Favourites";
import { DealerProfile } from "@/pages/dealer/Profile";

// Inspector Pages
import { InspectorLayout } from "@/pages/inspector/InspectorLayout";
import { InspectorDashboard } from "@/pages/inspector/Dashboard";
import { InspectorAddVehicle } from "@/pages/inspector/AddVehicle";
import { InspectorVehicles } from "@/pages/inspector/Vehicles";
import { InspectorNotifications } from "@/pages/inspector/Notifications";
import { InspectorProfile } from "@/pages/inspector/Profile";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Public Named Routes */}
        <Route path="/" element={<LandingPage page="home" />} />
        <Route path="/about" element={<LandingPage page="about" />} />
        <Route path="/why-choose-us" element={<LandingPage page="why" />} />
        <Route path="/why" element={<LandingPage page="why" />} />
        <Route path="/contact" element={<LandingPage page="contact" />} />
        <Route path="/privacy" element={<LandingPage page="privacy" />} />
        <Route path="/terms" element={<LandingPage page="terms" />} />
        <Route path="/login" element={<LandingPage page="auth" initialMode="login" />} />
        <Route path="/register" element={<LandingPage page="auth" initialMode="signup" />} />
        <Route path="/signup" element={<LandingPage page="auth" initialMode="signup" />} />
        <Route path="/public-bid/:vehicleId" element={<PublicBiddingPage />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="auctions" element={<AdminAuctions />} />
          <Route path="auctions/:id" element={<AdminAuctionDetail />} />
          <Route path="live-bidding" element={<AdminLiveBidding />} />
          <Route path="dealers" element={<AdminDealers />} />
          <Route path="inspectors" element={<AdminInspectors />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="vehicles" element={<AdminVehicles />} />
          <Route path="vehicles/:id" element={<AdminVehicleDetail />} />
          <Route path="vehicle/:id" element={<AdminVehicleDetail />} />
        </Route>

        {/* Dealer Routes */}
        <Route path="/dealer" element={<DealerLayout />}>
          <Route index element={<DealerDashboard />} />
          <Route path="marketplace" element={<DealerMarketplace />} />
          <Route path="vehicles/:vehicleId" element={<DealerVehicleDetail />} />
          <Route path="marketplace/:vehicleId" element={<DealerVehicleDetail />} />
          <Route path="bids" element={<DealerBids />} />
          <Route path="favourites" element={<DealerFavourites />} />
          <Route path="profile" element={<DealerProfile />} />
        </Route>

        {/* Inspector Routes */}
        <Route path="/inspector" element={<InspectorLayout />}>
          <Route index element={<InspectorDashboard />} />
          <Route path="add-vehicle" element={<InspectorAddVehicle />} />
          <Route path="vehicles" element={<InspectorVehicles />} />
          <Route path="notifications" element={<InspectorNotifications />} />
          <Route path="profile" element={<InspectorProfile />} />
        </Route>

        {/* Catch-all 404 Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      <Toaster position="top-right" />
    </>
  );
}

export default App;
