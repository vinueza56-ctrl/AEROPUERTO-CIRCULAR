import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { Profile, Company, UserRole } from '../types';
import { db } from '../services/db';
import { supabase } from '../services/supabase';

interface AuthContextType {
  currentUser: Profile | null;
  currentCompany: Company | null;
  loading: boolean;
  isPasswordRecovery: boolean;
  recoveryValid: boolean | null;
  isInviteFlow: boolean;
  inviteValid: boolean | null;
  initialLoginSuccessMessage: string | null;
  setInitialLoginSuccessMessage: (msg: string | null) => void;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ ok: boolean; message: string }>;
  updatePassword: (password: string) => Promise<{ ok: boolean; message: string }>;
  cancelPasswordRecovery: () => Promise<void>;
  acceptInvitePassword: (password: string) => Promise<{ ok: boolean; message: string }>;
  cancelInviteFlow: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const roleMap: Record<string, UserRole> = {
  administrador: 'admin',
  admin: 'admin',
  gestor_ambiental: 'gestor',
  gestor: 'gestor',
  operador_comercial: 'empresa',
  empresa: 'empresa',
};

const mapProfile = (row: any): Profile | null => {
  const roleKey = (row?.role || '').toLowerCase();
  const role = roleKey ? roleMap[roleKey] : undefined;
  if (!row || !role) return null;

  return {
    id: row.id,
    full_name: row.full_name || row.email || 'Usuario',
    email: row.email,
    role,
    company_id: row.commercial_operator_id || null,
    active: Boolean(row.active),
    created_at: row.created_at || new Date().toISOString(),
  };
};

const getAuthUrlFlags = () => {
  const url = new URL(window.location.href);
  const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''));

  return {
    isInvite: url.searchParams.get('invite') === '1',
    isRecovery:
      url.searchParams.get('recovery') === '1' ||
      url.searchParams.get('password-recovery') === '1',
    hasInviteToken:
      hashParams.get('type') === 'invite' &&
      Boolean(hashParams.get('access_token') || hashParams.get('refresh_token')),
    hasRecoveryToken:
      hashParams.get('type') === 'recovery' &&
      Boolean(hashParams.get('access_token') || hashParams.get('refresh_token')),
  };
};

