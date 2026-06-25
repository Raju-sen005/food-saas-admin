import { ShoppingBasket } from 'lucide-react';

export default function CartPreview({ total, count, onCheckoutClick }) {
  if (count === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 z-50">
      <button
        onClick={onCheckoutClick}
        className="w-full bg-red-500 text-white p-4 rounded-xl font-bold text-sm tracking-wide shadow-xl shadow-red-500/20 flex justify-between items-center transition-all hover:bg-red-600 cursor-pointer animate-fade-in"
      >
        <div className="flex items-center gap-2.5">
          <div className="bg-white/20 p-1.5 rounded-lg">
            <ShoppingBasket size={18} />
          </div>
          <div className="text-left">
            <p className="text-xs text-red-100 font-medium">{count} Items Added</p>
            <p className="text-base font-black">View Basket</p>
          </div>
        </div>
        <span className="text-base font-black bg-black/10 px-3 py-1 rounded-lg">₹{total}</span>
      </button>
    </div>
  );
}