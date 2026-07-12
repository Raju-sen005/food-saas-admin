import { Routes, Route } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import MerchantLayout from "./layouts/MerchantLayout";
import PublicMenu from "./features/public/PublicMenu";
import AuthGate from "./features/auth/AuthGate";

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* 🟢 PUBLIC ISOLATED CUSTOMER ROUTE */}
      <Route path="/catalog/:restaurantId" element={<PublicMenu />} />

      {/* 🔴 MERCHANT ADMIN SHELL SYSTEM */}
      <Route
        path="/*"
        element={user ? <MerchantLayout /> : <AuthGate />}
      />
    </Routes>
  );
}