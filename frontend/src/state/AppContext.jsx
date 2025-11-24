import React, { createContext, useContext, useMemo, useState } from 'react';

const Ctx = createContext(null);

export function AppProvider({ children }) {
  const [accessToken, setAccessToken] = useState(null);
  const value = useMemo(() => ({ accessToken, setAccessToken }), [accessToken]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('AppContext not found');
  return ctx;
}

