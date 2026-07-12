import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function RegisterTenant({ onSwitchToLogin }) {
  const { registerTenant } = useAuth();
  
  // Registration States
  const [restaurantName, setRestaurantName] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null); // Registration metadata cache storage

  // Automatic unique URL generator logic
  const generatedSlug = restaurantName.trim().toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const payload = { restaurantName, slug: generatedSlug, name, email, password, phone };
      const response = await registerTenant(payload);
      
      if (response.success) {
        // Step 2 and 5 integration verification target URL config
        // Custom link for customer app hit resolution:
        const liveMenuUrl = `${import.meta.env.VITE_APP_API_BASE}/?store=${generatedSlug}`;
        // Utilizing global openqr chart generator api mesh network
        const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(liveMenuUrl)}`;
        
        setSuccessData({
          url: liveMenuUrl,
          qr: qrCodeApiUrl,
          slug: generatedSlug
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Try again.');
    }
  };

  if (successData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center space-y-6 animate-fade-in">
          <div>
            <span className="text-4xl">🎉</span>
            <h2 className="text-2xl font-black text-slate-900 mt-2">Registration Live!</h2>
            <p className="text-xs text-slate-400 mt-1">Aapka multi-tenant storefront setup allocate ho gaya hai.</p>
          </div>

          {/* QR Code Graphic Frame */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 inline-block">
            <img src={successData.qr} alt="Restaurant QR" className="mx-auto rounded-lg shadow-xs" />
          </div>

          <div className="space-y-2 text-left">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Aapka Live Menu Sub-URL:</label>
            <a href={successData.url} target="_blank" rel="noreferrer" className="block p-3 rounded-xl bg-red-50 text-red-600 font-mono text-xs font-bold break-all border border-red-100 hover:bg-red-100 transition-all">
              {successData.url}
            </a>
          </div>

          <p className="text-xs text-slate-500 font-medium bg-amber-50 p-3 rounded-lg border border-amber-100">
            💡 <b>Testing Flow:</b> Is QR code par click karo ya URL ko nayi tab mein open karke items purchase karo. Order seedhe aapke admin live panel par flash hoga!
          </p>

          <Button onClick={() => window.location.reload()} className="w-full">
            Open Dashboard Workspace
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg w-full border border-slate-100">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Register Your Restaurant</h2>
          <p className="text-sm text-slate-400 mt-1">Create your automated digital menu SaaS portal</p>
        </div>

        {error && <div className="bg-rose-50 text-rose-600 p-3 rounded-lg text-sm font-medium mb-4 border border-rose-100">❌ {error}</div>}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Restaurant Name" required placeholder="e.g. Haveli Foods" value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)} />
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Auto Generated Slug/URL</label>
              <div className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-xs font-mono font-bold truncate mt-1">
                /{generatedSlug || 'your-url'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Owner Full Name" required placeholder="Raju Sen" value={name} onChange={(e) => setName(e.target.value)} />
            <Input label="Contact Mobile" required placeholder="9876543210" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>

          <Input label="Business Email Address" type="email" required placeholder="owner@haveli.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Secure Dashboard Password" type="password" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />

          <Button type="submit" className="w-full py-3 mt-2">
            Register & Generate Live QR Menu
          </Button>
        </form>

        <div className="text-center mt-4">
          <p className="text-xs text-slate-500">
            Already have a store account?{' '}
            <button onClick={onSwitchToLogin} className="text-red-500 font-bold hover:underline cursor-pointer">Sign In</button>
          </p>
        </div>
      </div>
    </div>
  );
}