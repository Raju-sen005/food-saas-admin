import { useState } from "react";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tag, X, Trash2 } from "lucide-react";

const api = axios.create({ baseURL: "http://localhost:5000/api/v1" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
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
      alert("Offer removed successfully!");
    },
    onError: () => alert("Failed to delete offer"),
  });

  const {
    data: offersRaw,
    isLoading: offersLoading,
    isError: offersError,
  } = useQuery({
    queryKey: ["offers"],
    queryFn: () => api.get("/offers").then((r) => r.data.data),
  });

  const {
    data: menuItemsRaw,
    isLoading: itemsLoading,
    isError: itemsError,
  } = useQuery({
    queryKey: ["menu-items"],
    queryFn: () => api.get("/menu/admin/items").then((r) => r.data.data),
  });

  const offers = Array.isArray(offersRaw) ? offersRaw : [];
  const menuItems = Array.isArray(menuItemsRaw) ? menuItemsRaw : [];

  const addMutation = useMutation({
    mutationFn: (data) => api.post("/offers", data),
    onSuccess: () => {
      queryClient.invalidateQueries(["offers"]);
      setFormData({
        title: "",
        discountValue: "",
        description: "",
        targetItems: [],
      });
    },
    onError: () => alert("Failed to create offer"),
  });

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-lg sm:text-xl font-black text-slate-800">
          🔥 Restaurant Offers
        </h2>
      </div>

      {/* Creation Card */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <input
            placeholder="Offer Name (e.g. Weekend Special)"
            className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
          />
          <input
            type="number"
            placeholder="Discount %"
            className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm"
            value={formData.discountValue}
            onChange={(e) =>
              setFormData({ ...formData, discountValue: e.target.value })
            }
          />
        </div>

        <textarea
          placeholder="Brief description..."
          className="w-full mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm"
          rows={2}
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
        />

        {/* Multi-Select for Items */}
        <div className="mt-4">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Apply to specific items:
          </label>

          {itemsLoading && (
            <p className="text-xs text-slate-400 mt-1">Loading items...</p>
          )}
          {itemsError && (
            <p className="text-xs text-red-500 mt-1">
              Failed to load menu items. Check your login/token.
            </p>
          )}

          <select
            className="w-full mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm"
            value=""
            onChange={(e) =>
              e.target.value &&
              !formData.targetItems.includes(e.target.value) &&
              setFormData({
                ...formData,
                targetItems: [...formData.targetItems, e.target.value],
              })
            }
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
              const item = menuItems.find((i) => i._id === itemId);
              return (
                <span
                  key={itemId}
                  className="flex items-center gap-1 bg-rose-50 text-rose-600 px-3 py-1 rounded-full text-xs font-bold"
                >
                  {item?.name || "Unknown item"}{" "}
                  <X
                    size={12}
                    className="cursor-pointer shrink-0"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        targetItems: formData.targetItems.filter(
                          (id) => id !== itemId,
                        ),
                      })
                    }
                  />
                </span>
              );
            })}
          </div>
        </div>

        <button
          onClick={() => addMutation.mutate(formData)}
          disabled={addMutation.isPending}
          className="w-full mt-6 bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition disabled:opacity-50"
        >
          {addMutation.isPending ? "Creating..." : "Launch Offer"}
        </button>
      </div>

      {/* List */}
      <div className="space-y-3 sm:space-y-4">
        {offersLoading && (
          <p className="text-sm text-slate-400">Loading offers...</p>
        )}
        {offersError && (
          <p className="text-sm text-red-500">Failed to load offers.</p>
        )}
        {!offersLoading && offers.length === 0 && (
          <p className="text-sm text-slate-400">No offers created yet.</p>
        )}

        {offers.map((offer) => (
          <div
            key={offer._id}
            className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 hover:border-rose-200 transition flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-3"
          >
            {/* Icon + Title/Description */}
            <div className="flex gap-3 sm:gap-4 items-center flex-1 min-w-0">
              <div className="p-2.5 sm:p-3 bg-rose-50 text-rose-500 rounded-xl shrink-0">
                <Tag size={18} className="sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-black text-slate-800 text-sm sm:text-base truncate">
                  {offer.title}
                </h3>
                <p className="text-xs text-slate-500 truncate">
                  {offer.description}
                </p>
              </div>
            </div>

            {/* Discount + Delete row (stays together, stacks below on mobile) */}
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
                onClick={() => {
                  if (
                    window.confirm(
                      "Are you sure you want to delete this offer?",
                    )
                  ) {
                    deleteMutation.mutate(offer._id);
                  }
                }}
                className="text-slate-300 hover:text-red-500 transition p-2 shrink-0"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}