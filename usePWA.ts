import { useEffect, useState, useCallback } from 'react';
import { db } from '../services/db';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  // Check offline queue in localStorage
  const checkPendingQueue = useCallback(() => {
    try {
      const queue = JSON.parse(localStorage.getItem('circular_uio_offline_queue') || '[]');
      setPendingSyncCount(queue.length);
    } catch {
      setPendingSyncCount(0);
    }
  }, []);

  // Sync offline records once online
  const syncOfflineRecords = useCallback(() => {
    try {
      const queue = JSON.parse(localStorage.getItem('circular_uio_offline_queue') || '[]');
      if (queue.length === 0) return;

      const profiles = db.getProfiles();
      const remaining: any[] = [];
      let synced = 0;

      queue.forEach((item: any) => {
        const gestorId = item.offline_created_by;
        const gestor = profiles.find((p) => p.id === gestorId && p.role === 'gestor' && p.active);

        if (!gestor) {
          // Never attribute an offline record to a different person. Keep it pending instead.
          remaining.push(item);
          return;
        }

        const { offline_created_by, offline_created_by_name, offline_timestamp, is_sync_pending, ...recordData } = item;
        db.addRecord(recordData, gestor);
        synced++;
      });

      if (remaining.length > 0) {
        localStorage.setItem('circular_uio_offline_queue', JSON.stringify(remaining));
      } else {
        localStorage.removeItem('circular_uio_offline_queue');
      }
      setPendingSyncCount(remaining.length);

      if (synced > 0) {
        db.addNotification({
          target_role: 'gestor',
          title: 'Sincronización PWA completada',
          message: `Se sincronizaron con éxito ${synced} registros guardados en modo sin conexión.`,
          type: 'info',
        });
      }
    } catch (e) {
      console.error('Error al sincronizar cola offline:', e);
    }
  }, []);

  useEffect(() => {
    // Detect standalone mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineRecords();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    checkPendingQueue();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkPendingQueue, syncOfflineRecords]);

  const install = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  const saveOfflineRecord = (recordData: any) => {
    try {
      const queue = JSON.parse(localStorage.getItem('circular_uio_offline_queue') || '[]');
      queue.push({
        ...recordData,
        is_sync_pending: true,
        offline_timestamp: new Date().toISOString(),
      });
      localStorage.setItem('circular_uio_offline_queue', JSON.stringify(queue));
      setPendingSyncCount(queue.length);
      return true;
    } catch {
      return false;
    }
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    isOnline,
    pendingSyncCount,
    install,
    saveOfflineRecord,
    syncOfflineRecords,
  };
}
