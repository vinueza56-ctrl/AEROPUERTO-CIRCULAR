// UIO_CIRCULAR_AUTH_RECOVERY_V2
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { PWAInstallButton } from '../common/PWAInstallButton';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Loader2,
  Lock,
  Mail,
} from 'lucide-react';

type LoginMode = 'login' | 'forgot';

export const LoginView: React.FC = () => {
  const {
    login,
    loading,
    isPasswordRecovery,
    recoveryValid,
    requestPasswordReset,
    updatePassword,
    cancelPasswordRecovery,
    initialLoginSuccessMessage,
    setInitialLoginSuccessMessage,
  } = useAuth();

  const [mode, setMode] = useState<LoginMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (initialLoginSuccessMessage) {
      setSuccessMsg(initialLoginSuccessMessage);
      setInitialLoginSuccessMessage(null);
    }
  }, [initialLoginSuccessMessage, setInitialLoginSuccessMessage]);

  const resetMessages = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setSubmitting(true);

    const ok = await login(email, password);
    if (!ok) {
      setErrorMsg('Correo, contraseña o autorización incorrectos. Verifica tus datos o contacta al administrador de UIO CIRCULAR.');
    }

    setSubmitting(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setSubmitting(true);

    const result = await requestPasswordReset(email);
    if (result.ok) setSuccessMsg(result.message);
    else setErrorMsg(result.message);

    setSubmitting(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (newPassword !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }

    setSubmitting(true);
    const result = await updatePassword(newPassword);
    if (result.ok) {
      setSuccessMsg(result.message);
      setNewPassword('');
      setConfirmPassword('');
      setMode('login');
    } else {
      setErrorMsg(result.message);
    }
    setSubmitting(false);
  };

  const busy = submitting || loading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 flex flex-col justify-between text-white p-4 sm:p-6">
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-600 flex items-center justify-center font-black text-sm text-white tracking-tight shadow-md">
            UIO
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-white block">
              UIO CIRCULAR
            </span>
            <span className="text-[11px] text-emerald-400 font-semibold block">
              Aeropuerto Internacional Mariscal Sucre · Quito
            </span>
          </div>
        </div>
        <PWAInstallButton />
      </div>

      <div className="max-w-md w-full mx-auto my-auto py-8">
        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 text-slate-900 border border-slate-100 space-y-6">
          <div className="text-center space-y-1.5">
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-900 tracking-wider">
              Gestión Circular de Residuos
            </span>

            <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight mt-2">
              {isPasswordRecovery
                ? 'Crear nueva contraseña'
                : mode === 'forgot'
                  ? 'Recuperar contraseña'
                  : 'Iniciar Sesión'}
            </h2>

            <p className="text-xs text-slate-500">
              {isPasswordRecovery
                ? 'Define una nueva contraseña segura para tu cuenta de UIO CIRCULAR.'
                : mode === 'forgot'
                  ? 'Ingresa el correo asociado a tu cuenta y te enviaremos las instrucciones.'
                  : 'Ingresa tus credenciales autorizadas para acceder a UIO CIRCULAR.'}
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-medium">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl font-medium flex gap-2 items-start">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {isPasswordRecovery ? (
            recoveryValid === null ? (
              <div className="py-8 text-center space-y-3">
                <Loader2 className="w-8 h-8 text-emerald-700 animate-spin mx-auto" />
                <p className="text-xs text-slate-600 font-medium">
                  Verificando enlace de recuperación...
                </p>
              </div>
            ) : recoveryValid === false ? (
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl">
                  <p className="text-xs font-black">
                    El enlace de recuperación no es válido o ha expirado.
                  </p>
                  <p className="text-[11px] text-amber-800 mt-1 leading-relaxed">
                    Solicita un nuevo enlace desde “¿Olvidaste tu contraseña? Recuperar acceso”.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void cancelPasswordRecovery()}
                  className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Volver al inicio de sesión
                </button>
              </div>
            ) : (
            <form onSubmit={handleUpdatePassword} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block font-bold text-slate-700 uppercase">Nueva contraseña:</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    placeholder="Mínimo 8 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700 uppercase">Confirmar nueva contraseña:</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    placeholder="Repite tu nueva contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full py-3 px-4 bg-emerald-800 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                <span>Actualizar contraseña</span>
              </button>

              <button
                type="button"
                onClick={() => void cancelPasswordRecovery()}
                className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Volver al inicio de sesión
              </button>
            </form>
            )
          ) : mode === 'forgot' ? (
            <form onSubmit={handleForgotPassword} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block font-bold text-slate-700 uppercase">Correo electrónico:</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="usuario@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full py-3 px-4 bg-emerald-800 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                <span>Enviar instrucciones</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  resetMessages();
                  setMode('login');
                }}
                className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Volver al inicio de sesión
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block font-bold text-slate-700 uppercase">Correo Electrónico:</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="usuario@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700 uppercase">Contraseña:</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full py-3 px-4 bg-emerald-800 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                <span>Acceder al Sistema</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  resetMessages();
                  setMode('forgot');
                }}
                className="w-full py-2.5 px-4 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-extrabold text-xs transition"
              >
                ¿Olvidaste tu contraseña? Recuperar acceso
              </button>
            </form>
          )}

          {!isPasswordRecovery && mode === 'login' && (
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Perfiles de acceso
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                  Estas tarjetas son informativas; no son botones de registro.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 select-none" aria-label="Perfiles informativos de acceso">
                <div className="rounded-xl border border-dashed border-sky-200 bg-sky-50/70 px-3 py-2.5 text-center cursor-default">
                  <p className="text-xs font-black text-sky-900">Gestor Ambiental</p>
                  <p className="text-[10px] text-sky-700 mt-0.5">Registro de pesajes en campo</p>
                </div>
                <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/70 px-3 py-2.5 text-center cursor-default">
                  <p className="text-xs font-black text-emerald-900">Operador Comercial</p>
                  <p className="text-[10px] text-emerald-700 mt-0.5">Dashboard y actas mensuales</p>
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5 flex items-start gap-2">
                <Lock className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
                <p className="text-[10px] text-slate-600 leading-relaxed">
                  Las cuentas no se crean desde esta pantalla. El acceso a UIO CIRCULAR se habilita mediante invitación de un Administrador.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl w-full mx-auto text-center text-[11px] text-slate-400 py-3">
        © 2026 Corporación Quiport S.A. · Aeropuerto Internacional Mariscal Sucre de Quito · UIO CIRCULAR
      </div>
    </div>
  );
};
