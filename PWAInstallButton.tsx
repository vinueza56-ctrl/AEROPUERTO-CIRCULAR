import React, { useState } from 'react';
import { usePWA } from '../../hooks/usePWA';
import { Download, Smartphone, X } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWA();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed, don't show
  if (isInstalled) {
    return null;
  }

  // Desktop / Android flow
  if (isInstallable) {
    return (
      <button
        id="btn-pwa-install"
        onClick={install}
        className="flex items-center gap-1.5 rounded-lg bg-emerald-700/90 hover:bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition border border-emerald-500/30 whitespace-nowrap"
        title="Instalar como aplicación nativa en tu dispositivo"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Instalar App PWA</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          id="btn-pwa-install-ios"
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-800/60 hover:bg-emerald-700 px-2.5 py-1.5 text-xs font-medium text-emerald-100 border border-emerald-600/40 transition whitespace-nowrap"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Instalar en iPhone</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-emerald-600" />
                  Instalar en iOS / iPhone
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="rounded-lg p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mt-4 space-y-3 text-xs text-slate-600">
                <div className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-800 text-[10px]">
                    1
                  </span>
                  <p>
                    Toca el botón <strong>Compartir</strong> en la barra inferior de Safari (icono de cuadrado con flecha hacia arriba).
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-800 text-[10px]">
                    2
                  </span>
                  <p>
                    Desliza hacia abajo y pulsa <strong>"Agregar al inicio"</strong>.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-800 text-[10px]">
                    3
                  </span>
                  <p>
                    Toca <strong>"Agregar"</strong> para usarla en campo sin conexión y con acceso instantáneo.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-emerald-700 py-2.5 text-xs font-semibold text-white shadow hover:bg-emerald-800 transition"
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
