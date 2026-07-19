import { NavLink } from "react-router-dom";
import { useMemo } from "react";
import {
  LayoutDashboard,
  ShoppingBag,
  Utensils,
  Settings,
  BarChart3,
  Tag,
  QrCode,
  DollarSign,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/", icon: LayoutDashboard, label: "Overview" },
  { to: "/orders", icon: ShoppingBag, label: "Live Orders" },
  { to: "/menu", icon: Utensils, label: "Menu Catalog" },
  { to: "/table-monitor", icon: QrCode, label: "Table Monitor" },
  { to: "/analysis", icon: BarChart3, label: "Analysis" },
  { to: "/payment", icon: DollarSign, label: "Payment"},
  { to: "/offer", icon: Tag, label: "Offers" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export default function Sidebar({ closeMobileSidebar }) {
  const handleNavClick = useMemo(
    () => (closeMobileSidebar ? closeMobileSidebar : () => {}),
    [closeMobileSidebar]
  );

  return (
    <aside className="w-64 bg-slate-900 text-white h-full min-h-screen flex flex-col">
      <div className="p-6 text-xl font-bold border-b border-slate-800 tracking-wide text-red-500">
        Chotu AI+ Admin
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={handleNavClick}
            className={({ isActive }) =>
              `flex items-center gap-4 px-4 py-3 rounded-lg transition-all text-sm font-medium ${
                isActive
                  ? "bg-red-500 text-white shadow-md"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}