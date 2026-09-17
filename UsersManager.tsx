import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import {
  Users,
  UserPlus,
  Search,
  RefreshCw,
  Mail,
  Shield,
  HardHat,
  Building2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  X,
  Loader2,
  Check,
  Building,
} from 'lucide-react';

interface SupabaseProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  commercial_operator_id: string | null;
  active: boolean;
  created_at: string;
}

interface CommercialOperatorItem {
  id: string;
  business_name: string;
  trade_name: string | null;
  active: boolean;
}

type InviteRole = 'gestor_ambiental' | 'operador_comercial';

export const UsersManager: React.FC = () => {
  const [profiles, setProfiles] = useState<SupabaseProfile[]>([]);
  const [operators, setOperators] = useState<CommercialOperatorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search and Filter
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Modal invite state
  const [showModal, setShowModal] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<InviteRole>('gestor_ambiental');
  const [commercialOperatorId, setCommercialOperatorId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Load real profiles and operators from Supabase
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch real profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, commercial_operator_id, active, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) {
        throw new Error(profilesError.message || 'Error al consultar la tabla de usuarios.');
      }

      setProfiles(profilesData || []);

      // 2. Fetch commercial operators
      const { data: operatorsData, error: operatorsError } = await supabase
        .from('commercial_operators')
        .select('id, business_name, trade_name, active')
        .order('business_name', { ascending: true });

      if (!operatorsError && operatorsData) {
        setOperators(operatorsData);
      }
    } catch (err: any) {
      setError(err.message || 'No fue posible cargar los usuarios desde Supabase.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Filter only active commercial operators for the dropdown
  const activeOperators = useMemo(() => {
    return operators.filter((op) => op.active !== false);
  }, [operators]);

  // Formatted role names for UI
  const formatRoleLabel = (r: string): string => {
    const lower = (r || '').toLowerCase();
    if (lower === 'administrador' || lower === 'admin') return 'Administrador';
    if (lower === 'gestor_ambiental' || lower === 'gestor') return 'Gestor Ambiental';
    if (lower === 'operador_comercial' || lower === 'empresa') return 'Operador Comercial';
    return r || 'Usuario';
  };

  const getRoleBadge = (r: string) => {
    const lower = (r || '').toLowerCase();
    if (lower === 'administrador' || lower === 'admin') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-purple-100 text-purple-900 border border-purple-200">
          <Shield className="w-3 h-3 text-purple-700" />
          Administrador
        </span>
      );
    }
    if (lower === 'gestor_ambiental' || lower === 'gestor') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-sky-100 text-sky-900 border border-sky-200">
          <HardHat className="w-3 h-3 text-sky-700" />
          Gestor Ambiental
        </span>
      );
    }
    if (lower === 'operador_comercial' || lower === 'empresa') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-900 border border-emerald-200">
          <Building2 className="w-3 h-3 text-emerald-700" />
          Operador Comercial
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-slate-100 text-slate-800 border border-slate-200">
        {r}
      </span>
    );
  };

  const getOperatorName = (operatorId: string | null): string => {
    if (!operatorId) return '—';
    const op = operators.find((o) => o.id === operatorId);
    if (!op) return 'Operador Asignado';
    return op.trade_name?.trim() || op.business_name?.trim() || 'Operador Comercial';
  };

  // Filtered profiles list
  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        (p.full_name || '').toLowerCase().includes(q) ||
        (p.email || '').toLowerCase().includes(q) ||
        getOperatorName(p.commercial_operator_id).toLowerCase().includes(q);

      if (!matchSearch) return false;

      if (roleFilter === 'all') return true;
      const lower = (p.role || '').toLowerCase();
      if (roleFilter === 'administrador') return lower === 'administrador' || lower === 'admin';
      if (roleFilter === 'gestor_ambiental') return lower === 'gestor_ambiental' || lower === 'gestor';
      if (roleFilter === 'operador_comercial') return lower === 'operador_comercial' || lower === 'empresa';
      return true;
    });
  }, [profiles, search, roleFilter, operators]);

  // Stats
  const adminCount = profiles.filter((p) => ['administrador', 'admin'].includes((p.role || '').toLowerCase())).length;
  const gestorCount = profiles.filter((p) => ['gestor_ambiental', 'gestor'].includes((p.role || '').toLowerCase())).length;
  const operadorCount = profiles.filter((p) => ['operador_comercial', 'empresa'].includes((p.role || '').toLowerCase())).length;

  const openInviteModal = () => {
    setFullName('');
    setEmail('');
    setRole('gestor_ambiental');
    setCommercialOperatorId('');
    setFormError(null);
    setFormSuccess(null);
    setShowModal(true);
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) {
      setFormError('Ingresa el nombre completo del usuario.');
      return;
    }
    if (!cleanEmail) {
      setFormError('Ingresa el correo electrónico del usuario.');
      return;
    }
    if (role === 'operador_comercial' && !commercialOperatorId) {
      setFormError('Debes seleccionar un Operador Comercial activo.');
      return;
    }

    setSubmitting(true);

    try {
      // Invocación exclusiva de la Edge Function oficial protegida
      const { data, error: invokeError } = await supabase.functions.invoke('invite-uio-user', {
        body: {
          email: cleanEmail,
          full_name: cleanName,
          role, // 'gestor_ambiental' | 'operador_comercial'
          commercial_operator_id: role === 'operador_comercial' ? commercialOperatorId : null,
        },
      });

      if (invokeError) {
        throw new Error(invokeError.message || 'Error al enviar la invitación.');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setFormSuccess('Invitación enviada correctamente');

      // Actualizar inmediatamente la lista real de usuarios
      await loadData();

      // Cerrar modal tras breve pausa para confirmar visualmente
      setTimeout(() => {
        setShowModal(false);
        setFullName('');
        setEmail('');
        setRole('gestor_ambiental');
        setCommercialOperatorId('');
        setFormSuccess(null);
        setFormError(null);
        setSubmitting(false);
      }, 1200);
    } catch (err: any) {
      setFormError(err.message || 'No fue posible completar la invitación.');
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Usuarios y Permisos</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                public.profiles
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Directorio oficial. Las cuentas nuevas se habilitan por invitación y cada usuario define su propia contraseña.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => void loadData()}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
            title="Actualizar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          <button
            id="btn-invitar-usuario"
            onClick={openInviteModal}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invitar usuario</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Usuarios</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{profiles.length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">Administradores</p>
          <p className="text-2xl font-black text-purple-950 mt-1">{adminCount}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-sky-700 uppercase tracking-wider">Gestores Ambientales</p>
          <p className="text-2xl font-black text-sky-950 mt-1">{gestorCount}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Operadores Comerciales</p>
          <p className="text-2xl font-black text-emerald-950 mt-1">{operadorCount}</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, correo u operador..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          >
            <option value="all">Todos los roles</option>
            <option value="administrador">Administradores</option>
            <option value="gestor_ambiental">Gestores Ambientales</option>
            <option value="operador_comercial">Operadores Comerciales</option>
          </select>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start justify-between gap-3 text-xs text-rose-900">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-bold">Error al consultar usuarios</p>
              <p className="text-[11px] text-rose-700 mt-0.5">{error}</p>
            </div>
          </div>
          <button
            onClick={() => void loadData()}
            className="px-3 py-1 bg-rose-200 hover:bg-rose-300 text-rose-900 rounded-lg font-bold text-[11px] transition"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-emerald-700 animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Cargando usuarios desde Supabase...</p>
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No se encontraron usuarios</p>
            <p className="text-xs text-slate-500">
              {search || roleFilter !== 'all'
                ? 'Intenta ajustar los filtros de búsqueda.'
                : 'Aún no hay usuarios registrados en el sistema.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Usuario</th>
                  <th className="py-3 px-4">Correo</th>
                  <th className="py-3 px-4">Rol</th>
                  <th className="py-3 px-4">Operador Comercial</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProfiles.map((p) => {
                  const operatorName = getOperatorName(p.commercial_operator_id);
                  const isCommercial = ['operador_comercial', 'empresa'].includes((p.role || '').toLowerCase());

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-700 font-black flex items-center justify-center text-xs shrink-0 uppercase border border-slate-200">
                            {(p.full_name || p.email || 'U').slice(0, 2)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">
                              {p.full_name || 'Sin nombre'}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              Registrado: {p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{p.email || '—'}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getRoleBadge(p.role)}
                      </td>

                      <td className="py-3.5 px-4 text-slate-700">
                        {isCommercial ? (
                          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                            <Building className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{operatorName}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">N/A (Quiport)</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {p.active ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            Inactivo
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Invitar Usuario */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Invitar usuario</h3>
                  <p className="text-[11px] text-slate-500">
                    Envío oficial de invitación mediante Supabase Edge Function
                  </p>
                </div>
              </div>
              <button
                onClick={() => !submitting && setShowModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Alerts */}
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-medium flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleInviteSubmit} className="space-y-4 text-xs">
              {/* Nombre completo */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700 uppercase">
                  Nombre completo:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Ing. Andrea Morales"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={submitting}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              {/* Correo electrónico */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700 uppercase">
                  Correo electrónico:
                </label>
                <input
                  type="email"
                  required
                  placeholder="andrea.morales@operador.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              {/* Rol selector */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700 uppercase">
                  Rol del usuario:
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <label
                    className={`p-3 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                      role === 'gestor_ambiental'
                        ? 'border-sky-500 bg-sky-50/80 ring-2 ring-sky-500/20'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <HardHat className="w-4 h-4 text-sky-700" />
                        <span className="font-black text-xs text-sky-950">Gestor Ambiental</span>
                      </div>
                      <input
                        type="radio"
                        name="invite_role"
                        value="gestor_ambiental"
                        checked={role === 'gestor_ambiental'}
                        onChange={() => setRole('gestor_ambiental')}
                        className="text-sky-600 focus:ring-sky-500"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Pesajes y evidencia en balanza de campo
                    </p>
                  </label>

                  <label
                    className={`p-3 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                      role === 'operador_comercial'
                        ? 'border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-emerald-700" />
                        <span className="font-black text-xs text-emerald-950">Operador Comercial</span>
                      </div>
                      <input
                        type="radio"
                        name="invite_role"
                        value="operador_comercial"
                        checked={role === 'operador_comercial'}
                        onChange={() => setRole('operador_comercial')}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Trazabilidad de retiros y actas mensuales
                    </p>
                  </label>
                </div>
              </div>

              {/* Selector obligatorio de Operador Comercial solo si role === 'operador_comercial' */}
              {role === 'operador_comercial' && (
                <div className="space-y-1 p-3 bg-emerald-50/50 border border-emerald-200 rounded-2xl animate-in fade-in duration-150">
                  <label className="block font-bold text-emerald-950 uppercase flex items-center justify-between">
                    <span>Operador Comercial Activo:</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-sm">
                      Obligatorio
                    </span>
                  </label>

                  {activeOperators.length === 0 ? (
                    <p className="text-[11px] text-amber-700 font-medium">
                      No hay operadores comerciales activos registrados en la base de datos.
                    </p>
                  ) : (
                    <select
                      required
                      value={commercialOperatorId}
                      onChange={(e) => setCommercialOperatorId(e.target.value)}
                      disabled={submitting}
                      className="w-full px-3 py-2.5 rounded-xl border border-emerald-300 bg-white focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
                    >
                      <option value="">-- Selecciona un Operador Comercial Activo --</option>
                      {activeOperators.map((op) => {
                        const displayName = op.trade_name
                          ? `${op.trade_name} (${op.business_name})`
                          : op.business_name;
                        return (
                          <option key={op.id} value={op.id}>
                            {displayName}
                          </option>
                        );
                      })}
                    </select>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                  className="px-4 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  <span>Enviar invitación</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
