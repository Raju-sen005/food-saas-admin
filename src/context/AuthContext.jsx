import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);
axios.defaults.withCredentials = true;
axios.defaults.baseURL = 'http://localhost:5000/api/v1';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifySession = async () => {
      try {
        const res = await axios.get('/auth/me');
        if (res.data.success) setUser(res.data.data);
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    verifySession();
  }, []);

  const login = async (email, password) => {
    const res = await axios.post('/auth/login', { email, password });
    if (res.data.success) setUser(res.data.data);
    return res.data;
  };

  // --- NEW: TENANT SIGNUP BINDER ---
  const registerTenant = async (formData) => {
    const res = await axios.post('/auth/register', formData);
    if (res.data.success) setUser(res.data.data.user);
    return res.data; // Isme restaurant details aur unique slug return hoga
  };

  return (
    <AuthContext.Provider value={{ user, login, registerTenant, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);