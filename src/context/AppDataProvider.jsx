import React from 'react';
import { SupabaseDataProvider } from './SupabaseDataContext';
import { MockDataProvider } from './MockDataContext';

export const AppDataProvider = ({ children }) => {
  // Use real Supabase if VITE_USE_SUPABASE env is 'true', or if we are building for production.
  const useRealSupabase = import.meta.env.VITE_USE_SUPABASE === 'true' || import.meta.env.PROD;

  if (useRealSupabase) {
    return <SupabaseDataProvider>{children}</SupabaseDataProvider>;
  }

  return <MockDataProvider>{children}</MockDataProvider>;
};

export default AppDataProvider;
