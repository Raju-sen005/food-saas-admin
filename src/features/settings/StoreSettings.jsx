import { useAuth } from "../../context/AuthContext";
import {
  QrCode,
  Link2,
  Download,
  Printer,
  Copy,
  CheckCircle,
  Plus,
  Trash2,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";

export default function StoreSettings() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(null);

  // 1. Load tables from localStorage or default to ["1"]
  const [tables, setTables] = useState(() => {
    const saved = localStorage.getItem(`tables_${user?.restaurantId}`);
    return saved ? JSON.parse(saved) : ["1"];
  });

  const targetRestaurantId = user?.restaurantId || user?._id || "default-store";

  // 2. Persist tables to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(
      `tables_${user?.restaurantId}`,
      JSON.stringify(tables),
    );
  }, [tables, user?.restaurantId]);

  const addTable = () => {
    const nextTable = (tables.length + 1).toString();
    setTables([...tables, nextTable]);
  };

  const removeTable = (tableNo) => {
    if (tables.length > 1) {
      setTables(tables.filter((t) => t !== tableNo));
    }
  };

  const generateTableUrl = (tableNo) => {
    const token = btoa(`${user?.restaurantId}-TABLE-${tableNo}`);
    return `${window.location.origin}/catalog/${targetRestaurantId}?t=${token}`;
  };

  const handleCopyLink = async (url, index) => {
    await navigator.clipboard.writeText(url);
    setCopied(index);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6 font-sans p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            Store Settings & QR Engine
          </h1>
          <p className="text-sm text-slate-500">
            Manage table-specific QR codes
          </p>
        </div>
        <button
          onClick={addTable}
          className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2"
        >
          <Plus size={16} /> Add Table
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tables.map((tableNo) => {
          const url = generateTableUrl(tableNo);
          return (
            <div
              key={tableNo}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4"
            >
              <div className="flex justify-between items-center">
                <span className="font-black text-slate-700">
                  Table {tableNo}
                </span>
                <button
                  onClick={() => removeTable(tableNo)}
                  className="text-slate-400 hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="flex justify-center p-4 bg-slate-50 rounded-xl">
                <QRCodeCanvas value={url} size={150} level={"H"} />
              </div>

              <button
                onClick={() => handleCopyLink(url, tableNo)}
                className={`w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                  copied === tableNo
                    ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                    : "bg-white text-slate-600 border-slate-200"
                }`}
              >
                {copied === tableNo ? (
                  <CheckCircle size={14} />
                ) : (
                  <Copy size={14} />
                )}
                {copied === tableNo ? "Copied!" : "Copy Link"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
