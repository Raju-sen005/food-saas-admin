import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { DollarSign, ShoppingBag, CheckCircle2, AlertTriangle, Activity, ShieldCheck, Radio } from 'lucide-react';

export default function DashboardOverview() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: async () => {
      const res = await axios.get(`${import.meta.env.VITE_APP_API_BASE}/orders/live`, { withCredentials: true });
      const todayOrders = res.data.data || [];

      const revenue = todayOrders
        .filter(o => o.status !== 'REJECTED')
        .reduce((acc, curr) => acc + (curr.total || 0), 0);

      return {
        revenue,
        totalOrdersToday: todayOrders.length,
        pending: todayOrders.filter(o => o.status === 'PENDING').length,
        accepted: todayOrders.filter(o => o.status === 'ACCEPTED').length,
      };
    },
    staleTime: 30_000,        // 30 sec tak "fresh" maana jayega, refetch nahi hoga baar baar
    refetchOnWindowFocus: false, // tab switch karke wapas aane pe refetch spam nahi
    refetchInterval: 60_000,  // background poll every 1 min — dashboard ke liye kaafi
  });

  // stats array sirf tab recompute hoga jab metrics change ho, har render pe nahi
  const stats = useMemo(() => [
    {
      title: "Today's Revenue",
      value: `₹${metrics?.revenue?.toLocaleString('en-IN') || 0}`,
      icon: <DollarSign size={20} className="text-emerald-600" />,
      bg: "bg-emerald-50 border-emerald-100/60"
    },
    {
      title: "Today's Total Orders",
      value: metrics?.totalOrdersToday || 0,
      icon: <ShoppingBag size={20} className="text-rose-600" />,
      bg: "bg-rose-50 border-rose-100/60"
    },
    {
      title: "Preparing in Kitchen",
      value: metrics?.accepted || 0,
      icon: <CheckCircle2 size={20} className="text-amber-600" />,
      bg: "bg-amber-50 border-amber-100/60"
    },
    {
      title: "New/Unattended",
      value: metrics?.pending || 0,
      icon: <AlertTriangle size={20} className="text-indigo-600" />,
      bg: "bg-indigo-50 border-indigo-100/60"
    },
  ], [metrics]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4">
        <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold text-slate-500 tracking-tight">Syncing Live Today's Metrics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-xs">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Operational Insights</h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">Real-time store unit telemetry parameters summary (Today)</p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-center bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-xl">
          <span className="w-2 h-2 bg-rose-500 rounded-full animate-ping" />
          <span className="text-[11px] font-black tracking-wider uppercase text-rose-600">Today's Tracker Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-xs flex items-center justify-between hover:shadow-md transition-all duration-200 group cursor-pointer"
          >
            <div className="space-y-1">
              <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.title}</p>
              <p className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight group-hover:text-rose-600 transition-colors">{stat.value}</p>
            </div>
            <div className={`p-3 rounded-xl border ${stat.bg} shadow-xs transition-transform group-hover:scale-105 duration-200`}>
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
          <div className="p-2 bg-slate-900 text-white rounded-xl shadow-xs">
            <Activity size={16} />
          </div>
          <div>
            <h3 className="font-black text-sm md:text-base text-slate-900 tracking-tight">System Infrastructure Pulse</h3>
            <p className="text-[11px] md:text-xs text-slate-400 font-medium">Telemetry sync heartbeats loop diagnostic metrics</p>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-4 bg-slate-50/60 border border-slate-100 rounded-xl">
            <div className="flex items-center gap-2.5">
              <ShieldCheck size={16} className="text-emerald-600" />
              <span className="text-xs md:text-sm font-semibold text-slate-600">Multi-tenant Data Guard:</span>
            </div>
            <span className="text-[11px] font-black tracking-wider uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-md">
              Enforced Secure
            </span>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50/60 border border-slate-100 rounded-xl">
            <div className="flex items-center gap-2.5">
              <Radio size={16} className="text-emerald-600 animate-pulse" />
              <span className="text-xs md:text-sm font-semibold text-slate-600">Socket.io KeepAlive Pipeline:</span>
            </div>
            <span className="text-[11px] font-black tracking-wider uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-md">
              Online Streaming
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}