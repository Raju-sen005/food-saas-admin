import { useAuth } from '../../context/AuthContext';
import { QrCode, Link2, Download, Printer, Copy, CheckCircle } from 'lucide-react';
import { useState } from 'react';

export default function StoreSettings() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  // 🎯 Target Restaurant Mapping Fallbacks
  const targetRestaurantId = user?.restaurantId || user?._id || 'default-store';
  const liveMenuUrl = `${window.location.origin}/public/catalog/${targetRestaurantId}`;
  const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(liveMenuUrl)}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(liveMenuUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR Stand - ${user?.restaurantName || 'Our Restaurant'}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; text-align: center; color: #1e293b; background: #fff; padding: 60px 20px; }
            .container { max-width: 420px; margin: 0 auto; border: 2px solid #f1f5f9; border-radius: 32px; padding: 40px 30px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); }
            .logo { font-size: 14px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; color: #94a3b8; margin-bottom: 25px; }
            .title { font-size: 26px; font-weight: 900; color: #e11d48; margin-bottom: 8px; letter-spacing: -0.5px; }
            .subtitle { font-size: 14px; color: #64748b; font-weight: 500; margin-bottom: 35px; }
            .qr-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; display: inline-block; border-radius: 24px; margin-bottom: 35px; }
            .qr-img { width: 240px; height: 240px; display: block; }
            .footer-tag { font-size: 11px; font-weight: 700; color: #cbd5e1; letter-spacing: 1px; text-transform: uppercase; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">Chotu AI+ Partner</div>
            <h1 class="title">${user?.restaurantName || 'Our Restaurant'}</h1>
            <p class="subtitle">Scan QR Code to Order Directly from Table</p>
            <div class="qr-box">
              <img src="${qrCodeApiUrl}" class="qr-img" />
            </div>
            <div class="footer-tag">✦ Powered by Chotu AI+ Hub ✦</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Welcome Title Banner Layout */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Store Settings & QR Engine</h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">Manage your digital storefront asset bindings and customer parameters</p>
        </div>
        <div className="bg-rose-50 border border-rose-100 px-3.5 py-1.5 rounded-xl self-start sm:self-center">
          <span className="text-[11px] font-black tracking-wider uppercase text-rose-600 flex items-center gap-1.5">
            Store ID: {targetRestaurantId.substring(0, 8).toUpperCase()}...
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Modern Minimalist QR Code Frame Visualizer Component */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/60 p-6 shadow-xs flex flex-col items-center text-center space-y-6">
          <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase bg-slate-50 border border-slate-100 px-3 py-1 rounded-md w-full">
            Live QR Code Preview
          </span>

          <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 shadow-inner group relative">
            <img 
              src={qrCodeApiUrl} 
              alt="Live Menu Store QR Code" 
              className="w-44 h-44 rounded-xl object-contain bg-white p-2 border border-slate-200/40 shadow-xs group-hover:scale-[1.02] transition-transform duration-200" 
            />
          </div>

          <div className="space-y-2.5 w-full">
            <button 
              onClick={handlePrint} 
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              <Printer size={14} strokeWidth={2.5} /> Print Table QR Stand
            </button>
            
            <a 
              href={qrCodeApiUrl} 
              download={`${user?.restaurantName || 'restaurant'}-qr.png`} 
              target="_blank" 
              rel="noreferrer" 
              className="block w-full"
            >
              <button 
                type="button"
                className="w-full bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 py-3.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download size={14} strokeWidth={2.5} /> Download High-Res PNG
              </button>
            </a>
          </div>
        </div>

        {/* Right Side: Deep Configuration Controls Info Boards Grid */}
        <div className="lg:col-span-8 space-y-6">
          {/* Box Variant A: Digital Menu Clipboard Controller */}
          <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                <Link2 size={16} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="font-black text-sm md:text-base text-slate-900 tracking-tight">Customer Digital Menu Link</h3>
                <p className="text-[11px] text-slate-400 font-medium">Isolated direct public catalog router engine route</p>
              </div>
            </div>

            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Yeh link seedhe customer catalog layout par redirect karta hai. Isme system security context boundaries enabled hain, jisse koi bhi customer panel se admin dashboard settings access nahi kar payega.
            </p>

            <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/60 flex items-center justify-between gap-4 font-mono text-xs font-bold text-slate-700 break-all select-all">
              <span className="truncate pr-2">{liveMenuUrl}</span>
              <button 
                onClick={handleCopyLink}
                className={`flex items-center gap-1.5 font-sans font-black text-xs px-4 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap border shrink-0 ${
                  copied 
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                    : 'bg-white text-rose-500 border-rose-100 hover:bg-rose-50'
                }`}
              >
                {copied ? (
                  <>
                    <CheckCircle size={13} strokeWidth={3} /> Copied!
                  </>
                ) : (
                  <>
                    <Copy size={13} strokeWidth={2.5} /> Copy Route
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Box Variant B: Instructional Terminal Operational Guidelines */}
          <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <QrCode size={16} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="font-black text-sm md:text-base text-slate-900 tracking-tight">QR Stand Deployment Instructions</h3>
                <p className="text-[11px] text-slate-400 font-medium">How to optimize digital table order placements</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 text-center md:text-left">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-xs mx-auto md:mx-0 mb-2">1</span>
                <h4 className="font-bold text-xs text-slate-800">Print Stands</h4>
                <p className="text-[11px] text-slate-400 font-medium mt-1 leading-relaxed">Direct counter ya table acrylic frames me fitting ke liye custom templates use karein.</p>
              </div>
              
              <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 text-center md:text-left">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-xs mx-auto md:mx-0 mb-2">2</span>
                <h4 className="font-bold text-xs text-slate-800">Zero App Downloads</h4>
                <p className="text-[11px] text-slate-400 font-medium mt-1 leading-relaxed">Customer apne phone camera standard se scan karke high-speed food cart access kar payega.</p>
              </div>

              <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 text-center md:text-left">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-xs mx-auto md:mx-0 mb-2">3</span>
                <h4 className="font-bold text-xs text-slate-800">Sandboxed Access</h4>
                <p className="text-[11px] text-slate-400 font-medium mt-1 leading-relaxed">Sare backend data routes restricted boundaries me encrypted hain, multi-tenant layer completely isolated h.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}