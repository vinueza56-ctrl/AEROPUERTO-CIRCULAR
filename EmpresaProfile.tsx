import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Building2, ShieldCheck, MapPin, Mail, Phone, UserCheck, Calendar } from 'lucide-react';

export const EmpresaProfile: React.FC = () => {
  const { currentCompany, currentUser } = useAuth();

  if (!currentCompany) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-700/80 border border-emerald-500/40 flex items-center justify-center text-white shrink-0">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">{currentCompany.commercial_name}</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Habilitado
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">{currentCompany.business_name}</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6 text-xs text-slate-700">
          {/* Main info grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider">
                Datos Fiscales y Registro
              </h4>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">R.U.C.:</span>
                <span className="font-mono font-bold text-slate-900">{currentCompany.ruc}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Razón Social:</span>
                <span className="font-medium text-slate-900">{currentCompany.business_name}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Tipo de Operador:</span>
                <span className="font-semibold text-emerald-800">Operador Comercial</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider">
                Ubicación en Aeropuerto UIO
              </h4>
              <div className="flex items-start gap-2 py-1">
                <MapPin className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 block">{currentCompany.airport_area}</span>
                  <span className="text-[11px] text-slate-500">
                    Punto de Acopio Autorizado y Monitoreado
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Person */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider">
              Responsable del Operador Comercial
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-[10px] text-slate-400 block">Nombre:</span>
                  <span className="font-bold text-slate-900">{currentCompany.responsible_name}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-[10px] text-slate-400 block">Correo Electrónico:</span>
                  <span className="font-medium text-slate-800">
                    {currentCompany.responsible_email || currentCompany.email}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-[10px] text-slate-400 block">Teléfono Móvil:</span>
                  <span className="font-medium text-slate-800">
                    {currentCompany.responsible_phone || currentCompany.phone}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Compliance notice */}
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="space-y-1 text-[11px]">
              <p className="font-bold">Protocolo de Pesaje y Entrega Conforme:</p>
              <p>
                Cada retiro realizado en su punto de acopio genera un registro digital con fotografía de balanza. Al finalizar cada mes, Quiport emite el Acta Mensual de Gestión de Residuos válida para auditorías del Ministerio del Ambiente, Agua y Transición Ecológica (MAATE).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
