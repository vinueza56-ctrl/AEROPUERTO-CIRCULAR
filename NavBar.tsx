import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../services/db';
import {
  LayoutDashboard,
  Clock,
  ClipboardList,
  Building,
  Recycle,
  FileCheck2,
  History,
  Scale,
  Database,
  Building2,
  FolderLock,
  Users,
} from 'lucide-react';

interface NavBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const NavBar: React.FC<NavBarProps> = ({ activeTab, setActiveTab }) => {
  const { currentUser, currentCompany } = useAuth();
  const records = db.getRecords();
  const pendingCount = records.filter((r) => r.status === 'pending').length;

  if (!currentUser) return null;

  return (
    <nav className="bg-white border-b border-slate-200 shadow-xs sticky top-16 z-30 print:hidden overflow-x-auto">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center space-x-1 sm:space-x-2 py-2 min-w-max">
          {currentUser.role === 'admin' && (
            <>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === 'dashboard'
                    ? 'bg-emerald-800 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard Global</span>
              </button>

              <button
                onClick={() => setActiveTab('pendientes')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition relative ${
                  activeTab === 'pendientes'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Bandeja Pendientes</span>
                {pendingCount > 0 && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      activeTab === 'pendientes'
                        ? 'bg-white text-amber-700'
                        : 'bg-amber-500 text-white'
                    }`}
                  >
                    {pendingCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('registros')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === 'registros'
                    ? 'bg-emerald-800 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <ClipboardList className="w-4 h-4" />
                <span>Todos los Registros</span>
              </button>

              <button
                onClick={() => setActiveTab('actas')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === 'actas'
                    ? 'bg-emerald-800 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <FileCheck2 className="w-4 h-4" />
                <span>Actas & Cierre Mensual</span>
              </button>

              <button
                onClick={() => setActiveTab('empresas')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === 'empresas'
                    ? 'bg-emerald-800 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Building className="w-4 h-4" />
                <span>Operadores Comerciales</span>
              </button>

              <button
                id="nav-tab-usuarios"
                onClick={() => setActiveTab('usuarios')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === 'usuarios'
                    ? 'bg-emerald-800 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Usuarios</span>
              </button>

              <button
                onClick={() => setActiveTab('residuos')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === 'residuos'
                    ? 'bg-emerald-800 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Recycle className="w-4 h-4" />
                <span>Catálogo de Residuos</span>
              </button>

              <button
                onClick={() => setActiveTab('auditoria')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === 'auditoria'
                    ? 'bg-emerald-800 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <History className="w-4 h-4" />
                <span>Auditoría (Audit Log)</span>
              </button>

              <button
                onClick={() => setActiveTab('supabase-sql')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === 'supabase-sql'
                    ? 'bg-emerald-800 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                title="Esquema SQL y Políticas Row Level Security"
              >
                <Database className="w-4 h-4 text-emerald-600" />
                <span>Script Supabase / RLS</span>
              </button>
            </>
          )}

          {currentUser.role === 'gestor' && (
            <>
              <button
                onClick={() => setActiveTab('nuevo-pesaje')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs ${
                  activeTab === 'nuevo-pesaje'
                    ? 'bg-emerald-700 text-white'
                    : 'text-slate-700 bg-emerald-50 hover:bg-emerald-100'
                }`}
              >
                <Scale className="w-4 h-4" />
                <span>Nuevo Pesaje en Campo</span>
              </button>

              <button
                onClick={() => setActiveTab('mis-registros')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === 'mis-registros'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <ClipboardList className="w-4 h-4" />
                <span>Mis Registros Realizados</span>
              </button>
            </>
          )}

          {currentUser.role === 'empresa' && (
            <>
              <button
                onClick={() => setActiveTab('mi-dashboard')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === 'mi-dashboard'
                    ? 'bg-emerald-800 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Mi Gestión de Residuos</span>
              </button>

              <button
                onClick={() => setActiveTab('mis-retiros')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === 'mis-retiros'
                    ? 'bg-emerald-800 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <ClipboardList className="w-4 h-4" />
                <span>Mis Retiros Oficiales</span>
              </button>

              <button
                onClick={() => setActiveTab('mis-actas')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === 'mis-actas'
                    ? 'bg-emerald-800 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <FileCheck2 className="w-4 h-4" />
                <span>Mis Actas Mensuales</span>
              </button>

              <button
                onClick={() => setActiveTab('mi-empresa')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === 'mi-empresa'
                    ? 'bg-emerald-800 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Ficha de {currentCompany?.commercial_name || 'Mi Organización'}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
