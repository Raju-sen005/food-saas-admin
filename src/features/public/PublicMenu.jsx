import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  ShoppingBag,
  Star,
  Plus,
  Minus,
  X,
  CheckCircle2,
  Utensils,
  AlertCircle,
  User,
  Phone,
} from "lucide-react";

export default function PublicMenu() {
  const { restaurantId } = useParams();
  const [searchParams] = useSearchParams();
  const tableToken = searchParams.get("t"); // 💡 URL se token mil gaya
  const [cart, setCart] = useState({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [orderType, setOrderType] = useState("PICKUP");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 👇 Touched state — taaki error tabhi dikhe jab user field ko chhu chuka ho
  const [touched, setTouched] = useState({ name: false, phone: false });

  const isValidName = /^[A-Za-z ]{3,50}$/.test(customerName.trim());
  const isValidPhone = /^[6-9]\d{9}$/.test(customerPhone.trim());
  const isValidAddress =
    orderType !== "DELIVERY" || deliveryAddress.trim().length > 4;

  // 👇 Master check — jb tak ye sab true na ho, submit button disable rahega
  const isFormValid =
    isValidName && isValidPhone && isValidAddress && totalItemsCountSafe(cart);

  function totalItemsCountSafe(c) {
    return Object.values(c).reduce((acc, item) => acc + item.quantity, 0) > 0;
  }

  const {
    data: catalog,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["public-catalog", restaurantId],
    queryFn: async () => {
      const res = await axios.get(
        `http://localhost:5000/api/v1/menu/public/catalog/${restaurantId}`,
      );
      return res.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 space-y-3">
        <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
          Loading Digital Menu...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="p-4 bg-rose-50 text-rose-500 rounded-full mb-3">
          <X size={28} />
        </div>
        <h3 className="font-black text-slate-800 text-base">
          Menu Not Available
        </h3>
        <p className="text-xs text-slate-400 font-medium max-w-xs mt-1">
          Invalid QR code configurations or server node aggregation failed.
        </p>
      </div>
    );
  }

  const { categories, combos, restaurant } = catalog || {};
  const categoryNames = categories ? Object.keys(categories) : [];

  const addToCart = (id, name, price, type = "item") => {
    setCart((prevCart) => {
      const existing = prevCart[id];
      if (existing) {
        return {
          ...prevCart,
          [id]: { ...existing, quantity: existing.quantity + 1 },
        };
      }
      return {
        ...prevCart,
        [id]: { name, price: Number(price), quantity: 1, type },
      };
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
      return {
        ...prevCart,
        [id]: { ...existing, quantity: existing.quantity - 1 },
      };
    });
  };

  const totalItemsCount = Object.values(cart).reduce(
    (acc, item) => acc + item.quantity,
    0,
  );
  const totalCartAmount = Object.values(cart).reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  );
  // 2. Filter logic add karein (items aur combos ke liye):
  const filteredCombos = combos?.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getFilteredItems = (items) =>
    items?.filter((i) =>
      i.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  const handleFinalOrderSubmit = async (e) => {
    e.preventDefault();

    // Mark sab touched — safety net agar form disabled state se bhi bypass ho jaye
    setTouched({ name: true, phone: true });

    if (!isValidName || !isValidPhone || !isValidAddress) {
      return;
    }

    const orderPayload = {
      restaurantId,
      tableToken,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      orderType: orderType === "PICKUP" ? "TAKEAWAY" : "DELIVERY",
      deliveryAddress: orderType === "DELIVERY" ? deliveryAddress.trim() : "",
      items: Object.entries(cart).map(([id, details]) => ({
        itemId: id,
        name: details.name,
        quantity: Number(details.quantity),
        price: Number(details.price),
        itemType: details.type === "combo" ? "COMBO" : "SINGLE",
      })),
      subtotal: Number(totalCartAmount),
      tax: 0,
      total: Number(totalCartAmount),
    };

    try {
      setIsSubmitting(true);
      const res = await axios.post(
        "http://localhost:5000/api/v1/orders/place",
        orderPayload,
      );
      if (res.data.success) {
        alert(
          `🎉 Order Confirmed Successfully!\n\nOrder ID: ${res.data.order.orderId}`,
        );
        setCart({});
        setCustomerName("");
        setCustomerPhone("");
        setDeliveryAddress("");
        setTouched({ name: false, phone: false });
        setIsCartOpen(false);
      }
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Internal validation check mismatch error.",
      );
    } finally {
      setIsSubmitting(false);
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
        <button
          type="button"
          onClick={() => removeFromCart(id)}
          className="px-2.5 hover:bg-emerald-700 h-full flex items-center justify-center cursor-pointer"
        >
          <Minus size={11} strokeWidth={3} />
        </button>
        <span className="px-1.5 text-xs font-black min-w-[16px] text-center select-none">
          {qty}
        </span>
        <button
          type="button"
          onClick={() => addToCart(id, name, price, type)}
          className="px-2.5 hover:bg-emerald-700 h-full flex items-center justify-center cursor-pointer"
        >
          <Plus size={11} strokeWidth={3} />
        </button>
      </div>
    );
  };

  const nameHasError = touched.name && !isValidName;
  const phoneHasError = touched.phone && !isValidPhone;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-28 antialiased font-sans max-w-md mx-auto shadow-sm relative border-x border-slate-200/40">
      {/* Premium Food Engine Corporate Brand Layout Header */}
      <div className="bg-white sticky top-0 z-40 border-b border-slate-100 shadow-xs">
        <div className="p-4 flex gap-4 items-center">
          {restaurant?.logo ? (
            <img
              src={restaurant.logo}
              alt={restaurant.name}
              className="w-14 h-14 rounded-2xl object-cover bg-slate-50 border border-slate-100"
            />
          ) : (
            <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center font-black text-xl border border-rose-100 shrink-0">
              {restaurant?.name?.charAt(0) || "🍴"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-tight text-slate-900 truncate">
                {restaurant?.name || "Our Restaurant"}
              </h1>
              <span className="flex items-center text-[10px] bg-amber-50 text-amber-700 font-extrabold px-1.5 py-0.5 rounded-md border border-amber-200/40 shrink-0">
                <Star size={10} className="fill-amber-600 mr-0.5" /> 4.2
              </span>
            </div>
          </div>
        </div>

        {/* Search Bar Component */}
      <div className="px-4 pb-4 bg-white">
        <div className="relative">
          <input
            type="text"
            placeholder="Search for your favorite dishes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-100 border border-slate-200 text-xs font-medium py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

        {/* Categories Tab Roller Component */}
        <div className="border-t border-slate-100 bg-white">
          <div className="px-4 py-2.5 flex gap-1.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveCategory("ALL")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black tracking-tight whitespace-nowrap transition-all cursor-pointer border ${
                activeCategory === "ALL"
                  ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                  : "bg-slate-50 text-slate-600 border-slate-200/60"
              }`}
            >
              All Menu
            </button>
            {combos?.length > 0 && (
              <button
                onClick={() => setActiveCategory("COMBOS")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black tracking-tight whitespace-nowrap transition-all cursor-pointer border ${
                  activeCategory === "COMBOS"
                    ? "bg-rose-500 text-white border-rose-500 shadow-sm"
                    : "bg-rose-50 text-rose-600 border-rose-100"
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
                  activeCategory === catName
                    ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                    : "bg-slate-50 text-slate-600 border-slate-200/60"
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
        {combos?.length > 0 &&
          (activeCategory === "ALL" || activeCategory === "COMBOS") && (
            <div className="space-y-3">
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-1">
                ✨ Best Value Combos
              </h2>

              {/* Horizontal Scrollable Container */}
              <div className="flex gap-3 overflow-x-auto pb-2 -mr-4 pr-4 no-scrollbar">
                {filteredCombos.map((combo) => (
                  <div
                    key={combo._id}
                    className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-xs flex flex-col justify-between gap-3 shrink-0 w-[240px]"
                  >
                    <div className="space-y-1">
                      <h3 className="font-black text-sm text-slate-900 tracking-tight truncate">
                        {combo.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 font-medium line-clamp-2 leading-relaxed h-[28px]">
                        {combo.description}
                      </p>
                    </div>

                    <div className="flex justify-between items-center mt-2">
                      <p className="text-sm font-black text-slate-900">
                        ₹{combo.price}
                      </p>
                      <QuantityController
                        id={combo._id}
                        name={combo.name}
                        price={combo.price}
                        type="combo"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Traditional Categories Matrix Grid loop */}
        {categories &&
          Object.keys(categories)
            .filter(
              (catName) =>
                activeCategory === "ALL" || activeCategory === catName,
            )
            .map((categoryName) => (
              <div key={categoryName} className="space-y-3">
                {/* <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                  {categoryName}
                </h2> */}
                <div className="space-y-3">
                  {getFilteredItems(categories[categoryName]).map((item) => (
                    <div
                      key={item._id}
                      className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-xs flex gap-4 items-center justify-between"
                    >
                      <div className="flex gap-3 items-center flex-1 min-w-0">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded-xl border border-slate-100 bg-slate-50 shrink-0"
                          />
                        )}
                        <div className="space-y-0.5 min-w-0">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block border border-white shadow-xs" />
                          <h3 className="font-black text-sm text-slate-900 tracking-tight truncate">
                            {item.name}
                          </h3>
                          <p className="text-xs text-slate-400 font-medium line-clamp-2 leading-relaxed pr-2">
                            {item.description}
                          </p>
                          <p className="text-sm font-black text-slate-900 pt-0.5">
                            ₹{item.price}
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0">
                        <QuantityController
                          id={item._id}
                          name={item.name}
                          price={item.price}
                          type="item"
                        />
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
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {totalItemsCount} Item{totalItemsCount > 1 ? "s" : ""}
                </p>
                <p className="text-base font-black text-white tracking-tight">
                  ₹{totalCartAmount.toLocaleString("en-IN")}
                </p>
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
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                Review Order
              </h2>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 cursor-pointer"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            <form
              onSubmit={handleFinalOrderSubmit}
              className="p-4 space-y-5 flex-1 text-slate-700"
              noValidate
            >
              {/* Order Mode Mappings */}
              <div className="space-y-2">
                <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Fulfillment Preference
                </span>
                <div className="grid grid-cols-1 gap-2 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setOrderType("PICKUP")}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-black tracking-tight transition-all cursor-pointer ${orderType === "PICKUP" ? "bg-white text-rose-500 shadow-xs" : "text-slate-500"}`}
                  >
                    <Utensils size={13} strokeWidth={2.5} /> Dine-In
                  </button>
                </div>
              </div>

              {/* Identity Capture Profiles inputs */}
              <div className="space-y-2.5">
                <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Contact Documentation
                </span>
                <div className="grid grid-cols-1 gap-2.5">
                  {/* Name field */}
                  <div>
                    <div className="relative">
                      <User
                        size={14}
                        strokeWidth={2.5}
                        className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${
                          nameHasError
                            ? "text-rose-400"
                            : isValidName
                              ? "text-emerald-500"
                              : "text-slate-300"
                        }`}
                      />
                      <input
                        type="text"
                        required
                        placeholder="Full Name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                        className={`w-full pl-10 pr-9 py-3 text-xs rounded-xl border bg-slate-50/50 focus:outline-none focus:ring-4 transition-colors ${
                          nameHasError
                            ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/10"
                            : isValidName
                              ? "border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500/10"
                              : "border-slate-200 focus:border-rose-500 focus:ring-rose-500/10"
                        }`}
                      />
                      {isValidName && (
                        <CheckCircle2
                          size={14}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500 fill-emerald-100"
                        />
                      )}
                    </div>
                    {nameHasError && (
                      <p className="flex items-center gap-1 text-[10px] font-bold text-rose-500 mt-1 pl-1">
                        <AlertCircle size={11} strokeWidth={2.5} />
                        Enter a valid name (3-50 letters, spaces allowed)
                      </p>
                    )}
                  </div>

                  {/* Phone field */}
                  <div>
                    <div className="relative">
                      <Phone
                        size={14}
                        strokeWidth={2.5}
                        className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${
                          phoneHasError
                            ? "text-rose-400"
                            : isValidPhone
                              ? "text-emerald-500"
                              : "text-slate-300"
                        }`}
                      />
                      <input
                        type="tel"
                        required
                        inputMode="numeric"
                        maxLength={10}
                        placeholder="Active Phone Number"
                        value={customerPhone}
                        onChange={(e) =>
                          setCustomerPhone(
                            e.target.value.replace(/\D/g, "").slice(0, 10),
                          )
                        }
                        onBlur={() =>
                          setTouched((t) => ({ ...t, phone: true }))
                        }
                        className={`w-full pl-10 pr-9 py-3 text-xs rounded-xl border bg-slate-50/50 focus:outline-none focus:ring-4 transition-colors ${
                          phoneHasError
                            ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/10"
                            : isValidPhone
                              ? "border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500/10"
                              : "border-slate-200 focus:border-rose-500 focus:ring-rose-500/10"
                        }`}
                      />
                      {isValidPhone && (
                        <CheckCircle2
                          size={14}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500 fill-emerald-100"
                        />
                      )}
                    </div>
                    {phoneHasError && (
                      <p className="flex items-center gap-1 text-[10px] font-bold text-rose-500 mt-1 pl-1">
                        <AlertCircle size={11} strokeWidth={2.5} />
                        Enter a valid 10-digit number starting with 6-9
                      </p>
                    )}
                  </div>
                </div>

                {orderType === "DELIVERY" && (
                  <textarea
                    required
                    rows={2}
                    placeholder="Complete Drop-off Address Instructions..."
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full px-4 py-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 bg-slate-50/50 resize-none leading-relaxed"
                  />
                )}
              </div>

              {/* Bill Items Breakdown Summary View */}
              <div className="space-y-2">
                <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Selected Delicacies
                </span>
                <div className="bg-slate-50/80 rounded-xl p-3 divide-y divide-slate-100 text-xs border border-slate-100 max-h-36 overflow-y-auto">
                  {Object.entries(cart).map(([id, details]) => (
                    <div
                      key={id}
                      className="py-2.5 flex justify-between items-center text-slate-700 font-medium"
                    >
                      <span>
                        {details.name}{" "}
                        <b className="text-emerald-600 ml-1">
                          x{details.quantity}
                        </b>
                      </span>
                      <span className="font-black text-slate-900">
                        ₹
                        {(details.price * details.quantity).toLocaleString(
                          "en-IN",
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interactive Multi-Option Payment Gateway Selections */}
              <div className="space-y-2">
                <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Payment Selection
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div
                    onClick={() => setPaymentMethod("UPI")}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${paymentMethod === "UPI" ? "border-emerald-500 bg-emerald-50/30" : "border-slate-200 bg-white"}`}
                  >
                    <span className="text-xs font-bold text-slate-800">
                      Instant UPI App
                    </span>
                    {paymentMethod === "UPI" && (
                      <CheckCircle2
                        size={14}
                        className="text-emerald-600 fill-emerald-100"
                      />
                    )}
                  </div>
                  <div
                    onClick={() => setPaymentMethod("CASH")}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${paymentMethod === "CASH" ? "border-emerald-500 bg-emerald-50/30" : "border-slate-200 bg-white"}`}
                  >
                    <span className="text-xs font-bold text-slate-800">
                      {orderType === "DELIVERY" ? "COD Pay" : "Pay at Desk"}
                    </span>
                    {paymentMethod === "CASH" && (
                      <CheckCircle2
                        size={14}
                        className="text-emerald-600 fill-emerald-100"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Terminal Trigger Checkout Submission Command */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!isFormValid || isSubmitting}
                  className={`w-full font-black text-xs py-3.5 rounded-xl shadow-md transition-all tracking-wider uppercase ${
                    !isFormValid || isSubmitting
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                      : "bg-gradient-to-r from-emerald-500 to-teal-600 text-white cursor-pointer shadow-emerald-600/10 active:scale-[0.99]"
                  }`}
                >
                  {isSubmitting
                    ? "Placing Order..."
                    : `Confirm Order • ₹${totalCartAmount.toLocaleString("en-IN")}`}
                </button>
                {!isFormValid && (
                  <p className="text-center text-[10px] font-bold text-slate-400 mt-2">
                    Enter your name and mobile number to continue
                  </p>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
