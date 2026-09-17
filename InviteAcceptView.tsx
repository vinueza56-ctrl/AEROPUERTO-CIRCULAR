import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { PWAInstallButton } from '../common/PWAInstallButton';
import {
  KeyRound,
  Lock,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ShieldCheck,
  Check,
  X,
} from 'lucide-react';

export const InviteAcceptView: React.FC = () => {
  const { inviteValid, acceptInvitePassword, cancelInviteFlow } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Real-time checks
  const isMinLength = password.length >= 8;
  const isMatch = password.length > 0 && password === confirmPassword;
  const canSubmit = isMinLength && isMatch && !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!isMinLength) {
      setErrorMsg('La contraseña debe tener un mínimo de 8 caracteres.');
      return;
    }

    if (!isMatch) {
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }

    setSubmitting(true);
    const result = await acceptInvitePassword(password);
    if (result.ok) {
      setSuccessMsg(result.message);
      // useAuth.acceptInvitePassword will clean URL, sign out, and redirect to login
    } else {
      setErrorMsg(result.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 flex flex-col justify-between text-white p-4 sm:p-6">
      {/* Top Header */}
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

      {/* Main Container */}
      <div className="max-w-md w-full mx-auto my-auto py-8">
        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 text-slate-900 border border-slate-100 space-y-6">
          {/* Header Title */}
          <div className="text-center space-y-1.5">
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-900 tracking-wider inline-flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3 text-emerald-700" />
              Activación de Cuenta
            </span>

            <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight mt-2">
              Crear contraseña
            </h2>

            <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
              Has sido invitado a UIO CIRCULAR. Define una contraseña para activar tu acceso.
            </p>
          </div>

          {/* Verification in progress */}
          {inviteValid === null && (
            <div className="p-8 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-emerald-700 animate-spin mx-auto" />
              <p className="text-xs text-slate-600 font-medium">
                Verificando enlace de invitación...
              </p>
            </div>
          )}

          {/* Invalid or Expired Token */}
          {inviteValid === false && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-black">
                    El enlace de invitación no es válido o ha expirado.
                  </p>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Este enlace de activación ya fue utilizado o caducó por seguridad. Solicita al Administrador de UIO CIRCULAR que te reenvíe una nueva invitación.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => void cancelInviteFlow()}
                className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Ir al inicio de sesión</span>
              </button>
            </div>
          )}

          {/* Valid Invitation: Form */}
          {inviteValid === true && (
            <>
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

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                {/* Nueva contraseña */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 uppercase">
                    Nueva contraseña:
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      minLength={8}
                      autoComplete="new-password"
                      placeholder="Mínimo 8 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={submitting}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 font-medium"
                    />
                  </div>
                </div>

                {/* Confirmar contraseña */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 uppercase">
                    Confirmar contraseña:
                  </label>
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
                      disabled={submitting}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 font-medium"
                    />
                  </div>
                </div>

                {/* Visual requirements */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-[11px]">
                  <div className="flex items-center gap-2">
                    {isMinLength ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-400 shrink-0" />
                    )}
                    <span className={isMinLength ? 'text-emerald-800 font-bold' : 'text-slate-500'}>
                      Mínimo 8 caracteres
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isMatch ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-400 shrink-0" />
                    )}
                    <span className={isMatch ? 'text-emerald-800 font-bold' : 'text-slate-500'}>
                      Ambas contraseñas coinciden
                    </span>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full py-3 px-4 bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <KeyRound className="w-4 h-4" />
                  )}
                  <span>Crear contraseña</span>
                </button>

                <button
                  type="button"
                  onClick={() => void cancelInviteFlow()}
                  disabled={submitting}
                  className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Volver al inicio de sesión
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-6xl w-full mx-auto text-center text-[11px] text-slate-400 py-3">
        © 2026 Corporación Quiport S.A. · Aeropuerto Internacional Mariscal Sucre de Quito · UIO CIRCULAR
      </div>
    </div>
  );
};
