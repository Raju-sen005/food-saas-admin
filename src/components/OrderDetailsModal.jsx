import { X, Printer, Phone, User, MapPin } from "lucide-react";

export default function OrderDetailsModal({ order, onClose }) {
  if (!order) return null;

  const handlePrint = () => {
    window.print(); // Yeh browser ka print dialog khol dega
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      {/* Printable Area: Sirf yahi print hoga */}
      <div id="printable-section" className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-xl">
        <div className="flex justify-between items-center border-b pb-4">
          <h2 className="text-lg font-black text-slate-900">KOT: {order.orderId}</h2>
          <button onClick={onClose} className="no-print p-2 hover:bg-slate-100 rounded-full"><X size={20}/></button>
        </div>

        <div className="space-y-2 text-sm">
          <p><strong>Table:</strong> {order.tableNumber}</p>
          <p><strong>Type:</strong> {order.orderType}</p>
          <div className="flex items-center gap-2"><User size={14}/> {order.customerName}</div>
          <div className="flex items-center gap-2"><Phone size={14}/> {order.customerPhone}</div>
        </div>

        <div className="border-t border-dashed py-4 space-y-2">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span>{item.quantity} x {item.name}</span>
              <span>₹{item.price * item.quantity}</span>
            </div>
          ))}
        </div>

        <div className="border-t pt-2 space-y-1 font-bold">
          <div className="flex justify-between"><span>Subtotal</span><span>₹{order.subtotal}</span></div>
          {/* <div className="flex justify-between"><span>Tax</span><span>₹{order.tax}</span></div> */}
          <div className="flex justify-between text-lg font-black"><span>Total</span><span>₹{order.total}</span></div>
        </div>

        <button onClick={handlePrint} className="no-print w-full py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2">
          <Printer size={16}/> Print KOT
        </button>
      </div>
    </div>
  );
}