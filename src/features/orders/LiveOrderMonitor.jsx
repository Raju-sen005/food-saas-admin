import { useEffect, useState, useCallback, memo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useSocket } from "../../context/SocketContext";
import { useNotificationSound } from "../../hooks/useNotificationSound";
import { Eye, Check, X } from "lucide-react";
import OrderDetailsModal from "../../components/OrderDetailsModal";

// 🔑 Row extracted + memoized: sirf tab re-render hogi jab uske apne props change ho,
// poori table re-render nahi hogi kisi ek row ke status change ya page switch pe
const OrderRow = memo(function OrderRow({ order, onStatusChange, onView }) {
  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="p-3 sm:p-4 font-mono font-bold text-rose-600 text-xs sm:text-sm whitespace-nowrap">
        {order.orderId}
      </td>
      <td className="p-3 sm:p-4 font-bold text-slate-700 text-xs sm:text-sm whitespace-nowrap">
        {order.tableNumber}
      </td>
      <td className="p-3 sm:p-4 text-xs sm:text-sm font-semibold whitespace-nowrap">
        {order.customerName}
      </td>
      <td className="p-3 sm:p-4 text-xs text-slate-500 max-w-[160px] truncate">
        {order.items.slice(0, 2).map((i) => i.name).join(", ")}
        {order.items.length > 2 && "..."}
      </td>
      <td className="p-3 sm:p-4 text-right font-black text-xs sm:text-sm whitespace-nowrap">
        ₹{order.total}
      </td>
      <td className="p-3 sm:p-4">
        <div className="flex justify-center gap-1.5 sm:gap-2">
          {order.status === "PENDING" ? (
            <>
              <button
                onClick={() => onStatusChange(order._id, "ACCEPTED")}
                className="p-1.5 sm:p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200"
              >
                <Check size={16} />
              </button>
              <button
                onClick={() => onStatusChange(order._id, "REJECTED")}
                className="p-1.5 sm:p-2 bg-rose-100 text-rose-600 rounded-lg hover:bg-rose-200"
              >
                <X size={16} />
              </button>
            </>
          ) : (
            <span className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 flex items-center whitespace-nowrap">
              {order.status}
            </span>
          )}
          <button
            onClick={() => onView(order)}
            className="p-1.5 sm:p-2 border border-slate-200 rounded-lg hover:bg-slate-100"
          >
            <Eye size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
});

export default function LiveOrderMonitor() {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const queryClient = useQueryClient();
  const socket = useSocket();
  const playAlert = useNotificationSound();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["live-orders"],
    queryFn: async () => {
      const res = await axios.get(`${import.meta.env.VITE_APP_API_BASE}/orders/live`, {
        withCredentials: true,
      });
      return res.data.data || [];
    },
    staleTime: 15_000,
    refetchOnWindowFocus: false,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const indexOfLastOrder = currentPage * itemsPerPage;
  const indexOfFirstOrder = indexOfLastOrder - itemsPerPage;
  const currentOrders = orders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(orders.length / itemsPerPage);

  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = (newOrder) => {
      playAlert();
      queryClient.setQueryData(["live-orders"], (oldOrders) => [
        newOrder,
        ...(oldOrders || []),
      ]);
      setCurrentPage(1); // naya order aane pe pehle page pe le jao, warna user ko dikhega hi nahi
    };

    socket.on("NEW_ORDER_RECEIVED", handleNewOrder);
    return () => socket.off("NEW_ORDER_RECEIVED", handleNewOrder);
  }, [socket, queryClient, playAlert]);

  // useCallback: function reference stable — OrderRow ka memo() effective rehta h
  const handleStatusTransition = useCallback(async (orderId, targetStatus) => {
    let rejectReason = "";

    if (targetStatus === "REJECTED") {
      const reason = prompt(
        "Please enter the reason for rejection (e.g., Item Out of Stock, Kitchen Closed):",
      );
      if (reason === null) return;
      if (!reason.trim()) {
        alert("Rejection reason is mandatory!");
        return;
      }
      rejectReason = reason.trim();
    }

    try {
      const res = await axios.patch(
        `${import.meta.env.VITE_APP_API_BASE}/orders/${orderId}/status`,
        { status: targetStatus, rejectReason },
        { withCredentials: true },
      );

      const updatedOrderFromBackend = res.data.data;

      queryClient.setQueryData(["live-orders"], (oldOrders) =>
        (oldOrders || []).map((order) =>
          order._id === orderId
            ? {
                ...order,
                status: targetStatus,
                rejectReason: updatedOrderFromBackend?.rejectReason || rejectReason,
              }
            : order,
        ),
      );
    } catch (err) {
      console.error("Error transitioning state context pipeline:", err);
    }
  }, [queryClient]);

  const handleView = useCallback((order) => setSelectedOrder(order), []);
  const handleCloseModal = useCallback(() => setSelectedOrder(null), []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 sm:p-20 space-y-4">
        <div className="w-9 h-9 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold text-slate-500 tracking-tight text-center px-4">
          Connecting to Live Kitchen Stream...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans p-4 sm:p-6">
      <h1 className="text-xl sm:text-2xl font-black text-slate-900">
        Live Kitchen Monitor
      </h1>

      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
          <p className="text-sm font-semibold text-slate-400">No live orders right now.</p>
        </div>
      ) : (
        <div className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
          <p className="sm:hidden text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 pt-3">
            ← Swipe to see more →
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                  <th className="p-3 sm:p-4 whitespace-nowrap">Order ID</th>
                  <th className="p-3 sm:p-4 whitespace-nowrap">Table</th>
                  <th className="p-3 sm:p-4 whitespace-nowrap">Customer</th>
                  <th className="p-3 sm:p-4 whitespace-nowrap">Items</th>
                  <th className="p-3 sm:p-4 text-right whitespace-nowrap">Total</th>
                  <th className="p-3 sm:p-4 text-center whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentOrders.map((order) => (
                  <OrderRow
                    key={order._id}
                    order={order}
                    onStatusChange={handleStatusTransition}
                    onView={handleView}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-0 justify-between items-center py-4 px-2">
          <p className="text-xs text-slate-500 font-medium text-center sm:text-left">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(indexOfLastOrder, orders.length)} of {orders.length} orders
          </p>
          <div className="flex gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold disabled:opacity-50"
            >
              Previous
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {selectedOrder && (
        <OrderDetailsModal order={selectedOrder} onClose={handleCloseModal} />
      )}
    </div>
  );
}