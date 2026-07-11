import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingBag,
  Utensils,
  Settings,
  BarChart3,
  Tag,
  QrCode,
} from "lucide-react";

export default function Sidebar({ closeMobileSidebar }) {
  const navItems = [
    { to: "/", icon: <LayoutDashboard size={20} />, label: "Overview" },
    { to: "/orders", icon: <ShoppingBag size={20} />, label: "Live Orders" },
    { to: "/menu", icon: <Utensils size={20} />, label: "Menu Catalog" },
    {
      to: "/table-monitor",
      icon: <QrCode size={20} />,
      label: "Table Monitor",
    },
    { to: "/analysis", icon: <BarChart3 size={20} />, label: "Analysis" },
    { to: "/offer", icon: <Tag size={20} />, label: "Offers" },
    { to: "/settings", icon: <Settings size={20} />, label: "Settings" },
  ];

  const handleNavClick = () => {
    // Sirf mobile drawer mein yeh function pass hota hai, isliye safe optional call
    if (closeMobileSidebar) closeMobileSidebar();
  };

  return (
    <aside className="w-64 bg-slate-900 text-white h-full min-h-screen flex flex-col">
      <div className="p-6 text-xl font-bold border-b border-slate-800 tracking-wide text-red-500">
        Chotu AI+ Admin
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={handleNavClick}
            className={({ isActive }) =>
              `flex items-center gap-4 px-4 py-3 rounded-lg transition-all text-sm font-medium ${
                isActive
                  ? "bg-red-500 text-white shadow-md"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}