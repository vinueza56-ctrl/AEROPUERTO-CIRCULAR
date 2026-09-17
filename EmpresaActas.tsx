import React, { useState, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../services/db';
import { MonthlyReport } from '../../types';
import { ActaPreviewModal } from '../actas/ActaPreviewModal';
import { FileCheck2, Printer, Download, Calendar, ShieldCheck } from 'lucide-react';

export const EmpresaActas: React.FC = () => {
  const { currentUser, currentCompany } = useAuth();
  const [selectedReport, setSelectedReport] = useState<MonthlyReport | null>(null);

  // Strictly enforced RLS: getMonthlyReports(currentUser) returns only reports of currentCompany
  const reports = useMemo(() => {
    return db.getMonthlyReports(currentUser);
  }, [currentUser]);

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Actas Mensuales de Gestión de Residuos
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Documentos oficiales certificados por Corporación Quiport para {currentCompany?.commercial_name}.
            </p>
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((rpt) => {
          const monthName = monthNames[rpt.month - 1];
          return (
            <div
              key={rpt.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition flex flex-col justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                    {rpt.report_number}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Certificada v{rpt.version}.0
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900">
                  Período: {monthName} {rpt.year}
                </h3>
                <p className="text-xs text-slate-500">
                  Área: <strong>{currentCompany?.airport_area}</strong>
                </p>

                <div className="pt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900 font-mono">
                    {rpt.total_weight_kg.toFixed(2)}
                  </span>
                  <span className="text-xs font-bold text-slate-500">kg certificados</span>
                  <span className="text-xs text-slate-400 font-mono">
                    ({(rpt.total_weight_kg / 1000).toFixed(3)} Ton)
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Emitida: {new Date(rpt.generated_at).toLocaleDateString()}
                </span>
                <button
                  onClick={() => setSelectedReport(rpt)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Ver Acta / Descargar PDF</span>
                </button>
              </div>
            </div>
          );
        })}

        {reports.length === 0 && (
          <div className="col-span-2 p-12 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
            Aún no se han emitido actas mensuales para este período. Aparecerán tan pronto Quiport realice el cierre mensual correspondiente.
          </div>
        )}
      </div>

      {/* Modal preview */}
      {selectedReport && (
        <ActaPreviewModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
        />
      )}
    </div>
  );
};
