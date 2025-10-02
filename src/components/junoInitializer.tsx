// components/JunoInitializer.tsx
'use client';

import { initSatellite, type EnvironmentWorker } from '@junobuild/core';
import { useEffect, useState, useCallback } from 'react';
import { startHealthMonitor } from '../lib/health-checks';

type JunoInitializerProps = {
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
  errorComponent?: (props: { error: Error; retry: () => void }) => React.ReactNode;
  maxRetries?: number;
  retryDelay?: number;
  satelliteConfig?: {
    container?: boolean;
    orbiter?: boolean;
  };
  enableHealthChecks?: boolean;
  healthCheckInterval?: number;
  /** When true, the app will render even if initialization fails */
  optional?: boolean;
};

type InitPhase = 'config' | 'satellite' | 'complete';

type InitStatus = {
  phase: InitPhase;
  status: 'loading' | 'error' | 'ready' | 'disabled';
  retryCount: number;
  error: Error | null;
};

interface SatelliteConfig {
  container?: boolean;
  workers?: {
    auth?: EnvironmentWorker;
    satellite?: EnvironmentWorker;
  };
  orbiter?: boolean;
}

export function JunoInitializer({ 
  children,
  loadingComponent,
  errorComponent,
  maxRetries = 3,
  retryDelay = 2000,
  satelliteConfig = {
    container: true,
    orbiter: false
  },
  enableHealthChecks = true,
  healthCheckInterval = 30000,
  optional = false,
}: JunoInitializerProps) {
  const [initState, setInitState] = useState<InitStatus>({
    phase: 'config',
    status: 'loading',
    retryCount: 0,
    error: null
  });

  const retry = useCallback(() => {
    setInitState(prev => ({
      ...prev,
      status: 'loading',
      retryCount: 0,
      error: null
    }));
  }, []);

  const initialize = useCallback(async (attempt = 1): Promise<void> => {
    try {
      setInitState(prev => ({ ...prev, phase: 'config' }));
      
      const satelliteId = process.env.NEXT_PUBLIC_JUNO_SATELLITE_ID;
      if (!satelliteId) {
        if (optional) {
          setInitState({
            phase: 'complete',
            status: 'disabled',
            retryCount: 0,
            error: null
          });
          return;
        }
        throw new Error('Missing NEXT_PUBLIC_JUNO_SATELLITE_ID environment variable');
      }

      setInitState(prev => ({ ...prev, phase: 'satellite' }));
      
      await initSatellite({
        satelliteId,
        ...satelliteConfig
      });
      
      setInitState({
        phase: 'complete',
        status: 'ready',
        retryCount: 0,
        error: null
      });
    } catch (err) {
      if (optional) {
        setInitState({
          phase: 'complete',
          status: 'disabled',
          retryCount: attempt,
          error: err instanceof Error ? err : new Error('Satellite initialization failed')
        });
        return;
      }

      const error = err instanceof Error ? err : new Error('Satellite initialization failed');
      
      if (attempt < maxRetries) {
        setInitState(prev => ({
          ...prev,
          retryCount: attempt,
          error
        }));
        
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return initialize(attempt + 1);
      }
      
      setInitState({
        phase: 'complete',
        status: 'error',
        retryCount: attempt,
        error
      });
    }
  }, [maxRetries, retryDelay, satelliteConfig, optional]);

  useEffect(() => {
    let healthMonitor: NodeJS.Timeout | undefined;

    const init = async () => {
      await initialize();
      
      if (enableHealthChecks && initState.status === 'ready') {
        healthMonitor = startHealthMonitor(healthCheckInterval);
      }
    };

    init();

    return () => {
      healthMonitor && clearInterval(healthMonitor);
    };
  }, [initialize, enableHealthChecks, healthCheckInterval, initState.status]);

  if (initState.status === 'error') {
    return errorComponent ? (
      errorComponent({ 
        error: initState.error!, 
        retry 
      })
    ) : (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-6 bg-red-50 rounded-lg max-w-md">
          <h3 className="text-lg font-medium text-red-800 mb-2">
            Initialization Error
          </h3>
          <p className="text-red-600 mb-2">
            {initState.error?.message}
          </p>
          <p className="text-sm text-red-500 mb-4">
            Attempt {initState.retryCount + 1} of {maxRetries}
          </p>
          <button
            onClick={retry}
            className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (initState.status === 'loading') {
    return loadingComponent || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 mb-1">
            {initState.phase === 'config' && 'Verifying configuration...'}
            {initState.phase === 'satellite' && 'Initializing satellite...'}
            {initState.phase === 'complete' && 'Finalizing...'}
          </p>
          {initState.retryCount > 0 && (
            <p className="text-sm text-gray-500">
              Attempt {initState.retryCount + 1}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Render children even if initialization is disabled
  if (initState.status === 'disabled') {
    return <>{children}</>;
  }

  return <>{children}</>;
}