import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { Header } from './components/common/Header';
import { NavBar } from './components/common/NavBar';
import { OfflineBanner } from './components/common/OfflineBanner';
import { LoginView } from './components/auth/LoginView';
import { InviteAcceptView } from './components/auth/InviteAcceptView';

// Admin Components
import { AdminDashboard } from './components/admin/AdminDashboard';
import { PendingInbox } from './components/admin/PendingInbox';
import { AllRecordsList } from './components/admin/AllRecordsList';
import { MonthlyReportsManager } from './components/admin/MonthlyReportsManager';
import { CompaniesManager } from './components/admin/CompaniesManager';
import { UsersManager } from './components/admin/UsersManager';
import { WasteTypesManager } from './components/admin/WasteTypesManager';
import { AuditLogViewer } from './components/admin/AuditLogViewer';
import { SupabaseSqlViewer } from './components/admin/SupabaseSqlViewer';

// Gestor Components
import { NewRecordForm } from './components/gestor/NewRecordForm';
import { GestorRecordsList } from './components/gestor/GestorRecordsList';

// Empresa Components
import { EmpresaDashboard } from './components/empresa/EmpresaDashboard';
import { EmpresaRecords } from './components/empresa/EmpresaRecords';
import { EmpresaActas } from './components/empresa/EmpresaActas';
import { EmpresaProfile } from './components/empresa/EmpresaProfile';

const AppContent: React.FC = () => {
  const { currentUser, isInviteFlow, isPasswordRecovery, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Synchronize tab based on role
  useEffect(() => {
    if (!currentUser) return;

    if (currentUser.role === 'admin') {
      const adminTabs = [
        'dashboard',
        'pendientes',
        'registros',
        'actas',
        'empresas',
        'usuarios',
        'residuos',
        'auditoria',
        'supabase-sql',
      ];
      if (!adminTabs.includes(activeTab)) {
        setActiveTab('dashboard');
      }
    } else if (currentUser.role === 'gestor') {
      const gestorTabs = ['nuevo-pesaje', 'mis-registros'];
      if (!gestorTabs.includes(activeTab)) {
        setActiveTab('nuevo-pesaje');
      }
    } else if (currentUser.role === 'empresa') {
      const empresaTabs = ['mi-dashboard', 'mis-retiros', 'mis-actas', 'mi-empresa'];
      if (!empresaTabs.includes(activeTab)) {
        setActiveTab('mi-dashboard');
      }
    }
  }, [currentUser?.role, activeTab]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-600 flex items-center justify-center font-black text-sm text-white tracking-tight shadow-md animate-pulse">
            UIO
          </div>
          <div className="text-xs text-slate-400 font-medium">Cargando UIO CIRCULAR...</div>
        </div>
      </div>
    );
  }

  // Routing Priority 1: ?invite=1
  if (isInviteFlow) {
    return <InviteAcceptView />;
  }

  // Routing Priority 2: Recovery flow (?recovery=1 or PASSWORD_RECOVERY)
  if (isPasswordRecovery) {
    return <LoginView />;
  }

  // Routing Priority 4 (if not authenticated): Login
  if (!currentUser) {
    return <LoginView />;
  }

  // Routing Priority 3: Authenticated user dashboard
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-800 antialiased font-sans">
      {/* Offline Status Banner */}
      <OfflineBanner />

      {/* Corporate Header */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Role Navigation Bar */}
      <NavBar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6">
        {/* Admin Views */}
        {currentUser.role === 'admin' && (
          <>
            {activeTab === 'dashboard' && <AdminDashboard onNavigateTab={setActiveTab} />}
            {activeTab === 'pendientes' && <PendingInbox />}
            {activeTab === 'registros' && <AllRecordsList />}
            {activeTab === 'actas' && <MonthlyReportsManager />}
            {activeTab === 'empresas' && <CompaniesManager />}
            {activeTab === 'usuarios' && <UsersManager />}
            {activeTab === 'residuos' && <WasteTypesManager />}
            {activeTab === 'auditoria' && <AuditLogViewer />}
            {activeTab === 'supabase-sql' && <SupabaseSqlViewer />}
          </>
        )}

        {/* Gestor Views */}
        {currentUser.role === 'gestor' && (
          <>
            {activeTab === 'nuevo-pesaje' && (
              <NewRecordForm onSuccess={() => setActiveTab('mis-registros')} />
            )}
            {activeTab === 'mis-registros' && <GestorRecordsList />}
          </>
        )}

        {/* Empresa Views */}
        {currentUser.role === 'empresa' && (
          <>
            {activeTab === 'mi-dashboard' && <EmpresaDashboard onNavigateTab={setActiveTab} />}
            {activeTab === 'mis-retiros' && <EmpresaRecords />}
            {activeTab === 'mis-actas' && <EmpresaActas />}
            {activeTab === 'mi-empresa' && <EmpresaProfile />}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500 print:hidden mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            <strong>UIO CIRCULAR</strong> · Sistema de Trazabilidad y Gestión de Residuos Reciclables
          </span>
          <span className="text-[11px] text-slate-400">
            Aeropuerto Internacional Mariscal Sucre de Quito · Conforme al Plan de Manejo Ambiental Quiport
          </span>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
