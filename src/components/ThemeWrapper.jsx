import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const CustomerConfigContext = createContext(null);

export const CustomerConfigProvider = ({ slug, children }) => {
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBrandingData = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_APP_API_BASE}/restaurant/public/${slug}`);
        if (res.data.success) setRestaurant(res.data.data);
      } catch {
        console.error("Restaurant mapping reference invalid");
      } finally {
        setLoading(false);
      }
    };
    fetchBrandingData();
  }, [slug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center font-semibold text-slate-500">Loading digital menu...</div>;
  if (!restaurant) return <div className="min-h-screen flex items-center justify-center font-bold text-rose-500">404: Menu Not Found</div>;

  return (
    <CustomerConfigContext.Provider value={restaurant}>
      <div style={{ '--accent-color': restaurant.themeColor || '#EF4444' }}>
        {children}
      </div>
    </CustomerConfigContext.Provider>
  );
};

export const useCustomerConfig = () => useContext(CustomerConfigContext);