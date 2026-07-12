import { useState, useCallback, useMemo, memo } from "react";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tag, X, Trash2 } from "lucide-react";

const api = axios.create({ baseURL: `${import.meta.env.VITE_APP_API_BASE}` });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 🔑 Extracted + memoized — form ke input change hone pe yeh list re-render nahi hogi
const OfferCard = memo(function OfferCard({ offer, onDelete }) {
  return (
    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 hover:border-rose-200 transition flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-3">
      <div className="flex gap-3 sm:gap-4 items-center flex-1 min-w-0">
        <div className="p-2.5 sm:p-3 bg-rose-50 text-rose-500 rounded-xl shrink-0">
          <Tag size={18} className="sm:w-5 sm:h-5" />
        </div>
        <div className="min-w-0">
          <h3 className="font-black text-slate-800 text-sm sm:text-base truncate">{offer.title}</h3>
          <p className="text-xs text-slate-500 truncate">{offer.description}</p>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 shrink-0">
        <div className="text-left sm:text-right">
          <div className="text-emerald-600 font-black text-base sm:text-lg">
            {offer.discountValue}% OFF
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase whitespace-nowrap">
            {offer.targetItems?.length || 0} Items
          </p>
        </div>
        <button
          onClick={() => onDelete(offer._id)}
          className="text-slate-300 hover:text-red-500 transition p-2 shrink-0"
        >
          <Trash2 size={20} />
        </button>
      </div>
    </div>
  );
});

export default function Offers() {
  const [formData, setFormData] = useState({
    title: "",
    discountValue: "",
    description: "",
    targetItems: [],
  });
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (offerId) => api.delete(`/offers/${offerId}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["offers"]);
    },
    onError: () => alert("Failed to delete offer"),
  });

  const { data: offersRaw, isLoading: offersLoading, isError: offersError } = useQuery({
    queryKey: ["offers"],
    queryFn: () => api.get("/offers").then((r) => r.data.data),
    staleTime: 30_000,
  });

  const { data: menuItemsRaw, isLoading: itemsLoading, isError: itemsError } = useQuery({
    queryKey: ["menu-items-list"], // Note: agar MenuCatalog mein "menu-items" key items+combos dono rakhta h,
    // yeh alag key rakhna better h taaki dono queries conflict na karein
    queryFn: () => api.get("/menu/admin/items").then((r) => r.data.data),
    staleTime: 60_000,
  });

  const offers = useMemo(() => (Array.isArray(offersRaw) ? offersRaw : []), [offersRaw]);
  const menuItems = useMemo(() => (Array.isArray(menuItemsRaw) ? menuItemsRaw : []), [menuItemsRaw]);

  // 🔑 lookup map — O(1) find instead of .find() (O(n)) har chip render pe
  const menuItemsById = useMemo(() => {
    const map = {};
    menuItems.forEach((item) => {
      map[item._id] = item;
    });
    return map;
  }, [menuItems]);

  const addMutation = useMutation({
    mutationFn: (data) => api.post("/offers", data),
    onSuccess: () => {
      queryClient.invalidateQueries(["offers"]);
      setFormData({ title: "", discountValue: "", description: "", targetItems: [] });
    },
    onError: () => alert("Failed to create offer"),
  });

  const updateField = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const addTargetItem = useCallback((itemId) => {
    setFormData((prev) =>
      prev.targetItems.includes(itemId)
        ? prev
        : { ...prev, targetItems: [...prev.targetItems, itemId] }
    );
  }, []);

  const removeTargetItem = useCallback((itemId) => {
    setFormData((prev) => ({
      ...prev,
      targetItems: prev.targetItems.filter((id) => id !== itemId),
    }));
  }, []);

  const handleDeleteOffer = useCallback(
    (offerId) => {
      if (window.confirm("Are you sure you want to delete this offer?")) {
        deleteMutation.mutate(offerId);
      }
    },
    [deleteMutation]
  );

  const handleLaunchOffer = useCallback(() => {
    addMutation.mutate(formData);
  }, [addMutation, formData]);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-lg sm:text-xl font-black text-slate-800">🔥 Restaurant Offers</h2>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <input
            placeholder="Offer Name (e.g. Weekend Special)"
            className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm"
            value={formData.title}
            onChange={(e) => updateField("title", e.target.value)}
          />
          <input
            type="number"
            placeholder="Discount %"
            className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm"
            value={formData.discountValue}
            onChange={(e) => updateField("discountValue", e.target.value)}
          />
        </div>

        <textarea
          placeholder="Brief description..."
          className="w-full mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm"
          rows={2}
          value={formData.description}
          onChange={(e) => updateField("description", e.target.value)}
        />

        <div className="mt-4">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Apply to specific items:
          </label>

          {itemsLoading && <p className="text-xs text-slate-400 mt-1">Loading items...</p>}
          {itemsError && (
            <p className="text-xs text-red-500 mt-1">
              Failed to load menu items. Check your login/token.
            </p>
          )}

          <select
            className="w-full mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm"
            value=""
            onChange={(e) => e.target.value && addTargetItem(e.target.value)}
          >
            <option value="">Select Item to add...</option>
            {menuItems.map((item) => (
              <option key={item._id} value={item._id}>
                {item.name} - ₹{item.price}
              </option>
            ))}
          </select>

          <div className="flex flex-wrap gap-2 mt-3">
            {formData.targetItems.map((itemId) => {
              const item = menuItemsById[itemId];
              return (
                <span
                  key={itemId}
                  className="flex items-center gap-1 bg-rose-50 text-rose-600 px-3 py-1 rounded-full text-xs font-bold"
                >
                  {item?.name || "Unknown item"}{" "}
                  <X
                    size={12}
                    className="cursor-pointer shrink-0"
                    onClick={() => removeTargetItem(itemId)}
                  />
                </span>
              );
            })}
          </div>
        </div>

        <button
          onClick={handleLaunchOffer}
          disabled={addMutation.isPending}
          className="w-full mt-6 bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition disabled:opacity-50"
        >
          {addMutation.isPending ? "Creating..." : "Launch Offer"}
        </button>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {offersLoading && <p className="text-sm text-slate-400">Loading offers...</p>}
        {offersError && <p className="text-sm text-red-500">Failed to load offers.</p>}
        {!offersLoading && offers.length === 0 && (
          <p className="text-sm text-slate-400">No offers created yet.</p>
        )}

        {offers.map((offer) => (
          <OfferCard key={offer._id} offer={offer} onDelete={handleDeleteOffer} />
        ))}
      </div>
    </div>
  );
}