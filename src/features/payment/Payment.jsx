import React from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Download, TrendingUp, TrendingDown, Minus } from "lucide-react";
import * as XLSX from "xlsx"; // CSV download ke liye

// 2. Trend Logic Component (declared outside render)
const TrendIcon = ({ totalRevenue }) => {
  const isUp = totalRevenue > 0;
  if (totalRevenue === 0) return <Minus className="w-4 h-4 text-slate-300" />;
  return isUp ? <TrendingUp className="w-4 h-4 text-emerald-500" /> : <TrendingDown className="w-4 h-4 text-rose-500" />;
};

export default function Payment() {
  const [filter, setFilter] = React.useState("today");

  const { data: bills, isLoading } = useQuery({
    queryKey: ["bills", filter],
    queryFn: () => axios.get(`/orders/billing?filter=${filter}`).then((res) => res.data.data),
  });

  const totalRevenue = bills?.reduce((acc, curr) => acc + (curr.total || 0), 0) || 0;

  // 1. Download CSV Logic
  const handleDownload = () => {
    const formattedData = bills.map((bill) => ({
      "Order ID": bill.orderId,
      "Customer": bill.customerName,
      "Phone": bill.customerPhone,
      "Order Type": bill.orderType,
      "Table": bill.tableNumber,
      "Subtotal": bill.subtotal,
      "Tax": bill.tax,
      "Total Amount": bill.total,
      "Status": bill.status,
      "Date": new Date(bill.createdAt).toLocaleString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);

    // 💡 Column width set karein taaki data cut na ho
    worksheet['!cols'] = [
      { wch: 15 }, // Order ID
      { wch: 20 }, // Customer
      { wch: 15 }, // Phone
      { wch: 12 }, // Order Type
      { wch: 8 },  // Table
      { wch: 10 }, // Subtotal
      { wch: 8 },  // Tax
      { wch: 12 }, // Total
      { wch: 12 }, // Status
      { wch: 25 }, // Date
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Payments");
    XLSX.writeFile(workbook, `Payment_Report_${filter}.xlsx`);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-black">Payment History</h2>
          <div className="flex items-center gap-2 mt-1">
            <TrendIcon />
            <span className="text-xs text-slate-400 font-medium">Compared to last period</span>
          </div>
        </div>

        <button 
          onClick={handleDownload}
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-800 transition"
        >
          <Download className="w-4 h-4" /> Download Report
        </button>
      </div>

      {/* Stats Card */}
      <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100 mb-6 w-fit">
          <p className="text-[10px] uppercase font-bold text-rose-400 tracking-widest">Total Revenue ({filter})</p>
          <h3 className="text-3xl font-black text-rose-600">₹{totalRevenue.toLocaleString()}</h3>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {["today", "week", "month", "year"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg font-bold capitalize transition ${
              filter === f ? "bg-rose-500 text-white" : "bg-slate-100 hover:bg-slate-200"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr className="text-slate-400 text-left">
              <th className="p-4">Date</th>
              <th className="p-4">Table</th>
              <th className="p-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="3" className="p-8 text-center text-slate-400">Loading...</td></tr>
            ) : bills?.length > 0 ? (
              bills.map((bill) => (
                <tr key={bill._id} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="p-4">{new Date(bill.createdAt).toLocaleDateString()}</td>
                  <td className="p-4 font-semibold">Table {bill.tableNumber}</td>
                  <td className="p-4 text-right font-black">₹{bill.total}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="3" className="p-8 text-center text-slate-400 italic">No records</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}