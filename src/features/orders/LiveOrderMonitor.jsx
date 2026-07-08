import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useSocket } from "../../context/SocketContext";
import { useNotificationSound } from "../../hooks/useNotificationSound";
import { Eye } from "lucide-react";
import OrderDetailsModal from "../../components/OrderDetailsModal";
import {
  Clock,
  Check,
  X,
  User,
  Phone,
  MapPin,
  ClipboardList,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";

export default function LiveOrderMonitor() {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const queryClient = useQueryClient();
  const socket = useSocket();
  const playAlert = useNotificationSound();
  // const [currentPage, setCurrentPage] = useState(1);
  // const itemsPerPage = 5; // Ek page par 5 orders

  // 1. Pehle data fetch karein
const { data: orders = [], isLoading } = useQuery({
  queryKey: ["live-orders"],
  queryFn: async () => {
    const res = await axios.get("http://localhost:5000/api/v1/orders/live", {
      withCredentials: true,
    });
    return res.data.data || [];
  },
});

// 2. AB pagination logic likhein (orders milne ke baad)
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
    };

    socket.on("NEW_ORDER_RECEIVED", handleNewOrder);

    return () => {
      socket.off("NEW_ORDER_RECEIVED", handleNewOrder);
    };
  }, [socket, queryClient, playAlert]);

  const handleStatusTransition = async (orderId, targetStatus) => {
    let rejectReason = "";

    // 🛑 If status is REJECTED, prompt the user for a clear operational reason
    if (targetStatus === "REJECTED") {
      const reason = prompt(
        "Please enter the reason for rejection (e.g., Item Out of Stock, Kitchen Closed):",
      );
      if (reason === null) return; // User cancelled prompt execution
      if (!reason.trim()) {
        alert("Rejection reason is mandatory!");
        return;
      }
      rejectReason = reason.trim();
    }

    try {
      // API payload structured with optional rejection token parameters
      const res = await axios.patch(
        `http://localhost:5000/api/v1/orders/${orderId}/status`,
        { status: targetStatus, rejectReason },
        { withCredentials: true },
      );

      const updatedOrderFromBackend = res.data.data;

      // 🔄 Update state in cache directly without removing/hiding the component card structure
      queryClient.setQueryData(["live-orders"], (oldOrders) =>
        (oldOrders || []).map((order) =>
          order._id === orderId
            ? {
                ...order,
                status: targetStatus,
                rejectReason:
                  updatedOrderFromBackend?.rejectReason || rejectReason,
              }
            : order,
        ),
      );
    } catch (err) {
      console.error("Error transitioning state context pipeline:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <div className="w-9 h-9 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold text-slate-500 tracking-tight">
          Connecting to Live Kitchen Stream...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans p-6">
      <h1 className="text-2xl font-black text-slate-900">
        Live Kitchen Monitor
      </h1>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 text-xs font-bold uppercase tracking-wider">
              <th className="p-4">Order ID</th>
              <th className="p-4">Table</th>
              <th className="p-4">Customer</th>
              <th className="p-4">Items</th>
              <th className="p-4 text-right">Total</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {currentOrders.map((order) => (
              <tr
                key={order._id}
                className="hover:bg-slate-50 transition-colors"
              >
                <td className="p-4 font-mono font-bold text-rose-600">
                  {order.orderId}
                </td>
                <td className="p-4 font-bold text-slate-700">
                  {order.tableNumber}
                </td>
                <td className="p-4 text-sm font-semibold">
                  {order.customerName}
                </td>
                <td className="p-4 text-xs text-slate-500">
                  {order.items
                    .slice(0, 2)
                    .map((i) => i.name)
                    .join(", ")}
                  {order.items.length > 2 && "..."}
                </td>
                <td className="p-4 text-right font-black">₹{order.total}</td>
                <td className="p-4 flex justify-center gap-2">
                  {order.status === "PENDING" ? (
                    <>
                      <button
                        onClick={() =>
                          handleStatusTransition(order._id, "ACCEPTED")
                        }
                        className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() =>
                          handleStatusTransition(order._id, "REJECTED")
                        }
                        className="p-2 bg-rose-100 text-rose-600 rounded-lg hover:bg-rose-200"
                      >
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <span className="text-[10px] font-black uppercase text-slate-400">
                      {order.status}
                    </span>
                  )}
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="p-2 border border-slate-200 rounded-lg hover:bg-slate-100"
                  >
                    <Eye size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center py-4 px-2">
          <p className="text-xs text-slate-500 font-medium">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(indexOfLastOrder, orders.length)} of {orders.length}{" "}
            orders
          </p>
          <div className="flex gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold disabled:opacity-50"
            >
              Previous
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
      {/* Modal Show Logic */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}