const cleanAuthUrl = () => {
  const cleanUrl = `${window.location.origin}${window.location.pathname}`;
  window.history.replaceState({}, document.title, cleanUrl);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [recoveryValid, setRecoveryValid] = useState<boolean | null>(null);
  const [isInviteFlow, setIsInviteFlow] = useState(false);
  const [inviteValid, setInviteValid] = useState<boolean | null>(null);
  const [initialLoginSuccessMessage, setInitialLoginSuccessMessage] = useState<string | null>(null);

  const loadAuthorizedProfile = async (authUser: User | null): Promise<Profile | null> => {
    if (!authUser) {
      setCurrentUser(null);
      return null;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, commercial_operator_id, active, created_at')
      .eq('id', authUser.id)
      .maybeSingle();

    if (error || !data) {
      setCurrentUser(null);
      return null;
    }

    const profile = mapProfile(data);
    if (!profile?.active) {
      setCurrentUser(null);
      return null;
    }

    setCurrentUser(profile);
    return profile;
  };

  useEffect(() => {
    let mounted = true;
    let recoveryEventSeen = false;
    let inviteEventSeen = false;

    // Subscribe before initialization so PASSWORD_RECOVERY is not missed while
    // Supabase is processing the tokens returned in the URL.
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      const flags = getAuthUrlFlags();

      // Priority 1: invitation flow always blocks dashboard access.
      if (flags.isInvite) {
        setIsInviteFlow(true);
        setCurrentUser(null);

        if (event === 'SIGNED_IN' && session?.user) {
          inviteEventSeen = true;
        }

        if (session?.user && (flags.hasInviteToken || inviteEventSeen)) {
          setInviteValid(true);
        }

        setLoading(false);
        return;
      }

      // Priority 2: only a real Supabase recovery event authorizes password update.
      if (event === 'PASSWORD_RECOVERY') {
        recoveryEventSeen = true;
        setIsPasswordRecovery(true);
        setRecoveryValid(Boolean(session?.user));
        setCurrentUser(null);
        setLoading(false);
        return;
      }

      // A recovery marker alone must never authorize a password change or
      // send the user to a dashboard. Authorization is granted only by the
      // PASSWORD_RECOVERY event above.
      if (flags.isRecovery) {
        setIsPasswordRecovery(true);
        setCurrentUser(null);
        setLoading(false);
        return;
      }

      if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setIsPasswordRecovery(false);
        setRecoveryValid(null);
        setIsInviteFlow(false);
        setInviteValid(null);
        setLoading(false);
        return;
      }

      // Priority 3: normal authenticated session.
      if (['SIGNED_IN', 'TOKEN_REFRESHED', 'USER_UPDATED'].includes(event)) {
        await loadAuthorizedProfile(session?.user ?? null);
        setLoading(false);
      }
    });

    const initialize = async () => {
      const flags = getAuthUrlFlags();

      // Priority 1: Invite flow (?invite=1)
      if (flags.isInvite) {
        setIsInviteFlow(true);
        setInviteValid(null);
        setCurrentUser(null);

        const { data } = await supabase.auth.getSession();
        if (!mounted) return;

        if (data.session?.user && (flags.hasInviteToken || inviteEventSeen)) {
          setInviteValid(true);
          setLoading(false);
          return;
        }

        // Give Supabase time to process the invite token. A pre-existing unrelated
        // session is not enough by itself to validate the invitation.
        window.setTimeout(async () => {
          if (!mounted) return;
          const check = await supabase.auth.getSession();
          if (!mounted) return;
          const currentFlags = getAuthUrlFlags();
          setInviteValid(
            Boolean(
              check.data.session?.user &&
                currentFlags.isInvite &&
                (currentFlags.hasInviteToken || inviteEventSeen)
            )
          );
        }, 1800);

        setLoading(false);
        return;
      }

      // Priority 2: Recovery flow. The query parameter only opens verification;
      // it does NOT authorize changing a password.
      if (flags.isRecovery) {
        setIsPasswordRecovery(true);
        setRecoveryValid(null);
        setCurrentUser(null);

        // Query-string presence alone is never sufficient. Wait for Supabase to
        // emit PASSWORD_RECOVERY and then confirm that the resulting session exists.
        await supabase.auth.getSession();
        if (!mounted) return;

        window.setTimeout(async () => {
          if (!mounted) return;
          const check = await supabase.auth.getSession();
          if (!mounted) return;
          setRecoveryValid(Boolean(recoveryEventSeen && check.data.session?.user));
        }, 1800);

        setLoading(false);
        return;
      }

      // Priority 3: Authenticated session
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      await loadAuthorizedProfile(data.session?.user ?? null);
      if (mounted) setLoading(false);
    };

    void initialize();

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, pass: string): Promise<boolean> => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: pass,
    });

    if (error || !data.user) {
      setCurrentUser(null);
      setLoading(false);
      return false;
    }

    const profile = await loadAuthorizedProfile(data.user);
    if (!profile) {
      await supabase.auth.signOut();
      setLoading(false);
      return false;
    }

    setLoading(false);
    return true;
  };

  const logout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setCurrentUser(null);
    setIsPasswordRecovery(false);
    setRecoveryValid(null);
    setIsInviteFlow(false);
    setInviteValid(null);
    setLoading(false);
  };

  const requestPasswordReset = async (email: string) => {
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      return { ok: false, message: 'Ingresa tu correo electrónico.' };
    }

    const redirectTo = `${window.location.origin}/?recovery=1`;
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo,
    });

    // Do not reveal whether the account exists.
    if (error && (error.status === 429 || (error.status ?? 0) >= 500)) {
      return {
        ok: false,
        message: 'No fue posible enviar el correo en este momento. Inténtalo nuevamente más tarde.',
      };
    }

    return {
      ok: true,
      message: 'Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña.',
    };
  };

  const updatePassword = async (password: string) => {
    if (password.length < 8) {
      return { ok: false, message: 'La nueva contraseña debe tener al menos 8 caracteres.' };
    }

    // Never allow updateUser from a manually typed ?recovery=1 URL.
    if (!isPasswordRecovery || recoveryValid !== true) {
      return {
        ok: false,
        message: 'El enlace de recuperación no es válido o ha expirado.',
      };
    }

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session?.user) {
      setRecoveryValid(false);
      return {
        ok: false,
        message: 'El enlace de recuperación no es válido o ha expirado.',
      };
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      return {
        ok: false,
        message: error.message || 'No fue posible actualizar la contraseña.',
      };
    }

    await supabase.auth.signOut();
    cleanAuthUrl();

    setIsPasswordRecovery(false);
    setRecoveryValid(null);
    setCurrentUser(null);
    setInitialLoginSuccessMessage(
      'Contraseña actualizada correctamente. Inicia sesión con tu nueva contraseña.'
    );

    return {
      ok: true,
      message: 'Contraseña actualizada correctamente. Inicia sesión con tu nueva contraseña.',
    };
  };

  const cancelPasswordRecovery = async () => {
    await supabase.auth.signOut();
    cleanAuthUrl();
    setIsPasswordRecovery(false);
    setRecoveryValid(null);
    setCurrentUser(null);
  };

  const acceptInvitePassword = async (password: string) => {
    if (password.length < 8) {
      return { ok: false, message: 'La nueva contraseña debe tener al menos 8 caracteres.' };
    }

    if (!isInviteFlow || inviteValid !== true) {
      return {
        ok: false,
        message: 'El enlace de invitación no es válido o ha expirado.',
      };
    }

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session?.user) {
      setInviteValid(false);
      return {
        ok: false,
        message: 'El enlace de invitación no es válido o ha expirado.',
      };
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      return {
        ok: false,
        message: error.message || 'No fue posible crear la contraseña.',
      };
    }

    await supabase.auth.signOut();
    cleanAuthUrl();

    setIsInviteFlow(false);
    setInviteValid(null);
    setCurrentUser(null);
    setInitialLoginSuccessMessage(
      'Tu cuenta está lista. Inicia sesión con tu correo y nueva contraseña.'
    );

    return {
      ok: true,
      message: 'Contraseña creada correctamente.',
    };
  };

  const cancelInviteFlow = async () => {
    await supabase.auth.signOut();
    cleanAuthUrl();
    setIsInviteFlow(false);
    setInviteValid(null);
    setCurrentUser(null);
  };

  // Operational data is still migrated in later steps. This keeps compatibility with
  // the current UI until the companies module is moved from local storage to Supabase.
  const currentCompany = useMemo(
    () => (currentUser?.company_id ? db.getCompany(currentUser.company_id) || null : null),
    [currentUser]
  );

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentCompany,
        loading,
        isPasswordRecovery,
        recoveryValid,
        isInviteFlow,
        inviteValid,
        initialLoginSuccessMessage,
        setInitialLoginSuccessMessage,
        login,
        logout,
        requestPasswordReset,
        updatePassword,
        cancelPasswordRecovery,
        acceptInvitePassword,
        cancelInviteFlow,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
