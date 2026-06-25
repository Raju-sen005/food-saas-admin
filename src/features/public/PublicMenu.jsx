import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { ShoppingBag, Clock, MapPin, Star, Plus, Minus, X, Bike, Store, Info, CheckCircle2 } from 'lucide-react';

export default function PublicMenu() {
  const { restaurantId } = useParams();

  const [cart, setCart] = useState({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('ALL'); 
  
  const [orderType, setOrderType] = useState('DELIVERY'); 
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI'); 

  const { data: catalog, isLoading, error } = useQuery({
    queryKey: ['public-catalog', restaurantId],
    queryFn: async () => {
      const res = await axios.get(`http://localhost:5000/api/v1/menu/public/catalog/${restaurantId}`);
      return res.data.data;
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 space-y-3">
        <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Loading Digital Menu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="p-4 bg-rose-50 text-rose-500 rounded-full mb-3">
          <X size={28} />
        </div>
        <h3 className="font-black text-slate-800 text-base">Menu Not Available</h3>
        <p className="text-xs text-slate-400 font-medium max-w-xs mt-1">Invalid QR code configurations or server node aggregation failed.</p>
      </div>
    );
  }

  const { categories, combos, restaurant } = catalog || {};
  const categoryNames = categories ? Object.keys(categories) : [];

  const addToCart = (id, name, price, type = 'item') => {
    setCart((prevCart) => {
      const existing = prevCart[id];
      if (existing) {
        return { ...prevCart, [id]: { ...existing, quantity: existing.quantity + 1 } };
      }
      return { ...prevCart, [id]: { name, price: Number(price), quantity: 1, type } };
    });
  };

  const removeFromCart = (id) => {
    setCart((prevCart) => {
      const existing = prevCart[id];
      if (!existing) return prevCart;
      if (existing.quantity === 1) {
        const newCart = { ...prevCart };
        delete newCart[id];
        return newCart;
      }
      return { ...prevCart, [id]: { ...existing, quantity: existing.quantity - 1 } };
    });
  };

  const totalItemsCount = Object.values(cart).reduce((acc, item) => acc + item.quantity, 0);
  const totalCartAmount = Object.values(cart).reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleFinalOrderSubmit = async (e) => {
    e.preventDefault();

    if (!customerName.trim() || !customerPhone.trim()) {
      alert("Please enter your Name and Mobile Number!");
      return;
    }
    if (orderType === 'DELIVERY' && !deliveryAddress.trim()) {
      alert("Delivery address is required for home delivery!");
      return;
    }

    const orderPayload = {
      restaurantId,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      orderType: orderType === 'PICKUP' ? 'TAKEAWAY' : 'DELIVERY', 
      deliveryAddress: orderType === 'DELIVERY' ? deliveryAddress.trim() : '',
      items: Object.entries(cart).map(([id, details]) => ({
        itemId: id,
        name: details.name,
        quantity: Number(details.quantity),
        price: Number(details.price),
        itemType: details.type === 'combo' ? 'COMBO' : 'SINGLE' 
      })),
      subtotal: Number(totalCartAmount), 
      tax: 0,                                 
      total: Number(totalCartAmount)     
    };

    try {
      const res = await axios.post("http://localhost:5000/api/v1/orders/place", orderPayload);
      if (res.data.success) {
        alert(`🎉 Order Confirmed Successfully!\n\nOrder ID: ${res.data.order.orderId}`);
        setCart({});
        setCustomerName('');
        setCustomerPhone('');
        setDeliveryAddress('');
        setIsCartOpen(false);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Internal validation check mismatch error.");
    }
  };

  const QuantityController = ({ id, name, price, type }) => {
    const qty = cart[id]?.quantity || 0;
    if (qty === 0) {
      return (
        <button 
          type="button"
          onClick={() => addToCart(id, name, price, type)}
          className="bg-white hover:bg-slate-50 text-emerald-600 font-black text-xs px-5 py-2 rounded-xl shadow-xs border border-slate-200/80 active:scale-95 transition-all cursor-pointer tracking-wider"
        >
          ADD
        </button>
      );
    }
    return (
      <div className="flex items-center bg-emerald-600 text-white rounded-xl overflow-hidden shadow-sm h-[32px]">
        <button type="button" onClick={() => removeFromCart(id)} className="px-2.5 hover:bg-emerald-700 h-full flex items-center justify-center cursor-pointer">
          <Minus size={11} strokeWidth={3} />
        </button>
        <span className="px-1.5 text-xs font-black min-w-[16px] text-center select-none">{qty}</span>
        <button type="button" onClick={() => addToCart(id, name, price, type)} className="px-2.5 hover:bg-emerald-700 h-full flex items-center justify-center cursor-pointer">
          <Plus size={11} strokeWidth={3} />
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-28 antialiased font-sans max-w-md mx-auto shadow-sm relative border-x border-slate-200/40">
      
      {/* Premium Food Engine Corporate Brand Layout Header */}
      <div className="bg-white sticky top-0 z-40 border-b border-slate-100 shadow-xs">
        <div className="p-4 flex gap-4 items-center">
          {restaurant?.logo ? (
            <img src={restaurant.logo} alt={restaurant.name} className="w-14 h-14 rounded-2xl object-cover bg-slate-50 border border-slate-100" />
          ) : (
            <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center font-black text-xl border border-rose-100 shrink-0">
              {restaurant?.name?.charAt(0) || '🍴'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-tight text-slate-900 truncate">{restaurant?.name || 'Our Restaurant'}</h1>
              <span className="flex items-center text-[10px] bg-amber-50 text-amber-700 font-extrabold px-1.5 py-0.5 rounded-md border border-amber-200/40 shrink-0">
                <Star size={10} className="fill-amber-600 mr-0.5" /> 4.2
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium space-y-0.5 mt-0.5">
              {restaurant?.address && <p className="flex items-center gap-1 truncate"><MapPin size={11} /> {restaurant.address}</p>}
              <p className="flex items-center gap-1 text-emerald-600 font-semibold">
                <Clock size={11} /> <span>{restaurant?.timings || '11:00 AM - 11:00 PM'}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Categories Tab Roller Component */}
        <div className="border-t border-slate-100 bg-white">
          <div className="px-4 py-2.5 flex gap-1.5 overflow-x-auto no-scrollbar">
            <button 
              onClick={() => setActiveCategory('ALL')} 
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black tracking-tight whitespace-nowrap transition-all cursor-pointer border ${
                activeCategory === 'ALL' ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200/60'
              }`}
            >
              All Menu
            </button>
            {combos?.length > 0 && (
              <button 
                onClick={() => setActiveCategory('COMBOS')} 
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black tracking-tight whitespace-nowrap transition-all cursor-pointer border ${
                  activeCategory === 'COMBOS' ? 'bg-rose-500 text-white border-rose-500 shadow-sm' : 'bg-rose-50 text-rose-600 border-rose-100'
                }`}
              >
                🔥 Combos
              </button>
            )}
            {categoryNames.map((catName) => (
              <button 
                key={catName} 
                onClick={() => setActiveCategory(catName)} 
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold tracking-tight whitespace-nowrap transition-all cursor-pointer border ${
                  activeCategory === catName ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200/60'
                }`}
              >
                {catName}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Menu Grid / Items Core Containers */}
      <div className="p-4 space-y-6">
        {/* Combos Visual Blocks Layer */}
        {combos?.length > 0 && (activeCategory === 'ALL' || activeCategory === 'COMBOS') && (
          <div className="space-y-3">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-1">
              ✨ Best Value Combos
            </h2>
            {combos.map((combo) => (
              <div key={combo._id} className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-xs flex justify-between items-center gap-4">
                <div className="space-y-1 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block border border-white shadow-xs" />
                  <h3 className="font-black text-sm text-slate-900 tracking-tight">{combo.name}</h3>
                  <p className="text-xs text-slate-400 font-medium line-clamp-2 leading-relaxed">{combo.description}</p>
                  <p className="text-sm font-black text-slate-900 pt-0.5">₹{combo.price}</p>
                </div>
                <div className="shrink-0">
                  <QuantityController id={combo._id} name={combo.name} price={combo.price} type="combo" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Traditional Categories Matrix Grid loop */}
        {categories && Object.keys(categories)
          .filter((catName) => activeCategory === 'ALL' || activeCategory === catName)
          .map((categoryName) => (
            <div key={categoryName} className="space-y-3">
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{categoryName}</h2>
              <div className="space-y-3">
                {categories[categoryName].map((item) => (
                  <div key={item._id} className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-xs flex gap-4 items-center justify-between">
                    <div className="flex gap-3 items-center flex-1 min-w-0">
                      {item.image && (
                        <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-xl border border-slate-100 bg-slate-50 shrink-0" />
                      )}
                      <div className="space-y-0.5 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block border border-white shadow-xs" />
                        <h3 className="font-black text-sm text-slate-900 tracking-tight truncate">{item.name}</h3>
                        <p className="text-xs text-slate-400 font-medium line-clamp-2 leading-relaxed pr-2">{item.description}</p>
                        <p className="text-sm font-black text-slate-900 pt-0.5">₹{item.price}</p>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <QuantityController id={item._id} name={item.name} price={item.price} type="item" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>

      {/* Floating Bottom Action Sheet Summary Notification Node */}
      {totalItemsCount > 0 && !isCartOpen && (
        <div className="fixed bottom-4 inset-x-4 max-w-sm mx-auto z-40 px-2">
          <div className="bg-slate-950 text-white p-3.5 rounded-2xl shadow-xl flex justify-between items-center border border-slate-800 backdrop-blur-md">
            <div className="flex items-center gap-3 pl-1">
              <div className="p-2 bg-rose-500 rounded-xl text-white">
                <ShoppingBag size={16} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{totalItemsCount} Item{totalItemsCount > 1 ? 's' : ''}</p>
                <p className="text-base font-black text-white tracking-tight">₹{totalCartAmount.toLocaleString('en-IN')}</p>
              </div>
            </div>
            <button 
              onClick={() => setIsCartOpen(true)} 
              className="bg-gradient-to-r from-rose-500 to-pink-600 text-white font-black text-xs px-5 py-3 rounded-xl cursor-pointer shadow-md transition-all active:scale-[0.98]"
            >
              Next Step
            </button>
          </div>
        </div>
      )}

      {/* Zomato-Style Secure Cart Layer Drawer Overlay Context */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-end justify-center backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-t-3xl max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-base font-black text-slate-900 tracking-tight">Review Order</h2>
              <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 cursor-pointer"><X size={18} strokeWidth={2.5} /></button>
            </div>

            <form onSubmit={handleFinalOrderSubmit} className="p-4 space-y-5 flex-1 text-slate-700">
              
              {/* Order Mode Mappings */}
              <div className="space-y-2">
                <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Fulfillment Preference</span>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                  <button type="button" onClick={() => setOrderType('DELIVERY')} className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-black tracking-tight transition-all cursor-pointer ${orderType === 'DELIVERY' ? 'bg-white text-rose-500 shadow-xs' : 'text-slate-500'}`}><Bike size={13} strokeWidth={2.5} /> Delivery</button>
                  <button type="button" onClick={() => setOrderType('PICKUP')} className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-black tracking-tight transition-all cursor-pointer ${orderType === 'PICKUP' ? 'bg-white text-rose-500 shadow-xs' : 'text-slate-500'}`}><Store size={13} strokeWidth={2.5} /> Self-Pickup</button>
                </div>
              </div>

              {/* Identity Capture Profiles inputs */}
              <div className="space-y-2.5">
                <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Contact Documentation</span>
                <div className="grid grid-cols-1 gap-2">
                  <input type="text" required placeholder="Full Name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full px-4 py-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 bg-slate-50/50" />
                  <input type="tel" required placeholder="Active Phone Number" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="w-full px-4 py-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 bg-slate-50/50" />
                </div>
                {orderType === 'DELIVERY' && (
                  <textarea required rows={2} placeholder="Complete Drop-off Address Instructions..." value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} className="w-full px-4 py-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 bg-slate-50/50 resize-none leading-relaxed" />
                )}
              </div>

              {/* Bill Items Breakdown Summary View */}
              <div className="space-y-2">
                <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Selected Delicacies</span>
                <div className="bg-slate-50/80 rounded-xl p-3 divide-y divide-slate-100 text-xs border border-slate-100 max-h-36 overflow-y-auto">
                  {Object.entries(cart).map(([id, details]) => (
                    <div key={id} className="py-2.5 flex justify-between items-center text-slate-700 font-medium">
                      <span>{details.name} <b className="text-emerald-600 ml-1">x{details.quantity}</b></span>
                      <span className="font-black text-slate-900">₹{(details.price * details.quantity).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interactive Multi-Option Payment Gateway Selections */}
              <div className="space-y-2">
                <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Payment Selection</span>
                <div className="grid grid-cols-2 gap-2">
                  <div 
                    onClick={() => setPaymentMethod('UPI')} 
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${paymentMethod === 'UPI' ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-200 bg-white'}`}
                  >
                    <span className="text-xs font-bold text-slate-800">Instant UPI App</span>
                    {paymentMethod === 'UPI' && <CheckCircle2 size={14} className="text-emerald-600 fill-emerald-100" />}
                  </div>
                  <div 
                    onClick={() => setPaymentMethod('CASH')} 
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${paymentMethod === 'CASH' ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-200 bg-white'}`}
                  >
                    <span className="text-xs font-bold text-slate-800">{orderType === 'DELIVERY' ? 'COD Pay' : 'Pay at Desk'}</span>
                    {paymentMethod === 'CASH' && <CheckCircle2 size={14} className="text-emerald-600 fill-emerald-100" />}
                  </div>
                </div>
              </div>

              {/* Terminal Trigger Checkout Submission Command */}
              <div className="pt-2">
                <button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-xs py-3.5 rounded-xl shadow-md shadow-emerald-600/10 transition-all cursor-pointer active:scale-[0.99] tracking-wider uppercase"
                >
                  Confirm Order • ₹{totalCartAmount.toLocaleString('en-IN')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}