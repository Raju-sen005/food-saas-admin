import { useEffect, useState } from 'react';
import axios from 'axios';
import { useCustomerConfig } from '../../components/ThemeWrapper';
import { ShoppingBag, Plus, Minus } from 'lucide-react';

export default function CustomerMenu({ onUpdateCart, cart }) {
  const restaurant = useCustomerConfig();
  const [catalog, setCatalog] = useState({ categories: {}, combos: [] });
  const [activeCategory, setActiveCategory] = useState('');

  useEffect(() => {
    const loadMenu = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/v1/menu/public/catalog/${restaurant._id}`);
        if (res.data.success) {
          setCatalog(res.data.data);
          const firstCat = Object.keys(res.data.data.categories)[0];
          if (firstCat) setActiveCategory(firstCat);
        }
      } catch (err) {
        console.error("Error compilation mapping details.");
      }
    };
    loadMenu();
  }, [restaurant]);

  const updateQuantity = (item, delta) => {
    const currentQty = cart[item._id]?.quantity || 0;
    const newQty = currentQty + delta;
    onUpdateCart(item, newQty);
  };

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen pb-24 shadow-sm">
      {/* Brand Header Banner */}
      <div className="relative h-40 bg-slate-900 flex items-end p-4 text-white">
        {restaurant.logo && <img src={restaurant.logo} alt="logo" className="w-16 h-16 rounded-xl border-2 border-white object-cover shadow-md absolute -bottom-4 left-4" />}
        <div className="ml-24 mb-1">
          <h1 className="text-xl font-bold tracking-tight">{restaurant.name}</h1>
          <p className="text-xs text-slate-300">Fresh and quick direct table ordering</p>
        </div>
      </div>

      {/* Horizontal Nav Categories Filter tabs */}
      <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-slate-100 flex gap-2 p-4 overflow-x-auto scrollbar-none z-40 mt-6">
        {Object.keys(catalog.categories).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{ backgroundColor: activeCategory === cat ? 'var(--accent-color)' : '', color: activeCategory === cat ? '#fff' : '' }}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border border-slate-100 transition-all ${activeCategory === cat ? '' : 'bg-slate-50 text-slate-600'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Live Active Items List Render Cards */}
      <div className="p-4 space-y-4">
        {catalog.categories[activeCategory]?.map((item) => {
          const qty = cart[item._id]?.quantity || 0;
          return (
            <div key={item._id} className="flex gap-4 p-3 rounded-xl border border-slate-100 shadow-xs items-center">
              {item.image && <img src={item.image} alt={item.name} className="w-20 h-20 rounded-lg object-cover bg-slate-100" />}
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800 text-sm">{item.name}</h3>
                <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">{item.description}</p>
                <p className="font-bold text-sm text-slate-900 mt-1">₹{item.price}</p>
              </div>
              <div className="flex items-center gap-2">
                {qty > 0 ? (
                  <div className="flex items-center gap-2 border border-slate-200 rounded-full p-1 bg-slate-50">
                    <button onClick={() => updateQuantity(item, -1)} className="w-6 h-6 rounded-full flex items-center justify-center bg-white text-slate-600 shadow-xs cursor-pointer"><Minus size={12} /></button>
                    <span className="text-xs font-bold w-4 text-center">{qty}</span>
                    <button onClick={() => updateQuantity(item, 1)} className="w-6 h-6 rounded-full flex items-center justify-center bg-white text-slate-600 shadow-xs cursor-pointer"><Plus size={12} /></button>
                  </div>
                ) : (
                  <button
                    onClick={() => updateQuantity(item, 1)}
                    style={{ borderColor: 'var(--accent-color)', color: 'var(--accent-color)' }}
                    className="flex items-center gap-1 border px-3 py-1 rounded-full text-xs font-bold bg-white transition-all cursor-pointer"
                  >
                    Add
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}