import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useSocket } from '../../context/SocketContext';
import { useNotificationSound } from '../../hooks/useNotificationSound';
import { Clock, Check, X, User, Phone, MapPin, ClipboardList, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

export default function LiveOrderMonitor() {
  const queryClient = useQueryClient();
  const socket = useSocket();
  const playAlert = useNotificationSound();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['live-orders'],
    queryFn: async () => {
      const res = await axios.get('http://localhost:5000/api/v1/orders/live', { withCredentials: true }); 
      return res.data.data || []; 
    }
  });

  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = (newOrder) => {
      playAlert();
      queryClient.setQueryData(['live-orders'], (oldOrders) => [
        newOrder,
        ...(oldOrders || [])
      ]);
    };

    socket.on('NEW_ORDER_RECEIVED', handleNewOrder);

    return () => {
      socket.off('NEW_ORDER_RECEIVED', handleNewOrder);
    };
  }, [socket, queryClient, playAlert]);

  const handleStatusTransition = async (orderId, targetStatus) => {
    let rejectReason = "";

    // 🛑 If status is REJECTED, prompt the user for a clear operational reason
    if (targetStatus === 'REJECTED') {
      const reason = prompt("Please enter the reason for rejection (e.g., Item Out of Stock, Kitchen Closed):");
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
        { withCredentials: true }
      );

      const updatedOrderFromBackend = res.data.data;

      // 🔄 Update state in cache directly without removing/hiding the component card structure
      queryClient.setQueryData(['live-orders'], (oldOrders) =>
        (oldOrders || []).map((order) => 
          order._id === orderId ? { ...order, status: targetStatus, rejectReason: updatedOrderFromBackend?.rejectReason || rejectReason } : order
        )
      );
    } catch (err) {
      console.error("Error transitioning state context pipeline:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <div className="w-9 h-9 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold text-slate-500 tracking-tight">Connecting to Live Kitchen Stream...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Dynamic Upper Top Bar Monitoring Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-xs">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ClipboardList className="text-rose-500" size={24} /> Live Kitchen Monitor
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">Incoming merchant platform ticket logs in real-time execution</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
          <span className="text-[11px] font-black tracking-wider uppercase text-emerald-700">POS Network Active</span>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-16 text-center shadow-xs flex flex-col items-center justify-center max-w-xl mx-auto space-y-3">
          <div className="p-4 bg-slate-50 rounded-full text-slate-400">
            <AlertCircle size={32} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base">Kitchen is Up to Date</h3>
            <p className="text-xs text-slate-400 font-medium mt-1">No pending ticket streams waiting for execution orders at this millisecond.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map((order) => (
            <div 
              key={order._id} 
              className={`bg-white rounded-2xl border shadow-xs hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden relative group ${
                order.status === 'REJECTED' ? 'border-rose-200/80 opacity-90' : 'border-slate-200/80'
              }`}
            >
              {/* Card Ribbon Style Premium Header */}
              <div className="bg-slate-900 px-5 py-4 flex justify-between items-center text-white">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">ORDER ID</span>
                  <span className="font-mono text-base font-black tracking-wider text-rose-400">{order.orderId}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                  <Clock size={12} className="animate-pulse" /> {order.orderType || 'Delivery'}
                </div>
              </div>

              {/* Customer Core Profile Section */}
              <div className="p-5 flex-1 space-y-4">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                    <User size={14} className="text-slate-400" />
                    <span>{order.customerName}</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium text-slate-500">
                    <Phone size={14} className="text-slate-400" />
                    <span>{order.customerPhone}</span>
                  </div>
                  {order.deliveryAddress && (
                    <div className="flex items-start gap-2 text-slate-500 pt-2 border-t border-slate-200/60 mt-1">
                      <MapPin size={14} className="text-rose-500 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{order.deliveryAddress}</span>
                    </div>
                  )}
                </div>

                {/* Items Iteration Loop Matrix */}
                <div className="space-y-2.5">
                  <p className="text-[10px] font-black tracking-wider text-slate-400 uppercase">KOT Item Summary</p>
                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    {order.items?.map((item, idx) => (
                      <div 
                        key={idx} 
                        className="flex justify-between items-center text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 shadow-xs" title="Veg Indicator Item" />
                          <span className="font-semibold text-slate-800">
                            {item.name} 
                            <span className="text-rose-600 font-black ml-1.5 bg-rose-50 px-1.5 py-0.5 rounded-md text-[11px]">x{item.quantity}</span>
                          </span>
                        </div>
                        <span className="font-black text-slate-900">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rejection Notification Indicator Banner (Only shows up if rejected) */}
                {order.status === 'REJECTED' && order.rejectReason && (
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2 text-[11px] text-rose-700 font-medium">
                    <AlertCircle size={14} className="shrink-0 mt-0.5 text-rose-500" />
                    <span><strong>Reason:</strong> {order.rejectReason}</span>
                  </div>
                )}
              </div>

              {/* Total Aggregate Calculation Summary Divider */}
              <div className="px-5 py-3 flex justify-between items-center text-xs bg-slate-50/60 border-t border-slate-100">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Net Merchant Payout</span>
                <span className="font-black text-base text-slate-900 tracking-tight">₹{(order.total || order.subtotal || 0).toLocaleString('en-IN')}</span>
              </div>

              {/* Dual Layout State Execution Control Operations */}
              <div className="p-5 bg-slate-50/60 border-t border-slate-100">
                {order.status === 'PENDING' ? (
                  <div className="flex gap-3">
                    <button 
                      type="button" 
                      onClick={() => handleStatusTransition(order._id, 'REJECTED')} 
                      className="flex-1 flex items-center justify-center gap-1.5 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:text-rose-600 hover:border-rose-200 py-3 rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                    >
                      <X size={14} strokeWidth={3} /> Decline
                    </button>
                    <button 
                      type="button" 
                      onClick={() => handleStatusTransition(order._id, 'ACCEPTED')} 
                      className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3 rounded-xl text-xs font-black hover:opacity-95 transition-all cursor-pointer shadow-sm shadow-emerald-500/10 active:scale-[0.98]"
                    >
                      <Check size={14} strokeWidth={3} /> Accept Order
                    </button>
                  </div>
                ) : (
                  /* Non-editable static state UI badges block */
                  <div className="w-full">
                    {order.status === 'ACCEPTED' && (
                      <div className="w-full flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200/80 py-3 rounded-xl text-xs font-black select-none tracking-wide uppercase">
                        <CheckCircle size={15} /> Order Accepted
                      </div>
                    )}
                    {order.status === 'REJECTED' && (
                      <div className="w-full flex items-center justify-center gap-2 bg-rose-50 text-rose-700 border border-rose-200/80 py-3 rounded-xl text-xs font-black select-none tracking-wide uppercase">
                        <XCircle size={15} /> Order Declined
                      </div>
                    )}
                    {order.status === 'COMPLETED' && (
                      <div className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-xl text-xs font-black select-none tracking-wide uppercase">
                        <CheckCircle size={15} /> Order Completed
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}