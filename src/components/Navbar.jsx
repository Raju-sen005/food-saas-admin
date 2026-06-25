import { useAuth } from '../context/AuthContext';
import { LogOut, User, Building } from 'lucide-react';
import axios from 'axios';

export default function Navbar() {
  const { user } = useAuth();

  const handleLogout = async () => {
    try {
      await axios.post('/auth/logout');
      window.location.reload();
    } catch (err) {
      console.error("Logout runtime error");
    }
  };

  return (
    <header className="h-16 border-b border-slate-200 bg-white sticky top-0 z-30 px-8 flex justify-between items-center">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
        <Building size={16} className="text-slate-400" />
        <span className="font-semibold text-slate-800">Tenant Context:</span>
        <span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-mono">{user?.restaurantId}</span>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-right">
          <p className="text-sm font-semibold text-slate-800">{user?.name}</p>
          <span className="text-[10px] bg-red-50 text-red-600 font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wide">
            {user?.role}
          </span>
        </div>
        <button 
          onClick={handleLogout}
          className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
          title="Sign Out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}