import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../services/db';
import { NotificationItem } from '../../types';
import { PWAInstallButton } from './PWAInstallButton';
import {
  Bell,
  CheckCircle2,
  Shield,
  HardHat,
  Building2,
  LogOut,
  FileText,
  AlertCircle,
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenActa?: (reportId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, onOpenActa }) => {
  const { currentUser, currentCompany, logout } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  useEffect(() => {
    const updateNotifs = () => {
      setNotifications(db.getNotifications(currentUser));
    };
    updateNotifs();
    const unsub = db.subscribe(updateNotifs);
    return unsub;
  }, [currentUser]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    if (currentUser) {
      db.markAllNotificationsAsRead(currentUser);
    }
  };


  return (
    <header className="sticky top-0 z-40 bg-slate-900 text-white shadow-md border-b border-slate-800 print:hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Logo & Airport Title */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-md flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                <span className="text-emerald-400 font-black text-xs tracking-tighter">UIO</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                  UIO CIRCULAR
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/80 uppercase">
                  Mariscal Sucre
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden md:block">
                Trazabilidad Digital y Cadena de Custodia de Residuos Reciclables
              </p>
            </div>
          </div>

          {/* Center / Right actions: Role indicator, PWA, Notifications, User Switcher */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* PWA Install Button */}
            <PWAInstallButton />

            {/* Authenticated user indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 text-xs font-semibold text-slate-200 border border-slate-700">
              {currentUser?.role === 'admin' ? (
                <Shield className="w-3.5 h-3.5 text-amber-400" />
              ) : currentUser?.role === 'gestor' ? (
                <HardHat className="w-3.5 h-3.5 text-sky-400" />
              ) : (
                <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span className="max-w-[150px] truncate">
                {currentUser?.role === 'empresa'
                  ? currentCompany?.commercial_name || currentUser?.full_name
                  : currentUser?.full_name}
              </span>
            </div>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                id="btn-notifications-toggle"
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className="relative p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                title="Notificaciones del sistema"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white ring-2 ring-slate-900">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 text-slate-800 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Notificaciones</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[10px] text-emerald-600 font-bold hover:underline"
                      >
                        Marcar leídas
                      </button>
                    )}
                  </div>

                  <div className="py-1 max-h-72 overflow-y-auto divide-y divide-slate-50">
                    {notifications.length === 0 ? (
                      <p className="py-6 text-center text-xs text-slate-400">
                        No tienes notificaciones pendientes.
                      </p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`px-4 py-2.5 hover:bg-slate-50 transition cursor-pointer ${
                            !n.read ? 'bg-emerald-50/50' : ''
                          }`}
                          onClick={() => {
                            db.markNotificationAsRead(n.id);
                            setShowNotifDropdown(false);
                            if (n.link_target === 'pendientes' && currentUser?.role === 'admin') {
                              setActiveTab('pendientes');
                            } else if (n.link_target === 'actas') {
                              if (currentUser?.role === 'empresa') setActiveTab('mis-actas');
                              else setActiveTab('actas');
                            } else if (n.link_target === 'retiros' && currentUser?.role === 'empresa') {
                              setActiveTab('mis-retiros');
                            } else if (n.link_target === 'mis-registros') {
                              setActiveTab('mis-registros');
                            }
                          }}
                        >
                          <div className="flex items-start gap-2">
                            <div className="p-1 rounded bg-slate-100 text-slate-600 shrink-0 mt-0.5">
                              {n.type === 'acta' ? (
                                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                              ) : n.type === 'approval' ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-bold text-slate-900">{n.title}</p>
                              <p className="text-[11px] text-slate-600 leading-tight mt-0.5">
                                {n.message}
                              </p>
                              <span className="text-[9px] text-slate-400 mt-1 block">
                                {new Date(n.created_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Logout button */}
            <button
              onClick={logout}
              className="p-2 rounded-lg bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 text-slate-400 transition"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
