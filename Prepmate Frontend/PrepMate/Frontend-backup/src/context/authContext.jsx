/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';
import { syncUser, getUserProfile } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [dbUser, setDbUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const syncUserToBackend = async (firebaseUser, userData = null) => {
    try {
      // If userData is provided (e.g., from signup with exam/stream), use it; otherwise use minimal data
      const profileData = userData || {
        firebaseUid: firebaseUser.uid,
        email: firebaseUser.email,
        fullName: firebaseUser.displayName || '',
        photoUrl: firebaseUser.photoURL || '',
      };
      
      console.log('[AuthContext] Syncing user to backend with data:', profileData);
      
      const response = await syncUser(profileData);
      console.log('[AuthContext] User sync successful:', response.data);
      setDbUser(response.data);
      return response.data;
    } catch (error) {
      console.error('[AuthContext] Error syncing user to backend:', error.response?.data || error.message);
      console.error('[AuthContext] Full error:', error);
      return null;
    }
  };

  const refreshUser = async () => {
    if (dbUser?.id) {
      try {
        const response = await getUserProfile(dbUser.id);
        setDbUser(response.data);
      } catch (error) {
        console.error('Error refreshing user:', error);
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await syncUserToBackend(firebaseUser);
      } else {
        setDbUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, dbUser, loading, syncUserToBackend, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};