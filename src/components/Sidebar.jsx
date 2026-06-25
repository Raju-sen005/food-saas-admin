import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, Utensils, Settings } from 'lucide-react';

export default function Sidebar() {
  const navItems = [
    { to: '/', icon: <LayoutDashboard size={20} />, label: 'Overview' },
    { to: '/orders', icon: <ShoppingBag size={20} />, label: 'Live Orders' },
    { to: '/menu', icon: <Utensils size={20} />, label: 'Menu Catalog' },
    { to: '/settings', icon: <Settings size={20} />, label: 'Settings' },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen flex flex-col fixed left-0 top-0">
      <div className="p-6 text-xl font-bold border-b border-slate-800 tracking-wide text-red-500">
        Chotu AI+ Admin
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-4 px-4 py-3 rounded-lg transition-all text-sm font-medium ${
                isActive ? 'bg-red-500 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
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