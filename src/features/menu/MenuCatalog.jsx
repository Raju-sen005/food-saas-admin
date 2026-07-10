import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  Plus,
  UtensilsCrossed,
  Edit2,
  Trash2,
  // Layers,
  IndianRupee,
  Image,
} from "lucide-react";
// import Card from "../../components/ui/Card";
// import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";

export default function MenuCatalog() {
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState("ALL");
  // Add these to your existing useState hooks
  const [formMode, setFormMode] = useState("DISH"); // 'DISH' or 'COMBO'
  const [selectedItems, setSelectedItems] = useState([]); // Combo ke liye IDs store karega
  // Form Fields State Block
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [image, setImage] = useState("");

  // ==========================================
  // 🟢 READ: Fetch Admin Items (Using absolute synchronized endpoint path)
  // ==========================================
  // const { data: menuItems = [], isLoading } = useQuery({
  //   queryKey: ["menu-items"],
  //   queryFn: async () => {
  //     const res = await axios.get(
  //       "http://localhost:5000/api/v1/menu/admin/items",
  //     );
  //     return res.data.data || [];
  //   },
  // });
  const { data: menuItems = { items: [], combos: [] }, isLoading } = useQuery({
    queryKey: ["menu-items"], // Key change kar di
    queryFn: async () => {
      const [itemsRes, combosRes] = await Promise.all([
        axios.get("http://localhost:5000/api/v1/menu/admin/items"),
        axios.get("http://localhost:5000/api/v1/menu/admin/combos"), // Naya endpoint
      ]);
      return {
        items: itemsRes.data.data || [],
        combos: combosRes.data.data || [],
      };
    },
  });
  // Extract unique categories dynamically for food aggregator layout tabs
  const categoriesList = [
    "ALL",
    ...new Set(
      menuItems.items
        .map((item) => item.category?.toUpperCase())
        .filter(Boolean),
    ),
  ];

  // Combine items and combos
  const allCatalogItems = [
    ...menuItems.items,
    ...menuItems.combos.map((c) => ({ ...c, isCombo: true })),
  ];

  // Filter logic:
  const filteredMenuItems =
    activeCategoryFilter === "ALL"
      ? allCatalogItems
      : allCatalogItems.filter(
          (item) =>
            item.category?.toUpperCase() === activeCategoryFilter ||
            (!item.category && activeCategoryFilter === "COMBO"),
        );
  // Filter items based on active top navigation pill selector
  // const filteredMenuItems =
  //   activeCategoryFilter === "ALL"
  //     ? menuItems
  //     : menuItems.filter(
  //         (item) => item.category?.toUpperCase() === activeCategoryFilter,
  //       );

  // ==========================================
  // 🔵 CREATE & UPDATE MUTATION
  // ==========================================
  const upsertMutation = useMutation({
    mutationFn: async (payload) => {
      if (editingItem) {
        return await axios.patch(
          `http://localhost:5000/api/v1/menu/admin/items/${editingItem._id}`,
          payload,
        );
      }
      return await axios.post(
        "http://localhost:5000/api/v1/menu/admin/items",
        payload,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["menu-items"]);
      closeAndResetModal();
    },
    onError: (err) => {
      alert(
        err.response?.data?.message ||
          "Error processing cloud catalog asset pipeline loop.",
      );
    },
  });

  // ==========================================
  // 🔴 DELETE MUTATION
  // ==========================================
  const deleteMutation = useMutation({
    mutationFn: async (itemId) => {
      return await axios.delete(
        `http://localhost:5000/api/v1/menu/admin/items/${itemId}`,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["menu-items"]);
    },
  });

  const deleteComboMutation = useMutation({
    mutationFn: async (comboId) => {
      return await axios.delete(
        `http://localhost:5000/api/v1/menu/admin/combos/${comboId}`,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["menu-items"]);
    },
  });

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setName(item.name);
    setDescription(item.description || "");
    setPrice(item.price);
    setCategory(item.category || "");
    setImage(item.image || "");

    if (item.isCombo) {
      setFormMode("COMBO");
      // Combo ke selected items ko restore karein
      setSelectedItems(item.items || []);
    } else {
      setFormMode("DISH");
      setSelectedItems([]);
    }

    setIsModalOpen(true);
  };

  // Update closeAndResetModal
  const closeAndResetModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setName("");
    setDescription("");
    setPrice("");
    setCategory("");
    setImage("");
    setSelectedItems([]); // Reset selection
    setFormMode("DISH");
  };

  const comboMutation = useMutation({
    mutationFn: (data) =>
      axios.post("http://localhost:5000/api/v1/menu/admin/combos", data),
    onSuccess: () => {
      queryClient.invalidateQueries(["menu-items"]);
      closeAndResetModal();
    },
  });

  const updateComboMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return await axios.patch(
        `http://localhost:5000/api/v1/menu/admin/combos/${id}`,
        data,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["menu-items"]);
      closeAndResetModal();
    },
  });

  // 1. Price auto-calculate karne ke liye helper function
  const calculateComboPrice = (selectedItemIds) => {
    const selectedItemsDetails = menuItems.items.filter((item) =>
      selectedItemIds.includes(item._id),
    );
    return selectedItemsDetails.reduce(
      (sum, item) => sum + (Number(item.price) || 0),
      0,
    );
  };

  // 2. Form submit handler update karein
  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      name,
      description,
      price: formMode === "COMBO" ? calculateComboPrice(selectedItems) : price,
      image,
      ...(formMode === "DISH" && { category }),
      ...(formMode === "COMBO" && { items: selectedItems }),
    };

    if (editingItem) {
      // Edit mode: check karein ki combo hai ya dish
      if (formMode === "COMBO") {
        // Combo update mutation call karein
        // (Yahan aapko updateComboMutation banana padega agar nahi hai)
        updateComboMutation.mutate({ id: editingItem._id, data: payload });
      } else {
        upsertMutation.mutate(payload);
      }
    } else {
      // Create mode
      if (formMode === "DISH") {
        upsertMutation.mutate(payload);
      } else {
        comboMutation.mutate(payload);
      }
    }
  };

  // Naya delete handler jo type check karega
  const handleDeleteClick = (item) => {
    if (window.confirm("Are you sure you want to discard this item?")) {
      if (item.isCombo) {
        // Combo delete mutation call karein
        deleteComboMutation.mutate(item._id);
      } else {
        // Single dish delete mutation call karein
        deleteMutation.mutate(item._id);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <div className="w-9 h-9 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold text-slate-500 tracking-tight">
          Syncing Digital Menu Matrix...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Dynamic Header Frame */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-xs">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            Digital Menu Catalog
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">
            Configure categories, single dishes, and active operational items
            pricing
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-xs shrink-0 cursor-pointer"
        >
          <Plus size={14} strokeWidth={3} /> Add New Dish
        </button>
      </div>

      {/* Dynamic Swiggy-Style Category Horizontal Navigation Roller */}
      {menuItems.items.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none mask-image-right">
          {categoriesList.map((cat, idx) => (
            <button
              key={idx}
              onClick={() => setActiveCategoryFilter(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold tracking-tight border whitespace-nowrap transition-all duration-150 cursor-pointer ${
                activeCategoryFilter === cat
                  ? "bg-rose-500 text-white border-rose-500 shadow-sm shadow-rose-500/10"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Main Grid View Area Viewport */}
      {filteredMenuItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-16 text-center shadow-xs flex flex-col items-center justify-center max-w-xl mx-auto space-y-3">
          <div className="p-4 bg-rose-50 rounded-full text-rose-500">
            <UtensilsCrossed size={28} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base">
              No Menu Items Listed
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-1">
              {activeCategoryFilter !== "ALL"
                ? `No dishes found matching target selection criteria "${activeCategoryFilter}" filter context.`
                : "Your operational store terminal catalog database appears empty. Click add button to spawn live entities."}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMenuItems.map((item) => (
            <div
              key={item._id}
              className="bg-white rounded-2xl border border-slate-200/60 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group"
            >
              {/* Agar item.isCombo true hai, toh Combo style dikhayein */}
              {item.isCombo && (
                <div className="absolute top-2 right-2 bg-purple-500 text-white text-[9px] px-2 py-0.5 rounded-full font-bold">
                  COMBO
                </div>
              )}
              <div className="p-5 flex gap-4 items-start">
                {/* Square Proportional Food Image Render Box Frame Layout */}
                {/* Combo Image Display Logic */}
                <div className="w-20 h-20 rounded-xl bg-slate-50 border border-slate-100 shrink-0 overflow-hidden relative flex items-center justify-center text-slate-300">
                  {item.isCombo ? (
                    // Combo ke liye custom icon ya pehle item ki image
                    // <Layers size={24} strokeWidth={1.5} />
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Image size={24} />
                  )}
                </div>

                {/* Text Data Strings Descriptions Context Bounds */}
                <div className="space-y-1 flex-1 min-w-0">
                  <span className="text-[9px] bg-slate-100 text-slate-500 font-black px-2 py-0.5 rounded-md uppercase tracking-wider inline-block">
                    {item.category}
                  </span>
                  <h3 className="font-black text-slate-900 text-sm md:text-base tracking-tight truncate mt-0.5">
                    {item.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium line-clamp-2 leading-relaxed">
                    {item.description ||
                      "No direct kitchen culinary preparations logs specified."}
                  </p>
                </div>
              </div>

              {/* Bottom Footer Price Meta Blocks operations */}
              <div className="px-5 py-3.5 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center">
                <span className="text-base font-black text-slate-900 flex items-center tracking-tight">
                  <IndianRupee
                    size={15}
                    strokeWidth={2.5}
                    className="mt-0.5 text-slate-800"
                  />
                  {item.price?.toLocaleString("en-IN")}
                </span>

                {/* Operational Quick Action Node Handlers */}
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleOpenEditModal(item)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200 transition-all cursor-pointer shadow-xs"
                    title="Edit Item Details"
                  >
                    <Edit2 size={13} strokeWidth={2.5} />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(item)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-white border border-transparent hover:border-rose-100 transition-all cursor-pointer shadow-xs"
                    title="Delete Asset Item"
                  >
                    <Trash2 size={13} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CRUD Core Pop-up Form Dialog Overlay Box Canvas Framework Component */}
      {/* CRUD Core Pop-up Form Dialog Overlay Box */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeAndResetModal}
        title={editingItem ? "Modify Catalog Entry" : "Create New Menu Asset"}
      >
        <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
          <button
            type="button"
            onClick={() => setFormMode("DISH")}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${formMode === "DISH" ? "bg-white shadow" : ""}`}
          >
            Add Dish
          </button>
          <button
            type="button"
            onClick={() => setFormMode("COMBO")}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${formMode === "COMBO" ? "bg-white shadow" : ""}`}
          >
            Add Combo
          </button>
        </div>

        {/* COMBO SELECTION LIST */}
        {formMode === "COMBO" && (
          <div className="space-y-2 mb-4">
            <label className="block text-[11px] font-bold uppercase text-slate-500">
              Select Items for Combo
            </label>
            <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50">
              {menuItems.items.map((item) => (
                <label
                  key={item._id}
                  className="flex items-center gap-3 p-2 hover:bg-white rounded-lg cursor-pointer text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item._id)}
                    onChange={(e) => {
                      if (e.target.checked)
                        setSelectedItems([...selectedItems, item._id]);
                      else
                        setSelectedItems(
                          selectedItems.filter((id) => id !== item._id),
                        );
                    }}
                  />
                  <span className="flex-1">{item.name}</span>
                  <span className="text-xs font-bold text-slate-400">
                    ₹{item.price}
                  </span>
                </label>
              ))}
            </div>

            {/* Auto-calculated Price Display */}
            <div className="flex justify-between items-center px-4 py-3 bg-rose-50 rounded-xl border border-rose-100">
              <span className="text-[11px] font-black uppercase text-rose-600">
                Combo Total Price
              </span>
              <span className="text-sm font-black text-rose-700">
                ₹
                {menuItems.items
                  .filter((item) => selectedItems.includes(item._id))
                  .reduce((sum, item) => sum + (Number(item.price) || 0), 0)}
              </span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <Input
            label="Title"
            required
            placeholder={
              formMode === "DISH"
                ? "e.g., Spicy Paneer Tikka"
                : "e.g., Weekend Special Combo"
            }
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          {formMode === "DISH" && (
            <Input
              label="Category Classification"
              required
              placeholder="e.g., Starters, Main Course"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Dish ke liye manual, Combo ke liye price disable/read-only rakha hai */}
            <Input
              label={
                formMode === "COMBO"
                  ? "Calculated Price (INR)"
                  : "Selling Price (INR)"
              }
              type="number"
              required
              readOnly={formMode === "COMBO"}
              placeholder="250"
              value={
                formMode === "COMBO"
                  ? menuItems.items
                      .filter((i) => selectedItems.includes(i._id))
                      .reduce((s, i) => s + (Number(i.price) || 0), 0)
                  : price
              }
              onChange={(e) => setPrice(e.target.value)}
            />
            <Input
              label="Image Web URL Link"
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={image}
              onChange={(e) => setImage(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Description
            </label>
            <textarea
              rows="3"
              placeholder="Culinary description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-6">
            <button
              type="button"
              onClick={closeAndResetModal}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-rose-500 text-white font-bold text-xs hover:bg-rose-600"
            >
              Publish {formMode === "COMBO" ? "Combo" : "Dish"} Live
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
