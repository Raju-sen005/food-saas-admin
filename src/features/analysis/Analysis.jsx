import { useQuery } from "@tanstack/react-query";
import React from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  //   YAxis,
  //   CartesianGrid,
  //   Tooltip,
  ResponsiveContainer,
} from "recharts";

function Analysis() {
  // Backend se data fetch karne ke liye (API: /api/v1/analytics/summary)
  const { data: stats, isLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      const res = await axios.get(
        "http://localhost:5000/api/v1/analytics/summary",
      );
      return res.data.data; // Backend se aane wala data
    },
  });
  const chartData = stats?.weeklyTrend.map((item) => ({
    ...item,
    day: new Date(item.day).toLocaleDateString("en-US", { weekday: "short" }),
  }));
  const tableStats = stats?.tableStats;
  const sortedTableStats = React.useMemo(() => {
    if (!tableStats) return [];
    // Sort: sabse zyada order wala upar (descending)
    return [...tableStats].sort((a, b) => b.orderCount - a.orderCount);
  }, [tableStats]);
  if (isLoading) return <div>Loading Analytics...</div>;
  const rev = stats.revenueStats;
  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-black">Business Analytics</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Today Revenue", val: `₹${rev.today || 0}` },
          { label: "Total Revenue", val: `₹${rev.totalRevenue || 0}` },
          { label: "Total Orders", val: rev.totalOrders },
          { label: "Top Items", val: stats.topItems.length },
        ].map((item, i) => (
          <div
            key={i}
            className="bg-white p-4 rounded-xl border border-slate-200"
          >
            <p className="text-[10px] uppercase font-bold text-slate-400">
              {item.label}
            </p>
            <h3 className="text-xl font-black text-slate-800">{item.val}</h3>
          </div>
        ))}
      </div>

      {/* Chart & Table Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <h3 className="font-bold mb-4">Weekly Sales Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <XAxis dataKey="day" />
              <Line
                type="monotone"
                dataKey="sales"
                stroke="#f43f5e"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
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
              {sortedTableStats.length > 0 ? (
                sortedTableStats.map((t, i) => {
                  // Yahan 'sortedTableStats' use karein
                  const maxOrders = Math.max(
                    ...sortedTableStats.map((s) => s.orderCount),
                  );
                  const percentage = (t.orderCount / maxOrders) * 100;

                  return (
                    <tr
                      key={i}
                      className="group hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-4 font-semibold text-slate-700">
                        Table {t._id || "N/A"}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <span className="font-bold text-rose-500">
                            {t.orderCount}
                          </span>
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-rose-400 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan="2"
                    className="py-8 text-center text-slate-400 italic"
                  >
                    No active orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
              {stats.topItems.map((item, i) => (
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
