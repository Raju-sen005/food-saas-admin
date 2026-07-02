import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

export default function TableMonitor() {
  const { user } = useAuth();
  const [activeOrders, setActiveOrders] = useState([]);

  const fetchActiveOrders = async () => {
    try {
      // Backend route fix: ensure it matches your app.use path
      const res = await axios.get(`/orders/live`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const filtered = res.data.data.filter(
        (o) => o.status === "ACCEPTED" && o.tableNumber !== "N/A",
      );
      setActiveOrders(filtered);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchActiveOrders();
  }, []);

  const handleBillAndWhatsApp = async (order) => {
    // 1. WhatsApp Message Trigger
    const invoiceLink = `${window.location.origin}/invoice/${order._id}`;
    const message = `*🧾 BILL: ${user?.restaurantName}*

Hello *${order.customerName}*, 
Thank you for dining with us!

*Table Number:* #${order.tableNumber}
*Total Amount:* ₹${order.total}

---
*View your detailed invoice here:*
${invoiceLink}

*Have a great day!* 👋`;
    window.open(
      `https://wa.me/${order.customerPhone}?text=${encodeURIComponent(message)}`,
      "_blank",
    );

    // 2. Mark as COMPLETED in Database
    try {
      await axios.patch(
        `/orders/${order._id}/complete`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );

      // 3. FORCE UPDATE UI: State se us order ko manually filter out karein
      // Isse API response ka wait nahi karna padega, UI instant update hoga
      setActiveOrders((prev) => prev.filter((o) => o._id !== order._id));
    } catch (err) {
      console.error("Failed to complete order", err);
      // Agar error aaye toh wapas list fetch kar lein
      fetchActiveOrders();
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-black">Live Table Monitor</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeOrders.map((order) => (
          <div
            key={order._id}
            className="bg-white p-6 rounded-2xl border-2 border-emerald-500 shadow-lg"
          >
            <div className="flex justify-between items-center mb-4">
              <span className="font-black text-emerald-600 text-lg">
                Table {order.tableNumber}
              </span>
              <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full uppercase">
                Occupied
              </span>
            </div>
            <div className="space-y-1 mb-4">
              <p className="font-bold text-slate-800">{order.customerName}</p>
              <p className="text-xs text-slate-400 font-medium">
                {order.customerPhone}
              </p>
            </div>
            <div className="text-2xl font-black text-slate-900 mb-6">
              ₹{order.total}
            </div>

            <button
              onClick={() => handleBillAndWhatsApp(order)}
              className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold hover:bg-slate-800 transition-all active:scale-[0.98]"
            >
              Generate Bill & Clear Table
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
