import { Routes, Route } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import MerchantLayout from "./layouts/MerchantLayout";
import PublicMenu from "./features/public/PublicMenu";
import AuthGate from "./features/auth/AuthGate";
import SubscriptionCheckout from "./components/SubscriptionCheckout"; // Apne path ke hisaab se check karein

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* 🟢 PUBLIC ISOLATED CUSTOMER ROUTE */}
      <Route path="/catalog/:restaurantId" element={<PublicMenu />} />

      {/* 💳 SUBSCRIPTION CHECKOUT ROUTE (Independent of Merchant Layout & AuthGate) */}
      <Route path="/subscription-checkout" element={<SubscriptionCheckout />} />

      {/* 🔴 MERCHANT ADMIN SHELL SYSTEM */}
      <Route
        path="/*"
        element={user ? <MerchantLayout /> : <AuthGate />}
      />
    </Routes>
  );
}