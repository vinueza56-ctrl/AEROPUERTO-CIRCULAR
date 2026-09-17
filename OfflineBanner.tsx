import React from 'react';
import { usePWA } from '../../hooks/usePWA';
import { WifiOff, RefreshCw } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const { isOnline, pendingSyncCount, syncOfflineRecords } = usePWA();

  if (isOnline && pendingSyncCount === 0) return null;

  return (
    <div
      id="pwa-offline-banner"
      className="bg-amber-600 text-white px-4 py-2 text-xs font-medium shadow-md flex items-center justify-between transition-all"
    >
      <div className="flex items-center gap-2">
        <WifiOff className="w-4 h-4 animate-pulse text-amber-200" />
        <span>
          {!isOnline
            ? 'Modo Fuera de Línea (Offline) — Los registros de pesaje se guardarán localmente en este dispositivo y se sincronizarán al recuperar señal.'
            : `Conexión restablecida — Tienes ${pendingSyncCount} registro(s) pendiente(s) de sincronizar.`}
        </span>
      </div>

      {pendingSyncCount > 0 && isOnline && (
        <button
          onClick={syncOfflineRecords}
          className="flex items-center gap-1.5 bg-white text-amber-900 px-2.5 py-1 rounded-md text-[11px] font-bold hover:bg-amber-50 transition shadow-sm"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Sincronizar ahora ({pendingSyncCount})</span>
        </button>
      )}
    </div>
  );
};
