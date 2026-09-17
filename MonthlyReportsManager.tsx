import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../services/db';
import { MonthlyReport, Company, WasteRecord } from '../../types';
import { ActaPreviewModal } from '../actas/ActaPreviewModal';
import {
  FileCheck2,
  Calendar,
  Building,
  AlertTriangle,
  Printer,
  FileText,
  Lock,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';

export const MonthlyReportsManager: React.FC = () => {
  const { currentUser } = useAuth();
  const [reports, setReports] = useState<MonthlyReport[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [records, setRecords] = useState<WasteRecord[]>([]);

  // Form to generate report
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const now = new Date();
  const currentYear = now.getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);

  const [activePreviewReport, setActivePreviewReport] = useState<MonthlyReport | null>(null);
  const [generationNotice, setGenerationNotice] = useState<string | null>(null);

  const refreshData = () => {
    const rpts = db.getMonthlyReports();
    const comps = db.getCompanies();
    const recs = db.getRecords();
    setReports(rpts);
    setCompanies(comps);
    setRecords(recs);

    if (comps.length > 0 && !selectedCompanyId) {
      setSelectedCompanyId(comps[0].id);
    }
  };

  useEffect(() => {
    refreshData();
    const unsub = db.subscribe(refreshData);
    return unsub;
  }, []);

  // Check pending records for the chosen company & month
  const pendingInPeriod = records.filter((r) => {
    if (r.company_id !== selectedCompanyId || r.status !== 'pending') return false;
    const d = new Date(r.record_date);
    return d.getFullYear() === selectedYear && d.getMonth() + 1 === selectedMonth;
  });

  const approvedInPeriod = records.filter((r) => {
    if (r.company_id !== selectedCompanyId || r.status !== 'approved') return false;
    const d = new Date(r.record_date);
    return d.getFullYear() === selectedYear && d.getMonth() + 1 === selectedMonth;
  });

  const totalKgInPeriod = approvedInPeriod.reduce((sum, r) => sum + r.weight_kg, 0);

  const handleGenerateActa = () => {
    if (!currentUser || !selectedCompanyId) return;

    if (pendingInPeriod.length > 0) {
      if (
        !window.confirm(
          `Atención: Existen ${pendingInPeriod.length} pesajes pendientes de revisión en este período. No se incluirán en el acta hasta ser aprobados. ¿Deseas generar el acta solo con los aprobados?`
        )
      ) {
        return;
      }
    }

    const report = db.generateMonthlyReport(selectedCompanyId, selectedMonth, selectedYear, currentUser);
    if (report) {
      setGenerationNotice(`¡Acta ${report.report_number} generada exitosamente (Versión ${report.version})!`);
      setActivePreviewReport(report);
    } else {
      setGenerationNotice(`No se encontraron pesajes aprobados para emitir el acta en el período seleccionado.`);
    }
  };

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  return (
    <div className="space-y-6">
      {/* Cierre Mensual Action Card */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Generación y Cierre de Acta Mensual
            </h2>
            <p className="text-xs text-slate-500">
              Consolida todos los pesajes aprobados de un operador comercial en un documento oficial con código único.
            </p>
          </div>
        </div>

        {generationNotice && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-semibold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {generationNotice}
            </span>
            <button
              onClick={() => setGenerationNotice(null)}
              className="text-emerald-700 hover:underline text-[11px]"
            >
              Cerrar
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase">
              1. Seleccionar Operador Comercial
            </label>
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white mt-1"
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.commercial_name} ({c.airport_area})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase">
              2. Mes de Liquidación
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white mt-1"
            >
              {monthNames.map((m, idx) => (
                <option key={idx + 1} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase">
              3. Año
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white mt-1"
            >
              {Array.from({ length: 6 }, (_, index) => currentYear - 3 + index).map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Audit Status for Selected Period */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <span className="font-bold text-slate-900">
              Estado de Pesajes para {monthNames[selectedMonth - 1]} {selectedYear}:
            </span>
            <div className="flex items-center gap-3 text-slate-600 text-[11px]">
              <span className="text-emerald-700 font-bold">
                ✓ {approvedInPeriod.length} aprobados ({totalKgInPeriod.toFixed(2)} kg)
              </span>
              {pendingInPeriod.length > 0 && (
                <span className="text-amber-700 font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> {pendingInPeriod.length} pendientes
                </span>
              )}
            </div>
          </div>

          <button
            onClick={handleGenerateActa}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition"
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Emitir / Actualizar Acta Oficial</span>
          </button>
        </div>
      </div>

      {/* Existing Reports List */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-600" />
          <span>Actas Mensuales Oficiales Emitidas ({reports.length})</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {reports.map((rpt) => {
            const comp = companies.find((c) => c.id === rpt.company_id);
            const monthName = monthNames[rpt.month - 1];

            return (
              <div
                key={rpt.id}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition flex flex-col justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      {rpt.report_number}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      Versión v{rpt.version}.0
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 mt-1">
                    {comp?.commercial_name}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Período: <strong>{monthName} {rpt.year}</strong> · {comp?.airport_area}
                  </p>

                  <div className="pt-2 flex items-baseline gap-2">
                    <span className="text-xl font-black text-slate-900 font-mono">
                      {rpt.total_weight_kg.toFixed(2)}
                    </span>
                    <span className="text-xs font-bold text-slate-500">kg reciclados</span>
                    <span className="text-xs text-slate-400 font-mono">
                      ({(rpt.total_weight_kg / 1000).toFixed(3)} Ton)
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-400">
                    Emitida: {new Date(rpt.generated_at).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => setActivePreviewReport(rpt)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Ver Acta Oficial / PDF</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Acta Preview Modal */}
      {activePreviewReport && (
        <ActaPreviewModal
          report={activePreviewReport}
          onClose={() => setActivePreviewReport(null)}
        />
      )}
    </div>
  );
};
