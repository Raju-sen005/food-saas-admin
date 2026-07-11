import { useState } from "react";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Tag, Utensils, Percent, X } from "lucide-react";

const api = axios.create({ baseURL: "http://localhost:5000/api/v1" });

export default function Offers() {
  const [formData, setFormData] = useState({ title: "", discountValue: "", description: "", targetItems: [] });
  const queryClient = useQueryClient();
const deleteMutation = useMutation({
    mutationFn: (offerId) => api.delete(`/offers/${offerId}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["offers"]);
      alert("Offer removed successfully!");
    },
    onError: (err) => alert("Failed to delete offer")
  });
  // Fetch Offers & Items (for dropdown)
  const { data: offers } = useQuery({ queryKey: ["offers"], queryFn: () => api.get("/offers").then(r => r.data.data) });
  const { data: menuItems } = useQuery({ queryKey: ["menu-items"], queryFn: () => api.get("/menu/admin/items").then(r => r.data.data) });

  const addMutation = useMutation({
    mutationFn: (data) => api.post("/offers", data),
    onSuccess: () => {
      queryClient.invalidateQueries(["offers"]);
      setFormData({ title: "", discountValue: "", description: "", targetItems: [] });
    }
  });

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black text-slate-800">🔥 Restaurant Offers</h2>
      </div>

      {/* Modern Creation Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input placeholder="Offer Name (e.g. Weekend Special)" className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
          <input type="number" placeholder="Discount %" className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm" value={formData.discountValue} onChange={e => setFormData({...formData, discountValue: e.target.value})} />
        </div>
        
        <textarea placeholder="Brief description..." className="w-full mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm" rows={2} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />

        {/* Multi-Select for Items */}
        <div className="mt-4">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Apply to specific items:</label>
          <select 
            className="w-full mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm"
            onChange={(e) => !formData.targetItems.includes(e.target.value) && setFormData({...formData, targetItems: [...formData.targetItems, e.target.value]})}
          >
            <option value="">Select Item to add...</option>
            {menuItems?.map(item => <option key={item._id} value={item._id}>{item.name} - ₹{item.price}</option>)}
          </select>
          
          <div className="flex flex-wrap gap-2 mt-3">
            {formData.targetItems.map(itemId => {
              const item = menuItems?.find(i => i._id === itemId);
              return (
                <span key={itemId} className="flex items-center gap-1 bg-rose-50 text-rose-600 px-3 py-1 rounded-full text-xs font-bold">
                  {item?.name} <X size={12} className="cursor-pointer" onClick={() => setFormData({...formData, targetItems: formData.targetItems.filter(id => id !== itemId)})} />
                </span>
              );
            })}
          </div>
        </div>

        <button onClick={() => addMutation.mutate(formData)} className="w-full mt-6 bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition">
          {addMutation.isPending ? "Creating..." : "Launch Offer"}
        </button>
      </div>

      {/* List */}
      <div className="space-y-4">
        {offers?.map(offer => (
          <div key={offer._id} className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between hover:border-rose-200 transition">
            <div className="flex gap-4 items-center">
              <div className="p-3 bg-rose-50 text-rose-500 rounded-xl"><Tag size={20} /></div>
              <div>
                <h3 className="font-black text-slate-800">{offer.title}</h3>
                <p className="text-xs text-slate-500">{offer.description}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-emerald-600 font-black text-lg">{offer.discountValue}% OFF</div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">{offer.targetItems?.length || 0} Items</p>
            </div>
            {/* Delete Button */}
              <button 
                onClick={() => {
                  if(window.confirm("Are you sure you want to delete this offer?")) {
                    deleteMutation.mutate(offer._id);
                  }
                }}
                className="text-slate-300 hover:text-red-500 transition p-2"
              >
                <Trash2 size={20} />
              </button>
          </div>
        ))}
      </div>
    </div>
  );
}