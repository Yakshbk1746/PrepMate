import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [backendUserId, setBackendUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        localStorage.removeItem('prepmateUserId');
        setUser(null);
        setBackendUserId(null);
        setLoading(false);
        return;
      }

      setUser(firebaseUser);

      try {
        const payload = {
          firebaseUid: firebaseUser.uid,
          email: firebaseUser.email,
          fullName: firebaseUser.displayName || '',
          photoUrl: firebaseUser.photoURL || '',
        };

        // const response = await axios.post('http://localhost:8080/api/users/sync', payload);
        const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/users/sync`, payload);
        const syncedUserId = response?.data?.id ?? null;

        if (syncedUserId !== null) {
          localStorage.setItem('prepmateUserId', String(syncedUserId));
          setBackendUserId(syncedUserId);
        } else {
          const fallbackId = localStorage.getItem('prepmateUserId');
          setBackendUserId(fallbackId ? Number(fallbackId) : null);
        }
      } catch (error) {
        console.error('Failed to sync user with backend:', error);
        const fallbackId = localStorage.getItem('prepmateUserId');
        setBackendUserId(fallbackId ? Number(fallbackId) : null);
      } finally {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, backendUserId, loading }}>
      {children}
    </AuthContext.Provider>
  );
};