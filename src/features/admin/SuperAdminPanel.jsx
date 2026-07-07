import { useState, useEffect } from "react";
import axios from "axios";
import {
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Store,
  Mail,
  User,
} from "lucide-react";

export default function SuperAdminPanel() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const res = await axios.get("/admin/restaurants");
      setRestaurants(res.data.data);
    } catch (err) {
      console.error("Error fetching tenants:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id, currentStatus) => {
    try {
      await axios.patch(`/admin/restaurants/${id}/approve`, {
        isApproved: !currentStatus,
      });
      // UI refresh karein
      fetchRestaurants();
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const handleStatusUpdate = async (id, field, currentStatus) => {
    try {
      // field will be 'isApproved' or 'isActive'
      await axios.patch(`/admin/restaurants/${id}/status`, {
        [field]: !currentStatus,
      });
      fetchRestaurants();
    } catch (err) {
      alert("Update failed!");
    }
  };

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-red-500" size={48} />
      </div>
    );

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
          <ShieldCheck className="text-red-500" size={32} />
          Super Admin Console
        </h1>
        <p className="text-slate-500 mt-2">
          Platform ke sabhi registered restaurants ko manage karein.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-bold">
            <tr>
              <th className="p-4">Store Details</th>
              <th className="p-4">Owner Info</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Access Control</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {restaurants.map((store) => (
              <tr
                key={store._id}
                className="hover:bg-slate-50 transition-colors"
              >
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg">
                      <Store size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{store.name}</p>
                      <p className="text-xs text-slate-400 font-mono">
                        /{store.slug}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-sm">
                  <div className="flex flex-col gap-1">
                    <span className="flex items-center gap-2 text-slate-700">
                      <User size={14} />
                      {store.ownerName}
                    </span>
                    <span className="flex items-center gap-2 text-slate-400">
                      <Mail size={14} />
                      {store.email}
                    </span>
                  </div>
                </td>
                <td className="p-4">
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${store.isApproved ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"}`}
                  >
                    {store.isApproved ? "Approved" : "Pending Approval"}
                  </span>
                </td>
                <td className="p-4 text-right flex justify-end gap-3">
                  {/* Block/Unblock Toggle */}
                  <button
                    onClick={() =>
                      handleStatusUpdate(store._id, "isActive", store.isActive)
                    }
                    className={
                      store.isActive ? "text-red-500" : "text-emerald-500"
                    }
                  >
                    {store.isActive ? "Block" : "Unblock"}
                  </button>

                  {/* Approve/Unapprove Toggle */}
                  <button
                    onClick={() =>
                      handleStatusUpdate(
                        store._id,
                        "isApproved",
                        store.isApproved,
                      )
                    }
                    className={
                      store.isApproved ? "text-amber-500" : "text-green-500"
                    }
                  >
                    {store.isApproved ? "Unapprove" : "Approve"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
