import { useQuery } from "@tanstack/react-query";
import React from "react";
import axios from "axios";
import { Sun, Coffee, Moon, CloudSun } from "lucide-react";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from "recharts";

// Module-level — har render pe naya object nahi banega
const HOURLY_ICONS = {
  Morning: <Sun className="w-4 h-4 text-amber-500" />,
  Afternoon: <CloudSun className="w-4 h-4 text-orange-400" />,
  Evening: <Coffee className="w-4 h-4 text-rose-500" />,
  Night: <Moon className="w-4 h-4 text-indigo-500" />,
};

function getHourlyCategory(hour) {
  if (hour >= 6 && hour < 12) return "Morning";
  if (hour >= 12 && hour < 17) return "Afternoon";
  if (hour >= 17 && hour < 21) return "Evening";
  return "Night";
}

function Analysis() {
  const [showAllTables, setShowAllTables] = React.useState(false);

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      const res = await axios.get(
        `${import.meta.env.VITE_APP_API_BASE}/analytics/summary`,
      );
      return res.data.data;
    },
    staleTime: 60_000, // 1 min tak fresh — analytics itni fast-changing nahi hoti
  });

  const chartData = React.useMemo(() => {
    if (!stats?.weeklyTrend) return [];
    return stats.weeklyTrend.map((item) => ({
      ...item,
      day: new Date(item.day).toLocaleDateString("en-US", { weekday: "short" }),
    }));
  }, [stats]);

  const tableStats = stats?.tableStats;

  const sortedTableStats = React.useMemo(() => {
    if (!tableStats) return [];
    return [...tableStats].sort((a, b) => {
      if (b.orderCount !== a.orderCount) return b.orderCount - a.orderCount;
      return String(a._id).localeCompare(String(b._id), undefined, { numeric: true });
    });
  }, [tableStats]);

  // 🔑 maxOrders sirf ek baar compute — pehle yeh har row render pe recalculate ho raha tha
  const maxOrders = React.useMemo(() => {
    if (sortedTableStats.length === 0) return 1;
    return Math.max(...sortedTableStats.map((s) => s.orderCount), 1);
  }, [sortedTableStats]);

  const displayTables = showAllTables ? sortedTableStats : sortedTableStats.slice(0, 5);

  const hourlyData = React.useMemo(() => {
    if (!stats?.hourlyStats) {
      return { Morning: 0, Afternoon: 0, Evening: 0, Night: 0 };
    }
    return stats.hourlyStats.reduce(
      (acc, curr) => {
        const cat = getHourlyCategory(curr._id);
        acc[cat] = (acc[cat] || 0) + curr.count;
        return acc;
      },
      { Morning: 0, Afternoon: 0, Evening: 0, Night: 0 },
    );
  }, [stats]);



  if (error || !stats) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm font-bold text-rose-500">
          Analytics data load nahi ho payi. Please refresh karke try karein.
        </p>
      </div>
    );
  }

  const rev = stats.revenueStats || {};
  const topItems = stats.topItems || [];

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-black">Business Analytics</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Today Revenue", val: `₹${rev.today || 0}` },
          { label: "Total Revenue", val: `₹${rev.totalRevenue || 0}` },
          { label: "Total Orders", val: rev.totalOrders || 0 },
          { label: "Top Items", val: topItems.length },
        ].map((item, i) => (
          <div key={i} className="bg-white p-4 rounded-xl border border-slate-200">
            <p className="text-[10px] uppercase font-bold text-slate-400">{item.label}</p>
            <h3 className="text-xl font-black text-slate-800">{item.val}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <h3 className="font-bold mb-20">Weekly Sales Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
              <Tooltip cursor={{ fill: "#f1f5f9" }} contentStyle={{ borderRadius: "8px", border: "none" }} />
              <Bar dataKey="sales" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {Object.entries(hourlyData).map(([label, val]) => (
            <div
              key={label}
              className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 group"
            >
              <div className="flex justify-between items-start mb-3">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{label}</p>
                <div className="p-1.5 bg-slate-50 rounded-lg group-hover:bg-rose-50 transition-colors">
                  {HOURLY_ICONS[label]}
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-800">
                {val}
                <span className="text-xs font-medium text-slate-400 ml-1">orders</span>
              </h3>
            </div>
          ))}
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <h3 className="font-bold mb-4">Table Performance</h3>
          <table className="w-full text-sm">
            <thead className="text-slate-400 border-b">
              <tr>
                <th className="pb-2 text-left">Table No.</th>
                <th className="pb-2 text-right">Orders</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {displayTables.length > 0 ? (
                displayTables.map((t) => {
                  const percentage = (t.orderCount / maxOrders) * 100;
                  return (
                    <tr key={t._id} className="group hover:bg-slate-50 transition-colors">
                      <td className="py-4 font-semibold text-slate-700">Table {t._id || "N/A"}</td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <span className="font-bold text-rose-500">{t.orderCount}</span>
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-rose-400 rounded-full" style={{ width: `${percentage}%` }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="2" className="py-8 text-center text-slate-400 italic">
                    No active orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {sortedTableStats.length > 5 && (
            <button
              onClick={() => setShowAllTables(!showAllTables)}
              className="w-full mt-4 py-2 text-sm text-rose-500 font-bold hover:bg-rose-50 rounded-lg transition"
            >
              {showAllTables ? "Show Less" : "View More"}
            </button>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <h3 className="font-bold mb-4">Top Selling Items</h3>
          <table className="w-full text-sm">
            <thead className="text-slate-400 border-b">
              <tr>
                <th className="pb-2">Item Name</th>
                <th className="pb-2 text-right">Sold</th>
              </tr>
            </thead>
            <tbody>
              {topItems.map((item, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-3">{item._id}</td>
                  <td className="py-3 text-right font-bold">{item.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
export default Analysis;
