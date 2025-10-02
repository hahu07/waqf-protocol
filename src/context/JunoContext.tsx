'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { initSatellite } from '@junobuild/core';

type JunoContextType = {
  isInitialized: boolean;
  error: Error | null;
  initialize: () => Promise<void>;
};

const JunoContext = createContext<JunoContextType>({
  isInitialized: false,
  error: null,
  initialize: async () => {},
});

export function JunoProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const initialize = useCallback(async () => {
    if (isInitialized) return;
    
    try {
      const satelliteId = process.env.NEXT_PUBLIC_JUNO_SATELLITE_ID;
      console.log('[Juno] Initializing with satellite ID:', satelliteId);
      if (!satelliteId) {
        throw new Error('Missing NEXT_PUBLIC_JUNO_SATELLITE_ID environment variable');
      }

      await initSatellite({
        satelliteId,
        container: true
        // Removed orbiter as it's not a valid property
      });

      console.log('[Juno] Initialization successful');
      setIsInitialized(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Juno initialization failed'));
      throw err;
    }
  }, [isInitialized]);
  useEffect(() => {
    // Eagerly initialize Satellite once on mount
    initialize().catch((err) => {
      setError(err instanceof Error ? err : new Error('Juno initialization failed'));
    });
  }, [initialize]);

  return (
    <JunoContext.Provider value={{ isInitialized, error, initialize }}>
      {children}
    </JunoContext.Provider>
  );
}

export function useJuno() {
  return useContext(JunoContext);
}
