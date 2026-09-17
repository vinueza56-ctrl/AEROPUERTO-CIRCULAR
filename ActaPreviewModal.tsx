import React from 'react';
import { X, Printer, Download, CheckCircle, FileText, ShieldCheck } from 'lucide-react';
import { MonthlyReport, WasteRecord, Company, WasteType } from '../../types';
import { db } from '../../services/db';

interface ActaPreviewModalProps {
  report: MonthlyReport | null;
  onClose: () => void;
}

export const ActaPreviewModal: React.FC<ActaPreviewModalProps> = ({ report, onClose }) => {
  if (!report) return null;

  const company = db.getCompany(report.company_id);
  const wasteTypes = db.getWasteTypes();
  const allRecords = db.getRecords();

  // Find all approved records belonging to this month & year and company
  const periodRecords = allRecords.filter((r) => {
    if (r.company_id !== report.company_id || r.status !== 'approved') return false;
    const d = new Date(r.record_date);
    return d.getFullYear() === report.year && d.getMonth() + 1 === report.month;
  });

  // Calculate summary by waste type
  const summaryMap = new Map<string, { name: string; weight: number }>();
  periodRecords.forEach((r) => {
    const wt = wasteTypes.find((w) => w.id === r.waste_type_id);
    const name = wt ? wt.name : 'Otro Residuo';
    const existing = summaryMap.get(r.waste_type_id) || { name, weight: 0 };
    existing.weight += r.weight_kg;
    summaryMap.set(r.waste_type_id, existing);
  });

  const summaryList = Array.from(summaryMap.values()).sort((a, b) => b.weight - a.weight);

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const monthName = monthNames[report.month - 1] || `Mes ${report.month}`;

  const totalKg = report.total_weight_kg;
  const totalTons = (totalKg / 1000).toFixed(3);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-4 print:border-none print:shadow-none print:my-0">
        {/* Modal Controls (Hidden in Print) */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <div>
              <span className="font-bold text-sm text-slate-100">
                Visualizador de Acta Oficial de Residuos Reciclables
              </span>
              <span className="text-[11px] text-slate-400 block">
                {report.report_number} · Versión {report.version}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow transition"
              title="Imprimir o Guardar como PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Descargar PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 sm:p-12 text-slate-800 bg-white" id="printable-acta">
          {/* Header Banner */}
          <div className="border-b-2 border-emerald-800 pb-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-emerald-800 flex items-center justify-center text-white font-black text-xl tracking-tighter shadow-md">
                UIO
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-950 uppercase">
                  Aeropuerto Internacional Mariscal Sucre de Quito
                </h1>
                <p className="text-xs font-bold text-emerald-800 tracking-wide uppercase">
                  Dirección de Gestión Ambiental y Sostenibilidad · Quiport S.A.
                </p>
                <p className="text-[11px] text-slate-500">
                  Cadena de Custodia y Trazabilidad Oficial de Residuos Aprovechables
                </p>
              </div>
            </div>
            <div className="text-right sm:border-l sm:border-slate-200 sm:pl-6">
              <div className="inline-block bg-emerald-50 border border-emerald-300 text-emerald-900 font-mono font-bold text-xs px-2.5 py-1 rounded-md">
                {report.report_number}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Versión oficial vigente: <strong>v{report.version}.0</strong>
              </p>
              <p className="text-[10px] text-slate-400">
                Estado: <span className="text-emerald-700 font-bold uppercase">{report.status === 'closed' ? 'Cerrada y Validada' : 'Borrador'}</span>
              </p>
            </div>
          </div>

          {/* Title Box */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-6 text-center">
            <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">
              ACTA MENSUAL DE GESTIÓN, VALORIZACIÓN Y RETIRO DE RESIDUOS RECICLABLES
            </h2>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              Período de Liquidación Ambiental: <strong>{monthName.toUpperCase()} {report.year}</strong>
            </p>
          </div>

          {/* Company & Period Information Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 text-xs">
            <div className="space-y-1.5 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80">
              <div className="flex justify-between">
                <span className="text-slate-500">Operador Comercial:</span>
                <span className="font-bold text-slate-900 text-right">{company?.business_name || report.company_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nombre Comercial:</span>
                <span className="font-semibold text-slate-800 text-right">{company?.commercial_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">R.U.C.:</span>
                <span className="font-mono font-bold text-slate-900">{company?.ruc}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Área Aeroportuaria:</span>
                <span className="text-slate-800 text-right">{company?.airport_area}</span>
              </div>
            </div>

            <div className="space-y-1.5 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80">
              <div className="flex justify-between">
                <span className="text-slate-500">Período Auditado:</span>
                <span className="font-bold text-slate-900">{monthName} {report.year}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Fecha de Emisión:</span>
                <span className="text-slate-800">{new Date(report.generated_at).toLocaleDateString('es-EC')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Retiros Realizados:</span>
                <span className="font-bold text-emerald-800">{periodRecords.length} eventos de pesaje</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Responsable del Operador Comercial:</span>
                <span className="text-slate-800">{company?.responsible_name || 'Designado ambiental'}</span>
              </div>
            </div>
          </div>

          {/* Detailed Table of Approved Records */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Detalle Cronológico de Retiros y Pesajes Aprobados
              </h3>
              <span className="text-[10px] text-slate-500">
                Conforme a registros de pesaje con evidencia fotográfica
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <th className="py-2.5 px-3">Fecha</th>
                    <th className="py-2.5 px-3">Código de Pesaje</th>
                    <th className="py-2.5 px-3">Tipo de Residuo</th>
                    <th className="py-2.5 px-3 text-right">Peso (kg)</th>
                    <th className="py-2.5 px-3 text-center">Estado Oficial</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {periodRecords.map((rec) => {
                    const wt = wasteTypes.find((w) => w.id === rec.waste_type_id);
                    return (
                      <tr key={rec.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-sans text-slate-700">{rec.record_date}</td>
                        <td className="py-2 px-3 text-slate-900 font-semibold">{rec.record_code}</td>
                        <td className="py-2 px-3 font-sans text-slate-800 font-medium">{wt?.name || rec.waste_type_id}</td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900">
                          {rec.weight_kg.toFixed(2)}
                        </td>
                        <td className="py-2 px-3 text-center font-sans">
                          <span className="inline-flex items-center gap-1 text-emerald-700 text-[10px] font-bold">
                            <CheckCircle className="w-3 h-3" /> Aprobado
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {periodRecords.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-slate-400 font-sans italic">
                        No se registraron retiros aprobados en este período para el operador comercial.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Consolidated Summary by Material */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
                Resumen Consolidado por Residuo
              </h4>
              <div className="space-y-1.5 text-xs">
                {summaryList.map((item) => {
                  const pct = totalKg > 0 ? ((item.weight / totalKg) * 100).toFixed(1) : '0';
                  return (
                    <div key={item.name} className="flex justify-between items-center py-1 border-b border-slate-100">
                      <span className="text-slate-700 font-medium">{item.name}</span>
                      <div className="text-right">
                        <span className="font-mono font-bold text-slate-900">{item.weight.toFixed(2)} kg</span>
                        <span className="text-[10px] text-slate-400 ml-2">({pct}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Total Balance Card */}
            <div className="border border-emerald-300 rounded-xl p-5 bg-gradient-to-br from-emerald-50 to-teal-50 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                  Total General Gestionado en el Período
                </span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black text-emerald-950 font-mono">
                    {totalKg.toFixed(2)}
                  </span>
                  <span className="text-lg font-bold text-emerald-800">kg</span>
                </div>
                <p className="text-xs text-emerald-700 font-semibold mt-1">
                  Equivalente oficial: <strong>{totalTons} toneladas métricas</strong>
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-emerald-200/80 flex items-center gap-2 text-[11px] text-emerald-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  El total mostrado corresponde exclusivamente a registros aprobados incluidos en esta acta.
                </span>
              </div>
            </div>
          </div>

          {/* Observations & Legal Disclaimer */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-[10px] text-slate-600 mb-8 leading-relaxed">
            <strong>Declaración de Conformidad Ambiental:</strong> El presente documento consolida los registros de pesaje aprobados para el período indicado. Cada registro está asociado a evidencia fotográfica y a su trazabilidad administrativa dentro de UIO CIRCULAR. La utilización del acta como soporte regulatorio dependerá de los requisitos aplicables y de la validación interna correspondiente.
          </div>

          {/* Signatures Section */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-slate-200 text-center text-xs">
            <div className="space-y-1">
              <div className="h-14 border-b border-dashed border-slate-300 flex items-end justify-center pb-1">
                <span className="font-serif italic text-slate-400 text-[11px]">Firma</span>
              </div>
              <p className="font-bold text-slate-900 mt-1">{report.signer_gestor}</p>
              <p className="text-[10px] text-slate-500">Gestor Ambiental</p>
            </div>

            <div className="space-y-1">
              <div className="h-14 border-b border-dashed border-slate-300 flex items-end justify-center pb-1">
                <span className="font-serif italic text-slate-400 text-[11px]">Firma de Entrega Conforme</span>
              </div>
              <p className="font-bold text-slate-900 mt-1">{report.signer_company}</p>
              <p className="text-[10px] text-slate-500">{company?.commercial_name || 'Operador Comercial'}</p>
            </div>

            <div className="space-y-1">
              <div className="h-14 border-b border-dashed border-slate-300 flex items-end justify-center pb-1">
                <span className="font-serif italic text-slate-400 text-[11px]">Firma</span>
              </div>
              <p className="font-bold text-slate-900 mt-1">{report.signer_airport}</p>
              <p className="text-[10px] text-slate-500">Corporación Quiport S.A.</p>
            </div>
          </div>

          {/* Document Verification Footer */}
          <div className="mt-8 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-400">
            <span>SISTEMA UIO CIRCULAR · ID DE VERIFICACIÓN: {report.id.toUpperCase()}</span>
            <span>Generado digitalmente: {new Date(report.generated_at).toLocaleString('es-EC')}</span>
          </div>
        </div>

        {/* Modal Bottom Actions (Hidden in Print) */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center print:hidden">
          <span className="text-xs text-slate-500">
            Documento listo para imprimir o exportar a formato PDF.
          </span>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow transition"
            >
              <Download className="w-4 h-4" />
              <span>Descargar PDF</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
